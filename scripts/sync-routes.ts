#!/usr/bin/env tsx
import { db } from "../src/lib/db";
import { fetchSchedules, extractTrainNumber } from "../src/lib/pkp-api";
import { config as loadEnv } from "dotenv";
loadEnv();

async function syncDate(apiKey: string, date: string): Promise<number> {
  console.log(`[sync-routes] ${date}`);
  const result = await fetchSchedules(apiKey, date);
  if (!result) { console.error(`[sync-routes] no data for ${date}`); return 0; }

  const stationsTable = new Map<number, string>();
  const rows = db().prepare("SELECT id, name FROM stations").all() as { id: number; name: string }[];
  for (const r of rows) stationsTable.set(r.id, r.name);

  const upsertRoute = db().prepare(`
    INSERT INTO train_routes
      (operating_date, train_number, stop_sequence, station_name, station_id, arrival_time, departure_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(operating_date, train_number, stop_sequence) DO UPDATE SET
      station_name = excluded.station_name,
      station_id = excluded.station_id,
      arrival_time = excluded.arrival_time,
      departure_time = excluded.departure_time
  `);

  const upsertId = db().prepare(`
    INSERT INTO train_ids (schedule_id, order_id, train_number, carrier_code, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(schedule_id, order_id) DO UPDATE SET
      train_number = excluded.train_number,
      carrier_code = excluded.carrier_code,
      updated_at = datetime('now')
  `);

  const insertMany = db().transaction((routes: typeof result.routes) => {
    for (const route of routes) {
      const trainNumber = extractTrainNumber(route);
      upsertId.run(route.scheduleId, route.orderId, trainNumber, route.carrierCode ?? null);
      for (const st of route.stations ?? []) {
        const name = result.stations[String(st.stationId)] || stationsTable.get(st.stationId) || "";
        upsertRoute.run(date, trainNumber, st.orderNumber,
          name, st.stationId,
          st.arrivalTime ?? null, st.departureTime ?? null);
      }
    }
  });
  insertMany(result.routes);
  console.log(`[sync-routes] ${date} - ${result.routes.length} routes`);
  return result.routes.length;
}

async function main() {
  const apiKey = process.env.PKP_API_KEY;
  if (!apiKey) { console.error("PKP_API_KEY missing"); process.exit(1); }
  let total = 0;
  for (let offset = -1; offset <= 7; offset++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offset);
    const date = d.toISOString().slice(0, 10);
    total += await syncDate(apiKey, date);
  }
  console.log(`[sync-routes] total routes across 9 days: ${total}`);
}

main().catch((err) => { console.error("[sync-routes] fatal:", err); process.exit(1); }).finally(() => process.exit(0));
