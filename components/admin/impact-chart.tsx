"use client";

import { useState } from "react";
import type { MonthlyCount } from "@/lib/admin/dashboard-stats";

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 36;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;

function niceMax(value: number) {
  if (value <= 0) return 5;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function ImpactChart({ data }: { data: MonthlyCount[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const max = niceMax(Math.max(...data.map((d) => d.count), 1));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: PAD_LEFT + stepX * i,
    y: PAD_TOP + plotHeight - (d.count / max) * plotHeight,
    ...d,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1]?.x ?? 0},${PAD_TOP + plotHeight} L${points[0]?.x ?? 0},${PAD_TOP + plotHeight} Z`;

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const last = points[points.length - 1];

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relativeX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="block w-full"
        role="img"
        aria-label="New beneficiaries added per month over the last 6 months"
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <g>
          {ticks.map((tick, i) => {
            const y = PAD_TOP + plotHeight - (tick / max) * plotHeight;
            return (
              <g key={i}>
                <line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={WIDTH - PAD_RIGHT}
                  y2={y}
                  stroke="#e9eef5"
                  strokeWidth={1}
                />
                <text x={0} y={y + 3} fontSize={9} fill="#7a8ca7">
                  {tick}
                </text>
              </g>
            );
          })}
        </g>

        <path
          d={areaPath}
          fill="var(--tace-blue)"
          opacity={0.1}
          stroke="none"
        />
        <path
          d={linePath}
          fill="none"
          stroke="var(--tace-blue)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <g key={p.month + i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={4}
              fill="var(--tace-blue)"
              stroke="#fff"
              strokeWidth={2}
            />
            {/* generous invisible hit target, per dataviz interaction spec */}
            <circle
              cx={p.x}
              cy={p.y}
              r={14}
              fill="transparent"
              onFocus={() => setHoverIndex(i)}
              tabIndex={0}
              role="button"
              aria-label={`${p.month}: ${p.count}`}
            />
          </g>
        ))}

        {hoverIndex !== null ? (
          <line
            x1={points[hoverIndex].x}
            y1={PAD_TOP}
            x2={points[hoverIndex].x}
            y2={PAD_TOP + plotHeight}
            stroke="#c7d4e4"
            strokeWidth={1}
          />
        ) : null}

        {last ? (
          <text
            x={last.x}
            y={last.y - 12}
            fontSize={10}
            fontWeight={700}
            textAnchor="end"
            fill="#102033"
          >
            {last.count}
          </text>
        ) : null}

        <g>
          {points.map((p, i) => (
            <text
              key={p.month + i}
              x={p.x}
              y={HEIGHT - 6}
              fontSize={9}
              textAnchor="middle"
              fill="#7a8ca7"
            >
              {p.month}
            </text>
          ))}
        </g>
      </svg>

      {hovered ? (
        <div
          className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-full flex-col items-center rounded-lg bg-tace-navy px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg"
          style={{
            left: `${(hovered.x / WIDTH) * 100}%`,
            top: `${(hovered.y / HEIGHT) * 100 - 4}%`,
          }}
        >
          <span className="font-bold">{hovered.count}</span>
          <span className="text-[10px] font-medium text-white/60">
            {hovered.month}
          </span>
        </div>
      ) : null}

      <table className="sr-only">
        <caption>New beneficiaries added per month</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>New beneficiaries</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <td>{d.month}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
