"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { HotpError, rpc } from "./db";
import { clearSession, getSession, setSession, type Session } from "./session";
import { paymentProvider } from "./payments";
import type {
  BallResult,
  PublicState,
  PurchaseResult,
  SkillQuestion,
  SpinResult,
} from "./types";

export type FormState = { error?: string; ok?: string };

function message(e: unknown): string {
  if (e instanceof HotpError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong.";
}

/* Auth ------------------------------------------------------------------ */

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const profile = await rpc<Session>("hotp_login", {
      p_email: String(formData.get("email") ?? ""),
      p_password: String(formData.get("password") ?? ""),
    });
    await setSession(profile);
  } catch (e) {
    return { error: message(e) };
  }
  redirect(String(formData.get("next") || "/"));
}

export async function signupAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const profile = await rpc<Session>("hotp_signup", {
      p_email: String(formData.get("email") ?? ""),
      p_password: String(formData.get("password") ?? ""),
      p_display_name: String(formData.get("display_name") ?? ""),
    });
    await setSession(profile);
  } catch (e) {
    return { error: message(e) };
  }
  redirect("/");
}

/** One click into the demo, so a meeting doesn't start with a password. */
export async function demoLoginAction(formData: FormData): Promise<void> {
  const as = String(formData.get("as") ?? "punter");
  const creds =
    as === "admin"
      ? { email: "admin@hotoffthepress.co.uk", password: "admin1234" }
      : { email: "demo@hotoffthepress.co.uk", password: "demo1234" };

  const profile = await rpc<Session>("hotp_login", {
    p_email: creds.email,
    p_password: creds.password,
  });
  await setSession(profile);
  redirect(as === "admin" ? "/admin" : "/");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/");
}

/* Shop ------------------------------------------------------------------ */

export async function getSkillQuestion(): Promise<SkillQuestion> {
  return rpc<SkillQuestion>("hotp_skill_question");
}

export type BuyState = FormState & { result?: PurchaseResult };

export async function buyAction(
  _prev: BuyState,
  formData: FormData,
): Promise<BuyState> {
  const session = await getSession();
  if (!session) return { error: "Sign in first — it takes a moment." };

  const drawId = String(formData.get("draw_id") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const questionId = String(formData.get("question_id") ?? "");
  const answerIndex = Number(formData.get("answer_index") ?? -1);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return { error: "Choose at least one ticket." };
  }
  if (answerIndex < 0) {
    return { error: "Answer the question to continue." };
  }

  try {
    // Price is read back from the database, never taken from the form. What
    // the browser thinks a ticket costs is not evidence.
    const state = await rpc<PublicState>("hotp_public_state", {
      p_profile_id: session.id,
    });
    const draw = [...state.upcoming, ...state.past].find((d) => d.id === drawId);
    if (!draw) return { error: "That edition is not on sale." };

    const payment = await paymentProvider().charge({
      profileId: session.id,
      drawId,
      quantity,
      amountPence: draw.ticket_price_pence * quantity,
      description: `Hot Off The Press — ${quantity} ticket(s)`,
    });

    const result = await rpc<PurchaseResult>("hotp_purchase", {
      p_profile_id: session.id,
      p_draw_id: drawId,
      p_quantity: quantity,
      p_skill_question_id: questionId,
      p_skill_answer_index: answerIndex,
      p_payment_ref: payment.ref,
    });

    revalidatePath("/");
    revalidatePath("/account");
    return { result, ok: "Tickets issued." };
  } catch (e) {
    return { error: message(e) };
  }
}

/* Wheel ----------------------------------------------------------------- */

export type SpinState = FormState & { result?: SpinResult };

export async function spinAction(): Promise<SpinState> {
  const session = await getSession();
  if (!session) return { error: "Sign in to use your spins." };

  try {
    const result = await rpc<SpinResult>("hotp_spin", {
      p_profile_id: session.id,
    });
    revalidatePath("/");
    return { result };
  } catch (e) {
    return { error: message(e) };
  }
}

/* Admin ----------------------------------------------------------------- */

async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session?.is_admin) throw new HotpError("HOTP_FORBIDDEN", "Admin only.");
  return session;
}

export async function recordBallAction(
  drawId: string,
  digit: number | null,
): Promise<{ error?: string; result?: BallResult }> {
  try {
    const admin = await requireAdmin();
    const result = await rpc<BallResult>("hotp_admin_record_ball", {
      p_admin_id: admin.id,
      p_draw_id: drawId,
      p_digit: digit,
    });
    revalidatePath("/live");
    revalidatePath("/admin");
    return { result };
  } catch (e) {
    return { error: message(e) };
  }
}

export async function setDrawAction(
  drawId: string,
  patch: Record<string, unknown>,
): Promise<FormState> {
  try {
    const admin = await requireAdmin();
    await rpc("hotp_admin_set_draw", {
      p_admin_id: admin.id,
      p_draw_id: drawId,
      p_patch: patch,
    });
    revalidatePath("/admin");
    revalidatePath("/live");
    revalidatePath("/");
    return { ok: "Saved." };
  } catch (e) {
    return { error: message(e) };
  }
}

export async function saveWheelAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const admin = await requireAdmin();

    const labels = formData.getAll("seg_label").map(String);
    const tickets = formData.getAll("seg_tickets").map(Number);
    const weights = formData.getAll("seg_weight").map(Number);

    const segments = labels.map((label, i) => ({
      label,
      tickets: tickets[i] ?? 0,
      weight_ppm: weights[i] ?? 0,
    }));

    const saved = await rpc<{ computed_ev: string }>("hotp_admin_save_wheel", {
      p_admin_id: admin.id,
      p_name: String(formData.get("name") ?? "Untitled wheel"),
      p_segments: segments,
      p_ev_ceiling: Number(formData.get("ev_ceiling") ?? 0.2),
      p_per_user_cap: Number(formData.get("per_user_cap") ?? 40),
      p_activate: formData.get("activate") === "on",
    });

    revalidatePath("/admin");
    revalidatePath("/");
    return {
      ok: `Saved. Expected value ${Number(saved.computed_ev).toFixed(4)} tickets per spin.`,
    };
  } catch (e) {
    return { error: message(e) };
  }
}

export async function postalEntryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const admin = await requireAdmin();
    const res = await rpc<{ ticket_numbers: number[] }>("hotp_postal_entry", {
      p_admin_id: admin.id,
      p_draw_id: String(formData.get("draw_id") ?? ""),
      p_email: String(formData.get("email") ?? ""),
      p_quantity: Number(formData.get("quantity") ?? 1),
    });
    revalidatePath("/admin");
    return { ok: `Issued ticket(s): ${res.ticket_numbers.join(", ")}` };
  } catch (e) {
    return { error: message(e) };
  }
}

export async function resetDemoAction(): Promise<FormState> {
  try {
    const admin = await requireAdmin();
    await rpc("hotp_admin_reset_demo", { p_admin_id: admin.id });
    revalidatePath("/admin");
    revalidatePath("/live");
    revalidatePath("/");
    return { ok: "Demo reset. Edition Thirteen is closed and ready to draw." };
  } catch (e) {
    return { error: message(e) };
  }
}
