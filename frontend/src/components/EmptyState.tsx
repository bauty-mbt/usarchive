export default function EmptyState({
  message,
  cta,
  onCta,
}: {
  message: string;
  cta?: string;
  onCta?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-dashed px-6 py-14 text-center"
      style={{ borderColor: "var(--color-line)" }}>
      <span className="text-2xl">🌱</span>
      <p className="max-w-xs text-sm text-inkMuted">{message}</p>
      {cta && (
        <button
          onClick={onCta}
          className="rounded-full bg-accent px-5 py-2 text-sm text-surface transition-opacity hover:opacity-90"
        >
          {cta} →
        </button>
      )}
    </div>
  );
}
