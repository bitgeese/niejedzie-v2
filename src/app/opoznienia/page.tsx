import { db } from "@/lib/db";
import TrainOperator from "@/components/TrainOperator";

export const dynamic = "force-dynamic";

interface TopDelayed { trainNumber: string; delay: number; route: string; station: string; carrier: string; }
interface StatsData { timestamp: string; totalTrains: number; punctuality: number; avgDelay: number; cancelled: number; topDelayed: TopDelayed[]; }

export default function OpoznieniaPage() {
  const row = db().prepare("SELECT data FROM stats WHERE key = 'today'").get() as { data: string } | undefined;
  const stats: StatsData | null = row ? JSON.parse(row.data) : null;

  return (
    <main className="min-h-screen">
      <section className="bg-[var(--color-cream)] py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)]">// opóźnienia na żywo</p>
          <h1 className="text-4xl md:text-5xl font-extrabold">
            Opóźnienia pociągów <span className="text-[var(--color-brand-500)]">dzisiaj</span>
          </h1>
          <p className="mt-4 text-[var(--color-ink-muted)]">
            Aktualne opóźnienia pociągów w Polsce. Dane z PKP PLK odświeżane co 5 minut.
          </p>
          {stats && (
            <p className="text-xs text-[var(--color-ink-faint)] font-mono mt-2">
              Ostatnia aktualizacja: {new Date(stats.timestamp).toLocaleString("pl-PL")} · Źródło: PKP PLK Otwarte Dane Kolejowe
            </p>
          )}
        </div>
      </section>

      {!stats ? (
        <section className="py-12 px-6 max-w-5xl mx-auto">
          <p className="text-center text-[var(--color-ink-muted)]">Dane będą dostępne po pierwszym cyklu cron (~5 min).</p>
        </section>
      ) : (
        <>
          <section className="py-8 px-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Pociągów dzisiaj" value={stats.totalTrains.toString()} />
              <StatCard label="Punktualność" value={`${stats.punctuality}%`} color="green" />
              <StatCard label="Średnie opóźnienie" value={`${stats.avgDelay} min`} color="brand" />
              <StatCard label="Odwołanych" value={stats.cancelled.toString()} color="red" />
            </div>
          </section>

          <section className="py-8 px-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Najbardziej opóźnione pociągi</h2>
            {stats.topDelayed.length === 0 ? (
              <p className="text-[var(--color-ink-muted)]">Brak opóźnionych pociągów — wszystko jedzie na czas.</p>
            ) : (
              <ul className="space-y-2">
                {stats.topDelayed.map((t, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                    <TrainOperator trainNumber={t.trainNumber} carrier={t.carrier} />
                    <span className="flex-1 text-sm text-[var(--color-ink-muted)]">{t.route}</span>
                    <span className="font-mono font-bold text-[var(--color-brand-500)]">+{t.delay} min</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <footer className="py-8 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-ink-faint)]">
        <p>© 2026 niejedzie.pl</p>
      </footer>
    </main>
  );
}

function StatCard({ label, value, color = "ink" }: { label: string; value: string; color?: "ink" | "green" | "brand" | "red"; }) {
  const colorCls = {
    ink: "text-[var(--color-ink)]",
    green: "text-green-600",
    brand: "text-[var(--color-brand-500)]",
    red: "text-[var(--color-delay-high)]",
  }[color];
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <div className={`text-3xl md:text-4xl font-bold ${colorCls}`}>{value}</div>
      <div className="font-mono text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mt-2">{label}</div>
    </div>
  );
}
