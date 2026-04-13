import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const type = req.nextUrl.searchParams.get("type") ?? "station";
  if (q.length < 2) return NextResponse.json({ suggestions: [] });

  const database = db();
  const like = `%${q}%`;
  const prefix = `${q}%`;

  if (type === "train") {
    const rows = database
      .prepare(
        `SELECT train_number, carrier_code FROM train_ids
         WHERE train_number LIKE ?
         ORDER BY length(train_number), train_number LIMIT 10`,
      )
      .all(prefix) as { train_number: string; carrier_code: string | null }[];
    return NextResponse.json({
      suggestions: rows.map((r) => ({ text: r.train_number, detail: r.carrier_code ?? undefined })),
    });
  }

  const rows = database
    .prepare(
      `SELECT name FROM stations WHERE name LIKE ?
       ORDER BY CASE WHEN name LIKE ? THEN 0 ELSE 1 END, length(name), name LIMIT 10`,
    )
    .all(like, prefix) as { name: string }[];
  return NextResponse.json({ suggestions: rows.map((r) => ({ text: r.name })) });
}
