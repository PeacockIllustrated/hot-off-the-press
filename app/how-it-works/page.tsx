import { rpc } from "@/lib/db";
import { gbp, thousands } from "@/lib/format";
import type { PublicState } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "How it works — Hot Off The Press" };

export default async function HowItWorksPage() {
  const state = await rpc<PublicState>("hotp_public_state", {
    p_profile_id: null,
  });

  const wheel = state.wheel;
  const totalPpm =
    wheel?.segments.reduce((s, x) => s + x.weight_ppm, 0) ?? 1_000_000;

  const grouped = new Map<number, number>();
  for (const s of wheel?.segments ?? []) {
    grouped.set(s.tickets, (grouped.get(s.tickets) ?? 0) + s.weight_ppm);
  }
  const odds = [...grouped.entries()].sort((a, b) => a[0] - b[0]);
  const selling = state.selling;

  return (
    <>
      <section className="zone-ink border-b-4 border-ink relative overflow-hidden">
        <div
          aria-hidden
          className="halftone absolute inset-0 pointer-events-none"
          style={{ opacity: 0.08 }}
        />
        <div className="relative max-w-3xl mx-auto px-4 py-14">
          <h1 className="text-5xl mb-5">How it works</h1>
          <p className="text-lg text-paper/80 leading-relaxed">
            The arithmetic is published because it has to be checkable. If any
            of the below is ever not true of a draw, that draw is void.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-14">
        {/* The draw ---------------------------------------------------- */}
        <section>
          <h2 className="text-3xl mb-5">The drum decides, not a computer</h2>
          <div className="space-y-4 leading-relaxed">
            <p>
              The drum holds ten balls, numbered nought to nine. It is shown
              empty at the start of every draw and the balls are counted into
              it on camera.
            </p>
            <p>
              The drum is spun once for each digit of the winning number, left
              to right. Four spins build a number between 0000 and 9999.
            </p>
            <p>
              Tickets are numbered from 0001 upwards in the order they are
              bought. If the number the drum produces is 0000, or is higher
              than the number of tickets actually sold, it is{" "}
              <strong>void</strong>: the balls go back in and the drum turns
              again, on camera. Every void attempt is published on the edition
              page alongside the valid one.
            </p>
            <p className="text-ink-soft">
              This rule is published here before any ticket is sold. It is not
              applied after the fact.
            </p>
          </div>
        </section>

        {/* The schedule ------------------------------------------------ */}
        <section className="rule-heavy pt-8">
          <h2 className="text-3xl mb-5">
            You are buying for the next edition
          </h2>
          <div className="space-y-4 leading-relaxed">
            <p>
              Video is always behind. Even a good stream runs several seconds
              late, which would mean somebody could in principle buy a ticket
              after a ball had already dropped.
            </p>
            <p>
              So we do not sell the edition you are watching. While tonight&rsquo;s
              draw runs, the tickets on sale are for the{" "}
              <strong>next</strong> one. There is no way for the stream delay
              to matter, because there is nothing left to buy in the edition on
              screen.
            </p>
            <p>
              Sales close on our server clock — not on your device&rsquo;s clock
              and not on where the video has got to. The countdown you see is
              driven by the server, and the close is enforced in the database
              at the moment of purchase.
              {selling && (
                <>
                  {" "}
                  Edition {selling.draw_no} closes at the time shown on the
                  front page.
                </>
              )}
            </p>
          </div>
        </section>

        {/* Free route -------------------------------------------------- */}
        <section id="free" className="rule-heavy pt-8 scroll-mt-4">
          <h2 className="text-3xl mb-5">Entering free, by post</h2>
          <div className="space-y-4 leading-relaxed">
            <p>
              A free postal route is open for every edition and carries exactly
              the same chance of winning as a paid ticket. Free entries are
              numbered from the same sequence and go into the same draw.
            </p>
            <div className="card-flat p-5 bg-paper-deep">
              <p className="label mb-3">To enter without paying</p>
              <p className="text-sm leading-relaxed">
                Send an unenclosed postcard with your name, address, email
                address, the edition number you wish to enter, and your answer
                to the qualifying question, to the address published in the
                terms and conditions. One entry per postcard. Entries must
                arrive before sales close on the edition you have named.
              </p>
              <p className="text-xs text-ink-soft mt-4">
                Address and full terms to be confirmed before launch.
              </p>
            </div>
            <p>
              Postal entries also earn spins on the wheel at the same rate as
              paid tickets.
            </p>
          </div>
        </section>

        {/* The question ------------------------------------------------ */}
        <section className="rule-heavy pt-8">
          <h2 className="text-3xl mb-5">Why there is a question</h2>
          <div className="space-y-4 leading-relaxed">
            <p>
              Every entry, paid or postal, has to be accompanied by a correct
              answer to a question. That is what makes this a competition of
              skill rather than a lottery, and it is why the free route exists
              alongside it.
            </p>
            <p>
              Get the question wrong and the entry is not accepted. Nothing is
              charged.
            </p>
          </div>
        </section>

        {/* The wheel --------------------------------------------------- */}
        <section id="wheel" className="rule-heavy pt-8 scroll-mt-4">
          <h2 className="text-3xl mb-5">The wheel, and its odds</h2>
          <div className="space-y-4 leading-relaxed">
            <p>
              Spins on the wheel cannot be bought. They are earned: every
              ticket you take, paid or postal, comes with a spin. The wheel
              awards free tickets into the edition currently on sale.
            </p>
            <p>
              Every outcome is decided on our server using a cryptographic
              random source before your browser is told anything. The animation
              you watch is showing you a result that already exists.
            </p>

            {wheel ? (
              <>
                <div className="card-flat overflow-hidden mt-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-ink bg-paper-deep">
                        <th className="text-left px-5 py-3 label">Outcome</th>
                        <th className="text-right px-5 py-3 label">Chance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {odds.map(([tickets, ppm]) => {
                        const pct = (ppm / totalPpm) * 100;
                        return (
                          <tr
                            key={tickets}
                            className="border-b border-rule/40 last:border-0"
                          >
                            <td className="px-5 py-3">
                              {tickets === 0
                                ? "Nothing"
                                : `${tickets} free ticket${tickets > 1 ? "s" : ""}`}
                            </td>
                            <td className="px-5 py-3 text-right num">
                              {pct >= 1 ? pct.toFixed(1) : pct.toFixed(2)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p>
                  On average a spin returns{" "}
                  <strong className="num">
                    {Number(wheel.computed_ev).toFixed(3)}
                  </strong>{" "}
                  of a ticket. Put plainly:{" "}
                  <strong>most spins win nothing</strong>, and roughly one spin
                  in five returns a ticket. A limit of{" "}
                  {wheel.per_user_spin_cap} spins per person per edition
                  applies, and there is a cap on the total number of free
                  tickets that can enter any one edition
                  {selling && (
                    <>
                      {" "}
                      — currently{" "}
                      <span className="num">
                        {thousands(selling.giveaway_cap_tickets)}
                      </span>{" "}
                      for Edition {selling.draw_no}
                    </>
                  )}
                  . Once that cap is reached the wheel still turns, but it can
                  only land on outcomes that award nothing.
                </p>
              </>
            ) : (
              <p className="text-ink-soft">
                No wheel is configured at the moment.
              </p>
            )}
          </div>
        </section>

        {/* If it goes wrong -------------------------------------------- */}
        <section className="rule-heavy pt-8">
          <h2 className="text-3xl mb-5">If something goes wrong</h2>
          <div className="space-y-4 leading-relaxed">
            <p>
              <strong>If the stream fails mid-draw,</strong> the draw still
              happens and the result still stands. The recording is the record.
              It is published on the edition page afterwards.
            </p>
            <p>
              <strong>If an edition undersells,</strong> the draw runs anyway on
              the published date and the prize is awarded. The prize is not
              conditional on the edition selling out.
              {selling && (
                <>
                  {" "}
                  Edition {selling.draw_no} carries a prize valued at{" "}
                  {gbp(selling.prize_value_pence)} and will be drawn whether{" "}
                  {thousands(selling.ticket_cap)} tickets are sold or a hundred.
                </>
              )}
            </p>
            <p>
              <strong>If a result is disputed,</strong> the recording of that
              draw settles it. Recordings are kept.
            </p>
          </div>
        </section>

        <section className="rule-heavy pt-8">
          <p className="text-sm text-ink-soft leading-relaxed">
            Over 18s only. This is a prize competition, not a lottery: entry
            requires a correct answer to a question of skill, and a free entry
            route is available. Full terms and conditions, and the postal
            address, to be published before launch.
          </p>
        </section>
      </div>
    </>
  );
}
