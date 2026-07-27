import Link from "next/link";
import { rpc } from "@/lib/db";
import { gbp, pad, thousands, ukDate } from "@/lib/format";
import type { PublicState } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Past draws — Hot Off The Press" };

export default async function DrawsPage() {
  const state = await rpc<PublicState>("hotp_public_state", {
    p_profile_id: null,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <p className="label text-red mb-3">The record</p>
      <h1 className="text-4xl mb-3">Past draws</h1>
      <p className="text-ink-soft max-w-2xl mb-10 leading-relaxed">
        Every edition, every winning number, and every void attempt along the
        way. Recordings are kept because they are the record — if a result is
        ever disputed, the tape is the answer.
      </p>

      {state.past.length === 0 ? (
        <p className="text-ink-soft">Nothing has been drawn yet.</p>
      ) : (
        <div className="space-y-5">
          {state.past.map((d) => (
            <Link
              key={d.id}
              href={`/draws/${d.draw_no}`}
              className="card-flat block hover:bg-paper-deep transition-colors"
            >
              <div className="p-5 sm:p-6 grid gap-5 sm:grid-cols-[1fr_auto] items-center">
                <div>
                  <p className="label text-ink-soft mb-2">
                    Edition {d.draw_no} · {ukDate(d.draw_at)}
                  </p>
                  <h2 className="text-2xl mb-2">{d.prize_headline}</h2>
                  <p className="text-sm text-ink-soft">
                    {thousands(d.sold)} tickets ·{" "}
                    {gbp(d.ticket_price_pence)} each · prize value{" "}
                    {gbp(d.prize_value_pence)}
                    {d.winner_name && ` · won by ${d.winner_name}`}
                  </p>
                </div>

                {d.winning_number !== null && (
                  <div className="text-left sm:text-right">
                    <p className="label text-ink-soft mb-1.5">Winning number</p>
                    <p className="num text-4xl font-bold text-red">
                      {pad(d.winning_number, d.digit_count)}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
