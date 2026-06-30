export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-brand-bg border-t border-white/10">
      <div className="text-brand-muted mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-sm">
        <p className="text-brand-silver-2 font-[family-name:var(--font-heading)]">NurvexThink</p>
        <p>Software, built and published. Custom software on demand.</p>
        <p>© {year} NurvexThink. All rights reserved.</p>
      </div>
    </footer>
  );
}
