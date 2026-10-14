"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareButton({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  async function handleShare() {
    const url = window.location.origin;
    const message = `${text} ${url}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // User dismissing the share sheet is not an error.
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleShare}
      className="h-11 px-4"
    >
      <Share2 className="size-4" />
      Share
    </Button>
  );
}
