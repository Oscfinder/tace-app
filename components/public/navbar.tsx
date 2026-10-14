"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/programmes", label: "Programmes" },
  { href: "/sponsor", label: "Sponsor a Child" },
  { href: "/#mentor", label: "Mentor" },
  { href: "/stories", label: "Stories" },
  { href: "/donate", label: "Donate" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 80);
    }
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all",
        scrolled
          ? "bg-white/98 shadow-[0_2px_20px_rgba(0,0,0,0.08)] backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-20 max-w-[1280px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center">
          <Image
            src={scrolled ? "/images/tace.png" : "/images/tace-white.png"}
            alt="TACE Foundation"
            width={616}
            height={405}
            priority
            className="h-16 w-auto object-contain"
          />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group relative text-sm font-semibold transition-colors",
                scrolled
                  ? "text-tace-navy hover:text-tace-blue"
                  : "text-white/90 hover:text-tace-yellow",
              )}
            >
              {link.label}
              <span
                className={cn(
                  "absolute -bottom-2 left-0 h-0.5 w-0 transition-all duration-200 group-hover:w-full",
                  scrolled ? "bg-tace-blue" : "bg-tace-yellow",
                )}
              />
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-5 lg:flex">
          <Link
            href="/signup/member"
            className={cn(
              "text-sm font-semibold transition-colors",
              scrolled
                ? "text-tace-navy hover:text-tace-blue"
                : "text-white/80 hover:text-tace-yellow",
            )}
          >
            Become a Member
          </Link>
          <Button
            render={<Link href="/login" />}
            variant="outline"
            className={cn(
              !scrolled &&
                "border-white/30 bg-white/15 text-white hover:bg-white/25 dark:border-white/30 dark:bg-white/15",
            )}
          >
            Login
          </Button>
          <Button
            render={<Link href="/sponsor" />}
            className="bg-tace-yellow text-tace-navy hover:bg-tace-yellow/90"
          >
            Sponsor a Child
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex size-10 items-center justify-center rounded-lg lg:hidden",
            scrolled ? "text-tace-navy" : "text-white",
          )}
          aria-label="Open menu"
        >
          <Menu className="size-6" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-tace-navy p-6 lg:hidden">
          <div className="flex items-center justify-between">
            <Image
              src="/images/tace-white.png"
              alt="TACE Foundation"
              width={616}
              height={405}
              className="h-14 w-auto object-contain"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex size-10 items-center justify-center rounded-lg text-white"
              aria-label="Close menu"
            >
              <X className="size-6" />
            </button>
          </div>
          <div className="mt-10 flex flex-1 flex-col gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-xl font-semibold text-white/90"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/signup/member"
              onClick={() => setOpen(false)}
              className="text-center text-base font-semibold text-white/70"
            >
              Become a Member
            </Link>
            <Button
              render={<Link href="/login" onClick={() => setOpen(false)} />}
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              Login
            </Button>
            <Button
              render={<Link href="/sponsor" onClick={() => setOpen(false)} />}
              className="bg-tace-yellow text-tace-navy hover:bg-tace-yellow/90"
            >
              Sponsor a Child
            </Button>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
