import Link from "next/link";
import BuyPanel from "@/components/BuyPanel";
import Countdown from "@/components/Countdown";
import { rpc } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gbp, pad, thousands, ukDateTime } from "@/lib/format";
import type { PublicState, SkillQuestion } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function FrontPage() {
  const session = await getSession();
  const state = await rpc<PublicState>("hotp_public_state", {
    p_profile_id: session?.id ?? null,
  });

  let question: SkillQuestion | null = null;
  try {
    question = await rpc<SkillQuestion>("hotp_skill_question");
  } catch {
    question = null;
  }

  const selling = state.selling;
  const sellPct = selling
    ? Math.round((selling.sold / selling.ticket_cap) * 100)
    : 0;

  return (
    <>
      {/* Hero ----------------------------------------------------------- */}
      <section className="zone-paper border-b-4 border-ink">
        <div className="max-w-6xl mx-auto px-4 py-10 lg:py-14">
          {selling ? (
            <div className="grid gap-10 lg:grid-cols-[1fr_26rem]">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <span aria-hidden className="h-0.5 w-10 flex-none bg-red" />
                  <p className="label text-red">
                    Edition {selling.draw_no} · On sale now
                  </p>
                  <span aria-hidden className="h-px flex-1 bg-red/40" />
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl mb-5">
                  {selling.prize_headline}
                </h1>

                {selling.prize_detail && (
                  <p className="text-lg leading-relaxed max-w-xl mb-7">
                    {selling.prize_detail}
                  </p>
                )}

                <div className="mb-8">
                  <p className="label text-ink-soft mb-3">
                    Sales close on server time
                  </p>
                  <Countdown
                    serverTime={state.server_time}
                    target={selling.sales_close_at}
                  />
                  <p className="text-sm text-ink-soft mt-3">
                    Drawn {ukDateTime(selling.draw_at)}, live on camera.
                  </p>
                </div>

                {/* Sold bar ---------------------------------------------- */}
                <div className="max-w-xl">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="label">Tickets gone</span>
                    <span className="num text-sm">
                      {thousands(selling.sold)} / {thousands(selling.ticket_cap)}
                    </span>
                  </div>
                  <div className="h-5 border-2 border-ink bg-paper-deep">
                    <div
                      className="h-full bg-red"
                      style={{ width: `${Math.max(sellPct, 1)}%` }}
                      role="progressbar"
                      aria-valuenow={sellPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Tickets sold"
                    />
                  </div>
                  <p className="text-xs text-ink-soft mt-2">
                    Prize value {gbp(selling.prize_value_pence)}. The draw runs
                    whether or not the edition sells out.
                  </p>
                </div>
              </div>

              <BuyPanel
                draw={selling}
                question={question}
                signedIn={Boolean(session)}
              />
            </div>
          ) : (
            <div className="py-12 text-center">
              <h1 className="text-5xl mb-4">Between editions</h1>
              <p className="text-ink-soft">
                Nothing is on sale at the moment. The next edition will be
                announced here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* The promise ---------------------------------------------------- */}
      <section className="zone-red border-b-4 border-ink relative overflow-hidden">
        <div
          aria-hidden
          className="halftone absolute inset-0 pointer-events-none"
          style={{ opacity: 0.12 }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <p className="display text-2xl sm:text-3xl leading-tight max-w-4xl">
            You are buying for the next edition, not the one on screen. Sales
            close on our clock, in the open, before the drum turns.
          </p>
        </div>
      </section>

      {/* How it works --------------------------------------------------- */}
      <section className="zone-deep border-b-4 border-ink">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-3xl mb-8">Three things, and no small print</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <article>
              <p className="num text-4xl font-bold text-red mb-3">01</p>
              <h3 className="text-xl mb-3">A real drum, in a real unit</h3>
              <p className="text-sm leading-relaxed text-ink-soft">
                Ten balls, numbered nought to nine. The drum is shown empty and
                the balls counted in on camera, every single draw. Nothing is
                generated by a computer.
              </p>
            </article>
            <article className="md:col-rule md:pl-8">
              <p className="num text-4xl font-bold text-red mb-3">02</p>
              <h3 className="text-xl mb-3">One digit at a time</h3>
              <p className="text-sm leading-relaxed text-ink-soft">
                Four spins build the winning number, left to right. If the
                number that comes out is higher than the tickets sold, it is
                void and the drum turns again — on camera, every time.
              </p>
            </article>
            <article className="md:col-rule md:pl-8">
              <p className="num text-4xl font-bold text-red mb-3">03</p>
              <h3 className="text-xl mb-3">Every number printed</h3>
              <p className="text-sm leading-relaxed text-ink-soft">
                Your numbers, the tickets sold, the wheel&rsquo;s odds and every
                void attempt are published where you can check them. Recordings
                are kept.
              </p>
            </article>
          </div>

          <Link href="/how-it-works" className="btn btn-ink mt-9">
            Read the whole method
          </Link>
        </div>
      </section>

      {/* Live now ------------------------------------------------------- */}
      {state.live && (
        <section className="zone-night border-b-4 border-ink">
          <div className="max-w-6xl mx-auto px-4 py-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span aria-hidden className="w-3 h-3 rounded-full lamp-on" />
                <span className="label text-lamp">On air</span>
              </div>
              <h2 className="text-3xl text-phosphor mb-2">
                {state.live.title} is being drawn
              </h2>
              <p className="text-sm text-phosphor/70">
                {thousands(state.live.sold)} tickets in the drum. Watch your
                numbers light up as the balls land.
              </p>
            </div>
            <Link href="/live" className="btn btn-light">
              Watch the draw
            </Link>
          </div>
        </section>
      )}

      {/* Past winners --------------------------------------------------- */}
      {state.past.length > 0 && (
        <section className="zone-paper">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-baseline justify-between gap-4 mb-7 flex-wrap">
              <h2 className="text-3xl">Already drawn</h2>
              <Link href="/draws" className="label underline">
                All past editions
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {state.past.slice(0, 3).map((d) => (
                <Link
                  key={d.id}
                  href={`/draws/${d.draw_no}`}
                  className="card-flat p-5 hover:bg-paper-deep transition-colors"
                >
                  <p className="label text-ink-soft mb-2">
                    Edition {d.draw_no}
                  </p>
                  <h3 className="text-xl mb-3">{d.prize_headline}</h3>
                  {d.winning_number !== null && (
                    <p className="num text-3xl font-bold text-red mb-2">
                      {pad(d.winning_number, d.digit_count)}
                    </p>
                  )}
                  <p className="text-sm text-ink-soft">
                    {d.winner_name ? `Won by ${d.winner_name}` : "Result pending"}
                    {" · "}
                    {thousands(d.sold)} tickets
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
