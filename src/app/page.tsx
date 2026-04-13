import ConnectionForm from "@/components/ConnectionForm";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <section className="relative text-white py-24 px-6">
        <div className="absolute inset-0 overflow-hidden">
          <img src="/hero-train.jpg" alt="Pociąg PKP na peronie dworca kolejowego w Polsce" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/75 to-[var(--color-ink)]"></div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-brand-500)] mb-4">// monitor przesiadek</p>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
            Masz przesiadkę?<br />
            <span className="text-[var(--color-brand-500)]">Sprawdzimy czy zdążysz.</span>
          </h1>
          <p className="text-lg text-white/70 mt-6 max-w-xl mx-auto">
            Monitorujemy Twój pociąg i wyślemy alert jeśli opóźnienie zagrozi połączeniu.
          </p>
        </div>
        <div className="max-w-xl mx-auto mt-10 relative z-10">
          <ConnectionForm />
        </div>
      </section>

      <section className="py-16 px-6 bg-[var(--color-cream)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">Jak to działa?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="text-3xl mb-3">1.</div>
              <h3 className="font-bold mb-2">Podaj trasę</h3>
              <p className="text-sm text-[var(--color-ink-muted)]">Wpisz numer pociągu i stację docelową.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="text-3xl mb-3">2.</div>
              <h3 className="font-bold mb-2">Włącz monitoring</h3>
              <p className="text-sm text-[var(--color-ink-muted)]">Za 5 zł jednorazowo lub 15 zł/msc bez limitu.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow">
              <div className="text-3xl mb-3">3.</div>
              <h3 className="font-bold mb-2">Reaguj na czas</h3>
              <p className="text-sm text-[var(--color-ink-muted)]">Dostaniesz alert push jeśli opóźnienie zagrozi przesiadce.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-ink-faint)]">
        <p>Dane z PKP PLK Otwarte Dane Kolejowe · Nie jesteśmy powiązani z PKP S.A.</p>
        <p className="mt-2">© 2026 niejedzie.pl</p>
      </footer>
    </main>
  );
}
