import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { todayWarsaw } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = db();
  const today = todayWarsaw();

  const stats = database
    .prepare("SELECT date, total_trains, punctuality_pct, updated_at FROM stats WHERE date = ?")
    .get(today) as
    | { date: string; total_trains: number; punctuality_pct: number; updated_at: string }
    | undefined;

  const trainCount = (database.prepare("SELECT COUNT(*) as c FROM active_trains WHERE operating_date = ?").get(today) as { c: number }).c;
  const routeCount = (database.prepare("SELECT COUNT(*) as c FROM train_routes WHERE operating_date = ?").get(today) as { c: number }).c;
  const sessionCount = (database.prepare("SELECT COUNT(*) as c FROM monitoring_sessions WHERE status IN ('active','paid_pending_push')").get() as { c: number }).c;

  const lastPollMinutesAgo = stats
    ? Math.round((Date.now() - new Date(stats.updated_at).getTime()) / 60000)
    : null;

  const healthy = stats !== undefined && lastPollMinutesAgo !== null && lastPollMinutesAgo < 15;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      today,
      stats: stats ?? null,
      counts: {
        active_trains: trainCount,
        train_routes: routeCount,
        active_sessions: sessionCount,
      },
      last_poll_minutes_ago: lastPollMinutesAgo,
    },
    { status: healthy ? 200 : 503 },
  );
}
