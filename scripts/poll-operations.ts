#!/usr/bin/env tsx
import { db } from "../src/lib/db";
import { fetchOperationsPage, fetchStatistics, type TrainOperationDto } from "../src/lib/pkp-api";
import { todayWarsaw } from "../src/lib/time";
import { config as loadEnv } from "dotenv";
loadEnv();

async function main() {
  const apiKey = process.env.PKP_API_KEY;
  if (!apiKey) { console.error("PKP_API_KEY missing"); process.exit(1); }
  const today = todayWarsaw();
  console.log(`[poll] ${new Date().toISOString()} - polling for ${today}`);

  const stats = await fetchStatistics(apiKey, today);
  const trainsSeen: TrainOperationDto[] = [];
  const stationDict: Record<string, string> = {};
  let page = 1;
  while (page <= 50) {
    const result = await fetchOperationsPage(apiKey, page);
    if (!result || result.trains.length === 0) break;
    trainsSeen.push(...result.trains);
    Object.assign(stationDict, result.stations);
    if (!result.hasNextPage) break;
    page++;
  }

  const upsertTrain = db().prepare(`
    INSERT INTO active_trains
      (operating_date, train_number, carrier, route_start, route_end,
       is_delayed, max_delay, schedule_id, order_id, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(operating_date, train_number) DO UPDATE SET
      carrier = excluded.carrier,
      route_start = excluded.route_start,
      route_end = excluded.route_end,
      is_delayed = excluded.is_delayed,
      max_delay = excluded.max_delay,
      schedule_id = excluded.schedule_id,
      order_id = excluded.order_id,
      updated_at = datetime('now')
  `);

  const topDelayed: Array<{ trainNumber: string; delay: number; route: string; station: string; carrier: string }> = [];
  let totalTrainsSeen = 0, totalDelay = 0, delayCount = 0, onTimeCount = 0, cancelledCount = 0;

  const insertMany = db().transaction((trains: TrainOperationDto[]) => {
    for (const train of trains) {
      if (train.trainStatus === "S") { onTimeCount++; continue; }
      totalTrainsSeen++;
      let maxDelay = 0;
      for (const st of train.stations ?? []) {
        const d = st.arrivalDelayMinutes ?? st.departureDelayMinutes ?? 0;
        if (Math.abs(d) > Math.abs(maxDelay)) maxDelay = d;
        if (st.isCancelled) cancelledCount++;
      }
      if (maxDelay > 0) { totalDelay += maxDelay; delayCount++; }
      if (maxDelay <= 5) onTimeCount++;

      const first = train.stations?.[0];
      const last = train.stations?.[train.stations.length - 1];
      const routeStart = first ? (stationDict[String(first.stationId)] ?? "") : "";
      const routeEnd = last ? (stationDict[String(last.stationId)] ?? "") : "";
      const trainNumber = `${train.scheduleId}/${train.orderId}`;

      upsertTrain.run(train.operatingDate || today, trainNumber, null, routeStart, routeEnd,
        maxDelay > 5 ? 1 : 0, maxDelay, train.scheduleId, train.orderId);

      if (maxDelay > 0) {
        topDelayed.push({
          trainNumber, delay: maxDelay, route: `${routeStart} -> ${routeEnd}`,
          station: last ? (stationDict[String(last.stationId)] ?? "") : "", carrier: "",
        });
      }
    }
  });
  insertMany(trainsSeen);

  const avgDelay = delayCount > 0 ? Math.round((totalDelay / delayCount) * 10) / 10 : 0;
  const punctuality = totalTrainsSeen > 0 ? Math.round((onTimeCount / totalTrainsSeen) * 1000) / 10 : 0;
  topDelayed.sort((a, b) => b.delay - a.delay);

  const statsData = {
    timestamp: new Date().toISOString(),
    totalTrains: stats?.totalTrains ?? totalTrainsSeen,
    punctuality, avgDelay,
    cancelled: stats?.cancelled ?? cancelledCount,
    topDelayed: topDelayed.slice(0, 10),
  };

  db().prepare(
    `INSERT INTO stats (key, data, updated_at) VALUES ('today', ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = datetime('now')`
  ).run(JSON.stringify(statsData));

  console.log(`[poll] done - ${totalTrainsSeen} trains, ${punctuality}% punct, ${avgDelay} min avg, ${cancelledCount} cancelled`);
}

main().catch((err) => { console.error("[poll] fatal:", err); process.exit(1); }).finally(() => process.exit(0));
