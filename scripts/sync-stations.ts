#!/usr/bin/env tsx
import { db } from "../src/lib/db";
import { fetchAllStations } from "../src/lib/pkp-api";
import { config as loadEnv } from "dotenv";
loadEnv();

async function main() {
  const apiKey = process.env.PKP_API_KEY;
  if (!apiKey) { console.error("PKP_API_KEY missing"); process.exit(1); }

  const stations = await fetchAllStations(apiKey);
  console.log(`[sync-stations] fetched ${stations.length} stations`);

  const upsert = db().prepare(`
    INSERT INTO stations (id, name) VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET name = excluded.name
  `);
  const tx = db().transaction((rows: typeof stations) => {
    for (const s of rows) upsert.run(s.id, s.name);
  });
  tx(stations);
  console.log(`[sync-stations] stored ${stations.length} stations`);
}

main().catch((err) => { console.error("[sync-stations] fatal:", err); process.exit(1); }).finally(() => process.exit(0));
