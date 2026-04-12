export default function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--color-cream)]/85 backdrop-blur-xl border-b border-[var(--color-border)]">
      <nav className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <a href="/" className="group flex items-baseline gap-[1px]">
          <span className="text-[1.2rem] font-extrabold tracking-[-0.03em] text-[var(--color-ink)]">nie</span>
          <span className="text-[1.2rem] font-extrabold tracking-[-0.03em] text-[var(--color-brand-500)] group-hover:text-[var(--color-brand-600)] transition-colors">jedzie</span>
          <span className="text-[0.8rem] font-medium text-[var(--color-ink-faint)] ml-[2px] tracking-tight">.pl</span>
        </a>
        <div className="flex items-center gap-0.5">
          <a href="/opoznienia" className="px-3 py-1.5 text-[0.8125rem] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-cream-dark)] rounded-lg transition-all">Opóźnienia</a>
          <a href="/cennik" className="px-3 py-1.5 text-[0.8125rem] font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-cream-dark)] rounded-lg transition-all">Cennik</a>
        </div>
      </nav>
    </header>
  );
}
