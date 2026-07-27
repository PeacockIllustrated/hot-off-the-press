import Link from "next/link";
import { redirect } from "next/navigation";
import { rpc } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gbp, pad, thousands, ukDateTime } from "@/lib/format";
import type { MyState } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "My numbers — Hot Off The Press" };

const STATUS_COPY: Record<string, string> = {
  draft: "Not yet on sale",
  selling: "On sale",
  closed: "Sales closed",
  drawing: "Being drawn",
  complete: "Drawn",
  void: "Void",
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/account");

  const me = await rpc<MyState>("hotp_my_state", { p_profile_id: session.id });
  const totalTickets = me.entries_by_draw.reduce(
    (n, d) => n + d.tickets.length,
    0,
  );
  const spent = me.orders.reduce((n, o) => n + o.total_pence, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl mb-2">My numbers</h1>
      <p className="text-ink-soft mb-9">{session.display_name}</p>

      {/* Tally --------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-3 mb-12">
        {[
          { l: "Numbers held", v: thousands(totalTickets) },
          { l: "Spins in hand", v: thousands(me.spins_left) },
          { l: "Spent in total", v: gbp(spent) },
        ].map((s) => (
          <div key={s.l} className="card-flat p-5">
            <p className="label text-ink-soft mb-2">{s.l}</p>
            <p className="num text-3xl font-bold">{s.v}</p>
          </div>
        ))}
      </div>

      {/* Entries ------------------------------------------------------- */}
      <h2 className="text-2xl mb-5">Your editions</h2>

      {me.entries_by_draw.length === 0 ? (
        <div className="card-flat p-6 mb-12">
          <p className="text-ink-soft mb-4">
            You have not entered an edition yet.
          </p>
          <Link href="/" className="btn btn-ink">
            See what&rsquo;s on sale
          </Link>
        </div>
      ) : (
        <div className="space-y-5 mb-12">
          {me.entries_by_draw.map((d) => {
            const won =
              d.winning_number !== null &&
              d.tickets.some((t) => t.n === d.winning_number);

            return (
              <div key={d.draw_id} className="card-flat">
                <div
                  className={`px-5 py-4 border-b-2 border-ink flex items-baseline justify-between gap-4 flex-wrap ${
                    won ? "bg-red text-paper" : ""
                  }`}
                >
                  <div>
                    <p className={`label ${won ? "text-paper/70" : "text-ink-soft"}`}>
                      Edition {d.draw_no} · {STATUS_COPY[d.status] ?? d.status}
                    </p>
                    <h3 className="text-xl mt-1.5">{d.title}</h3>
                  </div>
                  <div className="text-right">
                    {d.winning_number !== null ? (
                      <>
                        <p className={`label ${won ? "text-paper/70" : "text-ink-soft"}`}>
                          {won ? "You won" : "Winning number"}
                        </p>
                        <p className="num text-2xl font-bold mt-1">
                          {pad(d.winning_number, d.digit_count)}
                        </p>
                      </>
                    ) : (
                      <p className="label text-ink-soft">
                        {ukDateTime(d.draw_at)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <p className="label text-ink-soft mb-3">
                    {d.tickets.length} number{d.tickets.length > 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {d.tickets.map((t) => (
                      <span
                        key={t.n}
                        title={t.source === "wheel" ? "Won on the wheel" : undefined}
                        className={[
                          "num text-sm font-bold px-2 py-1.5 border-2",
                          d.winning_number === t.n
                            ? "bg-red text-paper border-red"
                            : t.source === "wheel"
                              ? "border-red bg-paper"
                              : "border-ink bg-paper-deep",
                        ].join(" ")}
                      >
                        {pad(t.n, d.digit_count)}
                      </span>
                    ))}
                  </div>
                  {d.tickets.some((t) => t.source !== "paid") && (
                    <p className="text-xs text-ink-soft mt-3">
                      Numbers outlined in red were won on the wheel or entered
                      by post. They count exactly the same.
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Spins ---------------------------------------------------------- */}
      {me.spins.length > 0 && (
        <>
          <h2 className="text-2xl mb-5">Recent spins</h2>
          <div className="card-flat overflow-x-auto mb-12">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className="text-left px-5 py-3 label">When</th>
                  <th className="text-left px-5 py-3 label">Outcome</th>
                  <th className="text-right px-5 py-3 label">Roll</th>
                </tr>
              </thead>
              <tbody>
                {me.spins.map((s, i) => (
                  <tr key={i} className="border-b border-rule/40 last:border-0">
                    <td className="px-5 py-2.5 whitespace-nowrap">
                      {ukDateTime(s.at)}
                    </td>
                    <td className="px-5 py-2.5">
                      {s.tickets > 0 ? (
                        <span className="text-red font-bold">
                          +{s.tickets} ticket{s.tickets > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-ink-soft">No win</span>
                      )}
                      {s.capped && (
                        <span className="label text-ink-faint ml-2">
                          giveaway cap
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-2.5 text-right num text-ink-soft">
                      {s.roll.toLocaleString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Orders --------------------------------------------------------- */}
      {me.orders.length > 0 && (
        <>
          <h2 className="text-2xl mb-5">Receipts</h2>
          <div className="card-flat overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-ink">
                  <th className="text-left px-5 py-3 label">When</th>
                  <th className="text-left px-5 py-3 label">Edition</th>
                  <th className="text-right px-5 py-3 label">Tickets</th>
                  <th className="text-right px-5 py-3 label">Paid</th>
                </tr>
              </thead>
              <tbody>
                {me.orders.map((o) => (
                  <tr key={o.id} className="border-b border-rule/40 last:border-0">
                    <td className="px-5 py-2.5 whitespace-nowrap">
                      {ukDateTime(o.created_at)}
                    </td>
                    <td className="px-5 py-2.5">{o.draw_title}</td>
                    <td className="px-5 py-2.5 text-right num">{o.quantity}</td>
                    <td className="px-5 py-2.5 text-right num">
                      {gbp(o.total_pence, { pennies: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
