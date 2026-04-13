import { db } from "@/lib/db";
import { todayWarsaw } from "@/lib/time";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Train { train_number: string; carrier: string | null; max_delay: number; route_start: string; route_end: string; }
interface RouteStop { stop_sequence: number; station_name: string; arrival_time: string | null; departure_time: string | null; }

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
    `SELECT stop_sequence, station_name, arrival_time, departure_time
     FROM train_routes WHERE operating_date = ? AND train_number = ? ORDER BY stop_sequence`,
  ).all(todayWarsaw(), trainNumber) as RouteStop[];
}

function destinationOnRoute(route: RouteStop[], destInput: string): RouteStop | null {
  const q = destInput.trim().toLowerCase();
  return route.find((s) => s.station_name.toLowerCase().includes(q)) ?? null;
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
              <p className="font-bold text-orange-900">Brak bezpośredniego połączenia do &quot;{destInput}&quot;</p>
              <p className="text-sm text-orange-700 mt-1">Ten pociąg nie zatrzymuje się na tej stacji.</p>
            </div>
          )}
        </div>

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
