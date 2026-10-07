import { Link } from "react-router-dom";

import { Button } from "@/components/ui";
import { formatDemoClock } from "@/lib/time";

type PlaceholderPageProps = {
  title: string;
  path: string;
  description?: string;
};

export function PlaceholderPage({
  title,
  path,
  description = "Phase 0 placeholder. Seeded data arrives in later phases.",
}: PlaceholderPageProps) {
  return (
    <main className="min-h-screen bg-bg px-8 py-10 text-text">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 rounded-[var(--radius-panel)] border border-border bg-surface-1 p-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text-muted">Triage Console</p>
          <h1 className="text-xl font-medium tracking-tight">{title}</h1>
          <p className="font-mono text-sm text-accent">{path}</p>
        </div>
        <p className="text-base text-text-muted">{description}</p>
        <p className="font-mono text-sm text-text-faint">
          Demo clock: {formatDemoClock("IST")}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link to="/home">Back to Home</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/tickets">Back to Tickets</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
