"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setDrawAction } from "@/lib/actions";
import { gbp, thousands, ukDateTime } from "@/lib/format";
import type { Draw } from "@/lib/types";

const NEXT_ACTIONS: Record<string, { label: string; patch: () => Record<string, unknown> }[]> = {
  draft: [
    {
      label: "Open the sale",
      patch: () => ({
        status: "selling",
        sales_open_at: new Date().toISOString(),
      }),
    },
  ],
  selling: [
    {
      label: "Close the sale",
      patch: () => ({
        status: "closed",
        sales_close_at: new Date().toISOString(),
      }),
    },
    {
      label: "Extend by 7 days",
      patch: () => ({
        sales_close_at: new Date(Date.now() + 7 * 864e5).toISOString(),
        draw_at: new Date(Date.now() + 7 * 864e5 + 18e5).toISOString(),
      }),
    },
  ],
  closed: [{ label: "Reopen the sale", patch: () => ({ status: "selling" }) }],
};

export default function DrawTable({ draws }: { draws: Draw[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function apply(id: string, patch: Record<string, unknown>) {
    setError(null);
    start(async () => {
      const res = await setDrawAction(id, patch);
      if (res.error) setError(res.error);
      router.refresh();
    });
  }

  return (
    <div className="card-flat">
      <div className="border-b-2 border-ink px-5 py-4">
        <h2 className="text-2xl">Editions</h2>
      </div>

      {error && (
        <p className="text-sm text-red border-b-2 border-red px-5 py-3">
          {error}
        </p>
      )}

      <div className="divide-y-2 divide-ink">
        {draws.map((d) => (
          <div key={d.id} className="p-5 grid gap-4 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="label px-2 py-1 bg-ink text-paper">
                  {d.status}
                </span>
                <span className="label text-ink-soft">
                  Edition {d.draw_no}
                </span>
              </div>
              <h3 className="text-xl mb-2">{d.prize_headline}</h3>
              <p className="text-sm text-ink-soft">
                {thousands(d.sold)} / {thousands(d.ticket_cap)} sold ·{" "}
                {gbp(d.ticket_price_pence)} each · take{" "}
                {gbp(d.sold_paid * d.ticket_price_pence)}
              </p>
              <p className="text-sm text-ink-soft mt-1">
                Closes {ukDateTime(d.sales_close_at)} · drawn{" "}
                {ukDateTime(d.draw_at)}
              </p>
              <p className="text-sm text-ink-soft mt-1">
                Free tickets in: {thousands(d.sold_free)} of{" "}
                {thousands(d.giveaway_cap_tickets)} allowed
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
              {(NEXT_ACTIONS[d.status] ?? []).map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => apply(d.id, a.patch())}
                  disabled={pending}
                  className="btn btn-paper text-sm whitespace-nowrap"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
