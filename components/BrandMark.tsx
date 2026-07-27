/**
 * The nameplate, drawn rather than photographed: the same HOT | OFF THE |
 * PRESS lockup as the raster logo, rebuilt as SVG so it can be printed at any
 * size and animated. A turbulence filter bites speckles out of the letters
 * and roughens their edges, the way ink sits on newsprint.
 *
 * `animated` staggers the three pieces of the lockup with the `stamp`
 * keyframe (defined in globals.css) — each part struck onto the page in turn.
 */
export default function BrandMark({
  tone = "paper",
  animated = false,
  idPrefix = "hotp-mark",
  className,
}: {
  tone?: "paper" | "ink";
  animated?: boolean;
  idPrefix?: string;
  className?: string;
}) {
  const fill = tone === "paper" ? "var(--color-paper)" : "var(--color-ink)";
  const filterId = `${idPrefix}-ink`;

  const wordProps = {
    fontFamily: "var(--font-display)",
    fontSize: 172,
    lengthAdjust: "spacingAndGlyphs" as const,
    fill,
  };
  const smallProps = {
    fontFamily: "var(--font-display)",
    fontSize: 48,
    textAnchor: "middle" as const,
    lengthAdjust: "spacingAndGlyphs" as const,
    fill,
  };

  const stamp = (delayMs: number) =>
    animated
      ? { className: "stamp", style: { animationDelay: `${delayMs}ms` } }
      : {};

  return (
    <svg
      viewBox="0 0 880 150"
      role="img"
      aria-label="Hot Off The Press"
      className={className}
    >
      <defs>
        <filter id={filterId} x="-4%" y="-12%" width="108%" height="124%">
          {/* Fine bright speckle, thresholded, bitten out of the letters. */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="8"
            result="speck"
          />
          <feColorMatrix
            in="speck"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0.9 0 0 -0.92"
            result="speckA"
          />
          <feComposite
            in="SourceGraphic"
            in2="speckA"
            operator="out"
            result="bitten"
          />
          {/* Then the edges are warped a touch, like ink spread on fibre. */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.09"
            numOctaves="2"
            seed="3"
            result="warp"
          />
          <feDisplacementMap in="bitten" in2="warp" scale="2.6" />
        </filter>
      </defs>

      <g filter={`url(#${filterId})`}>
        <g {...stamp(80)}>
          <text {...wordProps} x="0" y="138" textLength="300">
            HOT
          </text>
        </g>

        <g {...stamp(320)}>
          <text {...smallProps} x="352" y="76" textLength="80">
            OFF
          </text>
          <text {...smallProps} x="352" y="132" textLength="80">
            THE
          </text>
          <rect x="400" y="16" width="13" height="124" fill={fill} />
        </g>

        <g {...stamp(560)}>
          <text {...wordProps} x="432" y="138" textLength="448">
            PRESS
          </text>
        </g>
      </g>
    </svg>
  );
}
