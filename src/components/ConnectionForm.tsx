"use client";
import { useState } from "react";

export default function ConnectionForm() {
  const [train, setTrain] = useState("");
  const [dest, setDest] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!train.trim() || !dest.trim()) return;
    const params = new URLSearchParams({ train: train.trim(), destination: dest.trim() });
    window.location.href = `/wynik?${params.toString()}`;
  }

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4 max-w-md mx-auto">
      <label className="block">
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">Numer pociągu</span>
        <input type="text" value={train} onChange={(e) => setTrain(e.target.value)}
          placeholder="np. IC 5313"
          className="mt-1 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 font-mono focus:border-[var(--color-brand-500)] focus:outline-none"
          required />
      </label>
      <label className="block">
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">Dokąd jedziesz</span>
        <input type="text" value={dest} onChange={(e) => setDest(e.target.value)}
          placeholder="np. Kraków Główny"
          className="mt-1 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 focus:border-[var(--color-brand-500)] focus:outline-none"
          required />
      </label>
      <button type="submit" className="btn-primary w-full">Sprawdź połączenie</button>
      <p className="text-center text-xs text-[var(--color-ink-faint)] font-mono">Dane PKP · odświeżane co kilka minut</p>
    </form>
  );
}
