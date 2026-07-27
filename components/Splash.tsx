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

export default function Splash() {
  const [phase, setPhase] = useState<"showing" | "leaving" | "gone">("showing");
  const leaving = useRef(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const leave = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode: the splash simply runs again next time */
    }
    document.documentElement.setAttribute("data-splash", "seen");
    setPhase("leaving");
    exitTimer.current = setTimeout(() => setPhase("gone"), EXIT_MS);
  }, []);

  useEffect(() => {
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

  // The page behind the sheet does not scroll until the sheet has gone.
  useEffect(() => {
    if (phase === "gone") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
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
