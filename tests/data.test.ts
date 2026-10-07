import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isWithinLast24h } from "@/lib/time";
import type {
  Alert,
  DecryptionRule,
  Host,
  LogRecord,
  LogType,
  RemoteNetwork,
  SecurityRule,
  ServiceConnection,
  User,
} from "@/types";

function load<T>(file: string): T {
  const full = path.resolve(__dirname, "../src/data", file);
  return JSON.parse(readFileSync(full, "utf8")) as T;
}

const alerts = load<Alert[]>("alerts.json");
const logs = load<LogRecord[]>("logs.json");
const rules = load<SecurityRule[]>("rules.json");
const decryptionRules = load<DecryptionRule[]>("decryption-rules.json");
const networks = load<RemoteNetwork[]>("networks.json");
const serviceConnections = load<ServiceConnection[]>("service-connections.json");
const users = load<User[]>("users.json");
const hosts = load<Host[]>("hosts.json");

/** IST wall clock time of an ISO timestamp, as HH:MM:SS. */
function istTime(isoTime: string): string {
  return new Date(new Date(isoTime).getTime() + 19_800_000)
    .toISOString()
    .slice(11, 19);
}

describe("data counts", () => {
  it("has the planned record counts", () => {
    expect(alerts).toHaveLength(40);
    expect(rules).toHaveLength(25);
    expect(decryptionRules).toHaveLength(6);
    expect(networks).toHaveLength(12);
    expect(serviceConnections).toHaveLength(4);
    expect(users).toHaveLength(30);
    expect(hosts).toHaveLength(20);
  });

  it("has unique ids", () => {
    expect(new Set(logs.map((l) => l.id)).size).toBe(logs.length);
    expect(new Set(alerts.map((a) => a.id)).size).toBe(alerts.length);
  });
});

describe("logs", () => {
  it("has exactly 500 records, all within 24h before the demo clock", () => {
    expect(logs).toHaveLength(500);
    for (const l of logs) expect(isWithinLast24h(l.time)).toBe(true);
  });

  it("matches the planned type mix within 5 percentage points", () => {
    const target: Record<LogType, number> = {
      traffic: 0.4,
      url: 0.2,
      threat: 0.15,
      decryption: 0.1,
      system: 0.075,
      config: 0.075,
    };
    const share = (type: LogType): number =>
      logs.filter((l) => l.type === type).length / logs.length;
    for (const type of ["traffic", "url", "threat", "decryption"] as const) {
      expect(Math.abs(share(type) - target[type])).toBeLessThanOrEqual(0.05);
    }
    const sysConfig = share("system") + share("config");
    expect(Math.abs(sysConfig - 0.15)).toBeLessThanOrEqual(0.05);
  });

  it("only references rules that exist", () => {
    const names = new Set([
      ...rules.map((r) => r.name),
      ...decryptionRules.map((r) => r.name),
    ]);
    for (const l of logs) {
      if (l.rule) expect(names.has(l.rule), `${l.id} ${l.rule}`).toBe(true);
    }
  });
});

describe("scenario A needles", () => {
  const rahul = logs.filter((l) => l.srcUser === "rahul.mehta@acme.io");
  const failures = rahul.filter((l) => l.dstIp === "13.110.54.20");

  it("has the alert", () => {
    const a = alerts.find((x) => x.id === "ALR-1042");
    expect(a).toMatchObject({
      title: "User cannot reach Salesforce",
      severity: "medium",
      scenarioId: "A",
    });
    expect(a?.source).toContain("INC-88213");
    expect(a?.entities.users).toEqual(["rahul.mehta@acme.io"]);
    expect(a?.entities.ips).toContain("10.20.14.37");
  });

  it("has the user", () => {
    expect(users.find((u) => u.email === "rahul.mehta@acme.io")).toMatchObject({
      ip: "10.20.14.37",
      location: "Mumbai",
      connection: "globalprotect",
    });
  });

  it("has traffic failures from 14:17:42 IST with decrypt-error", () => {
    const traffic = failures.filter((l) => l.type === "traffic");
    expect(traffic.length).toBeGreaterThanOrEqual(10);
    expect(istTime(traffic[0].time)).toBe("14:17:42");
    for (const l of traffic) {
      expect(l).toMatchObject({
        srcIp: "10.20.14.37",
        dstIp: "13.110.54.20",
        dstPort: 443,
        app: "ssl",
        rule: "Allow-SaaS-Business",
        action: "allow",
        sessionEndReason: "decrypt-error",
        location: "Mumbai",
      });
      expect(l.bytesReceived ?? 0).toBeLessThan(250);
      expect(istTime(l.time) <= "14:48:59").toBe(true);
    }
  });

  it("has decryption errors from Decrypt-All-Outbound", () => {
    const dec = failures.filter((l) => l.type === "decryption");
    expect(dec.length).toBeGreaterThanOrEqual(10);
    for (const l of dec) {
      expect(l.rule).toBe("Decrypt-All-Outbound");
      expect(l.message).toBe(
        "Certificate pinned: client rejected forward proxy certificate",
      );
      expect(l.url).toBe("login.salesforce.com");
    }
  });

  it("has allowed business-and-economy URL logs", () => {
    const url = failures.filter((l) => l.type === "url");
    expect(url.length).toBeGreaterThanOrEqual(5);
    for (const l of url) {
      expect(l.urlCategory).toBe("business-and-economy");
      expect(l.action).toBe("allow");
    }
  });

  it("has the pinned certificate message only for Rahul", () => {
    const pinned = logs.filter((l) => l.message?.includes("Certificate pinned"));
    for (const l of pinned) expect(l.srcUser).toBe("rahul.mehta@acme.io");
  });
});

describe("scenario B needles", () => {
  it("has the alert and branch device", () => {
    const a = alerts.find((x) => x.id === "ALR-1037");
    expect(a).toMatchObject({ severity: "high", scenarioId: "B" });
    expect(a?.title).toContain("Pune-Branch-01");
    expect(a?.entities.hosts).toEqual(["pune-fw-01"]);
    expect(a?.entities.ips).toEqual(
      expect.arrayContaining(["203.0.113.10", "198.51.100.24"]),
    );
    expect(a?.summary).toContain("CHG-4471");
    const net = networks.find((n) => n.name === "Pune-Branch-01");
    expect(net).toMatchObject({
      device: "pune-fw-01",
      deviceModel: "PA-440",
      peerIp: "203.0.113.10",
      prismaIp: "198.51.100.24",
      status: "down",
    });
  });

  it("has system logs from 11:42:08 IST repeating every 30s", () => {
    const sys = logs.filter(
      (l) => l.type === "system" && l.message?.includes("NO_PROPOSAL_CHOSEN"),
    );
    expect(sys.length).toBeGreaterThanOrEqual(10);
    expect(sys[0].message).toContain(
      "IKEv2 child SA negotiation failed: NO_PROPOSAL_CHOSEN",
    );
    expect(istTime(sys[0].time)).toBe("11:42:08");
    expect(istTime(sys[1].time)).toBe("11:42:38");
    for (const l of sys) expect(l.device).toBe("pune-fw-01");
    const down = logs.find(
      (l) => l.type === "system" && l.message?.includes("up -> down") && l.device === "pune-fw-01",
    );
    expect(down && istTime(down.time)).toBe("11:42:08");
  });

  it("has the config change at 11:36 IST by netops.admin", () => {
    const cfg = logs.find(
      (l) => l.type === "config" && l.message?.includes("ipsec-prisma"),
    );
    expect(cfg).toBeDefined();
    expect(cfg?.srcUser).toBe("netops.admin");
    expect(cfg?.action).toBe("edit");
    expect(cfg?.message).toContain("PFS group group14 -> group19");
    expect(istTime(cfg?.time ?? "").slice(0, 5)).toBe("11:36");
  });
});

describe("scenario C needles", () => {
  const c2 = logs.filter((l) => l.threatName === "Generic C2 beacon");

  it("has the alert and host", () => {
    const a = alerts.find((x) => x.id === "ALR-1049");
    expect(a).toMatchObject({ severity: "critical", scenarioId: "C" });
    expect(a?.entities.hosts).toEqual(["prod-api-07"]);
    expect(a?.entities.ips).toContain("10.40.2.15");
    expect(hosts.find((h) => h.hostname === "prod-api-07")).toMatchObject({
      ip: "10.40.2.15",
      via: "SC-AWS-Mumbai",
    });
  });

  it("has sinkholed DNS beacons from 09:12:05 IST about every 60s", () => {
    expect(c2.length).toBeGreaterThanOrEqual(15);
    expect(istTime(c2[0].time)).toBe("09:12:05");
    for (const l of c2) {
      expect(l).toMatchObject({
        type: "threat",
        srcIp: "10.40.2.15",
        action: "sinkhole",
        url: "update-check.cdn-sync.net",
        severity: "critical",
      });
    }
    const gap = (new Date(c2[1].time).getTime() - new Date(c2[0].time).getTime()) / 1000;
    expect(Math.abs(gap - 60)).toBeLessThanOrEqual(3);
  });

  it("has the WildFire download at 08:57 IST", () => {
    const dl = logs.find(
      (l) => l.type === "threat" && l.url?.includes("agent-update.sh"),
    );
    expect(dl).toBeDefined();
    expect(dl?.dstIp).toMatch(/^185\.220\.\d+\.\d+$/);
    expect(dl?.srcIp).toBe("10.40.2.15");
    expect(dl?.message).toContain("WildFire verdict: malicious");
    expect(istTime(dl?.time ?? "").slice(0, 5)).toBe("08:57");
  });

  it("has fixed size beacon traffic to the sinkhole IP", () => {
    const beacons = logs.filter(
      (l) => l.type === "traffic" && l.dstIp === "192.0.2.53",
    );
    expect(beacons.length).toBe(c2.length);
    for (const l of beacons) {
      expect(l.srcIp).toBe("10.40.2.15");
      expect(l.bytesSent).toBe(412);
      expect(l.bytesReceived).toBe(186);
    }
  });

  it("keeps the C2 indicators unique to the scenario", () => {
    const hits = logs.filter((l) => l.url?.includes("cdn-sync.net"));
    for (const l of hits) expect(l.srcIp).toBe("10.40.2.15");
  });
});

describe("alert entities", () => {
  const knownIps = new Set<string>([
    ...users.map((u) => u.ip),
    ...hosts.map((h) => h.ip),
    ...networks.flatMap((n) => [n.peerIp, n.prismaIp]),
    ...serviceConnections.flatMap((s) => [s.peerIp, s.prismaIp]),
    ...logs.flatMap((l) => [l.srcIp, l.dstIp].filter((x): x is string => !!x)),
  ]);
  const knownUsers = new Set(users.map((u) => u.email));
  const knownHosts = new Set(hosts.map((h) => h.hostname));
  const knownSites = new Set([
    ...networks.map((n) => n.name),
    ...serviceConnections.map((s) => s.name),
  ]);

  it("references real users, hosts, ips and sites", () => {
    for (const a of alerts) {
      for (const u of a.entities.users ?? []) expect(knownUsers.has(u), `${a.id} user ${u}`).toBe(true);
      for (const h of a.entities.hosts ?? []) expect(knownHosts.has(h), `${a.id} host ${h}`).toBe(true);
      for (const ip of a.entities.ips ?? []) expect(knownIps.has(ip), `${a.id} ip ${ip}`).toBe(true);
      for (const s of a.entities.sites ?? []) expect(knownSites.has(s), `${a.id} site ${s}`).toBe(true);
    }
  });

  it("has the three scenario alerts and all alerts inside the demo window", () => {
    expect(alerts.filter((a) => a.scenarioId).map((a) => a.scenarioId).sort()).toEqual(["A", "B", "C"]);
    for (const a of alerts) expect(isWithinLast24h(a.createdAt)).toBe(true);
  });
});
