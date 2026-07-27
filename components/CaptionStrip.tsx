import { pad } from "@/lib/format";
import type { Attempt } from "@/lib/types";

/**
 * The strip along the bottom of the set, where the numbers appear as they are
 * drawn. Solid ground: nothing here is read through the picture.
 */
export default function CaptionStrip({
  attempt,
  digitCount,
  drawNo,
}: {
  attempt: Attempt | null;
  digitCount: number;
  drawNo: number;
}) {
  const balls = attempt?.balls ?? [];
  const cells = Array.from({ length: digitCount }, (_, i) => balls[i] ?? null);
  const complete = Boolean(attempt?.completed_at);
  const isVoid = Boolean(attempt?.void_reason);

  return (
    <div className="px-3 py-3 sm:px-4">
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <span className="label text-bezel/70">
          Edition {drawNo}
          {attempt ? ` · Attempt ${attempt.attempt}` : ""}
        </span>
        {complete && (
          <span
            className={`label px-2 py-1 ${
              isVoid ? "bg-red text-paper" : "bg-paper text-ink"
            }`}
          >
            {isVoid ? "Void — redrawing" : "Valid number"}
          </span>
        )}
      </div>

      <div className="flex items-end gap-2 sm:gap-3">
        {cells.map((ball, i) => (
          <div
            key={i}
            className={[
              "flex-1 max-w-20 aspect-square grid place-items-center border-2",
              ball
                ? "bg-paper border-paper ball-drop"
                : "bg-transparent border-bezel/25",
            ].join(" ")}
          >
            <span
              className={`num font-bold leading-none ${
                ball ? "text-ink text-3xl sm:text-5xl" : "text-bezel/25 text-2xl sm:text-4xl"
              }`}
            >
              {ball ? ball.digit : "·"}
            </span>
          </div>
        ))}

        <div className="flex-1 pl-1 sm:pl-3">
          {complete && attempt?.number !== null && attempt?.number !== undefined ? (
            <>
              <p className="label text-bezel/60 mb-1">Number drawn</p>
              <p className="num text-2xl sm:text-3xl font-bold text-paper leading-none">
                {pad(attempt.number, digitCount)}
              </p>
              {isVoid && (
                <p className="text-xs text-paper/70 mt-1.5 leading-snug">
                  {attempt.void_reason}
                </p>
              )}
            </>
          ) : (
            <p className="label text-bezel/50">
              {balls.length === 0
                ? "Drum loaded — waiting"
                : `Ball ${balls.length} of ${digitCount}`}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
