"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordBallAction, setDrawAction } from "@/lib/actions";
import { pad, thousands } from "@/lib/format";
import type { BallResult, Draw } from "@/lib/types";

export default function DrawConsole({ draw }: { draw: Draw }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [last, setLast] = useState<BallResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);

  function drop(digit: number | null) {
    setError(null);
    start(async () => {
      const res = await recordBallAction(draw.id, digit);
      if (res.error) setError(res.error);
      else setLast(res.result ?? null);
      router.refresh();
    });
  }

  function close() {
    start(async () => {
      const res = await setDrawAction(draw.id, {
        status: "closed",
        sales_close_at: new Date().toISOString(),
      });
      if (res.error) setError(res.error);
      router.refresh();
    });
  }

  const drawable = draw.status === "closed" || draw.status === "drawing";

  return (
    <div className="card-flat">
      <div className="border-b-2 border-ink px-5 py-4 flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-2xl">Draw console</h2>
        <span className="label text-ink-soft">
          Edition {draw.draw_no} · {thousands(draw.sold)} tickets in
        </span>
      </div>

      <div className="p-5">
        {!drawable ? (
          <>
            <p className="text-sm text-ink-soft mb-4">
              Edition {draw.draw_no} is{" "}
              <strong>{draw.status}</strong>. The drum cannot turn until the
              sale is closed — that is enforced in the database, not here.
            </p>
            {draw.status === "selling" && (
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="btn btn-ink"
              >
                Close the sale now
              </button>
            )}
          </>
        ) : (
          <>
            {/* Last ball -------------------------------------------- */}
            <div className="bg-ink text-paper p-5 mb-5">
              {last ? (
                <>
                  <p className="label text-paper/60 mb-3">
                    Attempt {last.attempt} · ball {last.position} of{" "}
                    {last.digit_count}
                    {last.simulated ? " · simulated" : " · entered by hand"}
                  </p>
                  <p className="num text-6xl font-bold leading-none">
                    {last.digit}
                  </p>
                  {last.attempt_complete && (
                    <div className="mt-4 pt-4 border-t border-paper/25">
                      {last.void_reason ? (
                        <>
                          <p className="label text-lamp mb-1.5">Void</p>
                          <p className="text-sm text-paper/80">
                            {last.void_reason}. Press again to start the next
                            attempt.
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="label text-lamp mb-1.5">
                            Valid — edition complete
                          </p>
                          <p className="num text-3xl font-bold">
                            {last.number !== null
                              ? pad(last.number, last.digit_count)
                              : "—"}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="label text-paper/60">
                  Drum loaded. Ready for the first ball.
                </p>
              )}
            </div>

            {/* Controls --------------------------------------------- */}
            {manual ? (
              <>
                <p className="label mb-3">
                  Enter the digit that came out of the drum
                </p>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => drop(d)}
                      disabled={pending}
                      className="num text-2xl font-bold border-2 border-ink py-4 bg-paper hover:bg-ink hover:text-paper transition-colors disabled:opacity-40"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => drop(null)}
                disabled={pending}
                className="btn btn-red w-full text-xl py-5 mb-4"
              >
                {pending ? "Turning…" : "Turn the drum"}
              </button>
            )}

            <button
              type="button"
              onClick={() => setManual((v) => !v)}
              className="label underline text-ink-soft"
            >
              {manual
                ? "Use the simulated drum instead"
                : "Enter the digit by hand instead"}
            </button>

            <p className="text-xs text-ink-soft mt-4 leading-snug">
              On the night an operator types what actually fell out of the
              drum. The simulated button uses the same cryptographic source and
              exists so the draw can be rehearsed.
            </p>
          </>
        )}

        {error && (
          <p className="text-sm text-red border-2 border-red px-3 py-2.5 mt-4">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
