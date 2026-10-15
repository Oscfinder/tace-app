// What the chat screen needs about a message. Plain data, safe to pass from a
// Server Component to the client chat.
export type ChatMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  /** Held for review by TACE staff. Only the sender ever sees their own held messages. */
  is_flagged: boolean;
  read_at: string | null;
};

export const MESSAGE_LIMIT_PER_HOUR = 30;
export const MAX_MESSAGE_LENGTH = 1000;
