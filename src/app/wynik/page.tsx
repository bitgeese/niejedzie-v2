import { db } from "@/lib/db";
import { todayWarsaw } from "@/lib/time";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Train { train_number: string; carrier: string | null; max_delay: number; route_start: string; route_end: string; }
interface RouteStop { stop_sequence: number; station_name: string; arrival_time: string | null; departure_time: string | null; }
interface Transfer {
  transfer_station: string;
  x_arrival: string;
  y_train: string;
  y_carrier: string | null;
  y_departure: string;
  y_dest_arrival: string;
  dest_name: string;
  wait_minutes: number;
}

function timeToMin(hhmm: string | null | undefined): number | null {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function findTrain(trainInput: string): Train | null {
  const today = todayWarsaw();
  const normalized = trainInput.trim().replace(/\s+/g, "");
  if (!normalized) return null;

  const live = db().prepare(
    `SELECT train_number, carrier, max_delay, route_start, route_end
     FROM active_trains WHERE operating_date = ? AND train_number = ? LIMIT 1`,
  ).get(today, normalized) as Train | undefined;
  if (live) return live;

  const scheduled = db().prepare(
    `SELECT ti.train_number, ti.carrier_code as carrier,
            (SELECT station_name FROM train_routes WHERE operating_date = ? AND train_number = ti.train_number ORDER BY stop_sequence ASC LIMIT 1) as route_start,
            (SELECT station_name FROM train_routes WHERE operating_date = ? AND train_number = ti.train_number ORDER BY stop_sequence DESC LIMIT 1) as route_end,
            0 as max_delay
     FROM train_ids ti
     WHERE ti.train_number = ? LIMIT 1`,
  ).get(today, today, normalized) as Train | undefined;
  return scheduled ?? null;
}

function findRoute(trainNumber: string): RouteStop[] {
  return db().prepare(
    `SELECT tr.stop_sequence,
            COALESCE(NULLIF(tr.station_name, ''), s.name, '') as station_name,
            tr.arrival_time, tr.departure_time
     FROM train_routes tr
     LEFT JOIN stations s ON s.id = tr.station_id
     WHERE tr.operating_date = ? AND tr.train_number = ?
     ORDER BY tr.stop_sequence`,
  ).all(todayWarsaw(), trainNumber) as RouteStop[];
}

function destinationOnRoute(route: RouteStop[], destInput: string): RouteStop | null {
  const q = destInput.trim().toLowerCase();
  return route.find((s) => s.station_name.toLowerCase().includes(q)) ?? null;
}

function findTransfers(xTrain: string, destInput: string): Transfer[] {
  const today = todayWarsaw();
  const like = `%${destInput.trim().toLowerCase()}%`;

  const rows = db().prepare(`
    SELECT
      COALESCE(NULLIF(x.station_name,''), sx.name, '') as transfer_station,
      x.arrival_time as x_arrival,
      x.departure_time as x_departure,
      y.train_number as y_train,
      ti.carrier_code as y_carrier,
      y.departure_time as y_departure,
      yd.arrival_time as y_dest_arrival,
      COALESCE(NULLIF(yd.station_name,''), syd.name, '') as dest_name,
      (
        (CAST(substr(y.departure_time,1,2) AS INTEGER)*60 + CAST(substr(y.departure_time,4,2) AS INTEGER))
        - (CAST(substr(COALESCE(x.arrival_time, x.departure_time),1,2) AS INTEGER)*60 + CAST(substr(COALESCE(x.arrival_time, x.departure_time),4,2) AS INTEGER))
        + 1440
      ) % 1440 as wait_min
    FROM train_routes x
    LEFT JOIN stations sx ON sx.id = x.station_id
    JOIN train_routes y ON y.operating_date = ?
      AND y.station_id = x.station_id
      AND y.train_number != x.train_number
    JOIN train_routes yd ON yd.operating_date = ?
      AND yd.train_number = y.train_number
      AND yd.stop_sequence > y.stop_sequence
    LEFT JOIN stations syd ON syd.id = yd.station_id
    LEFT JOIN train_ids ti ON ti.train_number = y.train_number
    WHERE x.operating_date = ?
      AND x.train_number = ?
      AND (LOWER(COALESCE(NULLIF(yd.station_name,''), syd.name, '')) LIKE ?)
      AND y.departure_time IS NOT NULL
      AND (x.arrival_time IS NOT NULL OR x.departure_time IS NOT NULL)
    ORDER BY wait_min ASC, y_dest_arrival ASC
    LIMIT 30
  `).all(today, today, today, xTrain, like) as Array<{
    transfer_station: string;
    x_arrival: string;
    x_departure: string;
    y_train: string;
    y_carrier: string | null;
    y_departure: string;
    y_dest_arrival: string;
    dest_name: string;
  }>;

  const candidates: Transfer[] = [];
  const seenAtStation = new Set<string>();
  for (const r of rows) {
    const xA = timeToMin(r.x_arrival) ?? timeToMin(r.x_departure);
    const yD = timeToMin(r.y_departure);
    if (xA === null || yD === null) continue;
    let wait = yD - xA;
    if (wait < 0) wait += 1440;
    if (wait < 5 || wait > 180) continue;
    const key = `${r.transfer_station}|${r.y_train}`;
    if (seenAtStation.has(key)) continue;
    seenAtStation.add(key);
    candidates.push({
      transfer_station: r.transfer_station,
      x_arrival: r.x_arrival,
      y_train: r.y_train,
      y_carrier: r.y_carrier,
      y_departure: r.y_departure,
      y_dest_arrival: r.y_dest_arrival,
      dest_name: r.dest_name,
      wait_minutes: wait,
    });
    if (candidates.length >= 5) break;
  }
  return candidates;
}

function addDelay(hhmm: string | null, delay: number): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return hhmm;
  const total = (h * 60 + m + delay + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default async function WynikPage({ searchParams }: { searchParams: Promise<{ train?: string; destination?: string }> }) {
  const { train: trainParam = "", destination: destParam = "" } = await searchParams;
  const trainInput = trainParam.trim();
  const destInput = destParam.trim();

  if (!trainInput || !destInput) {
    return <main className="min-h-screen flex items-center justify-center px-6"><Link href="/" className="btn-primary">Wróć do wyszukiwania</Link></main>;
  }

  const train = findTrain(trainInput);
  if (!train) {
    return (
      <main className="min-h-screen py-16 px-6">
        <div className="max-w-md mx-auto text-center">
          <p className="text-6xl mb-6">🚂</p>
          <h2 className="text-2xl font-bold mb-3">Nie znaleźliśmy pociągu &quot;{trainInput}&quot;</h2>
          <p className="text-[var(--color-ink-muted)] mb-8">
            Sprawdź numer na bilecie lub na tablicy informacyjnej. Używamy pełnego numeru pociągu (np. 49015).
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/" className="btn-primary">Wróć do wyszukiwania</Link>
            <Link href="/opoznienia" className="btn-secondary">Opóźnienia dzisiaj</Link>
          </div>
        </div>
      </main>
    );
  }

  const route = findRoute(train.train_number);
  const destStop = destinationOnRoute(route, destInput);
  const transfers = destStop ? [] : findTransfers(train.train_number, destInput);
  const delay = train.max_delay || 0;
  const hasLiveData = delay > 0 || (train.max_delay !== undefined && db().prepare(
    `SELECT 1 FROM active_trains WHERE operating_date = ? AND train_number = ?`,
  ).get(todayWarsaw(), train.train_number));

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{train.train_number} → {destInput}</h1>
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-ink-faint)]">
          // {destStop ? "połączenie bezpośrednie" : "brak bezpośredniego połączenia"}
        </p>

        <div className="bg-white rounded-2xl p-6 mt-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono font-semibold text-lg">{train.train_number}</span>
              {train.carrier && <span className="ml-2 font-mono text-xs text-[var(--color-ink-muted)]">{train.carrier}</span>}
              {train.route_start && train.route_end && (
                <p className="text-sm text-[var(--color-ink-muted)] mt-1">{train.route_start} → {train.route_end}</p>
              )}
            </div>
            {delay > 0 ? (
              <span className="font-mono font-bold text-[var(--color-brand-500)]">+{delay} min</span>
            ) : hasLiveData ? (
              <span className="font-mono text-xs text-green-700">na czas</span>
            ) : (
              <span className="font-mono text-xs text-[var(--color-ink-faint)]">brak danych live</span>
            )}
          </div>

          {destStop ? (
            <div className="mt-6 bg-green-50 rounded-xl p-4">
              <p className="font-bold text-green-900">Jedzie bezpośrednio do {destStop.station_name}</p>
              <p className="text-sm text-green-700 mt-1">Nie potrzebujesz przesiadki</p>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-xs uppercase text-green-700">Przyjazd</span>
                {delay > 0 ? (
                  <>
                    <span className="font-mono font-bold text-xl text-green-900">~{addDelay(destStop.arrival_time, delay)}</span>
                    <span className="text-xs text-[var(--color-ink-muted)] font-mono">planowo {destStop.arrival_time}</span>
                  </>
                ) : (
                  <span className="font-mono font-bold text-xl text-green-900">{destStop.arrival_time}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 bg-orange-50 rounded-xl p-4">
              <p className="font-bold text-orange-900">Potrzebujesz przesiadki do &quot;{destInput}&quot;</p>
              <p className="text-sm text-orange-700 mt-1">Ten pociąg nie dojeżdża bezpośrednio. Sprawdź opcje przesiadki poniżej.</p>
            </div>
          )}
        </div>

        {!destStop && transfers.length === 0 && (
          <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm text-center text-[var(--color-ink-muted)]">
            <p>Nie znaleźliśmy dzisiaj sensownej przesiadki do &quot;{destInput}&quot; (w oknie do 3h czasu oczekiwania).</p>
            <p className="text-xs mt-2">Sprawdź dokładną nazwę stacji lub rozkład na portalpasazera.pl.</p>
          </div>
        )}
        {!destStop && transfers.length > 0 && (
          <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-4">// opcje przesiadki ({transfers.length})</p>
            <ul className="space-y-4">
              {transfers.map((t, i) => (
                <li key={i} className="border border-[var(--color-border)] rounded-xl p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="font-bold">Przesiadka w: {t.transfer_station}</span>
                      <span className="text-sm text-[var(--color-ink-muted)] ml-2">czas na przesiadkę: {t.wait_minutes} min</span>
                    </div>
                    <span className="font-mono text-sm text-[var(--color-ink-faint)]">
                      przyjazd {t.y_dest_arrival ?? "—"}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="bg-[var(--color-cream-dark)] rounded-lg p-2">
                      <p className="font-mono text-xs uppercase text-[var(--color-ink-faint)]">etap 1</p>
                      <p className="font-mono font-semibold">{train.train_number}</p>
                      <p className="text-[var(--color-ink-muted)]">→ {t.transfer_station}</p>
                      <p className="font-mono text-xs">przyj. {t.x_arrival}</p>
                    </div>
                    <div className="flex items-center justify-center font-mono text-xs text-[var(--color-ink-faint)]">
                      {t.wait_minutes} min →
                    </div>
                    <div className="bg-[var(--color-cream-dark)] rounded-lg p-2">
                      <p className="font-mono text-xs uppercase text-[var(--color-ink-faint)]">etap 2</p>
                      <p className="font-mono font-semibold">{t.y_train}{t.y_carrier ? ` (${t.y_carrier})` : ""}</p>
                      <p className="text-[var(--color-ink-muted)]">→ {t.dest_name}</p>
                      <p className="font-mono text-xs">odj. {t.y_departure}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {route.length > 0 && (
          <div className="bg-white rounded-2xl p-6 mt-6 shadow-sm">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-4">// trasa pociągu ({route.length} przystanków)</p>
            <ul className="space-y-1 max-h-96 overflow-y-auto">
              {route.map((s) => (
                <li key={s.stop_sequence} className={`flex items-center justify-between py-2 px-3 rounded-lg ${destStop && s.stop_sequence === destStop.stop_sequence ? "bg-green-50 font-bold" : ""}`}>
                  <span>{s.station_name}</span>
                  <span className="font-mono text-sm text-[var(--color-ink-muted)]">{s.arrival_time ?? s.departure_time ?? ""}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 bg-[var(--color-ink)] text-white rounded-2xl p-6 text-center">
          <h3 className="text-xl font-bold mb-2">Monitoruj tę przesiadkę</h3>
          <p className="text-white/70 mb-4">Wyślemy Ci push jeśli opóźnienie zagrozi Twojemu połączeniu.</p>
          <form method="POST" action="/api/checkout/create" className="flex flex-wrap gap-3 justify-center">
            <input type="hidden" name="trainNumber" value={train.train_number} />
            <input type="hidden" name="destination" value={destInput} />
            <button type="submit" name="mode" value="onetime" className="btn-primary">Monitoruj raz — 5 zł</button>
            <button type="submit" name="mode" value="subscription" className="btn-secondary">Bez limitu — 15 zł/msc</button>
          </form>
        </div>
      </div>
    </main>
  );
}
