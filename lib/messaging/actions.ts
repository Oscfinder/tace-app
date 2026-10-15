"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireActive } from "@/lib/auth/guards";
import {
  adminProfileIds,
  matchParties,
  notifyIfNoUnread,
  type Notice,
} from "@/lib/notify";
import {
  CONTACT_BLOCKED_MESSAGE,
  findContactDetails,
} from "@/lib/messaging/contact-check";
import {
  MAX_MESSAGE_LENGTH,
  MESSAGE_LIMIT_PER_HOUR,
  type ChatMessage,
} from "@/lib/messaging/types";

type SendResult =
  | { error: string }
  | { success: true; message: ChatMessage };

const uuid = z.string().uuid();

async function chatSession() {
  const session = await requireActive();
  const role = session.profile.role;
  if (role !== "mentor" && role !== "beneficiary") return null;
  return { userId: session.user.id, role };
}

// Send one message. Everything that matters is enforced twice: here (to give a
// kind explanation) and in the database (row-level security + triggers), so it
// still holds if someone calls the API directly.
export async function sendMessage(input: {
  matchId: string;
  content: string;
}): Promise<SendResult> {
  const who = await chatSession();
  if (!who) return { error: "You can't send messages from this account." };
  if (!uuid.safeParse(input.matchId).success) return { error: "Invalid conversation." };

  const content = (input.content ?? "").trim();
  if (content.length === 0) return { error: "Please write a message first." };
  if (content.length > MAX_MESSAGE_LENGTH) {
    return { error: `That message is too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.` };
  }
  if (findContactDetails(content)) return { error: CONTACT_BLOCKED_MESSAGE };

  const supabase = await createClient();

  // Must be a party to an ACTIVE mentorship (RLS only shows the caller their own).
  const { data: match } = await supabase
    .from("mentorship_matches")
    .select("id, status")
    .eq("id", input.matchId)
    .maybeSingle();
  if (!match) return { error: "We couldn't find this conversation." };
  if (match.status !== "active") {
    return {
      error:
        match.status === "paused"
          ? "Messaging is paused for this mentorship right now."
          : "Messaging isn't available for this mentorship.",
    };
  }

  // Friendly pre-check of the 30-per-hour limit (the database enforces it too).
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { count } = await supabase
    .from("mentorship_messages")
    .select("id", { count: "exact", head: true })
    .eq("sender_id", who.userId)
    .gte("created_at", since);
  if ((count ?? 0) >= MESSAGE_LIMIT_PER_HOUR) {
    return {
      error: `You've sent ${MESSAGE_LIMIT_PER_HOUR} messages in the last hour, which is the limit. Please wait a little and try again.`,
    };
  }

  const { data: row, error } = await supabase
    .from("mentorship_messages")
    .insert({
      match_id: input.matchId,
      sender_id: who.userId,
      sender_type: who.role === "mentor" ? "mentor" : "beneficiary",
      content,
    })
    .select("id, sender_id, content, created_at, is_flagged, read_at")
    .single();
  if (error || !row) {
    if (error?.message.includes("Message limit reached")) {
      return {
        error: `You've reached the limit of ${MESSAGE_LIMIT_PER_HOUR} messages an hour. Please wait a little and try again.`,
      };
    }
    return { error: "We couldn't send that message. Please try again." };
  }

  // Tell the other side (never the text), at most one unread notice per thread.
  const parties = await matchParties(input.matchId);
  if (parties) {
    const notices: Notice[] = [];
    const flagged = row.is_flagged === true;
    if (!flagged) {
      const recipient =
        who.role === "mentor" ? parties.guardianProfileId : parties.mentorProfileId;
      if (recipient) {
        await notifyIfNoUnread({
          profileId: recipient,
          type: `message:${input.matchId}`,
          title: "You have a new message",
          body:
            who.role === "mentor"
              ? `${parties.mentorName} sent a message.`
              : `${parties.childFirstName} sent a message.`,
        });
      }
    } else {
      // A message that got past the app check and was held by the database:
      // let the admins know straight away (once, until they look).
      for (const id of await adminProfileIds()) {
        notices.push({
          profileId: id,
          type: "flagged_message",
          title: "A message was held for review",
          body: `A message in the ${parties.childFirstName} / ${parties.mentorName} conversation was flagged for contact details. Open Messages to review it.`,
        });
      }
      for (const n of notices) await notifyIfNoUnread(n);
    }
  }

  return {
    success: true,
    message: {
      id: row.id,
      sender_id: row.sender_id,
      content: row.content,
      created_at: row.created_at,
      is_flagged: row.is_flagged ?? false,
      read_at: row.read_at,
    },
  };
}

// Marks the OTHER side's visible messages in this thread as read.
export async function markThreadRead(matchId: string): Promise<void> {
  const who = await chatSession();
  if (!who || !uuid.safeParse(matchId).success) return;
  const supabase = await createClient();
  await supabase.rpc("mark_thread_read", { p_match_id: matchId });
}

const concernSchema = z.object({
  matchId: uuid,
  description: z
    .string()
    .trim()
    .min(1, "Please tell us what doesn't feel right.")
    .max(2000, "That's a bit long: please keep it under 2000 characters."),
});

// "Something doesn't feel right": works from either side of the chat. Creates a
// safeguarding concern and tells every admin. The chat stays open.
export async function raiseChatConcern(input: {
  matchId: string;
  description: string;
}): Promise<{ error: string } | { success: true }> {
  const who = await chatSession();
  if (!who) return { error: "You can't send a concern from this account." };
  const parsed = concernSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check what you wrote." };
  }

  const supabase = await createClient();
  const { data: match } = await supabase
    .from("mentorship_matches")
    .select("id, beneficiary_id")
    .eq("id", parsed.data.matchId)
    .maybeSingle();
  if (!match) return { error: "We couldn't find this conversation." };

  const { error } = await supabase.from("safeguarding_concerns").insert({
    raised_by: who.userId,
    match_id: match.id,
    beneficiary_id: match.beneficiary_id,
    description: parsed.data.description,
  });
  if (error) return { error: "We couldn't send that. Please try again." };

  const parties = await matchParties(match.id);
  const admins = await adminProfileIds();
  for (const id of admins) {
    await notifyIfNoUnread({
      profileId: id,
      type: "safeguarding",
      title: "Safeguarding concern raised",
      body: `${who.role === "mentor" ? "A mentor" : "A child's account"} raised a concern about the ${parties?.childFirstName ?? "a"} conversation. Open Concerns to review it.`,
    });
  }
  return { success: true };
}
