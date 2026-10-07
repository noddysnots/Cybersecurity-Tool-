import { Button } from "@/components/ui";

type LoadingProps = {
  label: string;
  testId: string;
};

export function ViewLoading({ label, testId }: LoadingProps) {
  return (
    <div
      className="rounded-[var(--radius-panel)] border border-border bg-surface-1 px-4 py-10 text-center text-sm text-text-muted"
      data-testid={testId}
      role="status"
    >
      {label}
    </div>
  );
}

type EmptyProps = {
  title: string;
  body: string;
  clearLabel: string;
  onClear: () => void;
  testId: string;
};

export function ViewEmpty({ title, body, clearLabel, onClear, testId }: EmptyProps) {
  return (
    <div
      className="rounded-[var(--radius-panel)] border border-border bg-surface-1 px-4 py-10 text-center"
      data-testid={testId}
    >
      <p className="text-sm font-medium text-text">{title}</p>
      <p className="mt-1 text-xs text-text-muted">{body}</p>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="mt-4"
        onClick={onClear}
        data-testid={`${testId}-clear`}
      >
        {clearLabel}
      </Button>
    </div>
  );
}

type ErrorProps = {
  title: string;
  body: string;
  retryLabel: string;
  onRetry: () => void;
  testId: string;
};

export function ViewError({ title, body, retryLabel, onRetry, testId }: ErrorProps) {
  return (
    <div
      className="rounded-[var(--radius-panel)] border border-border bg-surface-1 px-4 py-10 text-center"
      data-testid={testId}
      role="alert"
    >
      <p className="text-sm font-medium text-danger">{title}</p>
      <p className="mt-1 text-xs text-text-muted">{body}</p>
      <Button
        type="button"
        size="sm"
        className="mt-4"
        onClick={onRetry}
        data-testid={`${testId}-retry`}
      >
        {retryLabel}
      </Button>
    </div>
  );
}
