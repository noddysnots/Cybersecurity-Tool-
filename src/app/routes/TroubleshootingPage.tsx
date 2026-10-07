import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui";
import { toolsCopy } from "@/content/console";
import {
  CASE_1_POLICY_DEFAULTS,
  CASE_2_POLICY_DEFAULTS,
  runPing,
  runPolicyMatch,
  runTraceroute,
  runTunnelStatus,
  type PolicyMatchInput,
  type PolicyMatchResult,
} from "@/lib/console";
import { useCaseEngine } from "@/lib/case-engine";
import { formatDemoClock } from "@/lib/time";
import { cn } from "@/lib/utils";

type ToolId = "policy" | "ping" | "traceroute" | "tunnel";

const TOOLS: { id: ToolId; label: string }[] = [
  { id: "policy", label: toolsCopy.policyTitle },
  { id: "ping", label: toolsCopy.pingTitle },
  { id: "traceroute", label: toolsCopy.tracerouteTitle },
  { id: "tunnel", label: toolsCopy.tunnelTitle },
];

export function TroubleshootingPage() {
  const tickets = useCaseEngine((s) => s.tickets);
  const [active, setActive] = useState<ToolId>("policy");
  const [preset, setPreset] = useState<"case1" | "case2">("case1");
  const [policyForm, setPolicyForm] = useState<PolicyMatchInput>(CASE_1_POLICY_DEFAULTS);
  const [policyResult, setPolicyResult] = useState<PolicyMatchResult | null>(null);
  const [pingHost, setPingHost] = useState("8.8.8.8");
  const [pingOut, setPingOut] = useState<string | null>(null);
  const [traceHost, setTraceHost] = useState("8.8.8.8");
  const [traceOut, setTraceOut] = useState<string | null>(null);
  const [tunnelOut, setTunnelOut] = useState<string | null>(null);

  const engineSlice = useMemo(() => ({ tickets }), [tickets]);

  function applyPreset(next: "case1" | "case2") {
    setPreset(next);
    setPolicyForm(next === "case1" ? CASE_1_POLICY_DEFAULTS : CASE_2_POLICY_DEFAULTS);
    setPolicyResult(null);
  }

  function updateField<K extends keyof PolicyMatchInput>(key: K, value: PolicyMatchInput[K]) {
    setPolicyForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div
      className="h-full overflow-auto px-6 py-6 text-text"
      data-testid="page-troubleshooting"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <header>
          <h1 className="text-xl font-medium tracking-tight">{toolsCopy.title}</h1>
          <p className="mt-1 text-sm text-text-muted">{toolsCopy.subtitle}</p>
          <p className="mt-2 font-mono text-xs text-text-faint">
            Demo clock: {formatDemoClock("IST")}
          </p>
        </header>

        <div
          className="flex flex-wrap gap-1 rounded-[var(--radius-panel)] border border-border bg-surface-1 p-1"
          role="tablist"
          aria-label="Troubleshooting tools"
        >
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              role="tab"
              aria-selected={active === tool.id}
              data-testid={`tools-tab-${tool.id}`}
              className={cn(
                "rounded-[var(--radius-control)] px-3 py-2 text-sm",
                active === tool.id
                  ? "bg-surface-3 text-text"
                  : "text-text-muted hover:text-text",
              )}
              onClick={() => setActive(tool.id)}
            >
              {tool.label}
            </button>
          ))}
        </div>

        <section
          className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-5"
          data-testid={`tools-panel-${active}`}
        >
          {active === "policy" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-medium text-text">{toolsCopy.policyTitle}</h2>
                <p className="mt-1 text-sm text-text-muted">{toolsCopy.policyHint}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={preset === "case1" ? "default" : "secondary"}
                  data-testid="tools-preset-case1"
                  onClick={() => applyPreset("case1")}
                >
                  Case 1 Meet media
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={preset === "case2" ? "default" : "secondary"}
                  data-testid="tools-preset-case2"
                  onClick={() => applyPreset("case2")}
                >
                  Case 2 branch egress
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["fromZone", "From zone"],
                    ["toZone", "To zone"],
                    ["source", "Source"],
                    ["destination", "Destination"],
                    ["protocol", "Protocol"],
                    ["destinationPort", "Destination port"],
                    ["application", "Application"],
                    ["sourceUser", "Source user"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="block text-xs text-text-muted">
                    {label}
                    <input
                      className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-bg px-2 py-1.5 font-mono text-sm text-text"
                      value={policyForm[key]}
                      onChange={(e) => updateField(key, e.target.value)}
                      data-testid={`tools-policy-${key}`}
                    />
                  </label>
                ))}
                <label className="block text-xs text-text-muted">
                  Container
                  <select
                    className="mt-1 w-full rounded-[var(--radius-control)] border border-border bg-bg px-2 py-1.5 font-mono text-sm text-text"
                    value={policyForm.container}
                    onChange={(e) =>
                      updateField(
                        "container",
                        e.target.value as PolicyMatchInput["container"],
                      )
                    }
                    data-testid="tools-policy-container"
                  >
                    <option value="Mobile Users">Mobile Users</option>
                    <option value="Remote Networks">Remote Networks</option>
                  </select>
                </label>
              </div>
              <Button
                type="button"
                data-testid="tools-policy-run"
                onClick={() => setPolicyResult(runPolicyMatch(engineSlice, policyForm))}
              >
                {toolsCopy.policyRun}
              </Button>
              {policyResult ? (
                <pre
                  className="overflow-auto rounded-[var(--radius-control)] border border-border bg-bg p-3 font-mono text-xs text-text"
                  data-testid="tools-policy-result"
                >
                  {policyResult.detail}
                </pre>
              ) : (
                <p className="text-sm text-text-faint">{toolsCopy.resultEmpty}</p>
              )}
            </div>
          ) : null}

          {active === "ping" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-medium text-text">{toolsCopy.pingTitle}</h2>
                <p className="mt-1 text-sm text-text-muted">{toolsCopy.pingHint}</p>
              </div>
              <label className="block text-xs text-text-muted">
                {toolsCopy.pingHost}
                <input
                  className="mt-1 w-full max-w-sm rounded-[var(--radius-control)] border border-border bg-bg px-2 py-1.5 font-mono text-sm text-text"
                  value={pingHost}
                  onChange={(e) => setPingHost(e.target.value)}
                  data-testid="tools-ping-host"
                />
              </label>
              <Button
                type="button"
                data-testid="tools-ping-run"
                onClick={() => setPingOut(runPing(pingHost).output)}
              >
                {toolsCopy.pingRun}
              </Button>
              {pingOut ? (
                <pre
                  className="overflow-auto rounded-[var(--radius-control)] border border-border bg-bg p-3 font-mono text-xs text-text"
                  data-testid="tools-ping-result"
                >
                  {pingOut}
                </pre>
              ) : (
                <p className="text-sm text-text-faint">{toolsCopy.resultEmpty}</p>
              )}
            </div>
          ) : null}

          {active === "traceroute" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-medium text-text">{toolsCopy.tracerouteTitle}</h2>
                <p className="mt-1 text-sm text-text-muted">{toolsCopy.tracerouteHint}</p>
              </div>
              <label className="block text-xs text-text-muted">
                {toolsCopy.pingHost}
                <input
                  className="mt-1 w-full max-w-sm rounded-[var(--radius-control)] border border-border bg-bg px-2 py-1.5 font-mono text-sm text-text"
                  value={traceHost}
                  onChange={(e) => setTraceHost(e.target.value)}
                  data-testid="tools-traceroute-host"
                />
              </label>
              <Button
                type="button"
                data-testid="tools-traceroute-run"
                onClick={() => setTraceOut(runTraceroute(traceHost).output)}
              >
                {toolsCopy.tracerouteRun}
              </Button>
              {traceOut ? (
                <pre
                  className="overflow-auto rounded-[var(--radius-control)] border border-border bg-bg p-3 font-mono text-xs text-text"
                  data-testid="tools-traceroute-result"
                >
                  {traceOut}
                </pre>
              ) : (
                <p className="text-sm text-text-faint">{toolsCopy.resultEmpty}</p>
              )}
            </div>
          ) : null}

          {active === "tunnel" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-medium text-text">{toolsCopy.tunnelTitle}</h2>
                <p className="mt-1 text-sm text-text-muted">{toolsCopy.tunnelHint}</p>
              </div>
              <Button
                type="button"
                data-testid="tools-tunnel-run"
                onClick={() => setTunnelOut(runTunnelStatus(engineSlice).output)}
              >
                {toolsCopy.tunnelRun}
              </Button>
              {tunnelOut ? (
                <pre
                  className="overflow-auto rounded-[var(--radius-control)] border border-border bg-bg p-3 font-mono text-xs text-text"
                  data-testid="tools-tunnel-result"
                >
                  {tunnelOut}
                </pre>
              ) : (
                <p className="text-sm text-text-faint">{toolsCopy.resultEmpty}</p>
              )}
            </div>
          ) : null}
        </section>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link to="/home">{toolsCopy.backHome}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/tickets">{toolsCopy.backTickets}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
