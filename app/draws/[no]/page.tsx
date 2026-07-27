import Link from "next/link";
import { notFound } from "next/navigation";
import { rpc } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gbp, pad, thousands, ukDateTime } from "@/lib/format";
import type { LiveState, PublicState } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DrawDetailPage(props: PageProps<"/draws/[no]">) {
  const { no } = await props.params;
  const session = await getSession();

  const state = await rpc<PublicState>("hotp_public_state", {
    p_profile_id: session?.id ?? null,
  });

  const draw = [...state.past, ...state.upcoming].find(
    (d) => String(d.draw_no) === no,
  );
  if (!draw) notFound();

  const live = await rpc<LiveState>("hotp_live_state", {
    p_draw_id: draw.id,
    p_profile_id: session?.id ?? null,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Link href="/draws" className="label underline text-ink-soft">
        ← All past draws
      </Link>

      <p className="kicker label text-red mt-9 mb-5">Edition {draw.draw_no}</p>
      <h1 className="text-4xl sm:text-5xl mb-5">{draw.prize_headline}</h1>
      {draw.prize_detail && (
        <p className="text-lg text-ink-soft max-w-2xl mb-8 leading-relaxed">
          {draw.prize_detail}
        </p>
      )}

      {/* Result -------------------------------------------------------- */}
      {draw.winning_number !== null && (
        <div className="zone-red border-2 border-ink p-6 mb-10 max-w-2xl">
          <p className="label mb-3">Winning number</p>
          <div className="flex flex-wrap items-baseline gap-5">
            <span className="num text-6xl font-bold">
              {pad(draw.winning_number, draw.digit_count)}
            </span>
            {draw.winner_name && (
              <span className="text-xl">held by {draw.winner_name}</span>
            )}
          </div>
        </div>
      )}

      {/* Facts --------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
        {[
          { l: "Tickets sold", v: thousands(draw.sold) },
          { l: "Ticket price", v: gbp(draw.ticket_price_pence) },
          { l: "Prize value", v: gbp(draw.prize_value_pence) },
          { l: "Drawn", v: ukDateTime(draw.draw_at) },
        ].map((f) => (
          <div key={f.l} className="card-flat p-5">
            <p className="label text-ink-soft mb-2">{f.l}</p>
            <p className="num text-lg font-bold">{f.v}</p>
          </div>
        ))}
      </div>

      {/* Every attempt ------------------------------------------------- */}
      <h2 className="text-2xl mb-5">Every turn of the drum</h2>

      {live.attempts.length === 0 ? (
        <p className="text-ink-soft mb-12">
          This edition has not been drawn yet.
        </p>
      ) : (
        <div className="space-y-4 mb-12">
          {live.attempts.map((a) => (
            <div
              key={a.attempt}
              className={`card-flat p-5 ${a.void_reason ? "opacity-80" : ""}`}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
                <span className="label text-ink-soft">
                  Attempt {a.attempt}
                </span>
                <span
                  className={`label px-2.5 py-1.5 ${
                    a.void_reason
                      ? "bg-red text-paper"
                      : a.completed_at
                        ? "bg-ink text-paper"
                        : "bg-paper-deep"
                  }`}
                >
                  {a.void_reason ? "Void" : a.completed_at ? "Valid" : "In progress"}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {a.balls.map((b) => (
                  <span
                    key={b.position}
                    className="num text-3xl font-bold w-14 h-14 grid place-items-center border-2 border-ink bg-paper-deep"
                  >
                    {b.digit}
                  </span>
                ))}
                {a.number !== null && (
                  <span className="num text-2xl font-bold ml-3">
                    = {pad(a.number, draw.digit_count)}
                  </span>
                )}
              </div>

              {a.void_reason && (
                <p className="text-sm text-ink-soft mt-4">
                  {a.void_reason}. Published in the terms before sale: a number
                  above the tickets sold is void and the drum turns again.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {draw.recording_url && (
        <div className="card-flat p-6 max-w-2xl">
          <h3 className="text-xl mb-3">The recording</h3>
          <p className="text-sm text-ink-soft mb-4">
            Kept as the record of this draw.
          </p>
          <a
            href={draw.recording_url}
            className="btn btn-ink"
            rel="noreferrer"
            target="_blank"
          >
            Watch it back
          </a>
        </div>
      )}
    </div>
  );
}
