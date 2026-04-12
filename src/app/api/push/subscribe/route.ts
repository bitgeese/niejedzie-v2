import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const Body = z.object({
  sessionId: z.string().min(1),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({ p256dh: z.string(), auth: z.string() }),
  }),
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  const { sessionId, subscription } = parsed.data;

  const result = db().prepare(
    `UPDATE monitoring_sessions SET push_subscription = ? WHERE id = ? AND status = 'active'`
  ).run(JSON.stringify(subscription), sessionId);

  if (result.changes === 0) return NextResponse.json({ error: "session not found or not active" }, { status: 404 });
  return NextResponse.json({ success: true });
}
