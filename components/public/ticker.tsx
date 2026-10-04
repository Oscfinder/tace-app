const ITEMS = [
  "CAC Registered · RC: IT/9786795",
  "TIN: 2622487847179",
  "Guiding Children Toward Independence",
  "Empowering Children Since 2025 · Lagos, Nigeria",
  "Now Accepting Beneficiary Applications",
];

export function Ticker() {
  const items = [...ITEMS, ...ITEMS];

  return (
    <div className="overflow-hidden bg-tace-navy py-3.5">
      <div className="ticker-track flex w-max gap-12">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 whitespace-nowrap text-[13px] font-bold text-white/70"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-tace-yellow" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
