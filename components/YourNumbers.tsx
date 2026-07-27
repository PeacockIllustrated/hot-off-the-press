"use client";

import { useMemo, useState } from "react";
import { pad, thousands } from "@/lib/format";
import type { Attempt } from "@/lib/types";

/**
 * Your tickets for tonight, lit digit by digit as each ball drops. Watching
 * your first two digits survive is the whole point of the format.
 */
export default function YourNumbers({
  tickets,
  attempt,
  digitCount,
  signedIn,
}: {
  tickets: { n: number; source: string }[];
  attempt: Attempt | null;
  digitCount: number;
  signedIn: boolean;
}) {
  const [showDead, setShowDead] = useState(false);

  const prefix = useMemo(
    () =>
      (attempt?.balls ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((b) => String(b.digit))
        .join(""),
    [attempt],
  );

  const rows = useMemo(() => {
    return tickets.map((t) => {
      const s = pad(t.n, digitCount);
      let matched = 0;
      for (let i = 0; i < prefix.length && i < s.length; i++) {
        if (s[i] === prefix[i]) matched++;
        else break;
      }
      return {
        n: t.n,
        s,
        source: t.source,
        matched,
        alive: matched === prefix.length,
      };
    });
  }, [tickets, prefix, digitCount]);

  const alive = rows.filter((r) => r.alive);
  const dead = rows.filter((r) => !r.alive);
  const complete = Boolean(attempt?.completed_at);
  const won =
    complete &&
    !attempt?.void_reason &&
    alive.some((r) => r.n === attempt?.number);

  if (!signedIn) {
    return (
      <div className="card-flat p-5">
        <h3 className="text-xl mb-2">Your numbers</h3>
        <p className="text-sm text-ink-soft">
          Sign in and your tickets for this edition appear here, lighting up
          digit by digit as the balls drop.
        </p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="card-flat p-5">
        <h3 className="text-xl mb-2">Your numbers</h3>
        <p className="text-sm text-ink-soft">
          You have no tickets in this edition. Tickets on sale now are for the
          next one.
        </p>
      </div>
    );
  }

  return (
    <div className="card-flat">
      <div className="border-b-2 border-ink px-5 py-4 flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="text-xl">Your numbers</h3>
        <span className="label text-ink-soft">
          {thousands(tickets.length)} in this edition
        </span>
      </div>

      {/* Live tally ------------------------------------------------------ */}
      <div
        className={`px-5 py-4 border-b-2 border-ink ${
          won ? "bg-red text-paper" : prefix.length > 0 ? "bg-paper-deep" : ""
        }`}
      >
        {won ? (
          <p className="display text-2xl">You have won this edition</p>
        ) : prefix.length === 0 ? (
          <p className="text-sm text-ink-soft">
            Every number below is still in. The first ball knocks out nine in
            ten.
          </p>
        ) : (
          <p className="text-sm">
            <span className="num font-bold text-2xl">{alive.length}</span>
            <span className="text-ink-soft">
              {" "}
              of {tickets.length} still alive after{" "}
              {prefix.length === 1 ? "one ball" : `${prefix.length} balls`}
            </span>
          </p>
        )}
      </div>

      {/* Alive ----------------------------------------------------------- */}
      <div className="p-5">
        {alive.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {alive.slice(0, 60).map((r) => (
              <TicketChip
                key={r.n}
                s={r.s}
                matched={r.matched}
                winner={complete && !attempt?.void_reason && r.n === attempt?.number}
              />
            ))}
            {alive.length > 60 && (
              <span className="label self-center text-ink-soft ml-1">
                +{alive.length - 60} more
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">
            None of your numbers survived this attempt.
            {attempt?.void_reason
              ? " The attempt was void, so it counts for nothing — the drum turns again."
              : ""}
          </p>
        )}

        {dead.length > 0 && (
          <div className="mt-4 pt-4 rule-thin">
            <button
              type="button"
              onClick={() => setShowDead((v) => !v)}
              className="label underline text-ink-soft"
            >
              {showDead ? "Hide" : "Show"} {dead.length} knocked out
            </button>

            {showDead && (
              <div className="flex flex-wrap gap-1 mt-3">
                {dead.slice(0, 200).map((r) => (
                  <span
                    key={r.n}
                    className="num text-xs px-1.5 py-1 border border-rule text-ink-faint line-through"
                  >
                    {r.s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TicketChip({
  s,
  matched,
  winner,
}: {
  s: string;
  matched: number;
  winner: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex border-2",
        winner ? "border-red pop-in" : "border-ink",
      ].join(" ")}
    >
      {s.split("").map((d, i) => (
        <span
          key={i}
          className={[
            "num text-sm sm:text-base font-bold px-1.5 py-1 leading-none",
            i < matched
              ? winner
                ? "bg-red text-paper"
                : "bg-ink text-paper"
              : "bg-paper text-ink",
            i > 0 ? "border-l border-ink/25" : "",
          ].join(" ")}
        >
          {d}
        </span>
      ))}
    </span>
  );
}
