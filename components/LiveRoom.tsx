"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import TvFrame from "./TvFrame";
import TestCard from "./TestCard";
import CaptionStrip from "./CaptionStrip";
import YourNumbers from "./YourNumbers";
import Wheel from "./Wheel";
import Countdown from "./Countdown";
import Tear from "./Tear";
import { gbp, pad, thousands, ukTime } from "@/lib/format";
import type { Draw, LiveState, Wheel as WheelType } from "@/lib/types";

const POLL_MS = 2500;

export default function LiveRoom({
  initial,
  selling,
  wheel,
  spinsLeft,
  spinsUsed,
  signedIn,
}: {
  initial: LiveState;
  selling: Draw | null;
  wheel: WheelType | null;
  spinsLeft: number;
  spinsUsed: number;
  signedIn: boolean;
}) {
  const [state, setState] = useState<LiveState>(initial);
  const [wheelOpen, setWheelOpen] = useState(false);
  const drawId = initial.draw.id;
  const inflight = useRef(false);

  const poll = useCallback(async () => {
    if (inflight.current || document.hidden) return;
    inflight.current = true;
    try {
      const res = await fetch(`/api/live?draw=${drawId}`, { cache: "no-store" });
      if (res.ok) setState((await res.json()) as LiveState);
    } catch {
      /* a dropped poll is not worth showing anyone */
    } finally {
      inflight.current = false;
    }
  }, [drawId]);

  useEffect(() => {
    const id = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  const draw = state.draw;
  const attempts = state.attempts;
  const current = attempts.length ? attempts[attempts.length - 1] : null;
  const finished = draw.status === "complete";
  const onAir = draw.status === "drawing" || draw.status === "closed";
  const voids = attempts.filter((a) => a.void_reason);

  const picture = draw.stream_url ? (
    <iframe
      src={draw.stream_url}
      title={`Edition ${draw.draw_no} live stream`}
      allow="autoplay; fullscreen; picture-in-picture"
      className="absolute inset-0 w-full h-full border-0"
    />
  ) : (
    <TestCard
      headline={`Edition ${draw.draw_no}`}
      note={
        onAir
          ? "Camera feed not connected in this build"
          : "Transmission ended"
      }
    />
  );

  return (
    <>
      {/* Broadcast zone ------------------------------------------------- */}
      <section className="zone-night relative overflow-hidden">
        <div
          aria-hidden
          className="dot-shade absolute -right-24 -top-24 w-96 h-96 text-phosphor opacity-10 pointer-events-none"
        />
        <div className="relative max-w-6xl mx-auto px-4 py-10 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span
                  aria-hidden
                  className={`w-3 h-3 rounded-full ${onAir ? "lamp-on" : "lamp-off"}`}
                />
                <h1 className="text-3xl sm:text-4xl text-phosphor">
                  {draw.title}
                </h1>
                <span className="label text-phosphor/50">
                  {thousands(draw.sold)} tickets in the drum
                </span>
              </div>

              <TvFrame
                channel={String(draw.draw_no)}
                live={onAir}
                picture={picture}
                caption={
                  <CaptionStrip
                    attempt={current}
                    digitCount={draw.digit_count}
                    drawNo={draw.draw_no}
                  />
                }
              />

              {/* Result banner ---------------------------------------- */}
              {finished && draw.winning_number !== null && (
                <div className="mt-5 bg-red text-paper border-2 border-paper/30 px-5 py-4">
                  <p className="label mb-2">Winning number</p>
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <span className="num text-4xl font-bold">
                      {pad(draw.winning_number, draw.digit_count)}
                    </span>
                    {draw.winner_name && (
                      <span className="text-lg">held by {draw.winner_name}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Void record ------------------------------------------ */}
              {voids.length > 0 && (
                <div className="mt-5 border-2 border-phosphor/25 px-5 py-4">
                  <p className="label text-phosphor/60 mb-3">
                    Void attempts, kept on the record
                  </p>
                  <ul className="space-y-2">
                    {voids.map((a) => (
                      <li key={a.attempt} className="text-sm text-phosphor/80">
                        <span className="num font-bold">
                          {a.number !== null ? pad(a.number, draw.digit_count) : "—"}
                        </span>
                        <span className="text-phosphor/55"> — {a.void_reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar --------------------------------------------------- */}
            <aside className="space-y-6">
              {selling ? (
                <div className="bg-red text-paper border-2 border-paper/25 p-5">
                  <p className="label mb-2">On sale now</p>
                  <h2 className="text-2xl mb-1">{selling.prize_headline}</h2>
                  <p className="text-sm text-paper/80 mb-4">
                    Edition {selling.draw_no} · {gbp(selling.ticket_price_pence)}{" "}
                    a ticket
                  </p>
                  <p className="label mb-2 text-paper/70">Sales close in</p>
                  <Countdown
                    serverTime={state.server_time}
                    target={selling.sales_close_at}
                    tone="ink"
                    size="small"
                  />
                  <Link href="/" className="btn btn-paper w-full mt-4 text-sm">
                    Buy for Edition {selling.draw_no}
                  </Link>
                  <p className="text-xs text-paper/70 mt-3 leading-snug">
                    You are watching Edition {draw.draw_no}. Tickets on sale are
                    for the next one, so nothing you see on screen can change
                    what you are buying.
                  </p>
                </div>
              ) : (
                <div className="border-2 border-phosphor/25 p-5">
                  <p className="label text-phosphor/60">No edition on sale</p>
                </div>
              )}

              {wheel && (
                <div className="hidden lg:block">
                  <Wheel
                    segments={wheel.segments}
                    spinsLeft={spinsLeft}
                    spinsUsed={spinsUsed}
                    perUserCap={wheel.per_user_spin_cap}
                    signedIn={signedIn}
                    compact
                  />
                </div>
              )}

              {state.recent_spins.length > 0 && (
                <div className="border-2 border-phosphor/25 p-5">
                  <p className="label text-phosphor/60 mb-3">On the wheel</p>
                  <ul className="space-y-1.5">
                    {state.recent_spins.map((s, i) => (
                      <li
                        key={i}
                        className="text-sm text-phosphor/80 flex justify-between gap-3"
                      >
                        <span className="truncate">{s.name}</span>
                        <span
                          className={`num shrink-0 ${s.tickets > 0 ? "text-lamp" : "text-phosphor/40"}`}
                        >
                          {s.tickets > 0 ? `+${s.tickets}` : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="label text-phosphor/35">
                Server time {ukTime(state.server_time)}
              </p>
            </aside>
          </div>
        </div>
      </section>

      <Tear from="night" to="paper" />

      {/* Your numbers ---------------------------------------------------- */}
      <section className="zone-paper">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <YourNumbers
            tickets={state.my_tickets}
            attempt={current}
            digitCount={draw.digit_count}
            signedIn={signedIn}
          />
        </div>
      </section>

      {/* Mobile wheel ---------------------------------------------------- */}
      {wheel && (
        <>
          <div className="lg:hidden sticky bottom-0 z-30 border-t-2 border-ink bg-paper-deep px-4 py-3">
            <button
              type="button"
              onClick={() => setWheelOpen(true)}
              className="btn btn-red w-full"
            >
              Open the wheel
              {signedIn ? ` — ${spinsLeft} spins` : ""}
            </button>
          </div>

          {wheelOpen && (
            <div
              className="lg:hidden fixed inset-0 z-40 bg-ink/85 flex items-end sm:items-center justify-center p-3 overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="The wheel"
            >
              <div className="w-full max-w-sm my-auto">
                <Wheel
                  segments={wheel.segments}
                  spinsLeft={spinsLeft}
                  spinsUsed={spinsUsed}
                  perUserCap={wheel.per_user_spin_cap}
                  signedIn={signedIn}
                  compact
                />
                <button
                  type="button"
                  onClick={() => setWheelOpen(false)}
                  className="btn btn-paper w-full mt-3"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
