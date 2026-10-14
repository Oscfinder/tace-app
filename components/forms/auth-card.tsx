import Image from "next/image";
import Link from "next/link";
import { STOCK_IMAGES } from "@/lib/public/stock-images";

const POINTS = [
  "Quality Education",
  "Mentorship & Guidance",
  "Skills & Training",
  "Lasting Impact",
];

export function AuthCard({
  title,
  description,
  topLinkPrompt,
  topLinkLabel,
  topLinkHref,
  activeTab,
  children,
}: {
  title: string;
  description?: string;
  topLinkPrompt?: string;
  topLinkLabel?: string;
  topLinkHref?: string;
  activeTab?: "login" | "signup";
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white lg:flex">
      <div className="relative flex min-h-[300px] flex-col justify-end overflow-hidden bg-tace-navy lg:fixed lg:inset-y-0 lg:left-0 lg:h-screen lg:w-1/2">
        <Image
          src={STOCK_IMAGES.hero}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02142d]/10 via-[#02122b]/35 to-[#02122b]/88" />

        <Link
          href="/"
          className="absolute left-[8%] top-7 z-10 flex items-center gap-2.5 lg:top-10"
        >
          <Image
            src="/images/tace-icon.png"
            alt=""
            width={192}
            height={192}
            priority
            className="size-11 shrink-0 object-contain drop-shadow-[0_4px_14px_rgba(0,0,0,0.45)] lg:size-14"
          />
          <span className="flex flex-col leading-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
            <span className="font-heading text-lg font-bold lg:text-xl">
              TACE Foundation
            </span>
            <span className="text-xs text-white/70 lg:text-sm">
              Guiding Children Toward Independence
            </span>
          </span>
        </Link>

        <div className="relative z-10 max-w-[620px] px-[8%] pb-[7%] text-white">
          <h1 className="font-heading text-[38px] font-extrabold leading-[0.98] tracking-tight md:text-[58px]">
            Brighter Futures
            <br />
            <span className="text-tace-yellow">Start Here</span>
          </h1>
          <p className="mt-5 max-w-[560px] text-[15px] leading-relaxed text-white/90 md:text-[17px]">
            At TACE Welfare Foundation, we empower vulnerable children through
            education, mentorship, skills and opportunity — helping them build a
            better tomorrow.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            {POINTS.map((point, i) => (
              <span
                key={point}
                className={
                  i < POINTS.length - 1
                    ? "border-r border-white/30 pr-4 text-[13px] font-semibold"
                    : "text-[13px] font-semibold"
                }
              >
                {point}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center overflow-hidden bg-[#fbfdff] px-6 py-12 sm:px-10 lg:ml-[50%] lg:w-1/2 lg:min-h-screen lg:px-[7vw] lg:py-16">
        <div
          className="pointer-events-none absolute -right-[110px] -top-[120px] size-[250px] rounded-full bg-[#e3f4ff]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-[70px] -bottom-[80px] size-[190px] rounded-full bg-[#fff4c9]"
          aria-hidden
        />

        <div className="relative z-10 w-full max-w-[480px]">
          {topLinkPrompt && topLinkLabel && topLinkHref ? (
            <div className="mb-10 flex justify-end gap-1.5 text-sm text-tace-gray">
              <span>{topLinkPrompt}</span>
              <Link href={topLinkHref} className="font-bold text-tace-blue">
                {topLinkLabel}
              </Link>
            </div>
          ) : null}

          <h2 className="font-heading text-[32px] font-extrabold tracking-tight text-tace-navy md:text-[40px]">
            {title}
          </h2>
          {description ? (
            <p className="mt-2.5 text-base leading-relaxed text-tace-gray">
              {description}
            </p>
          ) : null}

          {activeTab ? (
            <div className="mt-7 grid grid-cols-2 overflow-hidden rounded-[14px] border border-[#dce7f4]">
              {activeTab === "login" ? (
                <span className="bg-tace-blue px-4 py-3.5 text-center text-[15px] font-bold text-white">
                  Sign In
                </span>
              ) : (
                <Link
                  href="/login"
                  className="bg-white px-4 py-3.5 text-center text-[15px] font-bold text-[#34496c] transition-colors hover:bg-[#f7faff]"
                >
                  Sign In
                </Link>
              )}
              {activeTab === "signup" ? (
                <span className="bg-tace-blue px-4 py-3.5 text-center text-[15px] font-bold text-white">
                  Create Account
                </span>
              ) : (
                <Link
                  href="/signup/member"
                  className="bg-white px-4 py-3.5 text-center text-[15px] font-bold text-[#34496c] transition-colors hover:bg-[#f7faff]"
                >
                  Create Account
                </Link>
              )}
            </div>
          ) : null}

          <div className="mt-7">{children}</div>

          <p className="mt-7 text-center text-xs leading-relaxed text-tace-gray">
            🔒 Your information is secure and will never be shared
            <br className="hidden sm:block" /> with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
