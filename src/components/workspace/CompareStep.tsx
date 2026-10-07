import { Button } from "@/components/ui";
import { logsCopy } from "@/content/logs";
import { logs, remoteNetworks } from "@/data";
import { getEvidenceScope } from "@/lib/case-scope";
import type { CaseTicketId, TicketCaseState } from "@/lib/case-engine";
import { selectPuneTunnelStatus, useCaseEngine } from "@/lib/case-engine";
import { isTraffic, trafficCompareDiff } from "@/lib/log-explorer";
import { formatAbsolute } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { Evidence, TrafficLogRecord } from "@/types";

type CompareStepProps = {
  ticketId: CaseTicketId;
  state: TicketCaseState;
  onPin: (evidence: Omit<Evidence, "ticketId" | "pinnedAt">) => void;
  onContinue: () => void;
};

function pickUserTraffic(user: string, preferId?: string): TrafficLogRecord | undefined {
  if (preferId) {
    const needle = logs.find((l) => l.id === preferId);
    if (needle && isTraffic(needle)) return needle;
  }
  return logs.find(
    (l): l is TrafficLogRecord => isTraffic(l) && l.srcUser === user,
  );
}

export function CompareStep({ ticketId, state, onPin, onContinue }: CompareStepProps) {
  const scope = getEvidenceScope(state.caseKey);
  const puneState = useCaseEngine((s) => selectPuneTunnelStatus(s));
  const alreadyPinned = state.pinnedEvidence.some((e) => e.refId === `compare-${ticketId}`);

  if (scope.compareMode === "users") {
    const failing = pickUserTraffic(scope.failingLabel, "log-traffic-ankit-100214");
    const working = pickUserTraffic(scope.workingLabel, "log-traffic-sana-100540");
    const diff = trafficCompareDiff(failing, working);

    return (
      <div className="space-y-4 p-4" data-testid="step-isolate">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-medium text-text">{logsCopy.compareTitle}</h2>
            <p className="mt-1 text-sm text-text-muted">{logsCopy.compareHint}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              data-testid="compare-pin"
              disabled={alreadyPinned}
              title={alreadyPinned ? logsCopy.comparePinned : undefined}
              onClick={() => {
                onPin({
                  id: `ev-compare-${ticketId}`,
                  source: "traffic",
                  label: `Compare ${scope.failingLabel} vs ${scope.workingLabel}: rule and container differ`,
                  refId: `compare-${ticketId}`,
                  note: "Same destination, different rule and container",
                });
              }}
            >
              {alreadyPinned ? logsCopy.comparePinned : logsCopy.comparePin}
            </Button>
            <Button
              type="button"
              size="sm"
              data-testid="compare-continue"
              disabled={!state.compareComplete && !alreadyPinned}
              title={
                !state.compareComplete && !alreadyPinned
                  ? "Pin the comparison first"
                  : undefined
              }
              onClick={onContinue}
            >
              {logsCopy.compareContinue}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <CompareCard
            title={`${logsCopy.compareFailing}: ${scope.failingLabel}`}
            row={failing}
            testId="compare-failing"
          />
          <CompareCard
            title={`${logsCopy.compareWorking}: ${scope.workingLabel}`}
            row={working}
            testId="compare-working"
          />
        </div>

        <DiffTable rows={diff} />
      </div>
    );
  }

  const pune = remoteNetworks.find((r) => r.name === "Pune-Branch-01");
  const mumbai =
    remoteNetworks.find((r) => r.name === "Mumbai-Branch-02") ??
    remoteNetworks.find((r) => r.id === "rn-mumbai-hq-01");

  const branchDiff = [
    {
      field: "Tunnel state",
      failing: pune ? (pune.id === "rn-pune-branch-01" ? puneState : pune.tunnelState) : "",
      working: mumbai?.tunnelState ?? "up",
      different: true,
    },
    {
      field: "Peer IP",
      failing: pune?.peerIp ?? "",
      working: mumbai?.peerIp ?? "",
      different: (pune?.peerIp ?? "") !== (mumbai?.peerIp ?? ""),
    },
    {
      field: "Subnet",
      failing: pune?.subnet ?? "",
      working: mumbai?.subnet ?? "",
      different: (pune?.subnet ?? "") !== (mumbai?.subnet ?? ""),
    },
    {
      field: "IKE gateway",
      failing: pune?.ikeGateway ?? "",
      working: mumbai?.ikeGateway ?? "",
      different: (pune?.ikeGateway ?? "") !== (mumbai?.ikeGateway ?? ""),
    },
    {
      field: "IPsec tunnel",
      failing: pune?.ipsecTunnel ?? "",
      working: mumbai?.ipsecTunnel ?? "",
      different: (pune?.ipsecTunnel ?? "") !== (mumbai?.ipsecTunnel ?? ""),
    },
    {
      field: "Uptime 30d",
      failing: pune ? String(pune.tunnelUptimePct30d) : "",
      working: mumbai ? String(mumbai.tunnelUptimePct30d) : "",
      different: pune?.tunnelUptimePct30d !== mumbai?.tunnelUptimePct30d,
    },
  ];

  return (
    <div className="space-y-4 p-4" data-testid="step-isolate">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-text">{logsCopy.compareTitle}</h2>
          <p className="mt-1 text-sm text-text-muted">{logsCopy.compareHint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            data-testid="compare-pin"
            disabled={alreadyPinned}
            onClick={() => {
              onPin({
                id: `ev-compare-${ticketId}`,
                source: "network",
                label: "Compare Pune-Branch-01 vs Mumbai-Branch-02 tunnel state",
                refId: `compare-${ticketId}`,
                note: "Pune down, Mumbai-Branch-02 up",
              });
            }}
          >
            {alreadyPinned ? logsCopy.comparePinned : logsCopy.comparePin}
          </Button>
          <Button
            type="button"
            size="sm"
            data-testid="compare-continue"
            disabled={!state.compareComplete && !alreadyPinned}
            title={
              !state.compareComplete && !alreadyPinned
                ? "Pin the comparison first"
                : undefined
            }
            onClick={onContinue}
          >
            {logsCopy.compareContinue}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <BranchCard
          title={`${logsCopy.compareFailing}: Pune-Branch-01`}
          name="Pune-Branch-01"
          state={puneState}
          peerIp={pune?.peerIp ?? ""}
          subnet={pune?.subnet ?? ""}
          testId="compare-failing"
        />
        <BranchCard
          title={`${logsCopy.compareWorking}: Mumbai-Branch-02`}
          name="Mumbai-Branch-02"
          state={mumbai?.tunnelState ?? "up"}
          peerIp={mumbai?.peerIp ?? ""}
          subnet={mumbai?.subnet ?? ""}
          testId="compare-working"
        />
      </div>

      <DiffTable rows={branchDiff} />
    </div>
  );
}

function CompareCard({
  title,
  row,
  testId,
}: {
  title: string;
  row: TrafficLogRecord | undefined;
  testId: string;
}) {
  return (
    <div
      className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-3"
      data-testid={testId}
    >
      <h3 className="text-sm font-medium text-text">{title}</h3>
      {!row ? (
        <p className="mt-2 text-xs text-text-faint">No matching traffic row.</p>
      ) : (
        <dl className="mt-2 space-y-1 font-mono text-xs text-text">
          <div>time {formatAbsolute(new Date(row.receiveTime), "IST")}</div>
          <div>src {row.srcIp}</div>
          <div>dst {row.dstIp}</div>
          <div>zone {row.srcZone}</div>
          <div>container {row.container}</div>
          <div>rule {row.rule}</div>
          <div>app {row.app}</div>
          <div>port {row.dstPort}</div>
          <div>action {row.action}</div>
          <div>bytes {row.bytes}</div>
        </dl>
      )}
    </div>
  );
}

function BranchCard({
  title,
  name,
  state,
  peerIp,
  subnet,
  testId,
}: {
  title: string;
  name: string;
  state: string;
  peerIp: string;
  subnet: string;
  testId: string;
}) {
  return (
    <div
      className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-3"
      data-testid={testId}
    >
      <h3 className="text-sm font-medium text-text">{title}</h3>
      <dl className="mt-2 space-y-1 font-mono text-xs text-text">
        <div>{name}</div>
        <div>
          tunnel{" "}
          <span className={state === "down" ? "text-danger" : "text-signal"}>{state}</span>
        </div>
        <div>peer {peerIp}</div>
        <div>subnet {subnet}</div>
      </dl>
    </div>
  );
}

function DiffTable({
  rows,
}: {
  rows: Array<{ field: string; failing: string; working: string; different: boolean }>;
}) {
  return (
    <div
      className="overflow-hidden rounded-[var(--radius-panel)] border border-border"
      data-testid="compare-diff"
    >
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-2 text-xs text-text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">{logsCopy.compareDiffTitle}</th>
            <th className="px-3 py-2 font-medium">{logsCopy.compareFailing}</th>
            <th className="px-3 py-2 font-medium">{logsCopy.compareWorking}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.field}
              data-testid={`compare-diff-${row.field.toLowerCase().replaceAll(" ", "-")}`}
              data-different={row.different ? "true" : "false"}
              className={cn(
                "border-t border-border",
                row.different && "bg-[color-mix(in_srgb,var(--warn)_14%,transparent)]",
              )}
            >
              <td className="px-3 py-2 text-text-muted">{row.field}</td>
              <td className="px-3 py-2 font-mono text-xs text-text">{row.failing}</td>
              <td className="px-3 py-2 font-mono text-xs text-text">{row.working}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
