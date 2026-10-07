import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui";
import { rcaCopy, type RcaDraft } from "@/content/rca";
import type { CaseTicketId, TicketCaseState } from "@/lib/case-engine";
import { useToast } from "@/lib/toast";

type RcaStepProps = {
  ticketId: CaseTicketId;
  state: TicketCaseState;
  onEnsureDraft: () => void;
  onUpdateDraft: (draft: RcaDraft) => void;
  onClose: () => { ok: boolean; reason: string };
};

export function RcaStep({
  ticketId,
  state,
  onEnsureDraft,
  onUpdateDraft,
  onClose,
}: RcaStepProps) {
  const navigate = useNavigate();
  const showToast = useToast((s) => s.showToast);
  const draft = state.rcaDraft;

  useEffect(() => {
    onEnsureDraft();
  }, [onEnsureDraft]);

  function patch(partial: Partial<RcaDraft>) {
    if (!draft) return;
    onUpdateDraft({ ...draft, ...partial });
  }

  function handleClose() {
    const result = onClose();
    if (!result.ok) return;
    showToast(`${rcaCopy.toastClosed}: ${ticketId}`);
    navigate("/tickets");
  }

  if (!draft) {
    return (
      <div className="p-4" data-testid="step-rca">
        <p className="text-sm text-text-muted">Preparing RCA draft…</p>
      </div>
    );
  }

  const canClose = state.customerConfirmed && !state.closed;

  return (
    <div className="flex min-h-0 flex-col gap-4 p-4" data-testid="step-rca">
      <div>
        <h2 className="text-base font-medium text-text">{rcaCopy.title}</h2>
        <p className="mt-1 text-sm text-text-muted">{rcaCopy.editableHint}</p>
      </div>

      <label className="block">
        <span className="text-xs text-text-faint">{rcaCopy.summary}</span>
        <textarea
          className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-surface-1 px-3 py-2 text-sm text-text focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
          rows={3}
          data-testid="rca-summary"
          value={draft.summary}
          disabled={state.closed}
          onChange={(e) => patch({ summary: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="text-xs text-text-faint">{rcaCopy.timeline}</span>
        <textarea
          className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-surface-1 px-3 py-2 font-mono text-xs text-text focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
          rows={8}
          data-testid="rca-timeline"
          value={draft.timeline.join("\n")}
          disabled={state.closed}
          onChange={(e) =>
            patch({
              timeline: e.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            })
          }
        />
      </label>

      <label className="block">
        <span className="text-xs text-text-faint">{rcaCopy.rootCause}</span>
        <textarea
          className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-surface-1 px-3 py-2 text-sm text-text focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
          rows={3}
          data-testid="rca-root-cause"
          value={draft.rootCause}
          disabled={state.closed}
          onChange={(e) => patch({ rootCause: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="text-xs text-text-faint">{rcaCopy.fix}</span>
        <textarea
          className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-surface-1 px-3 py-2 text-sm text-text focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
          rows={3}
          data-testid="rca-fix"
          value={draft.fix}
          disabled={state.closed}
          onChange={(e) => patch({ fix: e.target.value })}
        />
      </label>

      <label className="block">
        <span className="text-xs text-text-faint">{rcaCopy.prevention}</span>
        <textarea
          className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-surface-1 px-3 py-2 text-sm text-text focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-accent"
          rows={3}
          data-testid="rca-prevention"
          value={draft.prevention}
          disabled={state.closed}
          onChange={(e) => patch({ prevention: e.target.value })}
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          data-testid="rca-close"
          disabled={!canClose}
          title={canClose ? undefined : rcaCopy.closeDisabled}
          onClick={handleClose}
        >
          {state.closed ? rcaCopy.closed : rcaCopy.close}
        </Button>
        {!canClose && !state.closed ? (
          <p className="text-xs text-text-faint" data-testid="rca-close-reason">
            {rcaCopy.closeDisabled}
          </p>
        ) : null}
      </div>
    </div>
  );
}
