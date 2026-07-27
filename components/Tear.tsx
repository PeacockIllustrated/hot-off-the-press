const BG: Record<string, string> = {
  paper: "bg-paper",
  deep: "bg-paper-deep",
  red: "bg-red",
  ink: "bg-ink",
  night: "bg-night",
};

/**
 * The joint between two stocks: the next sheet's torn edge biting up into
 * the one above. `from` is the zone ending, `to` the zone beginning — the
 * strip is painted in the old stock and the tear is masked out of the new.
 */
export default function Tear({
  from,
  to,
}: {
  from: keyof typeof BG;
  to: keyof typeof BG;
}) {
  return (
    <div aria-hidden className={BG[from]}>
      <div className={`tear ${BG[to]}`} />
    </div>
  );
}
