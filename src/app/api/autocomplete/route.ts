import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { todayWarsaw } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const type = req.nextUrl.searchParams.get("type") ?? "station";
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  const database = db();
  const today = todayWarsaw();
  const like = `%${q}%`;
  const prefix = `${q}%`;

  if (type === "train") {
    const rows = database
      .prepare(
        `SELECT train_number, route_start, route_end
         FROM active_trains
         WHERE operating_date = ? AND train_number LIKE ?
         ORDER BY train_number LIMIT 10`,
      )
      .all(today, prefix) as { train_number: string; route_start: string; route_end: string }[];
    return NextResponse.json({
      suggestions: rows.map((r) => ({
        text: r.train_number,
        detail: r.route_start && r.route_end ? `${r.route_start} → ${r.route_end}` : undefined,
      })),
    });
  }

  const rows = database
    .prepare(
      `SELECT station_name, COUNT(*) as c FROM train_routes
       WHERE operating_date = ? AND station_name LIKE ?
       GROUP BY station_name ORDER BY c DESC LIMIT 10`,
    )
    .all(today, like) as { station_name: string }[];
  return NextResponse.json({ suggestions: rows.map((r) => ({ text: r.station_name })) });
}
