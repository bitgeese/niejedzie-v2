export const dynamic = "force-static";

export default function CennikPage() {
  return (
    <main className="min-h-screen py-16 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-ink-faint)]">// cennik</p>
        <h1 className="text-5xl font-extrabold mb-4">Prosty cennik, zero haczyków</h1>
        <p className="text-[var(--color-ink-muted)] max-w-xl mx-auto">
          Sprawdzanie opóźnień jest zawsze darmowe. Płacisz tylko za monitoring przesiadek z powiadomieniami push.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[var(--color-border)]">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">jednorazowy</p>
            <div className="flex items-baseline mt-2 mb-1">
              <span className="text-6xl font-mono font-bold">5</span>
              <span className="text-3xl font-mono font-bold ml-2">zł</span>
              <span className="text-[var(--color-ink-muted)] ml-2">/ przesiadka</span>
            </div>
            <p className="text-sm text-[var(--color-ink-muted)] mb-6">Jedziesz raz? To opcja dla Ciebie.</p>
            <ul className="space-y-2 text-sm text-left mb-6">
              <li>✓ Monitoring jednej przesiadki</li>
              <li>✓ Powiadomienia push w czasie rzeczywistym</li>
              <li>✓ Alternatywne połączenia przy opóźnieniu</li>
              <li>✓ Pomoc w odszkodowaniu jeśli &gt;60 min</li>
            </ul>
            <a href="/" className="btn-secondary w-full">Wybierz przesiadkę →</a>
          </div>

          <div className="bg-[var(--color-ink)] text-white rounded-2xl p-8 shadow-xl border-2 border-[var(--color-brand-500)] relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-brand-500)] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">Polecany</span>
            <p className="font-mono text-xs uppercase tracking-wider text-white/60">miesięczny</p>
            <div className="flex items-baseline mt-2 mb-1">
              <span className="text-6xl font-mono font-bold">15</span>
              <span className="text-3xl font-mono font-bold ml-2">zł</span>
              <span className="text-white/60 ml-2">/ miesiąc</span>
            </div>
            <p className="text-sm text-[var(--color-brand-500)] font-bold mb-6">Tyle co 3 jednorazowe — ale bez limitu</p>
            <ul className="space-y-2 text-sm text-left mb-6">
              <li>✓ <strong>Nielimitowany</strong> monitoring wszystkich przesiadek</li>
              <li>✓ Priorytetowe powiadomienia push</li>
              <li>✓ Historia opóźnień Twoich tras</li>
              <li>✓ Alternatywne połączenia + odszkodowania</li>
            </ul>
            <a href="/" className="btn-primary w-full">Zacznij za 15 zł/msc →</a>
            <p className="text-xs text-white/40 mt-3">Anulujesz kiedy chcesz.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
