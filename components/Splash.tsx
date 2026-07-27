"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BrandMark from "./BrandMark";

/**
 * The front sheet. On the first visit of a session the nameplate is stamped
 * onto an ink page, a red rule is drawn under it, and the sheet is pulled
 * away to reveal the paper. It runs once per session, leaves early on any
 * click, Escape or the Skip button, and collapses to a short plain fade for
 * anyone who has asked for reduced motion.
 *
 * Repeat visits never see a flash: an inline script in the layout reads
 * sessionStorage before first paint and sets data-splash="seen" on <html>,
 * which display:nones this element until React removes it for good.
 */

const SEEN_KEY = "hotp-splash-seen";
const HOLD_MS = 2150;
const REDUCED_HOLD_MS = 900;
const EXIT_MS = 480;
/* Keep in sync with the splash-failsafe delay + duration in globals.css. */
const FAILSAFE_MS = 4500;

export default function Splash() {
  const [phase, setPhase] = useState<"showing" | "leaving" | "gone">("showing");
  const leaving = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedAt = useRef<number | null>(null);

  /*
   * The data-splash attribute display:nones the sheet, so it must only be
   * set once the exit has finished — setting it inside leave() would hide
   * the sheet before the pull-away animation could render a frame.
   */
  const finish = useCallback(() => {
    document.documentElement.setAttribute("data-splash", "seen");
    setPhase("gone");
  }, []);

  const leave = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode: the splash simply runs again next time */
    }
    // Past the CSS failsafe the sheet has already faded itself out;
    // animating an exit now would flash it back into view.
    const late =
      mountedAt.current !== null &&
      Date.now() - mountedAt.current > FAILSAFE_MS;
    if (late) {
      finish();
      return;
    }
    setPhase("leaving");
    exitTimer.current = setTimeout(finish, EXIT_MS);
  }, [finish]);

  useEffect(() => {
    mountedAt.current = Date.now();

    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* treat as unseen */
    }
    if (seen) {
      leaving.current = true;
      setPhase("gone");
      return;
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const hold = setTimeout(leave, reduced ? REDUCED_HOLD_MS : HOLD_MS);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") leave();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(hold);
      window.removeEventListener("keydown", onKey);
      if (exitTimer.current) clearTimeout(exitTimer.current);
    };
  }, [leave]);

  /*
   * While the sheet is up it is the page: everything behind it is inert —
   * unfocusable and hidden from screen readers — and the body cannot
   * scroll. Both restore the moment the sheet has gone.
   */
  useEffect(() => {
    if (phase === "gone") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const made: HTMLElement[] = [];
    for (const el of Array.from(document.body.children)) {
      if (!(el instanceof HTMLElement)) continue;
      if (el.id === "hotp-splash" || el.tagName === "SCRIPT") continue;
      if (!el.inert) {
        el.inert = true;
        made.push(el);
      }
    }
    return () => {
      document.body.style.overflow = prev;
      for (const el of made) el.inert = false;
    };
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      id="hotp-splash"
      className={phase === "leaving" ? "splash-exit" : undefined}
      onClick={leave}
      role="presentation"
    >
      {/* Without JavaScript the sheet could never leave, so it never lands. */}
      <noscript>
        <style>{`#hotp-splash{display:none}`}</style>
      </noscript>

      <BrandMark
        tone="paper"
        animated
        idPrefix="hotp-splash-mark"
        className="splash-mark"
      />

      <div className="splash-rule" aria-hidden />

      <p className="splash-tag label">
        A real drum · on camera · every number printed
      </p>

      <button
        type="button"
        className="splash-skip label underline"
        onClick={leave}
      >
        Skip
      </button>
    </div>
  );
}
