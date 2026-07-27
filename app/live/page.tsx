import Link from "next/link";
import LiveRoom from "@/components/LiveRoom";
import { rpc } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { LiveState, PublicState } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "The live room — Hot Off The Press",
};

export default async function LivePage() {
  const session = await getSession();
  const state = await rpc<PublicState>("hotp_public_state", {
    p_profile_id: session?.id ?? null,
  });

  const target = state.live ?? state.past[0] ?? null;

  if (!target) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl mb-4">Off air</h1>
        <p className="text-ink-soft mb-8">
          Nothing is being drawn at the moment. The next edition is listed on
          the front page.
        </p>
        <Link href="/" className="btn btn-ink">
          Back to the front page
        </Link>
      </div>
    );
  }

  const live = await rpc<LiveState>("hotp_live_state", {
    p_draw_id: target.id,
    p_profile_id: session?.id ?? null,
  });

  return (
    <LiveRoom
      initial={live}
      selling={state.selling}
      wheel={state.wheel}
      spinsLeft={state.me?.spins_left ?? 0}
      spinsUsed={state.me?.spins_used_this_draw ?? 0}
      signedIn={Boolean(session)}
    />
  );
}
