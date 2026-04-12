import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { todayWarsaw } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = db();
  const today = todayWarsaw();

  const statsRow = database
    .prepare("SELECT data, updated_at FROM stats WHERE key = 'today'")
    .get() as { data: string; updated_at: string } | undefined;

  const stats = statsRow ? (JSON.parse(statsRow.data) as { totalTrains: number; punctuality: number; avgDelay: number; cancelled: number }) : null;

  const trainCount = (database.prepare("SELECT COUNT(*) as c FROM active_trains WHERE operating_date = ?").get(today) as { c: number }).c;
  const routeCount = (database.prepare("SELECT COUNT(*) as c FROM train_routes WHERE operating_date = ?").get(today) as { c: number }).c;
  const sessionCount = (database.prepare("SELECT COUNT(*) as c FROM monitoring_sessions WHERE status = 'active'").get() as { c: number }).c;

  const lastPollMinutesAgo = statsRow
    ? Math.round((Date.now() - new Date(statsRow.updated_at.replace(" ", "T") + "Z").getTime()) / 60000)
    : null;

  const healthy = stats !== null && lastPollMinutesAgo !== null && lastPollMinutesAgo < 15;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      today,
      stats,
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
