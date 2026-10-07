import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui";
import {
  addressObjects,
  configAudit,
  logs,
  mobileUsers,
  platformAlerts,
  remoteNetworks,
  securityRules,
  serviceObjects,
  tickets,
} from "@/data";
import { selectPuneTunnelStatus, useCaseEngine } from "@/lib/case-engine";
import { formatDemoClock } from "@/lib/time";

type PlaceholderPageProps = {
  title: string;
  path: string;
  description?: string;
};

function seedSummary(path: string): { label: string; items: string[] } {
  const pune = selectPuneTunnelStatus(useCaseEngine.getState());

  if (path.startsWith("/tickets")) {
    const active = tickets.filter((t) => t.workable);
    return {
      label: `${tickets.length} tickets seeded`,
      items: active.map((t) => `${t.id} ${t.subject}`),
    };
  }
  if (path.startsWith("/logs")) {
    return {
      label: `${logs.length} log rows seeded`,
      items: [
        `traffic ${logs.filter((l) => l.type === "traffic").length}`,
        `stun drops ${logs.filter((l) => l.type === "traffic" && l.app === "stun").length}`,
        `system ${logs.filter((l) => l.type === "system").length}`,
      ],
    };
  }
  if (path.startsWith("/policies")) {
    return {
      label: `${securityRules.length} security rules`,
      items: securityRules.slice(0, 5).map((r) => `${r.position} ${r.name}`),
    };
  }
  if (path.startsWith("/objects")) {
    return {
      label: `${addressObjects.length} address objects, ${serviceObjects.length} services`,
      items: [
        ...addressObjects.slice(0, 3).map((o) => `${o.name} ${o.value}`),
        ...serviceObjects.slice(0, 2).map((o) => `${o.name} ${o.destinationPorts}`),
      ],
    };
  }
  if (path.startsWith("/remote-networks")) {
    const up = remoteNetworks.filter((r) =>
      r.id === "rn-pune-branch-01" ? pune === "up" : r.tunnelState === "up",
    ).length;
    return {
      label: `${up}/${remoteNetworks.length} remote networks up`,
      items: remoteNetworks.slice(0, 6).map((r) => {
        const state = r.id === "rn-pune-branch-01" ? pune : r.tunnelState;
        return `${r.name} ${state}`;
      }),
    };
  }
  if (path.startsWith("/mobile-users")) {
    const connected = mobileUsers.filter((u) => u.status === "connected").length;
    return {
      label: `${connected} mobile users connected`,
      items: mobileUsers.slice(0, 5).map((u) => `${u.user} ${u.gateway}`),
    };
  }
  if (path.startsWith("/config-audit")) {
    return {
      label: `${configAudit.length} config changes`,
      items: [...configAudit]
        .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
        .slice(0, 5)
        .map((c) => `${c.changeId} ${c.summary}`),
    };
  }
  if (path.startsWith("/alerts")) {
    const open = platformAlerts.filter((a) => a.clearedAt === null);
    return {
      label: `${open.length} open platform alerts`,
      items: open.slice(0, 6).map((a) => `${a.id} ${a.title}`),
    };
  }
  if (path.startsWith("/troubleshooting")) {
    return {
      label: "Troubleshooting tools (Phase 6)",
      items: [
        "Security policy match",
        "Ping",
        "Traceroute",
        "Tunnel status",
      ],
    };
  }
  if (path.startsWith("/brief")) {
    return {
      label: "Review brief (Phase 9)",
      items: [
        "Problem and persona",
        "TAC playbook",
        "How to review",
        "Credits",
      ],
    };
  }
  return {
    label: "Seeded dataset ready",
    items: [`Demo clock ${formatDemoClock("IST")}`],
  };
}

export function PlaceholderPage({
  title,
  path,
  description = "Phase placeholder. Full page arrives in a later phase.",
}: PlaceholderPageProps) {
  const [params] = useSearchParams();
  const filterEntries = [...params.entries()];
  useCaseEngine((s) => s.tickets);
  const summary = seedSummary(path);

  return (
    <div className="h-full overflow-auto px-6 py-6 text-text" data-testid={`page-${title.toLowerCase().replaceAll(" ", "-")}`}>
      <div className="mx-auto flex max-w-3xl flex-col gap-5 rounded-[var(--radius-panel)] border border-border bg-surface-1 p-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-text-muted">Triage Console</p>
          <h1 className="text-xl font-medium tracking-tight">{title}</h1>
          <p className="font-mono text-sm text-accent">{path}</p>
        </div>
        <p className="text-base text-text-muted">{description}</p>

        {filterEntries.length > 0 ? (
          <div
            className="rounded-[var(--radius-control)] border border-border bg-surface-2 p-3"
            data-testid="active-filters"
          >
            <p className="text-sm text-text">Filters applied</p>
            <ul className="mt-2 space-y-1 font-mono text-sm text-text-muted">
              {filterEntries.map(([key, value]) => (
                <li key={`${key}-${value}`}>
                  {key}={value}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div data-testid="seeded-summary">
          <p className="text-sm text-text">{summary.label}</p>
          <ul className="mt-2 space-y-1 text-sm text-text-muted">
            {summary.items.map((item) => (
              <li key={item} className="truncate">
                {item}
              </li>
            ))}
          </ul>
        </div>

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
    </div>
  );
}
