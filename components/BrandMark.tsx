/**
 * The nameplate, built from the actual brand artwork: every cell of the
 * lockup is a live crop of /public/brand/hotp-long-white.webp (389×120),
 * so the splash letterforms are pixel-identical to the logo everywhere
 * else on the site.
 *
 * Animated, it plays as a slot machine: each big letter is a reel — other
 * letters from the same artwork whip past and the reel lands on the right
 * one, left to right — and then the OFF|THE column drops onto the lockup
 * from above. Crop boxes were measured from the file by alpha projection.
 */

const SRC = "/brand/hotp-long-white.webp";
const W = 389;
const H = 120;
/** Sprite pitch inside a reel: cell height plus a small gap. */
const PITCH = 130;

/** Measured x-bounds of each glyph in the artwork. */
const GLYPH: Record<string, [number, number]> = {
  H: [1, 48],
  O: [50, 96],
  T: [97, 142],
  P: [184, 227],
  R: [228, 271],
  E: [272, 308],
  S: [309, 348],
  S2: [349, 388],
};
const COLUMN: [number, number] = [149, 174];

/** The reels, left to right, each with the decoys that spin past first. */
const REELS: { target: string; decoys: string[] }[] = [
  { target: "H", decoys: ["P", "S", "O", "E", "R"] },
  { target: "O", decoys: ["T", "R", "S", "H", "P"] },
  { target: "T", decoys: ["E", "H", "P", "S", "O"] },
  { target: "P", decoys: ["S", "O", "R", "T", "E"] },
  { target: "R", decoys: ["H", "E", "T", "P", "S"] },
  { target: "E", decoys: ["O", "P", "S", "R", "H"] },
  { target: "S", decoys: ["R", "T", "E", "O", "P"] },
  { target: "S2", decoys: ["P", "H", "O", "S", "T"] },
];

/** One cropped view of the artwork, placed at (x, y) in lockup space. */
function Sprite({
  glyph,
  x,
  y,
  width,
}: {
  glyph: [number, number];
  x: number;
  y: number;
  width: number;
}) {
  const [a, b] = glyph;
  return (
    <svg
      x={x}
      y={y}
      width={width}
      height={H}
      viewBox={`${a} 0 ${b - a + 1} ${H}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <image href={SRC} width={W} height={H} />
    </svg>
  );
}

export default function BrandMark({
  animated = false,
  className,
}: {
  animated?: boolean;
  className?: string;
}) {
  const [colA, colB] = COLUMN;

  if (!animated) {
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Hot Off The Press"
        className={className}
      >
        <image href={SRC} width={W} height={H} />
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Hot Off The Press"
      className={className}
    >
      <defs>
        {REELS.map((reel, i) => {
          const [a, b] = GLYPH[reel.target];
          return (
            <clipPath key={i} id={`hotp-reel-clip-${i}`}>
              <rect x={a} y={0} width={b - a + 1} height={H} />
            </clipPath>
          );
        })}
      </defs>

      {REELS.map((reel, i) => {
        const [a, b] = GLYPH[reel.target];
        const width = b - a + 1;
        return (
          <g key={i} clipPath={`url(#hotp-reel-clip-${i})`}>
            <g
              className="reel"
              style={{
                ["--reel-dur" as string]: `${820 + i * 110}ms`,
                ["--reel-delay" as string]: `${i * 40}ms`,
              }}
            >
              {/* One decoy above the target fills the overshoot bounce… */}
              <Sprite glyph={GLYPH[reel.decoys[4]]} x={a} y={-PITCH} width={width} />
              <Sprite glyph={GLYPH[reel.target]} x={a} y={0} width={width} />
              {/* …and the rest queue below, whipping past first. */}
              {reel.decoys.slice(0, 4).map((d, k) => (
                <Sprite
                  key={k}
                  glyph={GLYPH[d]}
                  x={a}
                  y={(k + 1) * PITCH}
                  width={width}
                />
              ))}
            </g>
          </g>
        );
      })}

      {/* The OFF|THE column drops onto the lockup once the reels settle. */}
      <g className="col-drop">
        <Sprite glyph={COLUMN} x={colA} y={0} width={colB - colA + 1} />
      </g>
    </svg>
  );
}
