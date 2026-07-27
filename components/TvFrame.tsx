import type { ReactNode } from "react";

/**
 * A newspaper that has bought a television. The casing is furniture: every
 * word a person actually reads sits on a solid ground, never on the picture.
 */
export default function TvFrame({
  channel,
  live,
  picture,
  caption,
}: {
  channel: string;
  live: boolean;
  picture: ReactNode;
  caption?: ReactNode;
}) {
  return (
    <div className="tv-shell p-3 sm:p-5">
      <div className="flex gap-4">
        {/* Picture ---------------------------------------------------- */}
        <div className="flex-1 min-w-0">
          <div className="tv-screen scanlines vignette aspect-video">
            {picture}
          </div>

          {caption && (
            <div className="mt-3 bg-ink border-2 border-bezel/40">{caption}</div>
          )}
        </div>

        {/* Side furniture --------------------------------------------- */}
        <div className="hidden sm:flex w-20 lg:w-24 flex-col items-center gap-3 shrink-0">
          <div className="w-full bg-[#120F0C] border border-black/50 rounded px-2 py-2 text-center">
            <div className="label text-bezel/50" style={{ fontSize: "0.5rem" }}>
              Channel
            </div>
            <div className="num text-bezel text-lg font-bold leading-none mt-1">
              {channel}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5">
            <span
              aria-hidden
              className={`w-3.5 h-3.5 rounded-full ${live ? "lamp-on" : "lamp-off"}`}
            />
            <span
              className="label text-bezel/70"
              style={{ fontSize: "0.5rem", letterSpacing: "0.1em" }}
            >
              {live ? "Live" : "Off air"}
            </span>
          </div>

          <div className="grille w-full flex-1 min-h-16" aria-hidden />

          <div className="flex gap-2" aria-hidden>
            <span className="knob w-6 h-6 block" />
            <span className="knob w-6 h-6 block" />
          </div>

          <div
            className="label text-bezel/40 text-center"
            style={{ fontSize: "0.45rem", letterSpacing: "0.08em" }}
          >
            HOTP · Mk13
          </div>
        </div>
      </div>

      {/* Mobile control rail ------------------------------------------ */}
      <div className="sm:hidden flex items-center justify-between mt-3 px-1">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className={`w-3 h-3 rounded-full ${live ? "lamp-on" : "lamp-off"}`}
          />
          <span className="label text-bezel/70">
            {live ? "Live" : "Off air"}
          </span>
        </div>
        <span className="num text-bezel/70 text-sm">CH {channel}</span>
      </div>
    </div>
  );
}
