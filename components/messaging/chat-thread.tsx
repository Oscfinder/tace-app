"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { markThreadRead, sendMessage } from "@/lib/messaging/actions";
import { ChatConcern } from "@/components/messaging/chat-concern";
import { MAX_MESSAGE_LENGTH, type ChatMessage } from "@/lib/messaging/types";

const POLL_MS = 15_000;

const COLUMNS = "id, sender_id, content, created_at, is_flagged, read_at";

type Row = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_flagged: boolean | null;
  read_at: string | null;
};
const toMessage = (r: Row): ChatMessage => ({
  id: r.id,
  sender_id: r.sender_id,
  content: r.content,
  created_at: r.created_at,
  is_flagged: r.is_flagged ?? false,
  read_at: r.read_at,
});
const byTime = (a: ChatMessage, b: ChatMessage) =>
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

export function ChatThread({
  matchId,
  userId,
  initialMessages,
  status,
  otherName,
  backHref,
  backLabel,
}: {
  matchId: string;
  userId: string;
  initialMessages: ChatMessage[];
  status: string;
  otherName: string;
  backHref: string;
  backLabel: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [live, setLive] = useState<"connecting" | "live" | "polling">("connecting");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const active = status === "active";

  const merge = useCallback((incoming: ChatMessage[]) => {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) map.set(m.id, m);
      return [...map.values()].sort(byTime);
    });
  }, []);

  // Live updates. Row-level security decides which rows reach this browser, so
  // the subscription can never deliver someone else's conversation. If the live
  // connection fails (or never opens), fall back to polling every 15 seconds.
  useEffect(() => {
    const supabase = createClient();
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let subscribed = false;

    const refetch = async () => {
      const { data } = await supabase
        .from("mentorship_messages")
        .select(COLUMNS)
        .eq("match_id", matchId)
        .order("created_at", { ascending: true })
        .limit(500);
      if (data) {
        // Replace, not merge: a message an admin has since held must disappear.
        setMessages(data.map((r) => toMessage(r as Row)).sort(byTime));
        void markThreadRead(matchId);
      }
    };
    const startPolling = () => {
      if (pollTimer) return;
      setLive("polling");
      pollTimer = setInterval(refetch, POLL_MS);
    };
    const stopPolling = () => {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
    };

    const channel = supabase
      .channel(`thread:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mentorship_messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const row = payload.new as Row;
          merge([toMessage(row)]);
          if (row.sender_id !== userId) void markThreadRead(matchId);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "mentorship_messages", filter: `match_id=eq.${matchId}` },
        () => void refetch(),
      )
      .subscribe((s) => {
        if (s === "SUBSCRIBED") {
          subscribed = true;
          stopPolling();
          setLive("live");
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
          subscribed = false;
          startPolling();
        }
      });

    // If the live connection hasn't opened after a few seconds, don't wait.
    const guard = setTimeout(() => {
      if (!subscribed) startPolling();
    }, 5000);

    return () => {
      clearTimeout(guard);
      stopPolling();
      void supabase.removeChannel(channel);
    };
  }, [matchId, userId, merge]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    const result = await sendMessage({ matchId, content });
    setSending(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    merge([result.message]);
    setText("");
  }

  const remaining = MAX_MESSAGE_LENGTH - text.length;

  return (
    <div className="flex flex-col gap-3">
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-[#008fda] hover:underline"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>

      <section className="flex flex-col overflow-hidden rounded-[22px] border border-m-line bg-white shadow-m-card">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eff3f7] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h1 className="m-head truncate text-lg font-extrabold text-m-ink">{otherName}</h1>
            <p className="text-xs text-m-muted" aria-live="polite">
              {live === "live"
                ? "● Live"
                : live === "polling"
                  ? "Refreshing every 15 seconds"
                  : "Connecting…"}
            </p>
          </div>
          <ChatConcern matchId={matchId} />
        </header>

        <p className="flex items-start gap-2 bg-[#f4f8fd] px-4 py-2.5 text-xs leading-relaxed text-[#4d6584] sm:px-5">
          <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Messages on TACE are visible to TACE staff to keep children safe.
        </p>

        <div
          className="flex max-h-[60vh] min-h-[40vh] flex-col gap-2.5 overflow-y-auto px-4 py-4 sm:px-5"
          role="log"
          aria-label="Conversation"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <p className="m-auto max-w-xs text-center text-sm text-m-muted">
              {active
                ? `No messages yet. Say hello to ${otherName}!`
                : "There are no messages in this conversation."}
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === userId;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[16px] leading-relaxed ${
                      mine
                        ? m.is_flagged
                          ? "rounded-br-md bg-[#fff4dc] text-m-ink ring-1 ring-[#f6d27a]"
                          : "rounded-br-md bg-gradient-to-br from-m-blue to-[#19b2ed] text-white"
                        : "rounded-bl-md bg-[#eef3f9] text-m-ink"
                    }`}
                  >
                    <p className="break-words whitespace-pre-wrap">{m.content}</p>
                    <p
                      className={`mt-1 text-[11px] ${mine && !m.is_flagged ? "text-white/75" : "text-m-muted"}`}
                    >
                      <time dateTime={m.created_at} suppressHydrationWarning>
                        {new Date(m.created_at).toLocaleString("en-NG", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </time>
                      {mine && !m.is_flagged && m.read_at ? " · Seen" : ""}
                    </p>
                    {mine && m.is_flagged ? (
                      <p className="mt-1 text-xs font-semibold text-[#8a5d00]">
                        Held for review by TACE staff. {otherName} can&apos;t see this yet.
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {active ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="border-t border-[#eff3f7] p-3 sm:p-4"
            noValidate
          >
            {error ? (
              <p
                id="chat-error"
                role="alert"
                className="mb-2 rounded-xl bg-[#fff1f4] px-3.5 py-2.5 text-sm font-medium text-[#c2365c]"
              >
                {error}
              </p>
            ) : null}
            <div className="flex items-end gap-2">
              <label htmlFor="chat-input" className="sr-only">
                Write a message to {otherName}
              </label>
              <textarea
                id="chat-input"
                rows={2}
                value={text}
                maxLength={MAX_MESSAGE_LENGTH}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                aria-describedby={error ? "chat-error" : undefined}
                placeholder="Write a message…"
                className="min-h-12 flex-1 resize-none rounded-xl border border-m-line bg-[#fbfcfe] px-3.5 py-3 text-base outline-none focus-visible:border-[#89d3f5] focus-visible:ring-4 focus-visible:ring-[#0ba6e820]"
              />
              <button
                type="submit"
                disabled={sending || text.trim().length === 0}
                aria-label="Send message"
                className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-m-blue to-m-blue2 text-white shadow-[0_8px_18px_#009de832] disabled:opacity-50"
              >
                {sending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              </button>
            </div>
            <p className={`mt-1.5 text-right text-xs ${remaining < 100 ? "text-[#c2365c]" : "text-m-muted"}`}>
              {remaining} characters left
            </p>
          </form>
        ) : (
          <p className="border-t border-[#eff3f7] bg-[#fff9e8] px-4 py-3.5 text-sm font-medium text-[#8a5d00] sm:px-5">
            {status === "paused"
              ? "Messaging is paused for this mentorship. You can still read earlier messages."
              : "Messaging is switched off for this mentorship. You can still read earlier messages."}
          </p>
        )}
      </section>
    </div>
  );
}
