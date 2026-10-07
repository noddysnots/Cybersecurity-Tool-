import { describe, expect, it } from "vitest";

import {
  addressObjects,
  appGroups,
  configAudit,
  decryptionRules,
  logs,
  meta,
  mobileUsers,
  platformAlerts,
  remoteNetworks,
  securityRules,
  serviceObjects,
  tickets,
  users,
} from "@/data";
import { DEMO_NOW_ISO } from "@/lib/time";
import type { LogRecord, TrafficLogRecord } from "@/types";

function isTraffic(log: LogRecord): log is TrafficLogRecord {
  return log.type === "traffic";
}

describe("seeded dataset counts", () => {
  it("matches PLAN section 5 counts", () => {
    expect(logs).toHaveLength(600);
    expect(securityRules).toHaveLength(32);
    expect(addressObjects.length + serviceObjects.length + appGroups.length).toBe(40);
    expect(decryptionRules).toHaveLength(6);
    expect(remoteNetworks).toHaveLength(12);
    expect(mobileUsers).toHaveLength(60);
    expect(configAudit).toHaveLength(18);
    expect(tickets).toHaveLength(12);
    expect(users).toHaveLength(70);
    expect(platformAlerts).toHaveLength(25);
  });

  it("keeps log type mix near the planned ratios", () => {
    const counts = logs.reduce<Record<string, number>>((acc, log) => {
      acc[log.type] = (acc[log.type] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts.traffic).toBe(270);
    expect(counts.url).toBe(90);
    expect(counts.threat).toBe(60);
    expect(counts.decryption).toBe(48);
    expect(counts.globalprotect).toBe(48);
    expect(counts.system).toBe(48);
    expect(counts.config).toBe(36);
  });

  it("confines log receive times to the last 24h before the demo clock", () => {
    const start = Date.parse(meta.windowStart);
    const end = Date.parse(meta.windowEnd);
    expect(meta.demoNow).toBe(DEMO_NOW_ISO);
    expect(end - start).toBe(24 * 60 * 60 * 1000);
    for (const log of logs) {
      const t = Date.parse(log.receiveTime);
      expect(t).toBeGreaterThanOrEqual(start);
      expect(t).toBeLessThanOrEqual(end);
    }
  });
});

describe("case needles", () => {
  it("includes Case 1 Meet/QUIC evidence with exact values", () => {
    const drop1 = logs.find((l) => l.id === "log-traffic-ankit-100214");
    const drop2 = logs.find((l) => l.id === "log-traffic-ankit-100231");
    const allow = logs.find((l) => l.id === "log-traffic-sana-100540");
    expect(drop1).toMatchObject({
      type: "traffic",
      receiveTime: "2026-10-06T04:32:14.000Z",
      srcUser: "ankit.verma@acme.io",
      srcIp: "10.20.31.44",
      dstIp: "74.125.250.69",
      dstPort: 19305,
      protocol: "udp",
      app: "stun",
      rule: "Block-QUIC",
      action: "drop",
      container: "Mobile Users",
    });
    expect(drop2).toMatchObject({
      type: "traffic",
      receiveTime: "2026-10-06T04:32:31.000Z",
      srcUser: "ankit.verma@acme.io",
      dstPort: 19305,
      rule: "Block-QUIC",
      action: "drop",
    });
    expect(allow).toMatchObject({
      type: "traffic",
      receiveTime: "2026-10-06T04:35:40.000Z",
      srcUser: "sana.khan@acme.io",
      srcIp: "10.50.12.88",
      dstIp: "74.125.250.69",
      app: "google-meet",
      rule: "Allow-Collab-Apps",
      action: "allow",
      container: "Remote Networks",
    });

    const earlyDrops = logs.filter(
      (l) =>
        isTraffic(l) &&
        l.rule === "Block-QUIC" &&
        l.action === "drop" &&
        Date.parse(l.receiveTime) >= Date.parse("2026-10-06T03:28:00.000Z"),
    );
    expect(earlyDrops.length).toBeGreaterThanOrEqual(9);

    expect(serviceObjects.find((s) => s.name === "svc-quic-block")).toMatchObject({
      protocol: "udp",
      destinationPorts: "443,19302-19309",
    });
    expect(
      securityRules.find((r) => r.name === "Block-QUIC" && r.container === "Mobile Users"),
    ).toMatchObject({
      position: 12,
      service: ["svc-quic-block"],
      action: "drop",
      modifiedBy: "secops.vikram",
      modifiedAt: "2026-10-05T18:11:00.000Z",
    });
    expect(
      securityRules.find(
        (r) => r.name === "Allow-Collab-Apps" && r.container === "Mobile Users",
      ),
    ).toMatchObject({ position: 18 });

    const chg = configAudit.find((c) => c.changeId === "CHG-5120");
    expect(chg).toMatchObject({
      admin: "secops.vikram",
      timestamp: "2026-10-05T18:11:00.000Z",
      container: "Mobile Users",
    });
    expect(chg?.after).toContain("svc-quic-block");

    expect(logs.find((l) => l.id === "log-gp-ankit-connect")).toMatchObject({
      type: "globalprotect",
      srcUser: "ankit.verma@acme.io",
      status: "success",
    });
    expect(logs.find((l) => l.id === "log-url-ankit-meet")).toMatchObject({
      type: "url",
      url: "https://meet.google.com/",
      action: "allow",
    });
    expect(logs.find((l) => l.id === "log-decrypt-ankit-meet")).toMatchObject({
      type: "decryption",
      sni: "meet.google.com",
      action: "decrypt",
    });

    expect(tickets.find((t) => t.id === "TKT-24817")).toMatchObject({
      subject: "Google Meet not working for remote users",
      priority: "P2",
      workable: true,
      caseKey: "meet-quic",
      contactName: "Neha Kapoor",
      openedAt: "2026-10-06T04:42:00.000Z",
    });
  });

  it("includes Case 2 Pune tunnel evidence with exact values", () => {
    const pune = remoteNetworks.find((n) => n.name === "Pune-Branch-01");
    expect(pune).toMatchObject({
      tunnelState: "down",
      lastStateChange: "2026-10-06T06:12:08.000Z",
      peerIp: "203.0.113.10",
      tunnelUptimePct30d: 99.9,
      branchHostname: "pune-fw-01",
      branchModel: "PA-440",
      subnet: "10.60.0.0/16",
    });
    expect(remoteNetworks.filter((n) => n.tunnelState === "up")).toHaveLength(11);

    const sys = logs.find((l) => l.id === "log-system-pune-np-114208");
    expect(sys).toMatchObject({
      type: "system",
      receiveTime: "2026-10-06T06:12:08.000Z",
      description:
        "IKEv2 child SA negotiation failed, no proposal chosen, peer 203.0.113.10",
      peerIp: "203.0.113.10",
    });

    const retries = logs.filter(
      (l) =>
        l.type === "system" &&
        l.description.includes("no proposal chosen") &&
        l.peerIp === "203.0.113.10",
    );
    expect(retries.length).toBeGreaterThanOrEqual(8);

    expect(logs.find((l) => l.id === "log-config-pune-dh-113612")).toMatchObject({
      type: "config",
      receiveTime: "2026-10-06T06:06:12.000Z",
      admin: "netops.admin",
      before: "group14",
      after: "group19",
      changeId: "CHG-4471",
    });

    expect(configAudit.find((c) => c.changeId === "CHG-4471")).toMatchObject({
      admin: "netops.admin",
      before: "group14",
      after: "group19",
      timestamp: "2026-10-06T06:06:12.000Z",
    });

    expect(platformAlerts.find((a) => a.id === "ALT-88421")).toMatchObject({
      title: "Remote network Pune-Branch-01 tunnel down",
      raisedAt: "2026-10-06T06:12:08.000Z",
      linkedTicketId: "TKT-24823",
      resourceId: "rn-pune-branch-01",
    });

    expect(tickets.find((t) => t.id === "TKT-24823")).toMatchObject({
      subject: "Pune branch offline, tunnel down",
      priority: "P1",
      workable: true,
      caseKey: "pune-tunnel",
      linkedAlertId: "ALT-88421",
      contactName: "Rohit Sharma",
      openedAt: "2026-10-06T06:14:00.000Z",
    });

    const puneAfterDown = logs.filter(
      (l) =>
        isTraffic(l) &&
        l.srcIp.startsWith("10.60.") &&
        Date.parse(l.receiveTime) >= Date.parse("2026-10-06T06:12:08.000Z"),
    );
    expect(puneAfterDown).toHaveLength(0);
  });
});

describe("reference integrity", () => {
  it("resolves ticket contacts, alerts, rules, objects, and networks", () => {
    const emails = new Set(users.map((u) => u.email));
    for (const ticket of tickets.filter((t) => t.workable)) {
      expect(emails.has(ticket.contactEmail)).toBe(true);
      if (ticket.linkedAlertId) {
        expect(platformAlerts.some((a) => a.id === ticket.linkedAlertId)).toBe(true);
      }
    }

    expect(emails.has("ankit.verma@acme.io")).toBe(true);
    expect(emails.has("sana.khan@acme.io")).toBe(true);

    const ruleNames = new Set(securityRules.map((r) => r.name));
    const serviceNames = new Set(serviceObjects.map((s) => s.name));
    const addressNames = new Set(addressObjects.map((a) => a.name));
    const networkIds = new Set(remoteNetworks.map((n) => n.id));

    for (const rule of securityRules) {
      for (const svc of rule.service) {
        if (svc === "any" || svc === "application-default") {
          continue;
        }
        expect(serviceNames.has(svc)).toBe(true);
      }
    }

    expect(ruleNames.has("Block-QUIC")).toBe(true);
    expect(ruleNames.has("Allow-Collab-Apps")).toBe(true);
    expect(serviceNames.has("svc-quic-block")).toBe(true);
    expect(addressNames.has("Pune-Branch-Subnet")).toBe(true);
    expect(networkIds.has("rn-pune-branch-01")).toBe(true);

    for (const alert of platformAlerts) {
      if (alert.resourceType === "remote-network") {
        expect(networkIds.has(alert.resourceId)).toBe(true);
      }
    }

    for (const mu of mobileUsers) {
      expect(emails.has(mu.email)).toBe(true);
    }
  });
});
