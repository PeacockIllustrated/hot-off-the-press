import "server-only";

import {
  APP_SECRET,
  DB_CONFIGURED,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "./config";
import { demoRpc } from "./demo";
import { HotpError } from "./errors";

export { HotpError };

/**
 * Every call goes through a SECURITY DEFINER function in Postgres, gated by
 * HOTP_APP_SECRET. The anon key never reaches the browser and on its own is
 * not enough to mint a ticket or turn the wheel.
 *
 * With no database configured at all, calls are answered by the built-in
 * preview dataset instead (lib/demo.ts), so the build stays viewable.
 */

function splitPgMessage(raw: string): { code: string; message: string } {
  const m = /^(HOTP_[A-Z_]+):\s*([\s\S]*)$/.exec(raw ?? "");
  if (m) return { code: m[1], message: m[2] };
  return { code: "HOTP_UNKNOWN", message: raw || "Something went wrong." };
}

export async function rpc<T>(
  fn: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!DB_CONFIGURED) return demoRpc<T>(fn, args);

  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ p_secret: APP_SECRET, ...args }),
      cache: "no-store",
    });
  } catch {
    throw new HotpError(
      "HOTP_NETWORK",
      "Could not reach the database. Try again in a moment.",
    );
  }

  const text = await res.text();

  if (!res.ok) {
    let raw = text;
    try {
      const parsed = JSON.parse(text) as { message?: string };
      raw = parsed.message ?? text;
    } catch {
      /* keep raw */
    }
    const { code, message } = splitPgMessage(raw);
    throw new HotpError(code, message);
  }

  if (!text) return null as T;
  return JSON.parse(text) as T;
}
