import decryptionRulesData from "@/data/decryption-rules.json";
import networksData from "@/data/networks.json";
import rulesData from "@/data/rules.json";
import serviceConnectionsData from "@/data/service-connections.json";
import { ALL_LOGS } from "@/lib/logs";
import { DEMO_CLOCK_ISO, formatAbsolute, type TimezoneMode } from "@/lib/time";
import type {
  DecryptionRule,
  LogRecord,
  RemoteNetwork,
  ScenarioFixes,
  SecurityRule,
  ServiceConnection,
} from "@/types";

const rules = rulesData as SecurityRule[];
const decryptionRules = decryptionRulesData as DecryptionRule[];
const networks = networksData as RemoteNetwork[];
const serviceConnections = serviceConnectionsData as ServiceConnection[];

const PUNE = networks.find((n) => n.device === "pune-fw-01") ?? networks[0];
const ALLOW_SAAS = rules.find((r) => r.name === "Allow-SaaS-Business");
const DECRYPT_ALL = decryptionRules.find((r) => r.name === "Decrypt-All-Outbound");

const NO_DECRYPT_PINNED: DecryptionRule = {
  id: "DR-FIX-A",
  name: "No-Decrypt-Pinned-SaaS",
  order: 5,
  fromZone: "trust",
  toZone: "untrust",
  source: "any",
  urlCategory: "business-and-economy",
  type: "ssl-forward-proxy",
  action: "no-decrypt",
  hitCount: 0,
  description: "Exclude certificate pinned SaaS (*.salesforce.com).",
};

function pad(label: string, width: number): string {
  return label.length >= width ? label : `${label}${" ".repeat(width - label.length)}`;
}

function formatTime(iso: string, timezone: TimezoneMode = "IST"): string {
  return formatAbsolute(iso, timezone, "yyyy/MM/dd HH:mm:ss");
}

export function formatSystemInfo(mode: "prisma" | "branch"): string {
  if (mode === "branch") {
    return [
      "hostname: pune-fw-01",
      `ip-address: ${PUNE.peerIp}`,
      `model: ${PUNE.deviceModel}`,
      "sw-version: 11.1.4-h1",
      "app-version: 8921-9120",
      "threat-version: 8921-9120",
      "url-filtering-version: 20261006.20101",
      "uptime: 42 days, 6:18:11",
      `serial: 0123PUNE44001`,
    ].join("\n");
  }
  return [
    "hostname: prisma-diag-01",
    "product: Prisma Access diagnostics",
    "tenant: acme-io",
    "region: ap-south-1",
    "sw-version: 11.1.4-cloud",
    `remote-networks: ${networks.length}`,
    `service-connections: ${serviceConnections.length}`,
  ].join("\n");
}

export function formatClock(): string {
  return formatAbsolute(DEMO_CLOCK_ISO, "IST", "EEE MMM dd HH:mm:ss yyyy");
}

export function formatSecurityPolicyMatch(params: {
  source: string;
  destination: string;
  port: string;
  protocol: string;
  application: string;
}): string {
  const rule = ALLOW_SAAS;
  if (!rule) {
    return "No matching security policy found.";
  }
  return [
    `"${rule.name}"`,
    `{`,
    `  from: ${rule.fromZone};`,
    `  source: ${params.source};`,
    `  source-region: any;`,
    `  to: ${rule.toZone};`,
    `  destination: ${params.destination};`,
    `  destination-region: any;`,
    `  user: any;`,
    `  category: any;`,
    `  application/service: ${params.application}/tcp/${params.port};`,
    `  action: ${rule.action};`,
    `  icmp-unreachable: no`,
    `  terminal: yes;`,
    `}`,
  ].join("\n");
}

export function formatDecryptionPolicyMatch(
  params: { category: string; source: string; destination: string },
  fixes: ScenarioFixes,
): string {
  const fixed = Boolean(fixes.A);
  const rule = fixed ? NO_DECRYPT_PINNED : DECRYPT_ALL;
  if (!rule) {
    return "No matching decryption policy found.";
  }
  return [
    `"${rule.name}"`,
    `{`,
    `  from: ${rule.fromZone};`,
    `  source: ${params.source};`,
    `  to: ${rule.toZone};`,
    `  destination: ${params.destination};`,
    `  category: ${params.category};`,
    `  action: ${rule.action};`,
    `  type: ${rule.type};`,
    `  terminal: yes;`,
    `}`,
  ].join("\n");
}

function sessionLines(logs: LogRecord[], limit = 12): string[] {
  const header =
    `${pad("id", 8)}${pad("src", 16)}${pad("dst", 16)}${pad("sport", 7)}${pad("dport", 7)}` +
    `${pad("proto", 6)}${pad("app", 14)}${pad("rule", 22)}${pad("action", 8)}reason`;
  const rows = logs.slice(0, limit).map((log, index) => {
    const id = String(10001 + index);
    return (
      `${pad(id, 8)}${pad(log.srcIp ?? "-", 16)}${pad(log.dstIp ?? "-", 16)}` +
      `${pad("any", 7)}${pad(String(log.dstPort ?? "-"), 7)}${pad("6", 6)}` +
      `${pad(log.app ?? "-", 14)}${pad(log.rule ?? "-", 22)}` +
      `${pad(log.action ?? "-", 8)}${log.sessionEndReason ?? "-"}`
    );
  });
  return [header, ...rows, "", `${Math.min(logs.length, limit)} of ${logs.length} sessions shown`];
}

export function formatSessions(sourceIp: string): string {
  const sessions = ALL_LOGS.filter(
    (l) => l.type === "traffic" && l.srcIp === sourceIp,
  );
  if (sessions.length === 0) {
    return `No active or recent sessions matching filter source ${sourceIp}`;
  }
  return ["--------------------------------------------------------------------------------", ...sessionLines(sessions)].join(
    "\n",
  );
}

export function formatProxyCounters(): string {
  const pinnedSessions = ALL_LOGS.filter(
    (l) =>
      l.type === "traffic" &&
      l.srcIp === "10.20.14.37" &&
      l.sessionEndReason === "decrypt-error",
  ).length;
  const decryptHits = ALL_LOGS.filter(
    (l) => l.type === "decryption" && l.srcIp === "10.20.14.37",
  ).length;
  const delta = Math.max(pinnedSessions, 1);
  return [
    "Global counters:",
    "Name                                   Value     Rate Severity",
    `proxy_flow_interest                    ${1200 + decryptHits}        0 info`,
    `proxy_decrypt_cert_pinned              ${delta}        ${Math.min(delta, 9)} drop`,
    `proxy_process_pkt_error                ${decryptHits}        0 warn`,
    `proxy_url_request                      ${800 + decryptHits}        0 info`,
  ].join("\n");
}

export function formatIkeSa(): string {
  return [
    "GwID/client IP  Peer IP          Gateway Name           Role SN       Algo          Established     Lifetime",
    `1               ${PUNE.prismaIp.padEnd(16)}gw-prisma-pune          Init 0x1a4b3c  AES256/SHA256  Oct.06 11:30:12  28800`,
    "",
    "IKE SA established (phase 1).",
  ].join("\n");
}

export function formatIpsecSa(fixes: ScenarioFixes): string {
  if (fixes.B) {
    return [
      "GwID TnID  Peer IP          Tunnel          Algo          SPI(in)  SPI(out)  LifeSec  Remain  En/Dec(bytes)",
      `1    7     ${PUNE.prismaIp.padEnd(16)}tun-prisma-pune AES256/SHA256  0xA1B2C3 0xD4E5F6  3600     3488    12840/9216`,
      "",
      "There is 1 IPsec SA.",
    ].join("\n");
  }
  return [
    `No IPsec SA found for tunnel tun-prisma-pune (peer ${PUNE.prismaIp}).`,
    "IKE SA is established. Phase 2 negotiation is failing.",
  ].join("\n");
}

export function formatTestVpnIpsec(fixes: ScenarioFixes): string {
  if (fixes.B) {
    return [
      "Start testing IPsec SA for tunnel: tun-prisma-pune",
      "Initiate IKE phase-2 negotiation for tunnel tun-prisma-pune ...",
      "IKE phase-2 negotiation is started using proxy ID.",
      "IKE phase-2 negotiation is succeeded for tunnel tun-prisma-pune.",
      "IPsec SA is created.",
    ].join("\n");
  }
  return [
    "Start testing IPsec SA for tunnel: tun-prisma-pune",
    "Initiate IKE phase-2 negotiation for tunnel tun-prisma-pune ...",
    "IKE phase-2 negotiation failed for tunnel tun-prisma-pune.",
    "Reason: NO_PROPOSAL_CHOSEN (DH group mismatch).",
  ].join("\n");
}

export function formatIkemgrLog(): string {
  const system = ALL_LOGS.filter(
    (l) =>
      l.type === "system" &&
      l.device === "pune-fw-01" &&
      (l.message?.includes("NO_PROPOSAL_CHOSEN") || l.message?.includes("IKE")),
  );
  const lines = system.slice(0, 8).map((l) => {
    const ts = formatTime(l.time);
    return `${ts} ikemgr: ${l.message ?? ""}`;
  });
  if (lines.length === 0) {
    lines.push(
      `${formatTime("2026-10-06T06:12:08.000Z")} ikemgr: IKEv2 child SA negotiation failed: NO_PROPOSAL_CHOSEN`,
    );
  }
  lines.push(
    `${formatTime("2026-10-06T06:12:08.000Z")} ikemgr: NO_PROPOSAL_CHOSEN for tun-prisma-pune: received DH group 19, configured group 14`,
  );
  return ["----- less mp-log ikemgr.log -----", ...lines, "(END)"].join("\n");
}

export function formatVpnFlow(fixes: ScenarioFixes): string {
  const state = fixes.B ? "active" : "inactive";
  const status = fixes.B ? "up" : "down";
  return [
    "tunnel  tun-prisma-pune",
    "  id:                    7",
    `  state:                 ${state}`,
    `  status:                ${status}`,
    `  local ip:              ${PUNE.peerIp}`,
    `  remote ip:             ${PUNE.prismaIp}`,
    "  inner interface:       tunnel.7",
    "  outer interface:       ethernet1/1",
    fixes.B
      ? "  encap packets:         1842"
      : "  encap packets:         0",
    fixes.B ? "  decap packets:         1760" : "  decap packets:         0",
  ].join("\n");
}

export function formatThreatLog(srcIp: string): string {
  const threats = ALL_LOGS.filter((l) => l.type === "threat" && l.srcIp === srcIp);
  if (threats.length === 0) {
    return `No threat logs for src ${srcIp}`;
  }
  const header =
    `${pad("Time", 22)}${pad("Src", 16)}${pad("Dst", 16)}${pad("App", 12)}` +
    `${pad("Action", 10)}${pad("Severity", 10)}Threat`;
  const rows = threats.slice(0, 15).map((l) => {
    return (
      `${pad(formatTime(l.time), 22)}${pad(l.srcIp ?? "-", 16)}${pad(l.dstIp ?? "-", 16)}` +
      `${pad(l.app ?? "-", 12)}${pad(l.action ?? "-", 10)}${pad(l.severity ?? "-", 10)}` +
      `${l.threatName ?? "-"}${l.url ? ` (${l.url})` : ""}`
    );
  });
  return [header, ...rows, "", `Total: ${threats.length}`].join("\n");
}

export function formatDnsProxyCache(): string {
  const domains = new Map<string, LogRecord>();
  for (const log of ALL_LOGS) {
    if (log.type !== "threat" || log.app !== "dns" || !log.url) continue;
    if (!domains.has(log.url)) domains.set(log.url, log);
  }
  if (domains.size === 0) {
    return "DNS proxy cache is empty.";
  }
  const header = `${pad("Domain", 36)}${pad("TTL", 8)}${pad("Action", 12)}Resolved`;
  const rows = [...domains.values()].slice(0, 20).map((l) => {
    const action = l.action === "sinkhole" ? "sinkhole" : (l.action ?? "allow");
    const resolved = l.action === "sinkhole" ? "sinkhole-ip" : (l.dstIp ?? "-");
    return `${pad(l.url ?? "-", 36)}${pad("60", 8)}${pad(action, 12)}${resolved}`;
  });
  return ["DNS proxy cache:", header, ...rows].join("\n");
}

export function formatRemoteNetworks(fixes: ScenarioFixes): string {
  const header =
    `${pad("Name", 24)}${pad("Device", 18)}${pad("Peer", 16)}${pad("Prisma", 16)}Status`;
  const rows = networks.map((n) => {
    let status = n.status;
    if (n.device === "pune-fw-01" && fixes.B) status = "up";
    return (
      `${pad(n.name, 24)}${pad(n.device, 18)}${pad(n.peerIp, 16)}${pad(n.prismaIp, 16)}${status}`
    );
  });
  return [header, ...rows].join("\n");
}

export function formatServiceConnections(): string {
  const header = `${pad("Name", 22)}${pad("Kind", 10)}${pad("Region", 16)}${pad("Subnet", 18)}Status`;
  const rows = serviceConnections.map(
    (s) =>
      `${pad(s.name, 22)}${pad(s.kind, 10)}${pad(s.region, 16)}${pad(s.subnet, 18)}${s.status}`,
  );
  return [header, ...rows].join("\n");
}

export { NO_DECRYPT_PINNED };
