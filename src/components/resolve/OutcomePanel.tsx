"use client";

import { RESOLVE_COPY } from "@/content/resolve";
import type { EvidenceItem, ResolutionDraft, ScenarioId } from "@/types";
import { ConfigFixPanel } from "./ConfigFixPanel";
import { EscalationPanel } from "./EscalationPanel";
import { PolicyFixPanel } from "./PolicyFixPanel";

interface OutcomePanelProps {
  scenarioId: ScenarioId | undefined;
  draft: ResolutionDraft;
  evidence: EvidenceItem[];
  stagedA: boolean;
  appliedB: boolean;
  onStageA: () => void;
  onApplyB: () => void;
  onQuarantine: () => void;
  onCopyPackage: () => void;
  onDownloadPackage: () => void;
}

export function OutcomePanel({
  scenarioId,
  draft,
  evidence,
  stagedA,
  appliedB,
  onStageA,
  onApplyB,
  onQuarantine,
  onCopyPackage,
  onDownloadPackage,
}: OutcomePanelProps) {
  return (
    <section
      aria-labelledby="resolve-outcome"
      data-guide-id="guide-outcome"
      className="rounded-lg border border-border bg-panel p-4"
    >
      <h2 id="resolve-outcome" className="sr-only">
        {RESOLVE_COPY.outcomeTitle}
      </h2>
      {scenarioId === "A" ? (
        <PolicyFixPanel staged={stagedA} onStage={onStageA} />
      ) : scenarioId === "B" ? (
        <ConfigFixPanel applied={appliedB} onApply={onApplyB} />
      ) : scenarioId === "C" ? (
        <EscalationPanel
          evidence={evidence}
          quarantineTagged={draft.quarantineTagged}
          packageGenerated={draft.packageGenerated}
          onQuarantine={onQuarantine}
          onCopy={onCopyPackage}
          onDownload={onDownloadPackage}
        />
      ) : (
        <div>
          <h3 className="text-[13px] font-medium text-text">
            {RESOLVE_COPY.genericOutcomeTitle}
          </h3>
          <p className="mt-1 text-[12px] text-muted-fg">{RESOLVE_COPY.genericOutcomeBody}</p>
        </div>
      )}
    </section>
  );
}
