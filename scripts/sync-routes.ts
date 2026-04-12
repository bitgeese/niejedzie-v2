#!/usr/bin/env tsx
import { db } from "../src/lib/db";
import { fetchSchedules, extractTrainNumber } from "../src/lib/pkp-api";
import { todayWarsaw, yesterdayWarsaw } from "../src/lib/time";
import { config as loadEnv } from "dotenv";
loadEnv();

async function syncDate(apiKey: string, date: string): Promise<number> {
  console.log(`[sync-routes] ${date}`);
  const result = await fetchSchedules(apiKey, date);
  if (!result) { console.error(`[sync-routes] no data for ${date}`); return 0; }

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

  const insertMany = db().transaction((routes: typeof result.routes) => {
    for (const route of routes) {
      const trainNumber = extractTrainNumber(route);
      for (const st of route.stations ?? []) {
        upsertRoute.run(date, trainNumber, st.orderNumber,
          result.stations[String(st.stationId)] ?? "", st.stationId,
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
  const n1 = await syncDate(apiKey, todayWarsaw());
  const n2 = await syncDate(apiKey, yesterdayWarsaw());
  console.log(`[sync-routes] total: ${n1} today + ${n2} yesterday`);
}

main().catch((err) => { console.error("[sync-routes] fatal:", err); process.exit(1); }).finally(() => process.exit(0));
