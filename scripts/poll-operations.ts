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

  const idRows = db()
    .prepare("SELECT schedule_id, order_id, train_number, carrier_code FROM train_ids")
    .all() as { schedule_id: number; order_id: number; train_number: string; carrier_code: string | null }[];
  const trainNumberMap = new Map<string, string>();
  const carrierMap = new Map<string, string>();
  for (const row of idRows) {
    const key = `${row.schedule_id}/${row.order_id}`;
    trainNumberMap.set(key, row.train_number);
    if (row.carrier_code) carrierMap.set(key, row.carrier_code);
  }
  console.log(`[poll] loaded ${trainNumberMap.size} train_id mappings from DB`);

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
      const isToday = (train.operatingDate || today) === today;
      if (train.trainStatus === "S") {
        if (isToday) { onTimeCount++; totalTrainsSeen++; }
        continue;
      }

      let maxDelay = 0;
      let fullyCancelled = true;
      let stationsObserved = 0;
      for (const st of train.stations ?? []) {
        const observed = st.actualArrival || st.actualDeparture;
        if (observed) {
          stationsObserved++;
          fullyCancelled = false;
          const d = st.arrivalDelayMinutes ?? st.departureDelayMinutes ?? 0;
          if (Math.abs(d) > Math.abs(maxDelay)) maxDelay = d;
        }
        if (st.isCancelled && isToday) cancelledCount++;
      }

      // Skip trains that were fully cancelled or haven't started (no observations)
      // — their "delay" values from upstream are noise.
      if (fullyCancelled || stationsObserved === 0) continue;

      if (isToday) {
        totalTrainsSeen++;
        if (maxDelay > 0) { totalDelay += maxDelay; delayCount++; }
        if (maxDelay <= 5) onTimeCount++;
      }

      const first = train.stations?.[0];
      const last = train.stations?.[train.stations.length - 1];
      const routeStart = first ? (stationDict[String(first.stationId)] ?? "") : "";
      const routeEnd = last ? (stationDict[String(last.stationId)] ?? "") : "";
      const compound = `${train.scheduleId}/${train.orderId}`;
      const trainNumber = trainNumberMap.get(compound) ?? compound;
      const carrierCode = carrierMap.get(compound) ?? "";

      upsertTrain.run(train.operatingDate || today, trainNumber, carrierCode || null, routeStart, routeEnd,
        maxDelay > 5 ? 1 : 0, maxDelay, train.scheduleId, train.orderId);

      // Only today's trains with a real delay feed the public topDelayed list.
      if (isToday && maxDelay > 0 && maxDelay < 240) {
        topDelayed.push({
          trainNumber, delay: maxDelay, route: `${routeStart} -> ${routeEnd}`,
          station: last ? (stationDict[String(last.stationId)] ?? "") : "", carrier: carrierCode,
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
