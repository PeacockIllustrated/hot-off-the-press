"use client";

import { useEffect, useState } from "react";
import { countdownParts } from "@/lib/format";

/**
 * The clock on the wall is never trusted. We take the server's time once,
 * measure the offset against this browser, and count down against that.
 * The sale itself closes in Postgres, on now() — this display only reports it.
 */
export default function Countdown({
  serverTime,
  target,
  tone = "paper",
  size = "large",
  onDone,
}: {
  serverTime: string;
  target: string;
  tone?: "paper" | "ink" | "night";
  size?: "large" | "small";
  onDone?: () => void;
}) {
  const [offset, setOffset] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    setOffset(Date.parse(serverTime) - Date.now());
  }, [serverTime]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const remaining =
    offset === null ? null : Date.parse(target) - (now + offset);

  const parts = countdownParts(remaining ?? 0);

  useEffect(() => {
    if (remaining !== null && remaining <= 0) onDone?.();
  }, [remaining !== null && remaining <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const cells: { v: number; l: string }[] = [
    ...(parts.days > 0 ? [{ v: parts.days, l: "days" }] : []),
    { v: parts.hours, l: "hrs" },
    { v: parts.minutes, l: "min" },
    { v: parts.seconds, l: "sec" },
  ];

  const box =
    tone === "night"
      ? "bg-night-2 text-phosphor border-phosphor/30"
      : tone === "ink"
        ? "bg-ink text-paper border-ink"
        : "bg-paper text-ink border-ink";

  const labelTone =
    tone === "night" ? "text-phosphor/60" : tone === "ink" ? "text-paper/60" : "text-ink-soft";

  if (remaining === null) {
    // Server-rendered pass: hold the space, don't print a wrong number.
    return (
      <div className="flex gap-2" aria-hidden>
        {cells.map((c) => (
          <div key={c.l} className={`border-2 px-3 py-2 ${box}`}>
            <span className={size === "large" ? "num text-3xl" : "num text-xl"}>
              --
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (parts.done) {
    return (
      <p className="label text-red">Sales closed on server time</p>
    );
  }

  return (
    <div className="flex gap-2" role="timer" aria-live="off">
      {cells.map((c) => (
        <div key={c.l} className={`border-2 px-3 py-2 text-center ${box}`}>
          <div
            className={
              size === "large"
                ? "num text-3xl leading-none font-bold"
                : "num text-xl leading-none font-bold"
            }
          >
            {String(c.v).padStart(2, "0")}
          </div>
          <div className={`label mt-1.5 ${labelTone}`}>{c.l}</div>
        </div>
      ))}
    </div>
  );
}
