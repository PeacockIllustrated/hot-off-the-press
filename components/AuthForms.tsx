"use client";

import { useActionState, useState } from "react";
import { loginAction, signupAction, type FormState } from "@/lib/actions";

export default function AuthForms({ next }: { next: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [loginState, loginFormAction, loginPending] = useActionState<
    FormState,
    FormData
  >(loginAction, {});
  const [signupState, signupFormAction, signupPending] = useActionState<
    FormState,
    FormData
  >(signupAction, {});

  const state = mode === "in" ? loginState : signupState;

  return (
    <div className="card p-6">
      <div className="flex border-2 border-ink mb-6">
        <button
          type="button"
          onClick={() => setMode("in")}
          className={`label flex-1 py-3 ${mode === "in" ? "bg-ink text-paper" : "bg-paper"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("up")}
          className={`label flex-1 py-3 border-l-2 border-ink ${mode === "up" ? "bg-ink text-paper" : "bg-paper"}`}
        >
          Create account
        </button>
      </div>

      {mode === "in" ? (
        <form action={loginFormAction} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block">
            <span className="label">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="field mt-2"
            />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="field mt-2"
            />
          </label>
          <button
            type="submit"
            disabled={loginPending}
            className="btn btn-ink w-full"
          >
            {loginPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      ) : (
        <form action={signupFormAction} className="space-y-4">
          <label className="block">
            <span className="label">Name</span>
            <input
              name="display_name"
              type="text"
              autoComplete="name"
              className="field mt-2"
            />
          </label>
          <label className="block">
            <span className="label">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="field mt-2"
            />
          </label>
          <label className="block">
            <span className="label">Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="field mt-2"
            />
            <span className="text-xs text-ink-soft mt-1.5 block">
              Eight characters or more.
            </span>
          </label>
          <button
            type="submit"
            disabled={signupPending}
            className="btn btn-ink w-full"
          >
            {signupPending ? "Creating…" : "Create account"}
          </button>
        </form>
      )}

      {state.error && (
        <p className="text-sm text-red border-2 border-red px-3 py-2.5 mt-4">
          {state.error}
        </p>
      )}
    </div>
  );
}
