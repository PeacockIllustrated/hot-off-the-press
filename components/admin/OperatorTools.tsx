"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  postalEntryAction,
  resetDemoAction,
  type FormState,
} from "@/lib/actions";
import type { Draw } from "@/lib/types";

export function PostalEntryForm({ draws }: { draws: Draw[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    postalEntryAction,
    {},
  );

  const open = draws.filter(
    (d) => d.status === "selling" || d.status === "draft",
  );

  return (
    <div className="card-flat">
      <div className="border-b-2 border-ink px-5 py-4">
        <h2 className="text-2xl">Postal entry</h2>
        <p className="text-sm text-ink-soft mt-2">
          Records a free entry that arrived by post. It takes a ticket number
          from the same sequence as a paid one, and earns spins at the same
          rate.
        </p>
      </div>

      <form action={formAction} className="p-5 space-y-4">
        <label className="block">
          <span className="label">Edition</span>
          <select name="draw_id" className="field mt-2" required>
            {open.map((d) => (
              <option key={d.id} value={d.id}>
                {d.draw_no} — {d.prize_headline}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="label">Entrant email</span>
          <input name="email" type="email" required className="field mt-2" />
        </label>

        <label className="block">
          <span className="label">Number of entries</span>
          <input
            name="quantity"
            type="number"
            min={1}
            max={50}
            defaultValue={1}
            className="field mt-2"
          />
        </label>

        <button
          type="submit"
          disabled={pending || open.length === 0}
          className="btn btn-ink"
        >
          {pending ? "Recording…" : "Record entry"}
        </button>

        {state.error && <p className="text-sm text-red">{state.error}</p>}
        {state.ok && <p className="text-sm num">{state.ok}</p>}
      </form>
    </div>
  );
}

export function DemoReset() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="card-flat bg-paper-deep">
      <div className="border-b-2 border-ink px-5 py-4">
        <h2 className="text-2xl">Rehearse again</h2>
      </div>
      <div className="p-5">
        <p className="text-sm text-ink-soft mb-4">
          Clears the balls from Edition Thirteen, puts it back to closed and
          ready, and pushes Edition Fourteen&rsquo;s sale window forward. For the
          prototype only — on a live draw this would be destroying the evidence.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await resetDemoAction();
              setMsg(res.error ?? res.ok ?? null);
              router.refresh();
            })
          }
          className="btn btn-paper"
        >
          {pending ? "Resetting…" : "Reset the demo"}
        </button>
        {msg && <p className="text-sm mt-4">{msg}</p>}
      </div>
    </div>
  );
}
