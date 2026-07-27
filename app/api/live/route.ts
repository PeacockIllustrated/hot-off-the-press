import type { NextRequest } from "next/server";
import { rpc, HotpError } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { LiveState } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const drawId = request.nextUrl.searchParams.get("draw");
  if (!drawId) {
    return Response.json({ error: "Missing draw id" }, { status: 400 });
  }

  const session = await getSession();

  try {
    const state = await rpc<LiveState>("hotp_live_state", {
      p_draw_id: drawId,
      p_profile_id: session?.id ?? null,
    });
    return Response.json(state, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    const message = e instanceof HotpError ? e.message : "Could not load the draw.";
    return Response.json({ error: message }, { status: 500 });
  }
}
