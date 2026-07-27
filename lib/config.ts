import "server-only";

/**
 * All four values are server-side only and none reaches the browser.
 *
 * When the Supabase values are absent the app does not crash: `rpc` in
 * lib/db.ts serves the built-in preview dataset instead (lib/demo.ts), so
 * the build can be viewed and walked through with no database at all.
 * `DB_CONFIGURED` is the single switch.
 *
 * Before this takes real money, supply the values as environment variables
 * and rotate both secrets:
 *
 *   update hotp_app_secret
 *   set secret_hash = extensions.crypt('<new value>', extensions.gen_salt('bf', 10));
 *
 * Rotating HOTP_SESSION_SECRET signs everybody out, which is correct.
 */

export const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
export const APP_SECRET = process.env.HOTP_APP_SECRET ?? "";

/** True when every value needed to reach Postgres is present. */
export const DB_CONFIGURED = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && APP_SECRET,
);

/*
 * Sessions in preview mode are signed with a published constant, which makes
 * them forgeable — acceptable only because preview mode holds no money and
 * no real accounts. With a database configured, a real secret is required.
 */
export const SESSION_SECRET =
  process.env.HOTP_SESSION_SECRET ||
  APP_SECRET ||
  "hotp-preview-only-not-a-secret";
