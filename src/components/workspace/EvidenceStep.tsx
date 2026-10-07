import { Button } from "@/components/ui";
import { LogExplorer } from "@/components/logs";
import { logsCopy } from "@/content/logs";
import { getEvidenceScope } from "@/lib/case-scope";
import type { CaseTicketId, TicketCaseState } from "@/lib/case-engine";
import type { Evidence } from "@/types";

type EvidenceStepProps = {
  ticketId: CaseTicketId;
  state: TicketCaseState;
  onPin: (evidence: Omit<Evidence, "ticketId" | "pinnedAt">) => void;
  onContinue: () => void;
};

export function EvidenceStep({ ticketId, state, onPin, onContinue }: EvidenceStepProps) {
  const scope = getEvidenceScope(state.caseKey);
  const window = { start: scope.windowStart, end: scope.windowEnd };

  return (
    <div className="flex min-h-0 flex-col gap-3 p-4" data-testid="step-evidence">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-text">{logsCopy.evidenceTitle}</h2>
          <p className="mt-1 text-sm text-text-muted">{logsCopy.evidenceHint}</p>
          <p className="mt-1 font-mono text-xs text-text-faint">
            {scope.failingLabel} · scope window
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          data-testid="evidence-continue"
          disabled={!state.evidenceComplete && state.pinnedEvidence.length === 0}
          title={
            !state.evidenceComplete && state.pinnedEvidence.length === 0
              ? logsCopy.evidenceContinueHint
              : undefined
          }
          onClick={onContinue}
        >
          {logsCopy.evidenceContinue}
        </Button>
      </div>

      <LogExplorer
        testId={`evidence-explorer-${ticketId}`}
        initialQuery={scope.initialQuery}
        initialType={scope.initialType}
        initialWindow={window}
        scopeWindow={window}
        showConfigStrip
        onPin={onPin}
      />
    </div>
  );
}
