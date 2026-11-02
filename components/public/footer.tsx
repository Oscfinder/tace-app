import Image from "next/image";
import Link from "next/link";

const QUICK_LINKS = [
  { href: "/about", label: "About" },
  { href: "/programmes", label: "Programmes" },
  { href: "/sponsor", label: "Sponsor" },
  { href: "/#mentor", label: "Mentor" },
  { href: "/signup/member", label: "Become a Member" },
  { href: "/donate", label: "Donate" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms" },
  { href: "/child-protection-policy", label: "Child Protection Policy" },
];

export function Footer() {
  return (
    <footer className="bg-[#08080f] px-4 py-16 text-white/60 md:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-10 md:grid-cols-[2.5fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/images/tace-white.png"
              alt="TACE Foundation"
              width={616}
              height={405}
              className="h-16 w-auto object-contain"
            />
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              Transforming vulnerable children into skilled, self-sufficient
              young adults through education, mentorship, vocational training,
              and genuine human connection.
            </p>
            <p className="mt-4 text-[13px] italic text-[#6cc4ee]">
              &quot;Guiding Children Toward Independence&quot;
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-white/90">
              Quick Links
            </h3>
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="mb-2.5 block text-sm font-medium text-white/65 hover:text-[#6cc4ee]"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-white/90">
              Legal
            </h3>
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="mb-2.5 block text-sm font-medium text-white/65 hover:text-[#6cc4ee]"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-white/90">
              Contact
            </h3>
            <p className="mb-2.5 text-sm font-medium text-white/65">
              tacefoundationinfo@gmail.com
            </p>
            <p className="text-sm font-medium text-white/65">
              Festac Town, Lagos, Nigeria
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-6">
          <p className="text-[13px] text-white/60">
            © 2026 TACE Welfare Foundation. All rights reserved.
          </p>
          <div className="flex gap-2.5">
            <span className="rounded-full border border-tace-blue/20 bg-tace-blue/10 px-3 py-1 text-[11px] font-bold text-[#6cc4ee]">
              CAC: IT/9786795
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
