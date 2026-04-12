#!/usr/bin/env tsx
import { db } from "../src/lib/db";
import { sendPush } from "../src/lib/webpush";
import { todayWarsaw } from "../src/lib/time";
import { config as loadEnv } from "dotenv";
loadEnv();

const DELAY_THRESHOLD_MIN = 15;
const MIN_MINUTES_BETWEEN_PUSHES = 30;

interface Session { id: string; train_number: string; destination: string; push_subscription: string | null; last_push_at: string | null; }
interface Train { max_delay: number; carrier: string | null; }

async function main() {
  const today = todayWarsaw();
  const sessions = db().prepare(
    `SELECT id, train_number, destination, push_subscription, last_push_at
     FROM monitoring_sessions
     WHERE status = 'active' AND push_subscription IS NOT NULL AND operating_date = ?`
  ).all(today) as Session[];

  if (sessions.length === 0) { console.log("[check-push] no active sessions"); return; }
  console.log(`[check-push] checking ${sessions.length} sessions`);

  for (const s of sessions) {
    const digits = s.train_number.replace(/\D/g, "");
    const train = db().prepare(
      `SELECT max_delay, carrier FROM active_trains
       WHERE operating_date = ? AND train_number LIKE ? LIMIT 1`
    ).get(today, `%${digits}%`) as Train | undefined;

    if (!train || train.max_delay < DELAY_THRESHOLD_MIN) continue;

    if (s.last_push_at) {
      const last = new Date(s.last_push_at).getTime();
      if (Date.now() - last < MIN_MINUTES_BETWEEN_PUSHES * 60_000) continue;
    }

    const subscription = JSON.parse(s.push_subscription!);
    const result = await sendPush(subscription, {
      title: `Pociąg ${s.train_number} ma opóźnienie`,
      body: `+${train.max_delay} min. Sprawdź czy zdążysz na przesiadkę do ${s.destination}.`,
      url: `/wynik?train=${encodeURIComponent(s.train_number)}&destination=${encodeURIComponent(s.destination)}`,
    });

    if (result.ok) {
      db().prepare(`UPDATE monitoring_sessions SET last_push_at = datetime('now') WHERE id = ?`).run(s.id);
      console.log(`[check-push] pushed to ${s.id} - +${train.max_delay} min`);
    } else {
      console.error(`[check-push] push failed for ${s.id}: ${result.error}`);
      if (result.statusCode === 410) {
        db().prepare(`UPDATE monitoring_sessions SET push_subscription = NULL WHERE id = ?`).run(s.id);
      }
    }
  }
}

main().catch((err) => { console.error("[check-push] fatal:", err); process.exit(1); }).finally(() => process.exit(0));
