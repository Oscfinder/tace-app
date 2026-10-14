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
      variant="default"
      onClick={handleShare}
      className="h-11 self-start border-transparent px-5 bg-gradient-to-r from-m-blue to-m-blue2 text-white shadow-[0_8px_18px_#009de832] hover:opacity-95 hover:text-white"
    >
      <Share2 className="size-4" />
      Share
    </Button>
  );
}
