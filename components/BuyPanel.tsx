"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { buyAction, type BuyState } from "@/lib/actions";
import { gbp, oddsLine, pad, thousands } from "@/lib/format";
import type { Draw, SkillQuestion } from "@/lib/types";

const PRESETS = [1, 5, 10, 25, 50];

export default function BuyPanel({
  draw,
  question,
  signedIn,
}: {
  draw: Draw;
  question: SkillQuestion | null;
  signedIn: boolean;
}) {
  const [quantity, setQuantity] = useState(5);
  const [answer, setAnswer] = useState<number | null>(null);
  const [state, formAction, pending] = useActionState<BuyState, FormData>(
    buyAction,
    {},
  );

  const remaining = draw.ticket_cap - draw.sold;
  const total = draw.ticket_price_pence * quantity;

  if (state.result) {
    const r = state.result;
    return (
      <div className="card p-6 sm:p-8 pop-in">
        <p className="label text-red mb-3">Tickets issued</p>
        <h3 className="text-3xl mb-4">
          {r.quantity} number{r.quantity > 1 ? "s" : ""} are yours
        </h3>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {r.ticket_numbers.map((n) => (
            <span
              key={n}
              className="num text-sm font-bold border-2 border-ink px-2 py-1.5 bg-paper-deep"
            >
              {pad(n, r.digit_count)}
            </span>
          ))}
        </div>
        <p className="text-sm text-ink-soft mb-5">
          {gbp(r.total_pence)} paid.
          {r.spins_earned > 0 && (
            <>
              {" "}
              You earned <strong>{r.spins_earned} spins</strong> on the wheel —
              they came free with the tickets.
            </>
          )}
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link href="/account" className="btn btn-ink">
            See my numbers
          </Link>
          <Link href="/live" className="btn btn-paper">
            Go to the live room
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="card p-6 sm:p-8">
      <input type="hidden" name="draw_id" value={draw.id} />
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="question_id" value={question?.id ?? ""} />
      <input type="hidden" name="answer_index" value={answer ?? -1} />

      <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
        <h3 className="text-2xl">How many?</h3>
        <span className="label text-ink-soft">
          {thousands(remaining)} left of {thousands(draw.ticket_cap)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setQuantity(n)}
            className={[
              "num font-bold border-2 border-ink px-4 py-2.5 transition-colors",
              quantity === n ? "bg-ink text-paper" : "bg-paper hover:bg-paper-deep",
            ].join(" ")}
          >
            {n}
          </button>
        ))}
        <label className="flex items-center gap-2 border-2 border-ink px-3 bg-paper">
          <span className="label text-ink-soft">Other</span>
          <input
            type="number"
            min={1}
            max={Math.min(200, remaining)}
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Math.max(1, Math.min(200, Number(e.target.value) || 1)),
              )
            }
            className="num w-16 py-2 bg-transparent outline-none"
            aria-label="Number of tickets"
          />
        </label>
      </div>

      {/* Live arithmetic ------------------------------------------------ */}
      <dl className="border-y-2 border-ink divide-y divide-rule/50 mb-5">
        <div className="flex justify-between py-2.5">
          <dt className="text-sm">Ticket price</dt>
          <dd className="num text-sm">{gbp(draw.ticket_price_pence)}</dd>
        </div>
        <div className="flex justify-between py-2.5">
          <dt className="text-sm">Your odds, at the cap</dt>
          <dd className="num text-sm">{oddsLine(quantity, draw.ticket_cap)}</dd>
        </div>
        <div className="flex justify-between py-2.5">
          <dt className="text-sm">Spins earned</dt>
          <dd className="num text-sm">{quantity * draw.spins_per_ticket}</dd>
        </div>
        <div className="flex justify-between py-3 items-baseline">
          <dt className="display text-lg">Total</dt>
          <dd className="num text-2xl font-bold">{gbp(total, { pennies: true })}</dd>
        </div>
      </dl>

      {/* Skill gate ----------------------------------------------------- */}
      {question ? (
        <fieldset className="mb-5">
          <legend className="label mb-2">
            Answer to enter — this is a competition of skill
          </legend>
          <p className="text-sm mb-3">{question.question}</p>
          <div className="grid grid-cols-2 gap-2">
            {question.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setAnswer(i)}
                aria-pressed={answer === i}
                className={[
                  "border-2 border-ink px-3 py-2.5 text-sm text-left transition-colors",
                  answer === i
                    ? "bg-ink text-paper"
                    : "bg-paper hover:bg-paper-deep",
                ].join(" ")}
              >
                {opt}
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <p className="text-sm text-red mb-5">
          No skill question is configured, so entries cannot be taken.
        </p>
      )}

      {state.error && (
        <p className="text-sm text-red border-2 border-red px-3 py-2.5 mb-4">
          {state.error}
        </p>
      )}

      {signedIn ? (
        <button
          type="submit"
          disabled={pending || answer === null || !question || remaining < quantity}
          className="btn btn-red w-full text-lg"
        >
          {pending
            ? "Taking payment…"
            : `Buy ${quantity} for ${gbp(total, { pennies: true })}`}
        </button>
      ) : (
        <Link href="/sign-in?next=/" className="btn btn-red w-full text-lg">
          Sign in to buy
        </Link>
      )}

      <p className="text-xs text-ink-soft mt-4 leading-snug">
        No money is taken in this build. A free postal route is open to everyone
        and carries exactly the same chance —{" "}
        <Link href="/how-it-works#free" className="underline">
          how to enter free
        </Link>
        .
      </p>
    </form>
  );
}
