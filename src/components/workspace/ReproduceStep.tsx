import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui";
import { LogExplorer } from "@/components/logs";
import { logsCopy } from "@/content/logs";
import type { CaseTicketId, TicketCaseState } from "@/lib/case-engine";
import { DEMO_NOW } from "@/lib/time";
import type { Evidence, TrafficLogRecord } from "@/types";

type ReproduceStepProps = {
  ticketId: CaseTicketId;
  state: TicketCaseState;
  onAskRetry: (body: string) => void;
  onPin: (evidence: Omit<Evidence, "ticketId" | "pinnedAt">) => void;
};

type PcapRow = {
  time: string;
  src: string;
  dst: string;
  proto: string;
  info: string;
};

const CASE_1_RETRY =
  "Ankit, please retry joining the Meet call now. I am watching traffic logs live.";
const CASE_2_RETRY =
  "Rohit, please have a user at Pune retry cloud access now. I am watching system and tunnel logs live.";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function buildLiveDrops(count: number): TrafficLogRecord[] {
  // Place just before demo now so rows stay inside the default 24h window.
  const base = DEMO_NOW.getTime() - count * 1000;
  return Array.from({ length: count }, (_, i) => ({
    id: `log-traffic-live-ankit-${i + 1}`,
    receiveTime: new Date(base + (i + 1) * 1000).toISOString(),
    type: "traffic" as const,
    deviceName: "prisma-mu-india-west",
    location: "India West",
    container: "Mobile Users",
    srcIp: "10.20.31.44",
    dstIp: "74.125.250.69",
    srcZone: "GP-Mobile",
    dstZone: "Untrust",
    srcUser: "ankit.verma@acme.io",
    srcPort: 53000 + i,
    dstPort: 19305,
    protocol: "udp" as const,
    app: "stun",
    rule: "Block-QUIC",
    action: "drop" as const,
    sessionEndReason: "policy-deny",
    bytes: 240,
    packets: 2,
    bytesSent: 240,
    bytesReceived: 0,
    inboundIf: "gp.tunnel",
    outboundIf: "ethernet1/1",
  }));
}

function pcapForCase(caseKey: TicketCaseState["caseKey"]): PcapRow[] {
  if (caseKey === "meet-quic") {
    return [
      {
        time: "12:05:01 IST",
        src: "10.20.31.44",
        dst: "74.125.250.69",
        proto: "UDP",
        info: "STUN Binding Request (no response)",
      },
      {
        time: "12:05:02 IST",
        src: "10.20.31.44",
        dst: "74.125.250.69",
        proto: "UDP",
        info: "STUN Binding Request (no response)",
      },
      {
        time: "12:05:03 IST",
        src: "10.20.31.44",
        dst: "74.125.250.69",
        proto: "UDP",
        info: "STUN Binding Request retransmit (no response)",
      },
    ];
  }
  return [
    {
      time: "12:05:01 IST",
      src: "203.0.113.10",
      dst: "Prisma",
      proto: "IKEv2",
      info: "IKE_SA_INIT (Phase 1 up)",
    },
    {
      time: "12:05:02 IST",
      src: "203.0.113.10",
      dst: "Prisma",
      proto: "IKEv2",
      info: "CREATE_CHILD_SA request DH group 19",
    },
    {
      time: "12:05:02 IST",
      src: "Prisma",
      dst: "203.0.113.10",
      proto: "IKEv2",
      info: "NO_PROPOSAL_CHOSEN (configured group 14)",
    },
  ];
}

export function ReproduceStep({
  ticketId,
  state,
  onAskRetry,
  onPin,
}: ReproduceStepProps) {
  const [live, setLive] = useState(false);
  const [liveCount, setLiveCount] = useState(0);
  const [pcapOpen, setPcapOpen] = useState(false);
  const pcapPinned = state.pinnedEvidence.some((e) => e.refId === `pcap-${ticketId}`);

  useEffect(() => {
    if (!state.reproduceStarted) return;
    setLive(true);
    setLiveCount(0);
    const reduced = prefersReducedMotion();
    const gaps = reduced ? [50, 100, 150] : [400, 2000, 4000];
    const timers = gaps.map((ms, idx) =>
      globalThis.setTimeout(() => setLiveCount(idx + 1), ms),
    );
    const stop = globalThis.setTimeout(() => setLive(false), reduced ? 800 : 10000);
    return () => {
      timers.forEach((t) => globalThis.clearTimeout(t));
      globalThis.clearTimeout(stop);
    };
  }, [state.reproduceStarted]);

  const extraRows = useMemo(() => {
    if (state.caseKey !== "meet-quic" || liveCount === 0) return [];
    return buildLiveDrops(liveCount);
  }, [state.caseKey, liveCount]);

  const askBody =
    state.caseKey === "meet-quic" ? CASE_1_RETRY : CASE_2_RETRY;
  const pcapRows = pcapForCase(state.caseKey);

  return (
    <div className="flex min-h-0 flex-col gap-4 p-4" data-testid="step-reproduce">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-text">{logsCopy.reproduceTitle}</h2>
          <p className="mt-1 text-sm text-text-muted">{logsCopy.reproduceHint}</p>
        </div>
        <Button
          type="button"
          size="sm"
          data-testid="reproduce-ask-retry"
          disabled={state.reproduceStarted}
          title={state.reproduceStarted ? logsCopy.reproduceAsked : undefined}
          onClick={() => onAskRetry(askBody)}
        >
          {state.reproduceStarted ? logsCopy.reproduceAsked : logsCopy.reproduceAsk}
        </Button>
      </div>

      <div data-testid="reproduce-stream">
        <p className="mb-2 text-sm font-medium text-text">{logsCopy.reproduceStreamTitle}</p>
        <LogExplorer
          testId={`reproduce-explorer-${ticketId}`}
          initialQuery={
            state.caseKey === "meet-quic"
              ? "( user.src eq ankit.verma@acme.io ) and ( action eq drop )"
              : "( type eq system )"
          }
          initialType={state.caseKey === "meet-quic" ? "traffic" : "system"}
          extraRows={extraRows}
          live={live}
          onPin={onPin}
        />
      </div>

      <div
        className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-3"
        data-testid="reproduce-pcap"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-text">{logsCopy.reproducePcapTitle}</h3>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              data-testid="reproduce-start-pcap"
              disabled={pcapOpen}
              title={pcapOpen ? logsCopy.reproducePcapRunning : undefined}
              onClick={() => setPcapOpen(true)}
            >
              {pcapOpen ? logsCopy.reproducePcapRunning : logsCopy.reproduceStartPcap}
            </Button>
            <Button
              type="button"
              size="sm"
              data-testid="reproduce-pin-pcap"
              disabled={!pcapOpen || pcapPinned}
              title={
                !pcapOpen
                  ? "Start packet capture first"
                  : pcapPinned
                    ? logsCopy.reproducePinned
                    : undefined
              }
              onClick={() =>
                onPin({
                  id: `ev-pcap-${ticketId}`,
                  source: "tool",
                  label:
                    state.caseKey === "meet-quic"
                      ? "Packet capture: STUN requests with no responses"
                      : "Packet capture: IKE NO_PROPOSAL_CHOSEN",
                  refId: `pcap-${ticketId}`,
                  note: "Reproduce step capture",
                })
              }
            >
              {pcapPinned ? logsCopy.reproducePinned : logsCopy.reproducePin}
            </Button>
          </div>
        </div>
        {pcapOpen ? (
          <table className="mt-3 w-full text-left text-xs" data-testid="pcap-table">
            <thead className="text-text-muted">
              <tr>
                <th className="py-1 pr-2 font-medium">Time</th>
                <th className="py-1 pr-2 font-medium">Src</th>
                <th className="py-1 pr-2 font-medium">Dst</th>
                <th className="py-1 pr-2 font-medium">Proto</th>
                <th className="py-1 font-medium">Info</th>
              </tr>
            </thead>
            <tbody className="font-mono text-text">
              {pcapRows.map((row) => (
                <tr key={`${row.time}-${row.info}`} className="border-t border-border/60">
                  <td className="py-1 pr-2">{row.time}</td>
                  <td className="py-1 pr-2">{row.src}</td>
                  <td className="py-1 pr-2">{row.dst}</td>
                  <td className="py-1 pr-2">{row.proto}</td>
                  <td className="py-1">{row.info}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-2 text-xs text-text-faint">{logsCopy.reproduceContinueHint}</p>
        )}
      </div>
    </div>
  );
}
