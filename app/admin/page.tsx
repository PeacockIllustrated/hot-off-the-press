import Link from "next/link";
import { redirect } from "next/navigation";
import DrawConsole from "@/components/admin/DrawConsole";
import DrawTable from "@/components/admin/DrawTable";
import WheelEditor from "@/components/admin/WheelEditor";
import { PostalEntryForm, DemoReset } from "@/components/admin/OperatorTools";
import { rpc } from "@/lib/db";
import { getSession } from "@/lib/session";
import { gbp, thousands, ukDateTime } from "@/lib/format";
import type { AdminState } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin — Hot Off The Press" };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/admin");
  if (!session.is_admin) redirect("/");

  const state = await rpc<AdminState>("hotp_admin_state", {
    p_admin_id: session.id,
  });

  const drawable = state.draws.find(
    (d) => d.status === "closed" || d.status === "drawing",
  );
  const selling = state.draws.find((d) => d.status === "selling");
  const console_ = drawable ?? selling ?? state.draws[0];
  const wheel = state.wheels.find((w) => w.active) ?? state.wheels[0];

  const freeIssued = state.draws.reduce((n, d) => n + d.sold_free, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-9">
        <h1 className="text-4xl">Operator</h1>
        <Link href="/live" className="label underline">
          Open the live room →
        </Link>
      </div>

      {/* Tally --------------------------------------------------------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {[
          { l: "Take, all editions", v: gbp(state.revenue_pence) },
          { l: "Editions", v: String(state.draws.length) },
          { l: "Free tickets issued", v: thousands(freeIssued) },
          {
            l: "Wheel EV",
            v: wheel ? Number(wheel.computed_ev).toFixed(3) : "—",
          },
        ].map((s) => (
          <div key={s.l} className="card-flat p-5">
            <p className="label text-ink-soft mb-2">{s.l}</p>
            <p className="num text-2xl font-bold">{s.v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2 mb-8">
        {console_ && <DrawConsole draw={console_} />}
        <DemoReset />
      </div>

      <div className="mb-8">
        <DrawTable draws={state.draws} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2 mb-8">
        {wheel && (
          <WheelEditor
            current={wheel.segments}
            evCeiling={Number(wheel.ev_ceiling_tickets)}
            perUserCap={wheel.per_user_spin_cap}
          />
        )}
        <PostalEntryForm draws={state.draws} />
      </div>

      {/* Audit --------------------------------------------------------- */}
      <div className="card-flat">
        <div className="border-b-2 border-ink px-5 py-4">
          <h2 className="text-2xl">Audit log</h2>
          <p className="text-sm text-ink-soft mt-2">
            Written by the database, not the application.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left px-5 py-3 label">When</th>
                <th className="text-left px-5 py-3 label">Who</th>
                <th className="text-left px-5 py-3 label">Action</th>
              </tr>
            </thead>
            <tbody>
              {state.audit.map((a, i) => (
                <tr key={i} className="border-b border-rule/40 last:border-0">
                  <td className="px-5 py-2.5 whitespace-nowrap text-ink-soft">
                    {ukDateTime(a.at)}
                  </td>
                  <td className="px-5 py-2.5 whitespace-nowrap">
                    {a.actor ?? "—"}
                  </td>
                  <td className="px-5 py-2.5 num">{a.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
