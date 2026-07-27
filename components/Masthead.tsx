import Link from "next/link";
import Image from "next/image";
import NavLinks from "./NavLinks";
import { logoutAction } from "@/lib/actions";
import type { Session } from "@/lib/session";
import { rpc } from "@/lib/db";
import type { PublicState } from "@/lib/types";
import { gbp, ukDate } from "@/lib/format";

async function safeState(): Promise<PublicState | null> {
  try {
    return await rpc<PublicState>("hotp_public_state", { p_profile_id: null });
  } catch {
    return null;
  }
}

export default async function Masthead({
  session,
}: {
  session: Session | null;
}) {
  const state = await safeState();
  const live = state?.live ?? null;
  const selling = state?.selling ?? null;

  const items = [
    { href: "/", label: "Front page" },
    { href: "/live", label: "Live room", flag: Boolean(live) },
    { href: "/draws", label: "Past draws" },
    { href: "/how-it-works", label: "How it works" },
    ...(session ? [{ href: "/account", label: "My numbers" }] : []),
    ...(session?.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header>
      {/* Ink band ------------------------------------------------------ */}
      <div className="bg-ink text-paper relative overflow-hidden">
        <div
          aria-hidden
          className="halftone absolute inset-0 pointer-events-none"
          style={{ opacity: 0.1 }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-5 flex items-center justify-between gap-6">
          <Link href="/" className="block shrink-0">
            <Image
              src="/brand/hotp-long-white.webp"
              alt="Hot Off The Press"
              width={389}
              height={120}
              className="h-11 sm:h-14 w-auto"
            />
          </Link>

          <div className="hidden md:block text-right">
            <p className="label text-paper/70">
              {ukDate(state?.server_time ?? new Date().toISOString())}
            </p>
            <p className="label mt-2 text-paper">
              {selling
                ? `Edition ${selling.draw_no} on sale · ${gbp(selling.ticket_price_pence)} a ticket`
                : "No edition on sale"}
            </p>
          </div>
        </div>
      </div>

      {/* Red rule ------------------------------------------------------ */}
      <div className="h-1.5 bg-red" />

      {/* Nav ----------------------------------------------------------- */}
      <div className="bg-paper-deep border-b-2 border-ink">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between">
          <div className="border-l-2 border-ink">
            <NavLinks items={items} />
          </div>

          <div className="flex items-center gap-3 py-2">
            {session ? (
              <>
                <span className="label text-ink-soft hidden sm:inline">
                  {session.display_name}
                </span>
                <form action={logoutAction}>
                  <button type="submit" className="label underline">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link href="/sign-in" className="label underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Live strip ---------------------------------------------------- */}
      {live && (
        <Link
          href="/live"
          className="block bg-red text-paper border-b-2 border-ink hover:bg-red-deep transition-colors"
        >
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3 flex-wrap">
            <span aria-hidden className="w-2.5 h-2.5 rounded-full bg-paper lamp-on" />
            <span className="label">On air now</span>
            <span className="text-sm">
              Edition {live.draw_no} is being drawn. Watch the drum.
            </span>
          </div>
        </Link>
      )}
    </header>
  );
}
