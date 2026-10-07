import { Button } from "@/components/ui";

type ErrorFallbackProps = {
  error?: Error;
  onReset?: () => void;
};

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 text-text">
      <div className="w-full max-w-lg rounded-[var(--radius-panel)] border border-border bg-surface-1 p-8">
        <p className="text-sm text-danger">Something went wrong</p>
        <h1 className="mt-2 text-xl font-medium">This page could not load</h1>
        <p className="mt-3 text-base text-text-muted">
          An unexpected error stopped this view. You can retry or return to
          tickets.
        </p>
        {error?.message ? (
          <p className="mt-4 rounded-[var(--radius-control)] border border-border bg-surface-2 p-3 font-mono text-sm text-text-faint">
            {error.message}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {onReset ? (
            <Button type="button" onClick={onReset}>
              Try again
            </Button>
          ) : null}
          <Button asChild variant="secondary">
            <a href="/tickets">Back to Tickets</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
