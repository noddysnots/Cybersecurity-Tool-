import {
  selectMeetRuleMatch,
  selectPuneTunnelStatus,
  type CaseEngineState,
} from "@/lib/case-engine";
import { formatDemoClock } from "@/lib/time";
import { remoteNetworks } from "@/data";
import { kv, table } from "@/lib/console/format";

export type PolicyMatchInput = {
  fromZone: string;
  toZone: string;
  source: string;
  destination: string;
  protocol: string;
  destinationPort: string;
  application: string;
  sourceUser: string;
  container: "Mobile Users" | "Remote Networks";
};

export const CASE_1_POLICY_DEFAULTS: PolicyMatchInput = {
  fromZone: "GP-Mobile",
  toZone: "Untrust",
  source: "10.20.31.44",
  destination: "74.125.250.69",
  protocol: "udp",
  destinationPort: "19305",
  application: "any",
  sourceUser: "ankit.verma@acme.io",
  container: "Mobile Users",
};

export const CASE_2_POLICY_DEFAULTS: PolicyMatchInput = {
  fromZone: "Trust",
  toZone: "Untrust",
  source: "10.60.10.25",
  destination: "8.8.8.8",
  protocol: "icmp",
  destinationPort: "any",
  application: "ping",
  sourceUser: "any",
  container: "Remote Networks",
};

export type PolicyMatchResult = {
  matched: boolean;
  rule: string;
  action: "allow" | "drop" | "deny";
  container: string;
  summary: string;
  detail: string;
};

/** Security policy match driven by case engine (Case 1 Meet media path). */
export function runPolicyMatch(
  state: Pick<CaseEngineState, "tickets">,
  input: PolicyMatchInput,
): PolicyMatchResult {
  const isMeetMedia =
    input.container === "Mobile Users" &&
    (input.destination.startsWith("74.125.250.") || input.destination === "74.125.250.69") &&
    (input.destinationPort === "19305" ||
      input.destinationPort.startsWith("1930") ||
      input.protocol === "udp");

  if (isMeetMedia) {
    const match = selectMeetRuleMatch(state, "mobile-user");
    const action = match.action === "drop" ? "deny" : "allow";
    const detail = [
      `Matched rule: ${match.rule}`,
      `Container:     ${match.container}`,
      `Action:        ${action}`,
      `From:          ${input.fromZone}`,
      `To:            ${input.toZone}`,
      `Source:        ${input.source}`,
      `Destination:   ${input.destination}`,
      `Protocol:      ${input.protocol}`,
      `Dest port:     ${input.destinationPort}`,
      `Application:   ${input.application}`,
      `Source user:   ${input.sourceUser}`,
    ].join("\n");
    return {
      matched: true,
      rule: match.rule,
      action,
      container: match.container,
      summary: `${match.rule} (${action})`,
      detail,
    };
  }

  if (input.container === "Remote Networks") {
    const match = selectMeetRuleMatch(state, "remote-network");
    const action = match.action === "drop" ? "deny" : "allow";
    return {
      matched: true,
      rule: match.rule,
      action,
      container: match.container,
      summary: `${match.rule} (${action})`,
      detail: [
        `Matched rule: ${match.rule}`,
        `Container:     ${match.container}`,
        `Action:        ${action}`,
        `From:          ${input.fromZone}`,
        `To:            ${input.toZone}`,
        `Source:        ${input.source}`,
        `Destination:   ${input.destination}`,
      ].join("\n"),
    };
  }

  return {
    matched: true,
    rule: "Allow-Collab-Apps",
    action: "allow",
    container: input.container,
    summary: "Allow-Collab-Apps (allow)",
    detail: `Matched rule: Allow-Collab-Apps\nAction:        allow\nContainer:     ${input.container}`,
  };
}

export type PingResult = {
  host: string;
  ok: boolean;
  output: string;
};

export function runPing(host: string): PingResult {
  const target = host.trim() || "8.8.8.8";
  const lines = [
    `PING ${target} (${target}) 56(84) bytes of data.`,
    `64 bytes from ${target}: icmp_seq=1 ttl=117 time=12.4 ms`,
    `64 bytes from ${target}: icmp_seq=2 ttl=117 time=11.9 ms`,
    `64 bytes from ${target}: icmp_seq=3 ttl=117 time=12.1 ms`,
    `64 bytes from ${target}: icmp_seq=4 ttl=117 time=12.0 ms`,
    "",
    `--- ${target} ping statistics ---`,
    "4 packets transmitted, 4 received, 0% packet loss, time 3003ms",
    "rtt min/avg/max/mdev = 11.9/12.1/12.4/0.2 ms",
  ];
  return { host: target, ok: true, output: lines.join("\n") };
}

export type TracerouteResult = {
  host: string;
  output: string;
};

export function runTraceroute(host: string): TracerouteResult {
  const target = host.trim() || "8.8.8.8";
  const lines = [
    `traceroute to ${target} (${target}), 30 hops max, 60 byte packets`,
    ` 1  10.60.0.1 (10.60.0.1)  1.204 ms  1.112 ms  1.088 ms`,
    ` 2  203.0.113.1 (203.0.113.1)  4.331 ms  4.210 ms  4.155 ms`,
    ` 3  * * *`,
    ` 4  ${target} (${target})  12.044 ms  11.982 ms  12.101 ms`,
  ];
  return { host: target, output: lines.join("\n") };
}

export type TunnelStatusResult = {
  name: string;
  ike: "up" | "down";
  ipsec: "up" | "down";
  state: "up" | "down";
  output: string;
};

/** Prisma-side + branch view of Pune tunnel status from case engine. */
export function runTunnelStatus(
  state: Pick<CaseEngineState, "tickets">,
): TunnelStatusResult {
  const pune = remoteNetworks.find((r) => r.id === "rn-pune-branch-01");
  const fixed = selectPuneTunnelStatus(state) === "up";
  const name = pune?.name ?? "Pune-Branch-01";
  const ike: "up" | "down" = "up";
  const ipsec: "up" | "down" = fixed ? "up" : "down";
  const stateLabel: "up" | "down" = fixed ? "up" : "down";

  const output = kv([
    ["Remote network", name],
    ["Peer IP", pune?.peerIp ?? "203.0.113.10"],
    ["Location", pune?.location ?? "India West"],
    ["IKE gateway", pune?.ikeGateway ?? "gw-prisma-pune"],
    ["IPsec tunnel", pune?.ipsecTunnel ?? "tun-prisma-pune"],
    ["IKE SA", ike === "up" ? "Established" : "Down"],
    ["IPsec SA", ipsec === "up" ? "Active" : "Missing (NO_PROPOSAL_CHOSEN)"],
    ["Tunnel state", stateLabel],
    ["Last change", "6 Oct 2026, 11:42:08 IST"],
    ["Demo clock", formatDemoClock("IST")],
  ]);

  return { name, ike, ipsec, state: stateLabel, output };
}

export function formatPolicyMatchCli(result: PolicyMatchResult): string {
  if (!result.matched) {
    return "No rule matched.";
  }
  const action = result.action === "deny" || result.action === "drop" ? "drop" : "allow";
  return [
    `"${result.rule}" {`,
    `        from any;`,
    `        source any;`,
    `        destination any;`,
    `        application any;`,
    `        service any;`,
    `        action ${action};`,
    `        category any;`,
    `}`,
    "",
    `Matched rule in container ${result.container}`,
  ].join("\n");
}

export function formatInterfaces(): string {
  return table(
    ["name", "id", "vsys", "zone", "ip", "state"],
    [
      ["ethernet1/1", "16", "vsys1", "Untrust", "203.0.113.10/29", "up"],
      ["ethernet1/2", "17", "vsys1", "Trust", "10.60.0.1/16", "up"],
      ["tunnel.7", "256", "vsys1", "vpn", "N/A", "up"],
      ["ha1", "5", "", "", "N/A", "up"],
      ["ha2", "6", "", "", "N/A", "up"],
      ["management", "4", "", "", "10.60.255.10/24", "up"],
    ],
    [14, 4, 6, 10, 18, 6],
  );
}
