import { beforeEach, describe, expect, it } from "vitest";

import {
  closestCommand,
  completeCommand,
  findCommand,
  runCommand,
  runPolicyMatch,
  CASE_1_POLICY_DEFAULTS,
} from "@/lib/console";
import { useCaseEngine } from "@/lib/case-engine";

function ctx() {
  return { mode: "branch" as const, tickets: useCaseEngine.getState().tickets };
}

describe("console command registry", () => {
  beforeEach(() => {
    useCaseEngine.getState().resetDemo();
  });

  it("parses Case 2 VPN commands in branch mode", () => {
    expect(findCommand("branch", "show vpn ike-sa gateway gw-prisma-pune")?.command.id).toBe(
      "show-vpn-ike-sa",
    );
    expect(findCommand("branch", "show vpn ipsec-sa tunnel tun-prisma-pune")?.command.id).toBe(
      "show-vpn-ipsec-sa",
    );
    expect(findCommand("branch", "test vpn ipsec-sa tunnel tun-prisma-pune")?.command.id).toBe(
      "test-vpn-ipsec-sa",
    );
    expect(findCommand("branch", "less mp-log ikemgr.log")?.command.id).toBe("less-ikemgr");
    expect(findCommand("branch", "show config diff")?.command.id).toBe("show-config-diff");
    expect(findCommand("branch", "show vpn flow tunnel-id 7")?.command.id).toBe("show-vpn-flow");
  });

  it("parses general commands in both modes", () => {
    for (const mode of ["prisma", "branch"] as const) {
      expect(findCommand(mode, "show system info")?.command.id).toBe("show-system-info");
      expect(findCommand(mode, "show clock")?.command.id).toBe("show-clock");
      expect(findCommand(mode, "show interface all")?.command.id).toBe("show-interface-all");
      expect(findCommand(mode, "ping host 8.8.8.8")?.command.id).toBe("ping-host");
      expect(findCommand(mode, "help")?.command.id).toBe("help");
      expect(findCommand(mode, "?")?.command.id).toBe("question");
    }
  });

  it("suggests closest match for typos", () => {
    const suggestion = closestCommand("branch", "show vpn ipsec-sa tunel tun-prisma-pune");
    expect(suggestion).toContain("ipsec-sa");
  });

  it("tab-completes command prefixes", () => {
    expect(completeCommand("branch", "show vpn ike")).toContain("ike-sa");
    expect(completeCommand("prisma", "show sys")).toBe("show system info");
  });

  it("Case 2 before fix: IKE up, IPsec missing, ikemgr shows DH mismatch", () => {
    const ike = runCommand("branch", "show vpn ike-sa gateway gw-prisma-pune", ctx());
    expect(ike.ok).toBe(true);
    expect(ike.output).toContain("IKE SA established");
    expect(ike.output).toContain("gw-prisma-pune");

    const ipsec = runCommand("branch", "show vpn ipsec-sa tunnel tun-prisma-pune", ctx());
    expect(ipsec.ok).toBe(true);
    expect(ipsec.output).toContain("There is no IPSec SA found");

    const test = runCommand("branch", "test vpn ipsec-sa tunnel tun-prisma-pune", ctx());
    expect(test.ok).toBe(true);
    expect(test.output).toContain("NO_PROPOSAL_CHOSEN");

    const log = runCommand("branch", "less mp-log ikemgr.log", ctx());
    expect(log.ok).toBe(true);
    expect(log.output).toContain("NO_PROPOSAL_CHOSEN");
    expect(log.output).toMatch(/group 19/i);
    expect(log.output).toMatch(/group 14/i);

    const diff = runCommand("branch", "show config diff", ctx());
    expect(diff.ok).toBe(true);
    expect(diff.output).toContain("group14");
    expect(diff.output).toContain("group19");

    const flow = runCommand("branch", "show vpn flow tunnel-id 7", ctx());
    expect(flow.ok).toBe(true);
    expect(flow.output).toContain("inactive");
  });

  it("Case 2 after fix: IPsec SA present and test succeeds", () => {
    const engine = useCaseEngine.getState();
    engine.requestApproval("TKT-24823");
    engine.receiveApproval("TKT-24823");
    engine.applyFix("TKT-24823");

    const next = ctx();
    const ipsec = runCommand("branch", "show vpn ipsec-sa tunnel tun-prisma-pune", next);
    expect(ipsec.output).toContain("tun-prisma-pune");
    expect(ipsec.output).toContain("active");

    const test = runCommand("branch", "test vpn ipsec-sa tunnel tun-prisma-pune", next);
    expect(test.output).toContain("successfully");

    const log = runCommand("branch", "less mp-log ikemgr.log", next);
    expect(log.output).toContain("CREATE_CHILD_SA completed");
    expect(log.output).not.toContain("NO_PROPOSAL_CHOSEN");
  });

  it("Case 1 policy match is Block-QUIC deny before fix and Allow after", () => {
    const before = runPolicyMatch(ctx(), CASE_1_POLICY_DEFAULTS);
    expect(before.rule).toBe("Block-QUIC");
    expect(before.action).toBe("deny");

    const cli = runCommand(
      "prisma",
      "test security-policy-match from GP-Mobile to Untrust source 10.20.31.44 destination 74.125.250.69 protocol 17 destination-port 19305",
      { mode: "prisma", tickets: useCaseEngine.getState().tickets },
    );
    expect(cli.ok).toBe(true);
    expect(cli.output).toContain("Block-QUIC");
    expect(cli.output).toContain("drop");

    const engine = useCaseEngine.getState();
    engine.requestApproval("TKT-24817");
    engine.receiveApproval("TKT-24817");
    engine.applyFix("TKT-24817");

    const after = runPolicyMatch(
      { tickets: useCaseEngine.getState().tickets },
      CASE_1_POLICY_DEFAULTS,
    );
    expect(after.rule).toBe("Allow-Collab-Apps");
    expect(after.action).toBe("allow");
  });
});
