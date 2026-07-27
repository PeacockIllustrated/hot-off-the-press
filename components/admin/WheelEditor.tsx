"use client";

import { useActionState, useState } from "react";
import { saveWheelAction, type FormState } from "@/lib/actions";
import type { WheelSegment } from "@/lib/types";

type Row = WheelSegment & { key: number };

let seq = 0;
const row = (s: WheelSegment): Row => ({ ...s, key: seq++ });

/** The table printed in the brief. Its expected value is 0.275, not 0.20. */
const BRIEF_TABLE: WheelSegment[] = [
  { label: "No win", tickets: 0, weight_ppm: 780000 },
  { label: "1 ticket", tickets: 1, weight_ppm: 180000 },
  { label: "2 tickets", tickets: 2, weight_ppm: 35000 },
  { label: "5 tickets", tickets: 5, weight_ppm: 5000 },
];

export default function WheelEditor({
  current,
  evCeiling,
  perUserCap,
}: {
  current: WheelSegment[];
  evCeiling: number;
  perUserCap: number;
}) {
  const [rows, setRows] = useState<Row[]>(current.map(row));
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    saveWheelAction,
    {},
  );

  const sum = rows.reduce((n, r) => n + (r.weight_ppm || 0), 0);
  const ev = rows.reduce(
    (n, r) => n + ((r.tickets || 0) * (r.weight_ppm || 0)) / 1_000_000,
    0,
  );
  const sumOk = sum === 1_000_000;
  const evOk = ev <= evCeiling;

  function patch(key: number, field: keyof WheelSegment, value: string) {
    setRows((rs) =>
      rs.map((r) =>
        r.key === key
          ? {
              ...r,
              [field]: field === "label" ? value : Number(value) || 0,
            }
          : r,
      ),
    );
  }

  return (
    <div className="card-flat">
      <div className="border-b-2 border-ink px-5 py-4">
        <h2 className="text-2xl">Wheel configuration</h2>
        <p className="text-sm text-ink-soft mt-2">
          The database refuses to store a table whose probabilities don&rsquo;t
          sum to one, or whose expected value is over the ceiling. It does not
          warn — it refuses.
        </p>
      </div>

      <form action={formAction} className="p-5">
        <label className="block mb-5">
          <span className="label">Name</span>
          <input
            name="name"
            defaultValue="Revised wheel"
            className="field mt-2"
            required
          />
        </label>

        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm mb-4 min-w-md">
            <thead>
              <tr className="border-b-2 border-ink">
                <th className="text-left py-2.5 label">Label</th>
                <th className="text-right py-2.5 label w-24">Tickets</th>
                <th className="text-right py-2.5 label w-32">Weight ppm</th>
                <th className="text-right py-2.5 label w-20">Chance</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-rule/40">
                  <td className="py-2 pr-2">
                    <input
                      name="seg_label"
                      value={r.label}
                      onChange={(e) => patch(r.key, "label", e.target.value)}
                      className="field py-1.5"
                      required
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      name="seg_tickets"
                      type="number"
                      min={0}
                      value={r.tickets}
                      onChange={(e) => patch(r.key, "tickets", e.target.value)}
                      className="field py-1.5 text-right"
                    />
                  </td>
                  <td className="py-2 px-1">
                    <input
                      name="seg_weight"
                      type="number"
                      min={0}
                      value={r.weight_ppm}
                      onChange={(e) =>
                        patch(r.key, "weight_ppm", e.target.value)
                      }
                      className="field py-1.5 text-right"
                    />
                  </td>
                  <td className="py-2 pl-2 text-right num text-ink-soft">
                    {((r.weight_ppm / 1_000_000) * 100).toFixed(2)}%
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setRows((rs) => rs.filter((x) => x.key !== r.key))
                      }
                      className="label text-red"
                      aria-label="Remove segment"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            type="button"
            onClick={() =>
              setRows((rs) => [
                ...rs,
                row({ label: "No win", tickets: 0, weight_ppm: 0 }),
              ])
            }
            className="label underline"
          >
            + Add segment
          </button>
          <button
            type="button"
            onClick={() => setRows(BRIEF_TABLE.map(row))}
            className="label underline text-ink-soft"
          >
            Load the brief&rsquo;s example table
          </button>
          <button
            type="button"
            onClick={() => setRows(current.map(row))}
            className="label underline text-ink-soft"
          >
            Reset to live
          </button>
        </div>

        {/* Live arithmetic --------------------------------------------- */}
        <dl className="border-y-2 border-ink divide-y divide-rule/40 mb-6">
          <div className="flex justify-between py-3">
            <dt className="text-sm">Probabilities sum to</dt>
            <dd className={`num text-sm font-bold ${sumOk ? "" : "text-red"}`}>
              {(sum / 1_000_000).toFixed(6)}
              {!sumOk && " — must be 1.000000"}
            </dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-sm">Expected value per spin</dt>
            <dd className={`num text-sm font-bold ${evOk ? "" : "text-red"}`}>
              {ev.toFixed(4)} tickets
              {!evOk && ` — ceiling is ${evCeiling.toFixed(4)}`}
            </dd>
          </div>
          <div className="flex justify-between py-3">
            <dt className="text-sm">Cost per spin at £2.50 a ticket</dt>
            <dd className="num text-sm">£{(ev * 2.5).toFixed(3)}</dd>
          </div>
        </dl>

        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <label className="block">
            <span className="label">Expected value ceiling</span>
            <input
              name="ev_ceiling"
              type="number"
              step="0.001"
              min="0"
              defaultValue={evCeiling}
              className="field mt-2"
            />
          </label>
          <label className="block">
            <span className="label">Spins per person per edition</span>
            <input
              name="per_user_cap"
              type="number"
              min="1"
              defaultValue={perUserCap}
              className="field mt-2"
            />
          </label>
        </div>

        <label className="flex items-center gap-3 mb-6">
          <input
            type="checkbox"
            name="activate"
            defaultChecked
            className="w-5 h-5 accent-[#C8102E]"
          />
          <span className="text-sm">Make this the live wheel on save</span>
        </label>

        <button type="submit" disabled={pending} className="btn btn-ink">
          {pending ? "Saving…" : "Save configuration"}
        </button>

        {state.error && (
          <div className="mt-5 border-2 border-red bg-red text-paper px-4 py-3">
            <p className="label mb-1.5">Refused by the database</p>
            <p className="text-sm">{state.error}</p>
          </div>
        )}
        {state.ok && (
          <div className="mt-5 border-2 border-ink px-4 py-3 bg-paper-deep">
            <p className="text-sm">{state.ok}</p>
          </div>
        )}
      </form>
    </div>
  );
}
