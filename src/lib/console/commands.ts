import { remoteNetworks } from "@/data";
import {
  selectMeetRuleMatch,
  selectPuneTunnelStatus,
} from "@/lib/case-engine";
import { formatDemoClock } from "@/lib/time";
import { kv, table } from "@/lib/console/format";
import {
  CASE_1_POLICY_DEFAULTS,
  formatInterfaces,
  formatPolicyMatchCli,
  runPing,
  runPolicyMatch,
  runTunnelStatus,
} from "@/lib/console/tools";
import type { ConsoleCommand, ConsoleContext } from "@/lib/console/types";

function puneFixed(ctx: ConsoleContext): boolean {
  return selectPuneTunnelStatus(ctx) === "up";
}

function punePeer(): string {
  return remoteNetworks.find((r) => r.id === "rn-pune-branch-01")?.peerIp ?? "203.0.113.10";
}

function prismaPeer(): string {
  return "198.51.100.20";
}

function showSystemInfo(ctx: ConsoleContext): string {
  if (ctx.mode === "branch") {
    return kv([
      ["hostname", "pune-fw-01"],
      ["ip-address", punePeer()],
      ["netmask", "255.255.255.248"],
      ["default-gateway", "203.0.113.1"],
      ["ipv6-address", "unknown"],
      ["mac-address", "00:1b:17:00:01:44"],
      ["time", formatDemoClock("IST")],
      ["uptime", "45 days, 6:12:33"],
      ["family", "400"],
      ["model", "PA-440"],
      ["serial", "012345678901"],
      ["sw-version", "11.1.4-h1"],
      ["app-version", "8924-9120"],
      ["av-version", "4890-5412"],
      ["threat-version", "8924-9120"],
      ["wildfire-version", "8924-9120"],
      ["url-filtering-version", "20261006.20400"],
      ["logdb-version", "11.1.4"],
      ["platform-family", "400"],
      ["vpn-disable-mode", "off"],
      ["multi-vsys", "off"],
      ["operational-mode", "normal"],
    ]);
  }
  return kv([
    ["hostname", "prisma-access-india-west"],
    ["product", "Prisma Access"],
    ["tenant", "Acme Corp"],
    ["locations", "India West, India South"],
    ["time", formatDemoClock("IST")],
    ["mu-gateway", "gp-india-west-01"],
    ["rn-status", `Pune-Branch-01 ${selectPuneTunnelStatus(ctx)}`],
    ["sw-version", "Prisma Access 5.2"],
  ]);
}

function showClock(): string {
  return [
    formatDemoClock("IST"),
    formatDemoClock("UTC"),
  ].join("\n");
}

function showIkeSa(ctx: ConsoleContext, gateway: string): string {
  const gw = gateway.trim() || "gw-prisma-pune";
  if (gw !== "gw-prisma-pune") {
    return `Server error :  IKE SA for gateway ${gw} not found`;
  }
  // Phase 1 stays up even when IPsec is down (Case 2 root cause).
  return [
    table(
      ["GwID", "Peer-Address", "Gateway Name", "Role", "Algorithm", "Established"],
      [
        [
          "1",
          prismaPeer(),
          "gw-prisma-pune",
          "Init",
          "IKEv2/PSK/AES256/SHA256/DH14",
          "Oct.06 11:30:02",
        ],
      ],
      [6, 16, 16, 6, 30, 16],
    ),
    "",
    "IKE SA established (Phase 1 up).",
    puneFixed(ctx)
      ? "Child SA negotiations succeeding."
      : "Child SA negotiations failing. See ikemgr.log.",
  ].join("\n");
}

function showIpsecSa(ctx: ConsoleContext, tunnel: string): string {
  const name = tunnel.trim() || "tun-prisma-pune";
  if (name !== "tun-prisma-pune") {
    return `There is no IPSec SA found for tunnel ${name}`;
  }
  if (!puneFixed(ctx)) {
    return "There is no IPSec SA found for tunnel tun-prisma-pune";
  }
  return table(
    ["id", "name", "gwid", "local-ip", "remote-ip", "state", "bytes"],
    [
      [
        "7",
        "tun-prisma-pune",
        "1",
        punePeer(),
        prismaPeer(),
        "active",
        "1284096",
      ],
    ],
    [4, 18, 6, 16, 16, 8, 10],
  );
}

function testIpsecSa(ctx: ConsoleContext, tunnel: string): string {
  const name = tunnel.trim() || "tun-prisma-pune";
  if (name !== "tun-prisma-pune") {
    return `Failed to initiate IPsec SA for tunnel ${name}`;
  }
  if (!puneFixed(ctx)) {
    return [
      "Failed to initiate IPsec SA for tunnel tun-prisma-pune",
      "Reason: NO_PROPOSAL_CHOSEN",
      "Detail: peer expects PFS DH group14; local profile ipsec-prisma uses group19",
    ].join("\n");
  }
  return [
    "Initiate IPsec SA for tunnel tun-prisma-pune successfully.",
    "IPsec SA established. Tunnel id 7 is active.",
  ].join("\n");
}

function lessIkemgr(ctx: ConsoleContext): string {
  if (puneFixed(ctx)) {
    return [
      "2026-10-06 12:04:58 [INFO] IKEv2: CREATE_CHILD_SA completed for gw-prisma-pune",
      "2026-10-06 12:04:58 [INFO] IPsec SA installed tunnel tun-prisma-pune id 7 (DH group14)",
      "2026-10-06 12:05:00 [INFO] ikemgr: child SA lifetime rekey scheduled",
    ].join("\n");
  }
  return [
    "2026-10-06 11:42:08 [ERROR] IKEv2 child SA negotiation failed: NO_PROPOSAL_CHOSEN",
    "2026-10-06 11:42:08 [ERROR]   peer 198.51.100.20 proposed DH group 14",
    "2026-10-06 11:42:08 [ERROR]   local profile ipsec-prisma configured DH group 19",
    "2026-10-06 11:42:08 [ERROR]   received DH group 19 from local; peer expects group 14",
    "2026-10-06 11:42:38 [ERROR] IKEv2 child SA negotiation failed: NO_PROPOSAL_CHOSEN",
    "2026-10-06 11:43:08 [ERROR] IKEv2 child SA negotiation failed: NO_PROPOSAL_CHOSEN",
    "2026-10-06 11:43:38 [ERROR] IKEv2 child SA negotiation failed: NO_PROPOSAL_CHOSEN",
  ].join("\n");
}

function showConfigDiff(ctx: ConsoleContext): string {
  if (puneFixed(ctx)) {
    return "No pending local config differences (running-config matches candidate after commit).";
  }
  return [
    "--- running-config vs previous commit (CHG-4471)",
    "@@ network/ike/crypto-profiles/ipsec-crypto-profiles/ipsec-prisma @@",
    "- set network ike crypto-profiles ipsec-crypto-profiles ipsec-prisma dh-group group14",
    "+ set network ike crypto-profiles ipsec-crypto-profiles ipsec-prisma dh-group group19",
    "",
    "Admin: netops.admin  Time: 6 Oct 2026, 11:36:12 IST",
  ].join("\n");
}

function showVpnFlow(ctx: ConsoleContext, tunnelId: string): string {
  const id = tunnelId.trim() || "7";
  if (id !== "7") {
    return `tunnel id ${id} not found`;
  }
  const active = puneFixed(ctx);
  return kv([
    ["name", "tun-prisma-pune"],
    ["id", "7"],
    ["type", "IPSec"],
    ["gateway", "gw-prisma-pune"],
    ["local ip", punePeer()],
    ["peer ip", prismaPeer()],
    ["inner interface", "tunnel.7"],
    ["state", active ? "active" : "inactive"],
    ["SPI(s)", active ? "0xA1B2C3D4 / 0xD4C3B2A1" : "n/a"],
    ["encap", "ESP / AES256 / SHA256"],
    ["PFS DH group", active ? "group14" : "mismatch (local group19)"],
  ]);
}

function testSecurityPolicyMatch(ctx: ConsoleContext, args: string): string {
  const defaults = CASE_1_POLICY_DEFAULTS;
  const src = /source\s+(\S+)/i.exec(args)?.[1] ?? defaults.source;
  const dst = /destination\s+(\S+)/i.exec(args)?.[1] ?? defaults.destination;
  const protoRaw = /protocol\s+(\S+)/i.exec(args)?.[1] ?? "17";
  const dport = /destination-port\s+(\S+)/i.exec(args)?.[1] ?? defaults.destinationPort;
  const fromZone = /from\s+(\S+)/i.exec(args)?.[1] ?? defaults.fromZone;
  const toZone = /to\s+(\S+)/i.exec(args)?.[1] ?? defaults.toZone;
  const protocol =
    protoRaw === "17" || protoRaw.toLowerCase() === "udp"
      ? "udp"
      : protoRaw === "6" || protoRaw.toLowerCase() === "tcp"
        ? "tcp"
        : protoRaw;

  const result = runPolicyMatch(ctx, {
    ...defaults,
    fromZone,
    toZone,
    source: src,
    destination: dst,
    protocol,
    destinationPort: dport,
  });
  return formatPolicyMatchCli(result);
}

function showRemoteNetworkStatus(ctx: ConsoleContext): string {
  const status = runTunnelStatus(ctx);
  const match = selectMeetRuleMatch(ctx, "mobile-user");
  return [
    status.output,
    "",
    `Mobile Users Meet media rule (reference): ${match.rule} / ${match.action}`,
  ].join("\n");
}

function helpForMode(mode: ConsoleContext["mode"], commands: ConsoleCommand[]): string {
  const list = commands
    .filter((c) => c.modes.includes(mode) && c.id !== "help" && c.id !== "question")
    .map((c) => `  ${c.usage.padEnd(56)} ${c.help}`)
    .join("\n");
  const title =
    mode === "branch"
      ? "Branch firewall CLI commands (pune-fw-01)"
      : "Prisma diagnostics commands";
  return `${title}\n\n${list}\n\nType ? or help for this list. Tab completes. Up/Down recalls history.`;
}

/** All registered commands. Handlers read case engine state via context. */
export function buildCommands(): ConsoleCommand[] {
  const commands: ConsoleCommand[] = [
    {
      id: "help",
      usage: "help",
      help: "List commands for the current mode",
      modes: ["prisma", "branch"],
      pattern: /^help\s*$/i,
      handler: (_args, ctx) => helpForMode(ctx.mode, commands),
    },
    {
      id: "question",
      usage: "?",
      help: "List commands for the current mode",
      modes: ["prisma", "branch"],
      pattern: /^\?\s*$/,
      handler: (_args, ctx) => helpForMode(ctx.mode, commands),
    },
    {
      id: "show-system-info",
      usage: "show system info",
      help: "Device or tenant system information",
      modes: ["prisma", "branch"],
      pattern: /^show\s+system\s+info\s*$/i,
      handler: (_args, ctx) => showSystemInfo(ctx),
    },
    {
      id: "show-clock",
      usage: "show clock",
      help: "Demo clock in IST and UTC",
      modes: ["prisma", "branch"],
      pattern: /^show\s+clock\s*$/i,
      handler: () => showClock(),
    },
    {
      id: "show-interface-all",
      usage: "show interface all",
      help: "Interface table with zones and state",
      modes: ["prisma", "branch"],
      pattern: /^show\s+interface\s+all\s*$/i,
      handler: () => formatInterfaces(),
    },
    {
      id: "ping-host",
      usage: "ping host 8.8.8.8",
      help: "ICMP echo to a host (ISP path)",
      modes: ["prisma", "branch"],
      pattern: /^ping\s+host\s+(\S+)\s*$/i,
      handler: (args) => runPing(args).output,
    },
    {
      id: "show-vpn-ike-sa",
      usage: "show vpn ike-sa gateway gw-prisma-pune",
      help: "IKE SA for the Prisma gateway (Phase 1)",
      modes: ["branch"],
      pattern: /^show\s+vpn\s+ike-sa\s+gateway\s+(\S+)\s*$/i,
      handler: (args, ctx) => showIkeSa(ctx, args),
    },
    {
      id: "show-vpn-ipsec-sa",
      usage: "show vpn ipsec-sa tunnel tun-prisma-pune",
      help: "IPsec SA for the Prisma tunnel (Phase 2)",
      modes: ["branch"],
      pattern: /^show\s+vpn\s+ipsec-sa\s+tunnel\s+(\S+)\s*$/i,
      handler: (args, ctx) => showIpsecSa(ctx, args),
    },
    {
      id: "test-vpn-ipsec-sa",
      usage: "test vpn ipsec-sa tunnel tun-prisma-pune",
      help: "Initiate IPsec SA negotiation for the tunnel",
      modes: ["branch"],
      pattern: /^test\s+vpn\s+ipsec-sa\s+tunnel\s+(\S+)\s*$/i,
      handler: (args, ctx) => testIpsecSa(ctx, args),
    },
    {
      id: "less-ikemgr",
      usage: "less mp-log ikemgr.log",
      help: "IKE manager log (DH mismatch evidence)",
      modes: ["branch"],
      pattern: /^less\s+mp-log\s+ikemgr\.log\s*$/i,
      handler: (_args, ctx) => lessIkemgr(ctx),
    },
    {
      id: "show-config-diff",
      usage: "show config diff",
      help: "Local config diff (CHG-4471 dh-group)",
      modes: ["branch"],
      pattern: /^show\s+config\s+diff\s*$/i,
      handler: (_args, ctx) => showConfigDiff(ctx),
    },
    {
      id: "show-vpn-flow",
      usage: "show vpn flow tunnel-id 7",
      help: "IPsec flow details for tunnel id 7",
      modes: ["branch"],
      pattern: /^show\s+vpn\s+flow\s+tunnel-id\s+(\S+)\s*$/i,
      handler: (args, ctx) => showVpnFlow(ctx, args),
    },
    {
      id: "test-security-policy-match",
      usage:
        "test security-policy-match from GP-Mobile to Untrust source 10.20.31.44 destination 74.125.250.69 protocol 17 destination-port 19305",
      help: "Security policy match for Meet media (Case 1)",
      modes: ["prisma"],
      pattern: /^test\s+security-policy-match(?:\s+(.*))?$/i,
      handler: (args, ctx) => testSecurityPolicyMatch(ctx, args),
    },
    {
      id: "show-remote-network-status",
      usage: "show remote-network status",
      help: "Prisma-side remote network / tunnel status",
      modes: ["prisma"],
      pattern: /^show\s+remote-network\s+status\s*$/i,
      handler: (_args, ctx) => showRemoteNetworkStatus(ctx),
    },
  ];
  return commands;
}

export const CONSOLE_COMMANDS = buildCommands();

export const CASE_2_SUGGESTED_COMMANDS = [
  "show vpn ike-sa gateway gw-prisma-pune",
  "show vpn ipsec-sa tunnel tun-prisma-pune",
  "test vpn ipsec-sa tunnel tun-prisma-pune",
  "less mp-log ikemgr.log",
  "show config diff",
  "show vpn flow tunnel-id 7",
] as const;
