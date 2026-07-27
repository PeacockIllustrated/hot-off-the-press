import "server-only";

/**
 * All four values are server-side only and none reaches the browser.
 *
 * For the prototype they are supplied by `.env.production`, which ships with
 * the deployment. Before this takes real money, move them to Vercel
 * environment variables, delete that file, and rotate both secrets:
 *
 *   update hotp_app_secret
 *   set secret_hash = extensions.crypt('<new value>', extensions.gen_salt('bf', 10));
 *
 * Rotating HOTP_SESSION_SECRET signs everybody out, which is correct.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to the environment (see .env.example).`,
    );
  }
  return value;
}

export const SUPABASE_URL = required("SUPABASE_URL");
export const SUPABASE_ANON_KEY = required("SUPABASE_ANON_KEY");
export const APP_SECRET = required("HOTP_APP_SECRET");
export const SESSION_SECRET =
  process.env.HOTP_SESSION_SECRET ?? required("HOTP_APP_SECRET");
