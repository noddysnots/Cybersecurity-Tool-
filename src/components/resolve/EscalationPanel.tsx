"use client";

import { CheckCircle2 } from "lucide-react";
import { ESCALATION_COPY } from "@/content/resolve";
import {
  escalationAssets,
  escalationIocs,
  escalationTimeline,
  evidenceSummaryLine,
} from "@/lib/resolve";
import { cn } from "@/lib/utils";
import type { EvidenceItem } from "@/types";

interface EscalationPanelProps {
  evidence: EvidenceItem[];
  quarantineTagged: boolean;
  packageGenerated: boolean;
  onQuarantine: () => void;
  onCopy: () => void;
  onDownload: () => void;
}

export function EscalationPanel({
  evidence,
  quarantineTagged,
  packageGenerated,
  onQuarantine,
  onCopy,
  onDownload,
}: EscalationPanelProps) {
  return (
    <section aria-labelledby="resolve-escalation" className="space-y-4">
      <div>
        <h2 id="resolve-escalation" className="text-[13px] font-medium text-text">
          {ESCALATION_COPY.title}
        </h2>
        <p className="mt-1 text-[12px] text-muted-fg">{ESCALATION_COPY.intro}</p>
        {packageGenerated ? (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-success">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            {ESCALATION_COPY.packageReady}
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="text-[12px] font-medium text-muted-fg">{ESCALATION_COPY.timelineTitle}</h3>
        <ul className="mt-1.5 space-y-1">
          {escalationTimeline().map((item) => (
            <li key={item.time} className="text-[12px] text-text">
              <span className="font-mono text-muted-fg">{item.time}</span>
              <span className="mx-1.5 text-muted-fg">:</span>
              {item.event}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-[12px] font-medium text-muted-fg">{ESCALATION_COPY.iocsTitle}</h3>
        <ul className="mt-1.5 space-y-1">
          {escalationIocs().map((ioc) => (
            <li key={`${ioc.type}-${ioc.value}`} className="text-[12px]">
              <span className="text-muted-fg">{ioc.type}</span>
              <span className="mx-1.5 font-mono text-text">{ioc.value}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-[12px] font-medium text-muted-fg">{ESCALATION_COPY.assetsTitle}</h3>
        <ul className="mt-1.5 space-y-1">
          {escalationAssets().map((asset) => (
            <li key={asset} className="font-mono text-[12px] text-text">
              {asset}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-[12px] font-medium text-muted-fg">{ESCALATION_COPY.evidenceTitle}</h3>
        {evidence.length === 0 ? (
          <p className="mt-1.5 text-[12px] text-muted-fg">None pinned.</p>
        ) : (
          <ul className="mt-1.5 space-y-1">
            {evidence.map((item) => (
              <li key={item.id} className="font-mono text-[12px] text-text">
                {evidenceSummaryLine(item)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onQuarantine}
          disabled={quarantineTagged}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px]",
            quarantineTagged
              ? "border border-border bg-surface text-success"
              : "bg-accent text-white hover:opacity-90",
          )}
        >
          {quarantineTagged ? (
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
          ) : null}
          {quarantineTagged ? ESCALATION_COPY.quarantined : ESCALATION_COPY.quarantine}
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md border border-border bg-panel px-3 py-1.5 text-[13px] text-text hover:bg-surface"
        >
          {ESCALATION_COPY.copyText}
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-md border border-border bg-panel px-3 py-1.5 text-[13px] text-text hover:bg-surface"
        >
          {ESCALATION_COPY.downloadMd}
        </button>
      </div>
    </section>
  );
}
