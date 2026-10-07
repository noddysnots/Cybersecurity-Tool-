import type { ConsoleMode, ScenarioFixes } from "@/types";
import {
  formatClock,
  formatDecryptionPolicyMatch,
  formatDnsProxyCache,
  formatIkeSa,
  formatIkemgrLog,
  formatIpsecSa,
  formatProxyCounters,
  formatRemoteNetworks,
  formatSecurityPolicyMatch,
  formatServiceConnections,
  formatSessions,
  formatSystemInfo,
  formatTestVpnIpsec,
  formatThreatLog,
  formatVpnFlow,
} from "./outputs";

export type { ConsoleMode };

export interface CommandContext {
  mode: ConsoleMode;
  scenarioFixes: ScenarioFixes;
}

export interface ConsoleCommand {
  id: string;
  /** Canonical invocation for help, history, and tab completion. */
  invocation: string;
  mode: ConsoleMode;
  help: string;
  match: (normalized: string) => RegExpMatchArray | null;
  run: (match: RegExpMatchArray, ctx: CommandContext) => string;
}

export type RunCommandResult =
  | { ok: true; command: ConsoleCommand; output: string; clear?: boolean }
  | { ok: false; message: string; suggestion: string | null };

function norm(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

function re(source: string): RegExp {
  return new RegExp(`^${source}$`, "i");
}

function matchExact(invocation: string): (normalized: string) => RegExpMatchArray | null {
  const expected = norm(invocation);
  return (normalized) => {
    if (normalized !== expected) return null;
    return [normalized] as unknown as RegExpMatchArray;
  };
}

function matchRe(pattern: RegExp): (normalized: string) => RegExpMatchArray | null {
  return (normalized) => normalized.match(pattern);
}

const IP = String.raw`(\d{1,3}(?:\.\d{1,3}){3})`;

function helpText(mode: ConsoleMode): string {
  const lines = [
    `Available commands (${mode === "branch" ? "branch firewall CLI" : "Prisma diagnostics"}):`,
    "",
    ...commandsForMode(mode).map((c) => `  ${c.invocation}`),
    "",
    "Tab completes. Up and Down cycle history. Type help or ? to list commands.",
  ];
  return lines.join("\n");
}

const BRANCH_COMMANDS: ConsoleCommand[] = [
  {
    id: "help",
    invocation: "help",
    mode: "branch",
    help: "List available commands for this mode.",
    match: (n) => (n === "help" || n === "?" ? ([n] as unknown as RegExpMatchArray) : null),
    run: (_m, ctx) => helpText(ctx.mode),
  },
  {
    id: "show-system-info",
    invocation: "show system info",
    mode: "branch",
    help: "Show device hostname, model, and software versions.",
    match: matchExact("show system info"),
    run: () => formatSystemInfo("branch"),
  },
  {
    id: "show-clock",
    invocation: "show clock",
    mode: "branch",
    help: "Show the demo clock time on this device.",
    match: matchExact("show clock"),
    run: () => formatClock(),
  },
  {
    id: "clear",
    invocation: "clear",
    mode: "branch",
    help: "Clear the console output pane.",
    match: matchExact("clear"),
    run: () => "",
  },
  {
    id: "test-security-policy-match",
    invocation:
      "test security-policy-match from trust to untrust source 10.20.14.37 destination 13.110.54.20 destination-port 443 protocol 6 application ssl",
    mode: "branch",
    help: "Test which security rule matches a flow (Scenario A).",
    match: matchRe(
      re(
        String.raw`test security-policy-match from trust to untrust source ${IP} destination ${IP} destination-port (\d+) protocol (\d+) application (\S+)`,
      ),
    ),
    run: (m) =>
      formatSecurityPolicyMatch({
        source: m[1],
        destination: m[2],
        port: m[3],
        protocol: m[4],
        application: m[5],
      }),
  },
  {
    id: "test-decryption-policy-match",
    invocation:
      "test decryption-policy-match category business-and-economy from trust to untrust source 10.20.14.37 destination 13.110.54.20",
    mode: "branch",
    help: "Test which decryption rule matches a flow (Scenario A).",
    match: matchRe(
      re(
        String.raw`test decryption-policy-match category ([\w-]+) from trust to untrust source ${IP} destination ${IP}`,
      ),
    ),
    run: (m, ctx) =>
      formatDecryptionPolicyMatch(
        { category: m[1], source: m[2], destination: m[3] },
        ctx.scenarioFixes,
      ),
  },
  {
    id: "show-session-filter",
    invocation: "show session all filter source 10.20.14.37",
    mode: "branch",
    help: "List sessions for a source IP (Scenarios A and C).",
    match: matchRe(re(String.raw`show session all filter source ${IP}`)),
    run: (m) => formatSessions(m[1]),
  },
  {
    id: "show-counter-proxy",
    invocation: "show counter global filter delta yes | match proxy",
    mode: "branch",
    help: "Show proxy related global counters (Scenario A).",
    match: matchExact("show counter global filter delta yes | match proxy"),
    run: () => formatProxyCounters(),
  },
  {
    id: "show-vpn-ike-sa",
    invocation: "show vpn ike-sa gateway gw-prisma-pune",
    mode: "branch",
    help: "Show IKE SA for the Pune Prisma gateway (Scenario B).",
    match: matchExact("show vpn ike-sa gateway gw-prisma-pune"),
    run: () => formatIkeSa(),
  },
  {
    id: "show-vpn-ipsec-sa",
    invocation: "show vpn ipsec-sa tunnel tun-prisma-pune",
    mode: "branch",
    help: "Show IPsec SA for the Pune tunnel (Scenario B).",
    match: matchExact("show vpn ipsec-sa tunnel tun-prisma-pune"),
    run: (_m, ctx) => formatIpsecSa(ctx.scenarioFixes),
  },
  {
    id: "test-vpn-ipsec-sa",
    invocation: "test vpn ipsec-sa tunnel tun-prisma-pune",
    mode: "branch",
    help: "Test IPsec SA negotiation for the Pune tunnel (Scenario B).",
    match: matchExact("test vpn ipsec-sa tunnel tun-prisma-pune"),
    run: (_m, ctx) => formatTestVpnIpsec(ctx.scenarioFixes),
  },
  {
    id: "less-ikemgr",
    invocation: "less mp-log ikemgr.log",
    mode: "branch",
    help: "Read IKE manager log (Scenario B).",
    match: matchExact("less mp-log ikemgr.log"),
    run: () => formatIkemgrLog(),
  },
  {
    id: "show-vpn-flow",
    invocation: "show vpn flow tunnel-id 7",
    mode: "branch",
    help: "Show VPN flow state for tunnel id 7 (Scenario B).",
    match: matchExact("show vpn flow tunnel-id 7"),
    run: (_m, ctx) => formatVpnFlow(ctx.scenarioFixes),
  },
  {
    id: "show-log-threat",
    invocation: "show log threat src 10.40.2.15",
    mode: "branch",
    help: "Show threat logs for a source IP (Scenario C).",
    match: matchRe(re(String.raw`show log threat src ${IP}`)),
    run: (m) => formatThreatLog(m[1]),
  },
  {
    id: "show-dns-proxy-cache",
    invocation: "show dns-proxy cache",
    mode: "branch",
    help: "Show DNS proxy cache entries (Scenario C).",
    match: matchExact("show dns-proxy cache"),
    run: () => formatDnsProxyCache(),
  },
];

const PRISMA_COMMANDS: ConsoleCommand[] = [
  {
    id: "prisma-help",
    invocation: "help",
    mode: "prisma",
    help: "List available commands for this mode.",
    match: (n) => (n === "help" || n === "?" ? ([n] as unknown as RegExpMatchArray) : null),
    run: (_m, ctx) => helpText(ctx.mode),
  },
  {
    id: "prisma-show-system-info",
    invocation: "show system info",
    mode: "prisma",
    help: "Show Prisma diagnostics tenant and version info.",
    match: matchExact("show system info"),
    run: () => formatSystemInfo("prisma"),
  },
  {
    id: "prisma-show-clock",
    invocation: "show clock",
    mode: "prisma",
    help: "Show the demo clock time.",
    match: matchExact("show clock"),
    run: () => formatClock(),
  },
  {
    id: "prisma-clear",
    invocation: "clear",
    mode: "prisma",
    help: "Clear the console output pane.",
    match: matchExact("clear"),
    run: () => "",
  },
  {
    id: "show-remote-network",
    invocation: "show remote-network all",
    mode: "prisma",
    help: "List remote network tunnel status from the Prisma side.",
    match: matchExact("show remote-network all"),
    run: (_m, ctx) => formatRemoteNetworks(ctx.scenarioFixes),
  },
  {
    id: "show-service-connection",
    invocation: "show service-connection all",
    mode: "prisma",
    help: "List service connection status.",
    match: matchExact("show service-connection all"),
    run: () => formatServiceConnections(),
  },
];

export const COMMANDS: readonly ConsoleCommand[] = [...BRANCH_COMMANDS, ...PRISMA_COMMANDS];

export function commandsForMode(mode: ConsoleMode): ConsoleCommand[] {
  return COMMANDS.filter((c) => c.mode === mode);
}

/** Levenshtein distance for closest command suggestions. */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function closestInvocation(input: string, mode: ConsoleMode): string | null {
  const normalized = norm(input);
  if (!normalized) return null;
  let best: string | null = null;
  let bestDist = Infinity;
  for (const cmd of commandsForMode(mode)) {
    const candidate = norm(cmd.invocation);
    const dist = editDistance(normalized, candidate);
    if (dist < bestDist) {
      bestDist = dist;
      best = cmd.invocation;
    }
    // Prefer prefix overlap for partial mistypes of long commands.
    if (candidate.startsWith(normalized) || normalized.startsWith(candidate.slice(0, 12))) {
      const prefixBonus = Math.min(dist, Math.abs(candidate.length - normalized.length));
      if (prefixBonus < bestDist) {
        bestDist = prefixBonus;
        best = cmd.invocation;
      }
    }
  }
  // Only suggest when reasonably close.
  const threshold = Math.max(8, Math.floor(normalized.length * 0.45));
  if (bestDist > threshold) return null;
  return best;
}

export function runCommand(input: string, ctx: CommandContext): RunCommandResult {
  const normalized = norm(input);
  if (!normalized) {
    return { ok: false, message: "Empty command.", suggestion: null };
  }

  for (const command of commandsForMode(ctx.mode)) {
    const matched = command.match(normalized);
    if (!matched) continue;
    const output = command.run(matched, ctx);
    if (command.id === "clear" || command.id === "prisma-clear") {
      return { ok: true, command, output: "", clear: true };
    }
    return { ok: true, command, output };
  }

  const suggestion = closestInvocation(normalized, ctx.mode);
  const message = suggestion
    ? `Unknown command. Did you mean: ${suggestion}`
    : "Unknown command. Type help to list commands for this mode.";
  return { ok: false, message, suggestion };
}

/** Completions that share a prefix with the current input (case insensitive). */
export function completeCommand(input: string, mode: ConsoleMode): string[] {
  const normalized = norm(input);
  if (!normalized) {
    return commandsForMode(mode).map((c) => c.invocation);
  }
  const matches = commandsForMode(mode)
    .map((c) => c.invocation)
    .filter((inv) => norm(inv).startsWith(normalized));
  return [...new Set(matches)];
}

/** Longest shared prefix among completions (for Tab). */
export function sharedPrefix(values: string[]): string {
  if (values.length === 0) return "";
  let prefix = values[0];
  for (let i = 1; i < values.length; i += 1) {
    const value = values[i];
    let j = 0;
    while (j < prefix.length && j < value.length && prefix[j].toLowerCase() === value[j].toLowerCase()) {
      j += 1;
    }
    prefix = prefix.slice(0, j);
  }
  return prefix;
}
