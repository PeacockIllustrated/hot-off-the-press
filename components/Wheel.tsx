"use client";

import { useMemo, useRef, useState } from "react";
import { spinAction } from "@/lib/actions";
import type { SpinResult, WheelSegment } from "@/lib/types";

const SPIN_MS = 4200;

function colourFor(tickets: number): string {
  if (tickets >= 5) return "#C8102E";
  if (tickets >= 2) return "#8F0A20";
  if (tickets >= 1) return "#16130F";
  return "#DCD5C6";
}

function textFor(tickets: number): string {
  return tickets === 0 ? "#4A433A" : "#E9E4D9";
}

/** Polar point, degrees measured clockwise from twelve o'clock. */
function pt(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, a1: number, a2: number) {
  const p1 = pt(cx, cy, r, a1);
  const p2 = pt(cx, cy, r, a2);
  const large = a2 - a1 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
}

export default function Wheel({
  segments,
  spinsLeft,
  spinsUsed,
  perUserCap,
  signedIn,
  compact = false,
}: {
  segments: WheelSegment[];
  spinsLeft: number;
  spinsUsed: number;
  perUserCap: number;
  signedIn: boolean;
  compact?: boolean;
}) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(spinsLeft);
  const [used, setUsed] = useState(spinsUsed);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const geometry = useMemo(() => {
    const total = segments.reduce((s, x) => s + x.weight_ppm, 0) || 1;
    let cursor = 0;
    return segments.map((seg) => {
      const sweep = (seg.weight_ppm / total) * 360;
      const a1 = cursor;
      const a2 = cursor + sweep;
      cursor = a2;
      return { seg, a1, a2, mid: (a1 + a2) / 2, sweep };
    });
  }, [segments]);

  const odds = useMemo(() => {
    const total = segments.reduce((s, x) => s + x.weight_ppm, 0) || 1;
    const grouped = new Map<number, number>();
    for (const s of segments) {
      grouped.set(s.tickets, (grouped.get(s.tickets) ?? 0) + s.weight_ppm);
    }
    return [...grouped.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([tickets, ppm]) => ({
        tickets,
        pct: (ppm / total) * 100,
      }));
  }, [segments]);

  const atCap = used >= perUserCap;
  const canSpin = signedIn && balance > 0 && !spinning && !atCap;

  async function handleSpin() {
    if (!canSpin) return;
    setSpinning(true);
    setError(null);
    setResult(null);

    const res = await spinAction();

    if (res.error || !res.result) {
      setSpinning(false);
      setError(res.error ?? "The wheel could not be turned.");
      return;
    }

    const outcome = res.result;
    const g = geometry[outcome.segment_index] ?? geometry[0];

    // The result already exists. This only animates towards it.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const jitter = (Math.random() - 0.5) * g.sweep * 0.6;
    const targetMod = (360 - ((g.mid + jitter) % 360) + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    let delta = targetMod - currentMod;
    if (delta < 0) delta += 360;

    setRotation(rotation + delta + 360 * (reduced ? 0 : 5));

    timer.current = setTimeout(
      () => {
        setSpinning(false);
        setResult(outcome);
        setBalance(outcome.spins_left);
        setUsed(outcome.spins_used_this_draw);
      },
      reduced ? 120 : SPIN_MS,
    );
  }

  const size = compact ? 190 : 240;

  return (
    <div className="card-flat">
      <div className="border-b-2 border-ink px-5 py-4">
        <h3 className="text-xl">The wheel</h3>
        <p className="label text-ink-soft mt-2">Spins are earned, never sold</p>
      </div>

      <div className="p-5">
        <div className="flex flex-col items-center">
          <div className="relative" style={{ width: size, height: size + 14 }}>
            {/* Pointer */}
            <div
              aria-hidden
              className="absolute left-1/2 -translate-x-1/2 top-0 z-10"
              style={{
                width: 0,
                height: 0,
                borderLeft: "10px solid transparent",
                borderRight: "10px solid transparent",
                borderTop: "18px solid #16130F",
              }}
            />
            <svg
              viewBox="0 0 200 200"
              width={size}
              height={size}
              style={{
                marginTop: 14,
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? `transform ${SPIN_MS}ms cubic-bezier(.13,.66,.16,1)`
                  : "none",
              }}
              role="img"
              aria-label="Prize wheel"
            >
              <circle cx="100" cy="100" r="98" fill="#16130F" />
              {geometry.map((g, i) => (
                <path
                  key={i}
                  d={arcPath(100, 100, 94, g.a1, g.a2)}
                  fill={colourFor(g.seg.tickets)}
                  stroke="#16130F"
                  strokeWidth={g.sweep < 4 ? 0.4 : 1.2}
                />
              ))}
              {geometry.map((g, i) =>
                g.sweep > 26 ? (
                  <text
                    key={`t${i}`}
                    x={pt(100, 100, 62, g.mid).x}
                    y={pt(100, 100, 62, g.mid).y}
                    fill={textFor(g.seg.tickets)}
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${g.mid} ${pt(100, 100, 62, g.mid).x} ${pt(100, 100, 62, g.mid).y})`}
                  >
                    {g.seg.tickets === 0 ? "—" : `+${g.seg.tickets}`}
                  </text>
                ) : null,
              )}
              <circle cx="100" cy="100" r="16" fill="#16130F" stroke="#E9E4D9" strokeWidth="2" />
            </svg>
          </div>

          {/* Outcome ---------------------------------------------------- */}
          <div className="mt-4 w-full min-h-20 text-center">
            {spinning ? (
              <p className="label text-ink-soft">Turning…</p>
            ) : result ? (
              <div className="pop-in">
                <p
                  className={`display text-2xl ${result.tickets_awarded > 0 ? "text-red" : ""}`}
                >
                  {result.tickets_awarded > 0
                    ? `+${result.tickets_awarded} ticket${result.tickets_awarded > 1 ? "s" : ""}`
                    : "No win"}
                </p>
                {result.ticket_numbers.length > 0 && (
                  <p className="num text-sm mt-2">
                    {result.ticket_numbers.map((n) => String(n).padStart(4, "0")).join(" · ")}
                  </p>
                )}
                {result.capped && (
                  <p className="text-xs text-ink-soft mt-2 leading-snug">
                    This edition has reached its giveaway cap, so the wheel can
                    only land on non-ticket outcomes.
                  </p>
                )}
                <p className="label text-ink-faint mt-2">
                  Roll {result.roll.toLocaleString("en-GB")} / 1,000,000
                </p>
              </div>
            ) : error ? (
              <p className="text-sm text-red">{error}</p>
            ) : (
              <p className="text-sm text-ink-soft">
                {signedIn
                  ? "Every ticket you buy earns a spin."
                  : "Sign in to use your spins."}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSpin}
            disabled={!canSpin}
            className="btn btn-red w-full mt-3"
          >
            {spinning
              ? "Turning"
              : atCap
                ? "Spin limit reached"
                : balance > 0
                  ? `Spin — ${balance} left`
                  : "No spins"}
          </button>

          {signedIn && (
            <p className="label text-ink-faint mt-3">
              {used} of {perUserCap} spins used this edition
            </p>
          )}
        </div>

        {/* Printed odds ------------------------------------------------- */}
        <div className="mt-5 pt-4 rule-thin">
          <p className="label mb-3">Odds, printed</p>
          <table className="w-full text-sm">
            <tbody>
              {odds.map((o) => (
                <tr key={o.tickets} className="border-b border-rule/50 last:border-0">
                  <td className="py-1.5">
                    {o.tickets === 0
                      ? "No win"
                      : `${o.tickets} free ticket${o.tickets > 1 ? "s" : ""}`}
                  </td>
                  <td className="py-1.5 text-right num">
                    {o.pct >= 1 ? o.pct.toFixed(1) : o.pct.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-ink-soft mt-3 leading-snug">
            Most spins win nothing. That is what the table above says, and it is
            the honest shape of it.
          </p>
        </div>
      </div>
    </div>
  );
}
