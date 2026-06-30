export function PageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-brand-silver-2 text-4xl font-bold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-brand-muted mt-3 max-w-2xl">{subtitle}</p> : null}
    </div>
  );
}
