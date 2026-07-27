const BARS = [
  "#C0C0C0",
  "#C0C000",
  "#00C0C0",
  "#00C000",
  "#C000C0",
  "#C00000",
  "#0000C0",
];

/**
 * Stands in for the stream until Mux or Cloudflare is wired up. Honest about
 * being a placeholder rather than pretending to be a picture.
 */
export default function TestCard({
  headline,
  note,
}: {
  headline: string;
  note: string;
}) {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 flex">
        {BARS.map((c) => (
          <div key={c} className="flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[22%] flex">
        <div className="flex-1 bg-[#0A0A0A]" />
        <div className="flex-1 bg-[#C0C0C0]" />
        <div className="flex-1 bg-[#0A0A0A]" />
        <div className="flex-1 bg-[#1a1a1a]" />
      </div>

      {/* Reading matter gets its own solid ground. */}
      <div className="absolute inset-0 grid place-items-center px-4">
        <div className="bg-ink text-paper border-2 border-paper px-5 py-4 text-center max-w-sm">
          <p className="display text-xl sm:text-2xl leading-none">{headline}</p>
          <p className="label mt-3 text-paper/70">{note}</p>
        </div>
      </div>
    </div>
  );
}
