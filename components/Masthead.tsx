import Link from "next/link";
import Image from "next/image";
import NavLinks from "./NavLinks";
import { logoutAction } from "@/lib/actions";
import type { Session } from "@/lib/session";
import { DB_CONFIGURED } from "@/lib/config";
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
      {/* The ear — the small print that runs above a nameplate ---------- */}
      <div className="bg-paper border-b border-ink/30">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <p className="label text-ink-soft">
            {ukDate(state?.server_time ?? new Date().toISOString())}
          </p>
          <p className="label text-ink-soft hidden md:block">
            A real drum · on camera · every number printed
          </p>
          <p className="label text-ink">
            {selling
              ? `Edition ${selling.draw_no} · ${gbp(selling.ticket_price_pence)} a ticket`
              : "No edition on sale"}
          </p>
        </div>
      </div>

      {/* The nameplate -------------------------------------------------- */}
      <div className="bg-ink text-paper relative overflow-hidden">
        <div
          aria-hidden
          className="halftone absolute inset-0 pointer-events-none"
          style={{ opacity: 0.1 }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-6 sm:py-8 flex justify-center">
          <Link href="/" className="block">
            <Image
              src="/brand/hotp-long-white.webp"
              alt="Hot Off The Press — front page"
              width={389}
              height={120}
              priority
              className="h-14 sm:h-20 w-auto"
            />
          </Link>
        </div>
      </div>

      {/* Red rule ------------------------------------------------------- */}
      <div className="h-1.5 bg-red" />

      {/* Nav ------------------------------------------------------------ */}
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

      {/* Preview notice ------------------------------------------------- */}
      {!DB_CONFIGURED && (
        <div className="bg-paper border-b-2 border-ink">
          <p className="max-w-6xl mx-auto px-4 py-2 label text-ink-soft">
            Preview edition — sample data, no database connected. The demo
            sign-ins, buying and the drum all work; nothing is kept.
          </p>
        </div>
      )}

      {/* Live strip ----------------------------------------------------- */}
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
