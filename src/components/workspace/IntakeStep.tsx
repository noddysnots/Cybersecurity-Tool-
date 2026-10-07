import { useState } from "react";

import { PriorityBadge } from "@/components/tickets/PriorityBadge";
import { Button } from "@/components/ui";
import { getConversation } from "@/content/conversations";
import { workspaceCopy } from "@/content/workspace";
import type { TicketCaseState } from "@/lib/case-engine";
import { hasAcknowledged } from "@/lib/playbook";
import { productLabel, statusLabel } from "@/lib/tickets-view";
import { computeSla } from "@/lib/home-metrics";
import type { Ticket } from "@/types";
import { formatAbsolute } from "@/lib/time";

type IntakeStepProps = {
  ticket: Ticket;
  state: TicketCaseState;
  onAcknowledge: (body: string) => void;
};

export function IntakeStep({ ticket, state, onAcknowledge }: IntakeStepProps) {
  const script = getConversation(state.caseKey);
  const acknowledged = hasAcknowledged(state);
  const [body, setBody] = useState(script.events.acknowledge);
  const sla = computeSla(ticket);

  const affected =
    ticket.product === "mobile-users"
      ? "Google Meet / Mobile Users"
      : "Pune-Branch-01 / Remote Networks";

  return (
    <div className="space-y-4 p-4" data-testid="step-intake">
      <div>
        <h2 className="text-base font-medium text-text">{workspaceCopy.intakeTitle}</h2>
        <p className="mt-1 text-sm text-text-muted">{workspaceCopy.intakeSummary}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-[var(--radius-panel)] border border-border bg-surface-1 p-3 text-sm">
        <div className="col-span-2">
          <dt className="text-xs text-text-faint">Subject</dt>
          <dd className="text-text">{ticket.subject}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-faint">Ticket</dt>
          <dd className="font-mono text-accent">{ticket.id}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-faint">Priority</dt>
          <dd>
            <PriorityBadge priority={ticket.priority} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-faint">{workspaceCopy.customerLabel}</dt>
          <dd className="text-text">
            {ticket.customer}
            <span className="mt-0.5 block text-xs text-text-muted">
              {ticket.contactName} · {ticket.contactTitle}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-faint">{workspaceCopy.productLabel}</dt>
          <dd className="text-text">{productLabel(ticket.product)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-faint">{workspaceCopy.slaLeft}</dt>
          <dd className="font-mono text-text">
            {sla.breached ? sla.label : `${sla.label} ${workspaceCopy.slaLeftSuffix}`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-faint">Status</dt>
          <dd className="capitalize text-text">{statusLabel(state.status)}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-faint">{workspaceCopy.intakeLinkedAlert}</dt>
          <dd className="font-mono text-text">
            {ticket.linkedAlertId ?? workspaceCopy.intakeNoAlert}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-text-faint">{workspaceCopy.intakeAffected}</dt>
          <dd className="text-text">{affected}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-text-faint">Opened</dt>
          <dd className="font-mono text-text">
            {formatAbsolute(new Date(ticket.openedAt), "IST")}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-text-faint">Customer message</dt>
          <dd className="mt-1 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-2 text-text">
            {script.intake}
          </dd>
        </div>
      </dl>

      {acknowledged ? (
        <p className="text-sm text-signal" data-testid="intake-complete">
          {workspaceCopy.intakeAlready}
        </p>
      ) : (
        <div className="space-y-2 rounded-[var(--radius-panel)] border border-border bg-surface-1 p-3">
          <p className="text-sm text-text-muted">{workspaceCopy.intakeAckHint}</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            data-testid="intake-ack-input"
            className="w-full resize-none rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-2 text-sm text-text"
          />
          <Button
            type="button"
            data-testid="intake-acknowledge"
            disabled={!body.trim()}
            title={!body.trim() ? "Enter a first response first" : undefined}
            onClick={() => onAcknowledge(body)}
          >
            {workspaceCopy.intakeAcknowledge}
          </Button>
        </div>
      )}
    </div>
  );
}
