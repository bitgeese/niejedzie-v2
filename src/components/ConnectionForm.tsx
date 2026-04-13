"use client";
import { useEffect, useState } from "react";

type Suggestion = { text: string; detail?: string };

function useAutocomplete(type: "train" | "station", value: string) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/autocomplete?type=${type}&q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: { suggestions: Suggestion[] }) => setSuggestions(d.suggestions ?? []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [type, value]);
  return { suggestions, loading };
}

function AutocompleteInput({
  label,
  placeholder,
  type,
  value,
  onChange,
  mono,
}: {
  label: string;
  placeholder: string;
  type: "train" | "station";
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  const [hidden, setHidden] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const { suggestions } = useAutocomplete(type, value);
  const open = !hidden && suggestions.length > 0;

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      onChange(suggestions[activeIdx].text);
      setHidden(true);
    } else if (e.key === "Escape") {
      setHidden(true);
    }
  }

  return (
    <div className="relative">
      <label className="block">
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">{label}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setActiveIdx(-1);
            setHidden(false);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`mt-1 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-brand-500)] focus:outline-none ${mono ? "font-mono" : ""}`}
          required
        />
      </label>
      {open && (
        <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-[var(--color-border)] rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <li
              key={s.text + i}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s.text);
                setHidden(true);
              }}
              className={`px-4 py-2 cursor-pointer text-sm text-[var(--color-ink)] flex justify-between items-center gap-3 ${i === activeIdx ? "bg-[var(--color-cream-dark)]" : "hover:bg-[var(--color-cream-dark)]"}`}
            >
              <span className={mono ? "font-mono" : ""}>{s.text}</span>
              {s.detail && <span className="text-xs text-[var(--color-ink-faint)] truncate">{s.detail}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
      <AutocompleteInput label="Numer pociągu" placeholder="np. IC 5313" type="train" value={train} onChange={setTrain} mono />
      <AutocompleteInput label="Dokąd jedziesz" placeholder="np. Kraków Główny" type="station" value={dest} onChange={setDest} />
      <button type="submit" className="btn-primary w-full">Sprawdź połączenie</button>
      <p className="text-center text-xs text-[var(--color-ink-faint)] font-mono">Dane PKP · odświeżane co kilka minut</p>
    </form>
  );
}
