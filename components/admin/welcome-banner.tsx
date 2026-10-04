function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function WelcomeBanner({ firstName }: { firstName: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E1EDF8] bg-gradient-to-r from-[#E9F7FF] via-[#EEF8FF] to-[#DFF2FF] p-7">
      <div className="relative z-10 max-w-[650px]">
        <p className="text-sm font-semibold text-tace-blue">
          {greeting()}, {firstName} 👋
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-tace-navy md:text-[28px]">
          Welcome back to TACE Foundation
        </h1>
        <p className="mt-1.5 text-sm text-tace-gray">
          Together, we are building brighter futures for every child.
        </p>
        <div className="mt-4 h-[3px] w-12 rounded-full bg-tace-blue" />
      </div>

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 110%, rgba(21,159,234,.15), transparent 45%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-[3%] hidden text-[56px] opacity-90 sm:block"
        aria-hidden
      >
        👧🏾 👦🏾 👦🏾
      </div>
      <p
        className="pointer-events-none absolute right-[2%] top-5 hidden -rotate-3 font-serif text-lg italic leading-tight text-tace-blue/70 md:block"
        aria-hidden
      >
        Empowering
        <br />
        Children.
        <br />
        Building
        <br />
        Futures.
      </p>
    </div>
  );
}
