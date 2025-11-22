export function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-text-muted" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-muted border-t-brand"></div>
      <span>{label}</span>
    </div>
  );
}
