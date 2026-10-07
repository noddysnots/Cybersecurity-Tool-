import { beforeEach, describe, expect, it } from "vitest";
import {
  closestInvocation,
  completeCommand,
  runCommand,
  sharedPrefix,
  type CommandContext,
} from "@/lib/console/commands";
import { DEFAULT_STATE, useAppStore } from "@/lib/store";

function ctx(
  mode: CommandContext["mode"] = "branch",
  scenarioFixes: CommandContext["scenarioFixes"] = {},
): CommandContext {
  return { mode, scenarioFixes };
}

describe("console command parser", () => {
  it("runs general branch commands", () => {
    const info = runCommand("show system info", ctx("branch"));
    expect(info.ok).toBe(true);
    if (info.ok) {
      expect(info.output).toContain("hostname: pune-fw-01");
      expect(info.output).toContain("PA-440");
    }

    const clock = runCommand("show clock", ctx("branch"));
    expect(clock.ok).toBe(true);
    if (clock.ok) {
      expect(clock.output).toMatch(/2026/);
      expect(clock.output).toMatch(/IST/);
    }

    const help = runCommand("help", ctx("branch"));
    expect(help.ok).toBe(true);
    if (help.ok) {
      expect(help.output).toContain("test decryption-policy-match");
      expect(help.output).toContain("show vpn ike-sa");
    }

    const q = runCommand("?", ctx("branch"));
    expect(q.ok).toBe(true);
  });

  it("lists prisma mode commands separately", () => {
    const help = runCommand("help", ctx("prisma"));
    expect(help.ok).toBe(true);
    if (help.ok) {
      expect(help.output).toContain("show remote-network all");
      expect(help.output).not.toContain("test vpn ipsec-sa");
    }
  });

  it("clears via the clear command", () => {
    const result = runCommand("clear", ctx("branch"));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.clear).toBe(true);
  });

  it("suggests the closest match for unknown commands", () => {
    const result = runCommand("show sistem info", ctx("branch"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Unknown command");
      expect(result.suggestion).toBe("show system info");
    }
  });

  it("completes command prefixes with Tab helpers", () => {
    expect(completeCommand("show cl", "branch")).toEqual(["show clock"]);
    expect(completeCommand("show vpn", "branch").length).toBeGreaterThan(1);
    expect(sharedPrefix(["show vpn ike-sa", "show vpn ipsec-sa", "show vpn flow"])).toBe(
      "show vpn ",
    );
    expect(closestInvocation("show sistem info", "branch")).toBe("show system info");
  });
});

describe("scenario A console commands", () => {
  const security =
    "test security-policy-match from trust to untrust source 10.20.14.37 destination 13.110.54.20 destination-port 443 protocol 6 application ssl";
  const decrypt =
    "test decryption-policy-match category business-and-economy from trust to untrust source 10.20.14.37 destination 13.110.54.20";

  it("matches Allow-SaaS-Business for the security policy test", () => {
    const result = runCommand(security, ctx());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain("Allow-SaaS-Business");
      expect(result.output).toContain("action: allow");
    }
  });

  it("matches Decrypt-All-Outbound before the fix", () => {
    const result = runCommand(decrypt, ctx("branch", {}));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain("Decrypt-All-Outbound");
      expect(result.output).toContain("action: decrypt");
      expect(result.output).not.toContain("No-Decrypt-Pinned-SaaS");
    }
  });

  it("matches No-Decrypt-Pinned-SaaS after scenario A fix", () => {
    const result = runCommand(decrypt, ctx("branch", { A: true }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain("No-Decrypt-Pinned-SaaS");
      expect(result.output).toContain("action: no-decrypt");
    }
  });

  it("shows decrypt-error sessions and proxy counters", () => {
    const sessions = runCommand("show session all filter source 10.20.14.37", ctx());
    expect(sessions.ok).toBe(true);
    if (sessions.ok) {
      expect(sessions.output).toContain("decrypt-error");
      expect(sessions.output).toContain("10.20.14.37");
    }

    const counters = runCommand("show counter global filter delta yes | match proxy", ctx());
    expect(counters.ok).toBe(true);
    if (counters.ok) {
      expect(counters.output).toContain("proxy_decrypt_cert_pinned");
    }
  });
});

describe("scenario B console commands", () => {
  it("shows IKE up and IPsec down before the fix", () => {
    const ike = runCommand("show vpn ike-sa gateway gw-prisma-pune", ctx());
    expect(ike.ok).toBe(true);
    if (ike.ok) expect(ike.output).toContain("IKE SA established");

    const ipsec = runCommand("show vpn ipsec-sa tunnel tun-prisma-pune", ctx("branch", {}));
    expect(ipsec.ok).toBe(true);
    if (ipsec.ok) expect(ipsec.output).toContain("No IPsec SA found");

    const test = runCommand("test vpn ipsec-sa tunnel tun-prisma-pune", ctx("branch", {}));
    expect(test.ok).toBe(true);
    if (test.ok) {
      expect(test.output).toContain("failed");
      expect(test.output).toContain("NO_PROPOSAL_CHOSEN");
    }

    const flow = runCommand("show vpn flow tunnel-id 7", ctx("branch", {}));
    expect(flow.ok).toBe(true);
    if (flow.ok) expect(flow.output).toContain("inactive");
  });

  it("shows IPsec up after scenario B fix", () => {
    const ipsec = runCommand("show vpn ipsec-sa tunnel tun-prisma-pune", ctx("branch", { B: true }));
    expect(ipsec.ok).toBe(true);
    if (ipsec.ok) {
      expect(ipsec.output).toContain("tun-prisma-pune");
      expect(ipsec.output).toContain("There is 1 IPsec SA");
    }

    const test = runCommand("test vpn ipsec-sa tunnel tun-prisma-pune", ctx("branch", { B: true }));
    expect(test.ok).toBe(true);
    if (test.ok) expect(test.output).toContain("succeeded");

    const flow = runCommand("show vpn flow tunnel-id 7", ctx("branch", { B: true }));
    expect(flow.ok).toBe(true);
    if (flow.ok) {
      expect(flow.output).toContain("active");
      expect(flow.output).toContain("status:                up");
    }
  });

  it("surfaces the DH group mismatch in ikemgr.log", () => {
    const result = runCommand("less mp-log ikemgr.log", ctx());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain("NO_PROPOSAL_CHOSEN");
      expect(result.output).toContain("received DH group 19");
      expect(result.output).toContain("configured group 14");
    }
  });
});

describe("scenario C console commands", () => {
  it("shows threat logs, sessions, and dns proxy cache", () => {
    const threat = runCommand("show log threat src 10.40.2.15", ctx());
    expect(threat.ok).toBe(true);
    if (threat.ok) {
      expect(threat.output).toContain("Generic C2 beacon");
      expect(threat.output).toContain("10.40.2.15");
    }

    const sessions = runCommand("show session all filter source 10.40.2.15", ctx());
    expect(sessions.ok).toBe(true);
    if (sessions.ok) expect(sessions.output).toContain("10.40.2.15");

    const dns = runCommand("show dns-proxy cache", ctx());
    expect(dns.ok).toBe(true);
    if (dns.ok) {
      expect(dns.output).toContain("update-check.cdn-sync.net");
      expect(dns.output).toContain("sinkhole");
    }
  });
});

describe("console store scenario state", () => {
  beforeEach(() => {
    useAppStore.getState().resetDemo();
  });

  it("changes command output when scenarioFixes flip", () => {
    const decrypt =
      "test decryption-policy-match category business-and-economy from trust to untrust source 10.20.14.37 destination 13.110.54.20";

    const before = runCommand(decrypt, {
      mode: "branch",
      scenarioFixes: useAppStore.getState().scenarioFixes,
    });
    expect(before.ok && before.output).toContain("Decrypt-All-Outbound");

    useAppStore.getState().setScenarioFix("A", true);
    const after = runCommand(decrypt, {
      mode: "branch",
      scenarioFixes: useAppStore.getState().scenarioFixes,
    });
    expect(after.ok && after.output).toContain("No-Decrypt-Pinned-SaaS");

    useAppStore.getState().setScenarioFix("B", true);
    const vpn = runCommand("test vpn ipsec-sa tunnel tun-prisma-pune", {
      mode: "branch",
      scenarioFixes: useAppStore.getState().scenarioFixes,
    });
    expect(vpn.ok && vpn.output).toContain("succeeded");
  });

  it("resets scenarioFixes with resetDemo", () => {
    useAppStore.getState().setScenarioFix("A", true);
    useAppStore.getState().resetDemo();
    expect(useAppStore.getState().scenarioFixes).toEqual(DEFAULT_STATE.scenarioFixes);
  });
});
