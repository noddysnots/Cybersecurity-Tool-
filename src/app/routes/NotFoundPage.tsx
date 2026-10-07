import { Link } from "react-router-dom";

import { Button } from "@/components/ui";

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-6 text-text">
      <div className="w-full max-w-lg rounded-[var(--radius-panel)] border border-border bg-surface-1 p-8">
        <p className="text-sm text-text-muted">Page not found</p>
        <h1 className="mt-2 text-xl font-medium">This route does not exist</h1>
        <p className="mt-3 text-base text-text-muted">
          The path you opened is not part of Triage Console. Return to tickets
          or home to continue.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/tickets">Back to Tickets</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/home">Back to Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
