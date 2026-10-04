"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function StickyDonate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Link
      href="/donate"
      className={cn(
        "fixed inset-x-4 bottom-4 z-40 flex items-center justify-center gap-2 rounded-full bg-tace-red px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(237,28,36,0.35)] transition-all md:inset-x-auto md:bottom-6 md:right-6",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <Heart className="size-4 fill-current" />
      Donate Now
    </Link>
  );
}
