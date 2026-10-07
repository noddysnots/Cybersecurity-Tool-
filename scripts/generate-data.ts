/**
 * Generates src/data/*.json with a fixed seed. Run: npm run generate
 * Scenario records (PLAN.md section 4) are hand-written below. Only noise is random.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fakerEN_IN as faker } from "@faker-js/faker";
import { DEMO_CLOCK } from "../src/lib/time";
import type {
  Alert,
  AlertStatus,
  DecryptionRule,
  Host,
  LogRecord,
  LogType,
  RemoteNetwork,
  SecurityRule,
  ServiceConnection,
  Severity,
  User,
} from "../src/types";

faker.seed(20261006);

type LogDraft = Omit<LogRecord, "id">;

const OUT_DIR = path.resolve(process.cwd(), "src/data");
const DAY = "2026-10-06";
const HOUR_MS = 3_600_000;
const WINDOW_START_MS = DEMO_CLOCK.getTime() - 24 * HOUR_MS;

/** Targets from PLAN.md section 5: 500 logs, 40 / 20 / 15 / 10 / 15 percent. */
const LOG_TARGETS: Record<LogType, number> = {
  traffic: 200,
  url: 100,
  threat: 75,
  decryption: 50,
  system: 40,
  config: 35,
};

// ---------- helpers ----------

const int = (min: number, max: number): number =>
  faker.number.int({ min, max });
const pick = <T>(items: readonly T[]): T => faker.helpers.arrayElement(items);
const weighted = <T>(items: readonly { weight: number; value: T }[]): T =>
  faker.helpers.weightedArrayElement(items as { weight: number; value: T }[]);

/** IST wall clock time on the demo day (or the day before) to epoch ms. */
function istMs(hms: string, date = DAY): number {
  return new Date(`${date}T${hms}+05:30`).getTime();
}
const iso = (ms: number): string => new Date(ms).toISOString();
const istIso = (hms: string, date = DAY): string => iso(istMs(hms, date));

function hourWeight(istHour: number): number {
  if (istHour < 6) return 0.2;
  if (istHour < 9) return 0.6;
  if (istHour < 19) return 1;
  return 0.45;
}

/** Random time in the last 24h, weighted toward IST business hours. */
function noiseMs(): number {
  const start = WINDOW_START_MS + 60_000;
  const end = DEMO_CLOCK.getTime() - 60_000;
  for (;;) {
    const ms = start + int(0, Math.floor((end - start) / 1000)) * 1000;
    const istHour = new Date(ms + 19_800_000).getUTCHours();
    if (faker.number.float({ min: 0, max: 1 }) < hourWeight(istHour)) return ms;
  }
}

function pubIp(): string {
  return `${pick([34, 35, 45, 51, 54, 91, 103, 104, 142, 151, 157])}.${int(1, 254)}.${int(1, 254)}.${int(1, 254)}`;
}

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z]/g, "");

// ---------- reference data ----------

const networkSeed: {
  name: string;
  city: string;
  model: string;
  status: RemoteNetwork["status"];
  uptime: number;
}[] = [
  { name: "Pune-Branch-01", city: "Pune", model: "PA-440", status: "down", uptime: 99.9 },
  { name: "Mumbai-HQ-01", city: "Mumbai", model: "PA-1410", status: "up", uptime: 100 },
  { name: "Bengaluru-Branch-01", city: "Bengaluru", model: "PA-460", status: "up", uptime: 99.98 },
  { name: "Chennai-Branch-01", city: "Chennai", model: "PA-440", status: "up", uptime: 99.95 },
  { name: "Hyderabad-Branch-01", city: "Hyderabad", model: "PA-460", status: "up", uptime: 99.93 },
  { name: "Delhi-Branch-01", city: "Delhi", model: "PA-460", status: "up", uptime: 99.97 },
  { name: "Kolkata-Branch-01", city: "Kolkata", model: "PA-440", status: "degraded", uptime: 98.2 },
  { name: "Ahmedabad-Branch-01", city: "Ahmedabad", model: "PA-440", status: "up", uptime: 99.6 },
  { name: "Kochi-Branch-01", city: "Kochi", model: "PA-440", status: "up", uptime: 99.9 },
  { name: "Jaipur-Branch-01", city: "Jaipur", model: "PA-440", status: "up", uptime: 99.85 },
  { name: "Singapore-Office-01", city: "Singapore", model: "PA-1410", status: "up", uptime: 99.99 },
  { name: "London-Office-01", city: "London", model: "PA-1410", status: "up", uptime: 99.99 },
];

const networks: RemoteNetwork[] = networkSeed.map((n, i) => ({
  id: `RN-${String(i + 1).padStart(2, "0")}`,
  name: n.name,
  location: n.city,
  device: `${slug(n.city)}-fw-01`,
  deviceModel: n.model,
  peerIp: `203.0.113.${(i + 1) * 10}`,
  prismaIp: i === 0 ? "198.51.100.24" : `198.51.100.${40 + i * 4}`,
  ipsecProfile: "ipsec-prisma",
  status: n.status,
  uptime30d: n.uptime,
  ...(n.name === "Pune-Branch-01" ? { statusSince: istIso("11:42:08") } : {}),
}));

const serviceConnections: ServiceConnection[] = [
  { id: "SC-01", name: "SC-AWS-Mumbai", kind: "aws", region: "ap-south-1", subnet: "10.40.0.0/16", peerIp: "203.0.113.201", prismaIp: "198.51.100.201", status: "up" },
  { id: "SC-02", name: "SC-Azure-Pune", kind: "azure", region: "centralindia", subnet: "10.50.0.0/16", peerIp: "203.0.113.202", prismaIp: "198.51.100.202", status: "up" },
  { id: "SC-03", name: "SC-GCP-Mumbai", kind: "gcp", region: "asia-south1", subnet: "10.70.0.0/16", peerIp: "203.0.113.203", prismaIp: "198.51.100.203", status: "up" },
  { id: "SC-04", name: "SC-DC-Chennai", kind: "datacenter", region: "Chennai", subnet: "10.10.0.0/16", peerIp: "203.0.113.204", prismaIp: "198.51.100.204", status: "up" },
];

const netIp = (name: string): string => {
  const n = networks.find((x) => x.name === name);
  if (!n) throw new Error(`Unknown network ${name}`);
  return n.peerIp;
};

const hostSeed: Omit<Host, "id">[] = [
  { hostname: "prod-api-03", ip: "10.40.2.11", role: "workload", environment: "prod", location: "Mumbai", via: "SC-AWS-Mumbai", os: "Ubuntu 22.04" },
  { hostname: "prod-api-05", ip: "10.40.2.13", role: "workload", environment: "prod", location: "Mumbai", via: "SC-AWS-Mumbai", os: "Ubuntu 22.04" },
  { hostname: "prod-api-07", ip: "10.40.2.15", role: "workload", environment: "prod", location: "Mumbai", via: "SC-AWS-Mumbai", os: "Ubuntu 22.04" },
  { hostname: "prod-web-02", ip: "10.40.1.22", role: "workload", environment: "prod", location: "Mumbai", via: "SC-AWS-Mumbai", os: "Amazon Linux 2023" },
  { hostname: "prod-web-04", ip: "10.40.1.24", role: "workload", environment: "prod", location: "Mumbai", via: "SC-AWS-Mumbai", os: "Amazon Linux 2023" },
  { hostname: "prod-db-01", ip: "10.40.3.5", role: "workload", environment: "prod", location: "Mumbai", via: "SC-AWS-Mumbai", os: "Ubuntu 22.04" },
  { hostname: "prod-db-02", ip: "10.40.3.6", role: "workload", environment: "prod", location: "Mumbai", via: "SC-AWS-Mumbai", os: "Ubuntu 22.04" },
  { hostname: "prod-worker-11", ip: "10.40.4.31", role: "workload", environment: "prod", location: "Mumbai", via: "SC-AWS-Mumbai", os: "Ubuntu 22.04" },
  { hostname: "stg-api-02", ip: "10.50.2.12", role: "workload", environment: "staging", location: "Pune", via: "SC-Azure-Pune", os: "Ubuntu 22.04" },
  { hostname: "stg-web-01", ip: "10.50.1.21", role: "workload", environment: "staging", location: "Pune", via: "SC-Azure-Pune", os: "Ubuntu 22.04" },
  { hostname: "ci-runner-03", ip: "10.50.5.43", role: "workload", environment: "staging", location: "Pune", via: "SC-Azure-Pune", os: "Ubuntu 24.04" },
  { hostname: "jump-host-01", ip: "10.10.1.5", role: "server", environment: "corp", location: "Chennai", via: "SC-DC-Chennai", os: "Ubuntu 22.04" },
  { hostname: "ad-dc-01", ip: "10.10.1.10", role: "server", environment: "corp", location: "Chennai", via: "SC-DC-Chennai", os: "Windows Server 2022" },
  { hostname: "ad-dc-02", ip: "10.10.1.11", role: "server", environment: "corp", location: "Chennai", via: "SC-DC-Chennai", os: "Windows Server 2022" },
  { hostname: "file-srv-01", ip: "10.10.2.20", role: "server", environment: "corp", location: "Chennai", via: "SC-DC-Chennai", os: "Windows Server 2019" },
  { hostname: "print-srv-01", ip: "10.10.2.40", role: "server", environment: "corp", location: "Chennai", via: "SC-DC-Chennai", os: "Windows Server 2019" },
  { hostname: "pune-fw-01", ip: netIp("Pune-Branch-01"), role: "firewall", environment: "corp", location: "Pune", via: "Pune-Branch-01", os: "PAN-OS 11.1" },
  { hostname: "chennai-fw-01", ip: netIp("Chennai-Branch-01"), role: "firewall", environment: "corp", location: "Chennai", via: "Chennai-Branch-01", os: "PAN-OS 11.1" },
  { hostname: "hyderabad-fw-01", ip: netIp("Hyderabad-Branch-01"), role: "firewall", environment: "corp", location: "Hyderabad", via: "Hyderabad-Branch-01", os: "PAN-OS 11.1" },
  { hostname: "delhi-fw-01", ip: netIp("Delhi-Branch-01"), role: "firewall", environment: "corp", location: "Delhi", via: "Delhi-Branch-01", os: "PAN-OS 11.1" },
];
const hosts: Host[] = hostSeed.map((h, i) => ({ id: `HOST-${String(i + 1).padStart(2, "0")}`, ...h }));

const RAHUL = "rahul.mehta@acme.io";
const RAHUL_IP = "10.20.14.37";
const PROD07_IP = "10.40.2.15";

function buildUsers(): User[] {
  const departments = ["Sales", "Finance", "Engineering", "Support", "Marketing", "HR", "Operations", "Legal"];
  const mobileSubnets: [string, string][] = [
    ["Mumbai", "10.20.14"], ["Bengaluru", "10.20.22"], ["Delhi", "10.20.31"],
    ["Hyderabad", "10.20.40"], ["Chennai", "10.20.47"], ["Pune", "10.20.55"],
  ];
  const branchSubnets: [string, string, string][] = [
    ["Chennai", "10.61.0", "Chennai-Branch-01"], ["Hyderabad", "10.62.0", "Hyderabad-Branch-01"],
    ["Delhi", "10.63.0", "Delhi-Branch-01"], ["Kolkata", "10.64.0", "Kolkata-Branch-01"],
    ["Ahmedabad", "10.65.0", "Ahmedabad-Branch-01"],
  ];
  const usedEmails = new Set<string>([RAHUL]);
  const usedIps = new Set<string>([RAHUL_IP]);
  const users: Omit<User, "id">[] = [
    { email: RAHUL, displayName: "Rahul Mehta", department: "Sales", location: "Mumbai", connection: "globalprotect", ip: RAHUL_IP },
  ];
  const makeOne = (location: string, subnet: string, site?: string): void => {
    for (;;) {
      const first = faker.person.firstName();
      const last = faker.person.lastName();
      const email = `${slug(first)}.${slug(last)}@acme.io`;
      const ip = `${subnet}.${int(10, 250)}`;
      if (!slug(first) || !slug(last) || usedEmails.has(email) || usedIps.has(ip)) continue;
      usedEmails.add(email);
      usedIps.add(ip);
      users.push({
        email,
        displayName: `${first} ${last}`,
        department: pick(departments),
        location,
        connection: site ? "branch" : "globalprotect",
        ip,
        ...(site ? { site } : {}),
      });
      return;
    }
  };
  for (let i = 0; i < 17; i++) {
    const [city, subnet] = mobileSubnets[i % mobileSubnets.length];
    makeOne(city, subnet);
  }
  for (let i = 0; i < 12; i++) {
    const [city, subnet, site] = branchSubnets[i % branchSubnets.length];
    makeOne(city, subnet, site);
  }
  return users.map((u, i) => ({ id: `USR-${String(i + 1).padStart(2, "0")}`, ...u }));
}
const users = buildUsers();
const noiseUsers = users.filter((u) => u.email !== RAHUL);

type RuleSeed = [name: string, from: string, to: string, src: string, dst: string, app: string, action: SecurityRule["action"], profile: string | undefined, description: string];
const ruleSeeds: RuleSeed[] = [
  ["Block-Quarantine", "any", "any", "dag:quarantine", "any", "any", "drop", undefined, "Drops all traffic from hosts tagged quarantine."],
  ["Block-Known-Bad-IPs", "untrust", "any", "edl:Known-Bad-IPs", "any", "any", "drop", undefined, "Threat intel feed block."],
  ["Block-Tor-Exit", "untrust", "any", "edl:Tor-Exit-Nodes", "any", "any", "drop", undefined, "Blocks Tor exit nodes."],
  ["Block-Geo-Restricted", "untrust", "dmz", "geo:restricted-countries", "any", "any", "deny", undefined, "Geo restriction for inbound services."],
  ["Block-P2P", "trust", "untrust", "any", "any", "bittorrent, emule", "deny", undefined, "Peer to peer file sharing is not allowed."],
  ["Block-Unapproved-Remote-Access", "trust", "untrust", "any", "any", "teamviewer, anydesk", "deny", undefined, "Only the approved remote support tool is allowed."],
  ["Block-Legacy-Protocols", "any", "any", "any", "any", "telnet, ftp", "deny", undefined, "Legacy clear text protocols."],
  ["Allow-DNS-Internal", "any", "trust", "any", "10.10.1.10, 10.10.1.11", "dns", "allow", undefined, "Internal DNS resolvers."],
  ["Allow-GlobalProtect-Portal", "untrust", "trust", "any", "gp-portal", "paloalto-globalprotect", "allow", undefined, "Mobile user portal and gateway."],
  ["Allow-SaaS-Business", "trust", "untrust", "any", "any", "ssl, web-browsing, salesforce-base, servicenow-base", "allow", "Corp-Security-Profiles", "Business SaaS applications."],
  ["Allow-O365", "trust", "untrust", "any", "any", "ms-office365, ms-onedrive, outlook-web", "allow", "Corp-Security-Profiles", "Microsoft 365 traffic."],
  ["Allow-Collab", "trust", "untrust", "any", "any", "ms-teams, zoom-base, slack-base", "allow", "Corp-Security-Profiles", "Collaboration tools."],
  ["Allow-Dev-Github", "trust", "untrust", "dev-hosts", "any", "github-base, git", "allow", "Corp-Security-Profiles", "Source control access for engineering."],
  ["Allow-General-Web", "trust", "untrust", "any", "any", "web-browsing, ssl, google-base", "allow", "Corp-URL-Filtering", "General web with URL filtering."],
  ["Allow-Software-Updates", "any", "untrust", "any", "any", "apt-get, yum, windows-update", "allow", "Corp-Security-Profiles", "OS and package updates."],
  ["Allow-Prod-Outbound", "prod", "untrust", "prod-workloads", "any", "ssl, web-browsing, dns, ntp, aws-s3", "allow", "Prod-Threat-Profiles", "Outbound access for production workloads."],
  ["Allow-Prod-Inbound-Web", "untrust", "dmz", "any", "prod-web", "ssl, web-browsing", "allow", "Prod-Threat-Profiles", "Public web front ends."],
  ["Allow-Prod-DB-Internal", "prod", "prod", "prod-api, prod-worker", "prod-db", "postgres, mysql", "allow", undefined, "Application to database traffic."],
  ["Allow-AD-Auth", "trust", "trust", "any", "10.10.1.10, 10.10.1.11", "kerberos, ldap, ms-ds-smb-base", "allow", undefined, "Directory authentication."],
  ["Allow-File-Services", "trust", "trust", "any", "10.10.2.20", "ms-ds-smb-base", "allow", undefined, "File server access."],
  ["Allow-Branch-Internal", "branch", "trust", "branch-subnets", "10.10.0.0/16", "any", "allow", "Corp-Security-Profiles", "Branch to data centre access."],
  ["Allow-Admin-SSH-JumpHost", "trust", "trust", "admin-workstations", "10.10.1.5", "ssh", "allow", undefined, "Admin access through the jump host only."],
  ["Allow-Monitoring", "any", "any", "monitoring-hosts", "any", "snmp, icmp", "allow", undefined, "Monitoring probes."],
  ["Allow-Backup", "trust", "trust", "backup-servers", "any", "ssl, ssh", "allow", undefined, "Nightly backup jobs."],
  ["Default-Deny", "any", "any", "any", "any", "any", "deny", undefined, "Interzone default."],
];

const securityRules: SecurityRule[] = ruleSeeds.map(
  ([name, fromZone, toZone, source, destination, application, action, profile, description], i) => ({
    id: `SR-${String(i + 1).padStart(3, "0")}`,
    name,
    order: i + 1,
    fromZone,
    toZone,
    source,
    destination,
    application,
    action,
    ...(profile ? { profile } : {}),
    hitCount: name === "Block-Quarantine" ? 0 : int(120, 480_000),
    description,
  }),
);

type DecSeed = [string, string, DecryptionRule["type"], DecryptionRule["action"], string];
const decSeeds: DecSeed[] = [
  ["No-Decrypt-Financial-Services", "financial-services", "ssl-forward-proxy", "no-decrypt", "Privacy and regulatory exclusion."],
  ["No-Decrypt-Health-And-Medicine", "health-and-medicine", "ssl-forward-proxy", "no-decrypt", "Privacy exclusion."],
  ["No-Decrypt-Government", "government", "ssl-forward-proxy", "no-decrypt", "Regulatory exclusion."],
  ["No-Decrypt-Private-IPs", "private-ip-addresses", "ssl-forward-proxy", "no-decrypt", "Internal services."],
  ["Decrypt-All-Outbound", "any", "ssl-forward-proxy", "decrypt", "Decrypt all other outbound TLS."],
  ["Decrypt-Inbound-Prod", "any", "ssl-inbound-inspection", "decrypt", "Inbound inspection for public web servers."],
];
const decryptionRules: DecryptionRule[] = decSeeds.map(([name, urlCategory, type, action, description], i) => ({
  id: `DR-${String(i + 1).padStart(3, "0")}`,
  name,
  order: i + 1,
  fromZone: name === "Decrypt-Inbound-Prod" ? "untrust" : "trust",
  toZone: name === "Decrypt-Inbound-Prod" ? "dmz" : "untrust",
  source: "any",
  urlCategory,
  type,
  action,
  hitCount: int(300, 260_000),
  description,
}));

// ---------- location and device helpers ----------

const gpDevice = (city: string): string => `gp-gw-${slug(city)}-01`;
function userDevice(u: User): string {
  if (u.site) {
    const n = networks.find((x) => x.name === u.site);
    return n ? n.device : gpDevice(u.location);
  }
  return gpDevice(u.location);
}
const userBase = (u: User): Pick<LogDraft, "srcIp" | "srcUser" | "device" | "location"> => ({
  srcIp: u.ip,
  srcUser: u.email,
  device: userDevice(u),
  location: u.location,
});
const hostDevice = (h: Host): string =>
  h.via.startsWith("SC-") ? `${slug(h.via.replace("SC-", ""))}-sc-gw` : (networks.find((n) => n.name === h.via)?.device ?? "panorama-01");

// ---------- scenario A ----------

function scenarioLogsA(): LogDraft[] {
  const logs: LogDraft[] = [];
  const base = { srcIp: RAHUL_IP, srcUser: RAHUL, device: gpDevice("Mumbai"), location: "Mumbai" };
  const sfIp = "13.110.54.20";
  const sni = "login.salesforce.com";
  const message = "Certificate pinned: client rejected forward proxy certificate";

  let t = istMs("14:17:42");
  const end = istMs("14:48:00");
  let attempt = 0;
  while (t <= end) {
    logs.push({
      ...base, type: "traffic", time: iso(t), dstIp: sfIp, dstPort: 443, app: "ssl",
      rule: "Allow-SaaS-Business", action: "allow", sessionEndReason: "decrypt-error",
      bytesSent: int(520, 1240), bytesReceived: int(0, 210),
    });
    logs.push({
      ...base, type: "decryption", time: iso(t), dstIp: sfIp, dstPort: 443, app: "ssl",
      rule: "Decrypt-All-Outbound", action: "decrypt", severity: "medium", url: sni, message,
    });
    if (attempt % 2 === 0) {
      logs.push({
        ...base, type: "url", time: iso(t), dstIp: sfIp, dstPort: 443, app: "ssl",
        rule: "Allow-SaaS-Business", action: "allow", urlCategory: "business-and-economy",
        severity: "info", url: `${sni}/`,
      });
    }
    attempt += 1;
    t += int(60, 180) * 1000;
  }

  // Rahul's other traffic: the network and other apps work fine.
  const other: [string, string, string, number, string, string][] = [
    ["10:12:31", "ms-office365", "52.96.108.18", 443, "Allow-O365", "tcp-fin"],
    ["11:05:09", "ms-teams", "52.112.100.4", 443, "Allow-Collab", "tcp-fin"],
    ["13:42:50", "ms-office365", "52.96.166.114", 443, "Allow-O365", "tcp-fin"],
    ["14:02:17", "google-base", "142.250.77.46", 443, "Allow-General-Web", "tcp-fin"],
    ["14:21:08", "ms-teams", "52.113.194.132", 443, "Allow-Collab", "tcp-fin"],
    ["14:36:44", "ms-office365", "52.96.108.18", 443, "Allow-O365", "tcp-fin"],
  ];
  for (const [hms, app, dstIp, dstPort, rule, reason] of other) {
    logs.push({
      ...base, type: "traffic", time: istIso(hms), dstIp, dstPort, app, rule, action: "allow",
      sessionEndReason: reason, bytesSent: int(4_000, 90_000), bytesReceived: int(30_000, 2_400_000),
    });
  }

  // Red herring: other users reach Salesforce in a browser without trouble.
  const sfUsers = faker.helpers.shuffle(noiseUsers).slice(0, 6);
  for (const u of sfUsers) {
    logs.push({
      ...userBase(u), type: "traffic", time: iso(noiseMs()), dstIp: sfIp, dstPort: 443,
      app: "salesforce-base", rule: "Allow-SaaS-Business", action: "allow",
      sessionEndReason: "tcp-fin", bytesSent: int(8_000, 60_000), bytesReceived: int(90_000, 1_800_000),
    });
  }
  return logs;
}

// ---------- scenario B ----------

function scenarioLogsB(): LogDraft[] {
  const logs: LogDraft[] = [];
  const base = { device: "pune-fw-01", location: "Pune" };
  const failMsg =
    "IKEv2 child SA negotiation failed: NO_PROPOSAL_CHOSEN (gateway gw-prisma-pune, tunnel tun-prisma-pune, peer 198.51.100.24)";

  logs.push({
    ...base, type: "config", time: istIso("11:36:20"), srcUser: "netops.admin", action: "edit",
    severity: "info", message: "netops.admin edited IPsec crypto profile ipsec-prisma: PFS group group14 -> group19 (CHG-4471)",
  });
  logs.push({
    ...base, type: "config", time: istIso("11:38:02"), srcUser: "netops.admin", action: "commit",
    severity: "info", message: "Commit succeeded for change CHG-4471 (job 2291)",
  });
  logs.push({
    ...base, type: "system", time: istIso("11:42:08"), severity: "high",
    message: "Tunnel tun-prisma-pune state changed: up -> down",
  });

  const first = istMs("11:42:08");
  for (let i = 0; i < 12; i++) {
    logs.push({ ...base, type: "system", time: iso(first + i * 30_000), severity: "high", message: failMsg });
  }
  // Retries back off after the first minutes. Kept sparse so the dataset size stays fixed.
  for (let t = istMs("12:02:38"); t <= istMs("14:50:00"); t += 20 * 60_000) {
    logs.push({ ...base, type: "system", time: iso(t), severity: "high", message: failMsg });
  }
  return logs;
}

// ---------- scenario C ----------

function scenarioLogsC(): LogDraft[] {
  const logs: LogDraft[] = [];
  const base = { srcIp: PROD07_IP, device: "awsmumbai-sc-gw", location: "Mumbai" };
  const sinkholeIp = "192.0.2.53";
  const c2Domain = "update-check.cdn-sync.net";
  const badIp = "185.220.101.47";

  logs.push({
    ...base, type: "url", time: istIso("08:57:12"), dstIp: badIp, dstPort: 80, app: "web-browsing",
    rule: "Allow-Prod-Outbound", action: "alert", urlCategory: "unknown", severity: "low",
    url: `${badIp}/agent-update.sh`,
  });
  logs.push({
    ...base, type: "threat", time: istIso("08:57:13"), dstIp: badIp, dstPort: 80, app: "web-browsing",
    rule: "Allow-Prod-Outbound", action: "alert", threatName: "Malicious shell script (WildFire)",
    severity: "high", url: `${badIp}/agent-update.sh`,
    message: `WildFire verdict: malicious. File agent-update.sh downloaded from ${badIp}`,
  });
  logs.push({
    ...base, type: "traffic", time: istIso("08:57:14"), dstIp: badIp, dstPort: 80, app: "web-browsing",
    rule: "Allow-Prod-Outbound", action: "allow", sessionEndReason: "tcp-fin", bytesSent: 640, bytesReceived: 18_432,
  });

  const beaconTimes: number[] = [];
  const first = istMs("09:12:05");
  for (let k = 0; k < 18; k++) beaconTimes.push(first + k * 60_000 + (k === 0 ? 0 : int(-3, 3) * 1000));
  // After the first half hour the beacons are thinned so the dataset size stays fixed.
  for (let k = 0; k < 6; k++) beaconTimes.push(istMs("10:14:05") + k * 45 * 60_000 + int(-3, 3) * 1000);

  for (const t of beaconTimes) {
    logs.push({
      ...base, type: "threat", time: iso(t), dstIp: "10.40.0.2", dstPort: 53, app: "dns",
      rule: "Allow-Prod-Outbound", action: "sinkhole", threatName: "Generic C2 beacon", severity: "critical",
      url: c2Domain, message: "DNS query sinkholed. Threat category: spyware",
    });
    logs.push({
      ...base, type: "traffic", time: iso(t + 1000), dstIp: sinkholeIp, dstPort: 443, app: "ssl",
      rule: "Allow-Prod-Outbound", action: "allow", sessionEndReason: "tcp-fin", bytesSent: 412, bytesReceived: 186,
    });
  }

  // Normal workload traffic, so the beacons are not the only thing this host does.
  const normal: [string, string, string, number, string, string][] = [
    ["07:45:10", "yum", "13.234.10.11", 443, "Allow-Software-Updates", "tcp-fin"],
    ["08:30:02", "ntp", "10.40.0.2", 123, "Allow-Prod-Outbound", "aged-out"],
    ["10:20:44", "aws-s3", "52.219.62.18", 443, "Allow-Prod-Outbound", "tcp-fin"],
    ["12:05:31", "aws-s3", "52.219.160.34", 443, "Allow-Prod-Outbound", "tcp-fin"],
    ["13:40:12", "dns", "10.40.0.2", 53, "Allow-Prod-Outbound", "aged-out"],
    ["14:15:55", "aws-s3", "52.219.62.18", 443, "Allow-Prod-Outbound", "tcp-fin"],
  ];
  for (const [hms, app, dstIp, dstPort, rule, reason] of normal) {
    logs.push({
      ...base, type: "traffic", time: istIso(hms), dstIp, dstPort, app, rule, action: "allow",
      sessionEndReason: reason, bytesSent: int(900, 220_000), bytesReceived: int(1_200, 4_000_000),
    });
  }
  return logs;
}

// ---------- noise generators ----------

type Gen = () => LogDraft;

const extApps = [
  { app: "ms-office365", dst: ["52.96.108.18", "52.96.166.114", "40.97.120.2"], port: 443, rule: "Allow-O365" },
  { app: "ms-teams", dst: ["52.112.100.4", "52.113.194.132"], port: 443, rule: "Allow-Collab" },
  { app: "zoom-base", dst: ["170.114.52.2", "149.137.24.30"], port: 443, rule: "Allow-Collab" },
  { app: "slack-base", dst: ["54.192.30.12", "3.33.130.190"], port: 443, rule: "Allow-Collab" },
  { app: "github-base", dst: ["140.82.112.3", "140.82.113.4"], port: 443, rule: "Allow-Dev-Github" },
  { app: "google-base", dst: ["142.250.77.46", "172.217.167.78"], port: 443, rule: "Allow-General-Web" },
  { app: "ssl", dst: ["104.18.32.7", "151.101.1.69", "34.117.59.81"], port: 443, rule: "Allow-General-Web" },
  { app: "web-browsing", dst: ["93.184.216.34", "151.101.65.69"], port: 80, rule: "Allow-General-Web" },
] as const;

const policyBlocks = [
  { app: "bittorrent", rule: "Block-P2P", action: "deny", ports: [6881, 6882, 6889, 51413] },
  { app: "teamviewer", rule: "Block-Unapproved-Remote-Access", action: "deny", ports: [5938] },
  { app: "anydesk", rule: "Block-Unapproved-Remote-Access", action: "deny", ports: [7070] },
  { app: "telnet", rule: "Block-Legacy-Protocols", action: "deny", ports: [23] },
  { app: "ftp", rule: "Block-Legacy-Protocols", action: "deny", ports: [21] },
  { app: "incomplete", rule: "Default-Deny", action: "deny", ports: [445, 3389, 8080, 8443, 5985] },
] as const;

function randomClient(): Pick<LogDraft, "srcIp" | "srcUser" | "device" | "location"> {
  return userBase(pick(noiseUsers));
}

const trafficPolicy: Gen = () => {
  if (faker.number.float({ min: 0, max: 1 }) < 0.2) {
    const rule = pick(["Block-Known-Bad-IPs", "Block-Tor-Exit", "Block-Geo-Restricted"] as const);
    const target = pick(hosts.filter((h) => h.environment === "prod" && h.hostname !== "prod-api-07"));
    return {
      type: "traffic", time: iso(noiseMs()), srcIp: pubIp(), dstIp: target.ip, dstPort: pick([22, 443, 3389, 8080]),
      app: "incomplete", rule, action: "drop", sessionEndReason: "policy-deny", bytesSent: 0, bytesReceived: 0,
      device: hostDevice(target), location: target.location,
    };
  }
  const b = pick(policyBlocks);
  return {
    type: "traffic", time: iso(noiseMs()), ...randomClient(), dstIp: pubIp(), dstPort: pick(b.ports),
    app: b.app, rule: b.rule, action: b.action, sessionEndReason: "policy-deny", bytesSent: 0, bytesReceived: 0,
  };
};

const trafficConnectivity: Gen = () => {
  const targets = [
    { ip: "10.10.2.20", port: 445, rule: "Allow-File-Services", app: "ms-ds-smb-base" },
    { ip: "10.10.1.10", port: 88, rule: "Allow-AD-Auth", app: "kerberos" },
    { ip: "10.10.1.10", port: 389, rule: "Allow-AD-Auth", app: "ldap" },
    { ip: "10.10.1.5", port: 22, rule: "Allow-Admin-SSH-JumpHost", app: "ssh" },
  ];
  const t = pick(targets);
  const branchUsers = noiseUsers.filter((u) => u.site);
  return {
    type: "traffic", time: iso(noiseMs()), ...userBase(pick(branchUsers)), dstIp: t.ip, dstPort: t.port, app: t.app,
    rule: t.rule, action: "allow",
    sessionEndReason: pick(["aged-out", "tcp-rst-from-server", "tcp-rst-from-client", "resources-unavailable"]),
    bytesSent: int(60, 1_800), bytesReceived: int(0, 900),
  };
};

const trafficThreatish: Gen = () => {
  const target = pick(hosts.filter((h) => h.hostname.startsWith("prod-web") || h.hostname === "jump-host-01"));
  return {
    type: "traffic", time: iso(noiseMs()), srcIp: pubIp(), dstIp: target.ip,
    dstPort: target.hostname === "jump-host-01" ? 22 : pick([443, 80]),
    app: target.hostname === "jump-host-01" ? "ssh" : pick(["ssl", "web-browsing"]),
    rule: target.hostname === "jump-host-01" ? "Block-Known-Bad-IPs" : "Allow-Prod-Inbound-Web",
    action: "reset-both", sessionEndReason: "threat", bytesSent: int(200, 4_000), bytesReceived: int(0, 800),
    device: hostDevice(target), location: target.location,
  };
};

const trafficPure: Gen = () => {
  const roll = faker.number.float({ min: 0, max: 1 });
  if (roll < 0.2) {
    const h = pick(hosts.filter((x) => x.role !== "firewall" && x.hostname !== "prod-api-07"));
    return {
      type: "traffic", time: iso(noiseMs()), srcIp: h.ip, dstIp: pick(["10.10.1.10", "10.10.1.11"]), dstPort: 53, app: "dns",
      rule: "Allow-DNS-Internal", action: "allow", sessionEndReason: "aged-out", bytesSent: int(70, 140), bytesReceived: int(90, 400),
      device: hostDevice(h), location: h.location,
    };
  }
  const a = pick(extApps);
  return {
    type: "traffic", time: iso(noiseMs()), ...randomClient(), dstIp: pick(a.dst), dstPort: a.port, app: a.app,
    rule: a.rule, action: "allow", sessionEndReason: pick(["tcp-fin", "tcp-fin", "aged-out"]),
    bytesSent: int(2_000, 150_000), bytesReceived: int(10_000, 5_000_000),
  };
};

const trafficNoise: Gen = () =>
  weighted<Gen>([
    { weight: 40, value: trafficPolicy },
    { weight: 15, value: trafficConnectivity },
    { weight: 15, value: trafficThreatish },
    { weight: 30, value: trafficPure },
  ])();

const urlBlocked: [string, string[], Severity][] = [
  ["social-networking", ["facebook.com", "instagram.com", "x.com", "linkedin.com/feed"], "low"],
  ["streaming-media", ["youtube.com", "netflix.com", "spotify.com", "twitch.tv"], "low"],
  ["games", ["steampowered.com", "roblox.com", "epicgames.com"], "low"],
  ["peer-to-peer", ["thepiratebay.org", "1337x.to"], "low"],
  ["online-storage-and-backup", ["mega.nz", "wetransfer.com", "mediafire.com"], "medium"],
  ["gambling", ["bet365.com", "dream11.com"], "low"],
  ["proxy-avoidance-and-anonymizers", ["protonvpn.com", "hide.me", "nordvpn.com"], "medium"],
  ["dynamic-dns", ["no-ip.com", "freedns.afraid.org", "duckdns.org"], "medium"],
  ["phishing", ["secure-login-m365-verify.com", "acme-payroll-update.info"], "high"],
  ["malware", ["dl.softupdate-center.biz", "cdn-fastfile.top"], "high"],
  ["newly-registered-domain", ["xk3-promo.top", "free-offer-claim.click"], "medium"],
  ["hacking", ["exploit-db.com", "hackforums.net"], "medium"],
];
const urlAllowed: [string, string[]][] = [
  ["search-engines", ["google.com/search", "bing.com/search", "duckduckgo.com"]],
  ["computer-and-internet-info", ["stackoverflow.com", "developer.mozilla.org", "docs.python.org"]],
  ["business-and-economy", ["zoom.us/j", "atlassian.net", "hubspot.com", "zendesk.com"]],
  ["news", ["timesofindia.indiatimes.com", "bbc.com/news", "economictimes.com"]],
  ["cloud-storage", ["drive.google.com", "onedrive.live.com"]],
];

const urlNoise: Gen = () => {
  const c = randomClient();
  const roll = faker.number.float({ min: 0, max: 1 });
  if (roll < 0.65) {
    const [category, domains, severity] = pick(urlBlocked);
    const phishOrMalware = category === "phishing" || category === "malware";
    return {
      type: "url", time: iso(noiseMs()), ...c, dstIp: pubIp(), dstPort: 443, app: "ssl", rule: "Allow-General-Web",
      action: phishOrMalware ? "block-url" : pick(["block-url", "block-url", "alert"]),
      urlCategory: category, severity, url: pick(domains),
    };
  }
  const [category, domains] = pick(urlAllowed);
  return {
    type: "url", time: iso(noiseMs()), ...c, dstIp: pubIp(), dstPort: 443, app: pick(["ssl", "web-browsing"]),
    rule: "Allow-General-Web", action: "allow", urlCategory: category, severity: "info", url: pick(domains),
  };
};

const threatCatalog: { name: string; severity: Severity; port: number; app: string; msg: string; actions: string[]; inbound: boolean }[] = [
  { name: "SSH Brute Force Attempt", severity: "high", port: 22, app: "ssh", msg: "Threat category: brute-force", actions: ["reset-both", "alert", "block-ip"], inbound: true },
  { name: "Apache Log4j Remote Code Execution Vulnerability", severity: "critical", port: 443, app: "ssl", msg: "Threat category: code-execution. CVE-2021-44228", actions: ["reset-both", "drop"], inbound: true },
  { name: "SQL Injection Attempt", severity: "medium", port: 443, app: "web-browsing", msg: "Threat category: sql-injection", actions: ["reset-both", "alert"], inbound: true },
  { name: "HTTP Directory Traversal Request Attempt", severity: "medium", port: 80, app: "web-browsing", msg: "Threat category: info-leak", actions: ["alert", "reset-both"], inbound: true },
  { name: "ZmEu Scanner Detection", severity: "low", port: 80, app: "web-browsing", msg: "Threat category: scan", actions: ["alert"], inbound: true },
  { name: "TCP Port Scan", severity: "low", port: 445, app: "incomplete", msg: "Threat category: reconnaissance", actions: ["alert", "block-ip"], inbound: true },
  { name: "WordPress wp-login Brute Force Attempt", severity: "medium", port: 443, app: "web-browsing", msg: "Threat category: brute-force", actions: ["alert", "reset-both"], inbound: true },
  { name: "Adware.Generic Download", severity: "low", port: 443, app: "ssl", msg: "WildFire verdict: grayware", actions: ["alert", "drop"], inbound: false },
  { name: "Suspicious HTTP Evasion Found", severity: "info", port: 80, app: "web-browsing", msg: "Threat category: protocol-anomaly", actions: ["alert"], inbound: false },
  { name: "Dynamic DNS Domain Query", severity: "low", port: 53, app: "dns", msg: "Threat category: dns-ddns", actions: ["alert"], inbound: false },
  { name: "Trojan Download Blocked", severity: "high", port: 80, app: "web-browsing", msg: "WildFire verdict: malicious", actions: ["drop", "reset-both"], inbound: false },
];

const threatNoise: Gen = () => {
  const t = pick(threatCatalog);
  if (t.inbound) {
    const target = pick(hosts.filter((h) => h.role !== "firewall" && h.hostname !== "prod-api-07"));
    return {
      type: "threat", time: iso(noiseMs()), srcIp: pubIp(), dstIp: target.ip, dstPort: t.port, app: t.app,
      rule: t.name === "SSH Brute Force Attempt" ? "Allow-Admin-SSH-JumpHost" : "Allow-Prod-Inbound-Web",
      action: pick(t.actions), threatName: t.name, severity: t.severity, message: t.msg,
      device: hostDevice(target), location: target.location,
    };
  }
  const u = pick(noiseUsers);
  return {
    type: "threat", time: iso(noiseMs()), ...userBase(u), dstIp: pubIp(), dstPort: t.port, app: t.app,
    rule: "Allow-General-Web", action: pick(t.actions), threatName: t.name, severity: t.severity, message: t.msg,
    url: t.app === "dns" ? "myhost-lab.duckdns.org" : undefined,
  };
};

const decryptionSites = [
  "outlook.office365.com", "teams.microsoft.com", "slack.com", "github.com", "docs.google.com",
  "zoom.us", "stackoverflow.com", "atlassian.net", "cdn.jsdelivr.net", "api.segment.io",
];
const decryptionErrors = [
  "Unsupported cipher suite: client offered only legacy ciphers",
  "Client closed connection during handshake",
  "Certificate validation failed: untrusted issuer",
  "Unsupported protocol version: TLS 1.0",
  "Server certificate expired",
];
const noDecryptSites: [string, string][] = [
  ["No-Decrypt-Financial-Services", "netbanking.hdfcbank.com"],
  ["No-Decrypt-Financial-Services", "retail.onlinesbi.sbi"],
  ["No-Decrypt-Health-And-Medicine", "portal.apollo247.com"],
  ["No-Decrypt-Government", "incometax.gov.in"],
];

const decryptionNoise: Gen = () => {
  const c = randomClient();
  const roll = faker.number.float({ min: 0, max: 1 });
  if (roll < 0.25) {
    const [rule, site] = pick(noDecryptSites);
    return {
      type: "decryption", time: iso(noiseMs()), ...c, dstIp: pubIp(), dstPort: 443, app: "ssl", rule,
      action: "no-decrypt", severity: "info", url: site, message: "Session not decrypted: matched no-decrypt rule",
    };
  }
  if (roll < 0.62) {
    return {
      type: "decryption", time: iso(noiseMs()), ...c, dstIp: pubIp(), dstPort: 443, app: "ssl",
      rule: "Decrypt-All-Outbound", action: "decrypt", severity: "low", url: pick(decryptionSites),
      message: pick(decryptionErrors),
    };
  }
  return {
    type: "decryption", time: iso(noiseMs()), ...c, dstIp: pubIp(), dstPort: 443, app: "ssl",
    rule: "Decrypt-All-Outbound", action: "decrypt", severity: "info", url: pick(decryptionSites),
    message: `Session decrypted: ${pick(["TLS 1.3", "TLS 1.2"])}, ${pick(["TLS_AES_256_GCM_SHA384", "TLS_AES_128_GCM_SHA256", "ECDHE-RSA-AES256-GCM-SHA384"])}`,
  };
};

const flappingSites = ["Kolkata-Branch-01", "Kolkata-Branch-01", "Kolkata-Branch-01", "Ahmedabad-Branch-01", "Ahmedabad-Branch-01", "Hyderabad-Branch-01", "Jaipur-Branch-01", "Kochi-Branch-01", "Delhi-Branch-01"];

const systemConnectivity: Gen = () => {
  const roll = faker.number.float({ min: 0, max: 1 });
  if (roll < 0.25) {
    const sc = pick(serviceConnections);
    const msg = pick([
      `BGP session to ${sc.name} reset: hold timer expired`,
      `BGP session to ${sc.name} established`,
      `Service connection ${sc.name} latency above threshold: ${int(80, 190)} ms`,
    ]);
    return { type: "system", time: iso(noiseMs()), device: `${slug(sc.name.replace("SC-", ""))}-sc-gw`, location: sc.region, severity: msg.includes("established") ? "info" : "medium", message: msg };
  }
  if (roll < 0.4) {
    const u = pick(noiseUsers.filter((x) => !x.site));
    return {
      type: "system", time: iso(noiseMs()), device: gpDevice(u.location), location: u.location, severity: "info",
      message: `GlobalProtect: user ${u.email} reconnected after network change`,
    };
  }
  const siteName = pick(flappingSites);
  const net = networks.find((n) => n.name === siteName);
  if (!net) throw new Error("Unknown flapping site");
  const tun = `tun-prisma-${slug(net.location)}`;
  const options: [string, Severity][] = [
    [`Tunnel ${tun} state changed: up -> down (DPD timeout)`, "high"],
    [`Tunnel ${tun} state changed: down -> up`, "info"],
    [`IKE phase-1 negotiation to ${net.prismaIp} timed out, retransmitting`, "medium"],
    [`Path monitor failed for ${tun}: destination 198.51.100.1 unreachable`, "medium"],
    [`Path monitor recovered for ${tun}`, "info"],
  ];
  const [message, severity] = pick(options);
  return { type: "system", time: iso(noiseMs()), device: net.device, location: net.location, severity, message };
};

const systemPure: Gen = () => {
  const net = pick(networks.filter((n) => n.name !== "Pune-Branch-01"));
  const options: [string, Severity][] = [
    ["NTP synchronization completed, offset 3 ms", "info"],
    [`Content update ${int(8800, 8860)}-${int(1000, 9000)} installed`, "info"],
    ["Log forwarding to syslog server reconnected", "info"],
    [`Dataplane CPU ${int(78, 88)}% above threshold for 2 minutes`, "medium"],
    [`Management disk usage at ${int(71, 84)}%`, "low"],
    ["Certificate gp-portal.acme.io expires in 29 days", "low"],
    [`Admin ${pick(["secops.admin", "netops.admin", "fw.admin"])} logged in to web UI`, "info"],
  ];
  const [message, severity] = pick(options);
  return { type: "system", time: iso(noiseMs()), device: net.device, location: net.location, severity, message };
};

const systemNoise: Gen = () =>
  weighted<Gen>([
    { weight: 70, value: systemConnectivity },
    { weight: 30, value: systemPure },
  ])();

const configNoise: Gen = () => {
  const admin = pick(["secops.admin", "netops.admin", "fw.admin", "cloudops.admin"]);
  const rule = pick(securityRules.filter((r) => !["Block-Quarantine", "Block-Legacy-Protocols"].includes(r.name)));
  const options: { action: string; message: string; rule?: string }[] = [
    { action: "edit", rule: rule.name, message: `${admin} edited security rule ${rule.name}: description` },
    { action: "edit", rule: rule.name, message: `${admin} edited security rule ${rule.name}: log forwarding profile` },
    { action: "add", message: `${admin} added address object srv-${int(10, 99)}.acme.internal` },
    { action: "edit", message: `${admin} edited URL filtering profile Corp-URL-Filtering: added category online-storage-and-backup` },
    { action: "edit", message: `${admin} updated external dynamic list Known-Bad-IPs` },
    { action: "delete", message: `${admin} removed expired address object tmp-vendor-${int(1, 20)}` },
    { action: "commit", message: `Commit succeeded (job ${int(2100, 2290)}) by ${admin}` },
    { action: "commit", message: `Commit succeeded (job ${int(2100, 2290)}) by ${admin}` },
  ];
  const o = pick(options);
  return {
    type: "config", time: iso(noiseMs()), srcUser: admin, action: o.action, severity: "info", device: "panorama-01",
    ...(o.rule ? { rule: o.rule } : {}), message: o.message,
  };
};

function buildLogs(): LogRecord[] {
  const fixed: LogDraft[] = [...scenarioLogsA(), ...scenarioLogsB(), ...scenarioLogsC()];
  const counts: Record<LogType, number> = { traffic: 0, url: 0, threat: 0, decryption: 0, system: 0, config: 0 };
  for (const l of fixed) counts[l.type] += 1;

  const gens: Record<LogType, Gen> = {
    traffic: trafficNoise, url: urlNoise, threat: threatNoise,
    decryption: decryptionNoise, system: systemNoise, config: configNoise,
  };
  const all: LogDraft[] = [...fixed];
  (Object.keys(LOG_TARGETS) as LogType[]).forEach((type) => {
    const need = LOG_TARGETS[type] - counts[type];
    if (need < 0) throw new Error(`Scenario ${type} logs exceed target by ${-need}`);
    for (let i = 0; i < need; i++) all.push(gens[type]());
  });

  const sorted = all
    .map((l, i) => ({ l, i }))
    .sort((a, b) => a.l.time.localeCompare(b.l.time) || a.i - b.i)
    .map(({ l }) => l);
  return sorted.map((l, i) => ({ id: `LOG-${String(i + 1).padStart(4, "0")}`, ...l }));
}

// ---------- alerts ----------

function scenarioAlerts(): Alert[] {
  return [
    {
      id: "ALR-1042", title: "User cannot reach Salesforce", severity: "medium", status: "new",
      createdAt: istIso("14:26:00"), source: "Helpdesk INC-88213", category: "access", scenarioId: "A",
      entities: { users: [RAHUL], ips: [RAHUL_IP, "13.110.54.20"] },
      summary: "Helpdesk ticket INC-88213 forwarded to security. Rahul Mehta (GlobalProtect, Mumbai) reports that login.salesforce.com stopped loading around 2:20 PM.",
    },
    {
      id: "ALR-1037", title: "Remote network Pune-Branch-01: tunnel down", severity: "high", status: "new",
      createdAt: istIso("11:42:40"), source: "Remote network monitor", category: "connectivity", scenarioId: "B",
      entities: { sites: ["Pune-Branch-01"], hosts: ["pune-fw-01"], ips: ["203.0.113.10", "198.51.100.24"] },
      summary: "IPsec tunnel between pune-fw-01 (peer 203.0.113.10) and Prisma (198.51.100.24) went down at 11:42:08 IST. Change window CHG-4471 (11:30 to 11:40, netops.admin) closed shortly before.",
    },
    {
      id: "ALR-1049", title: "Command and control traffic from prod workload", severity: "critical", status: "new",
      createdAt: istIso("09:14:10"), source: "Threat prevention", category: "threat", scenarioId: "C",
      entities: { hosts: ["prod-api-07"], ips: [PROD07_IP, "192.0.2.53", "185.220.101.47"] },
      summary: "prod-api-07 (10.40.2.15, SC-AWS-Mumbai) is querying update-check.cdn-sync.net every 60 seconds. First seen 09:12:05 IST.",
    },
  ];
}

interface AlertTemplate {
  title: (e: Ent) => string;
  severity: Severity;
  category: Alert["category"];
  status: AlertStatus;
  source: string;
  kind: "user" | "host" | "site" | "sc";
  summary: (e: Ent) => string;
}
interface Ent { user: User; host: Host; site: string; sc: string }

const T = (
  kind: AlertTemplate["kind"], category: Alert["category"], severity: Severity, status: AlertStatus,
  source: string, title: AlertTemplate["title"], summary: AlertTemplate["summary"],
): AlertTemplate => ({ kind, category, severity, status, source, title, summary });

const alertTemplates: AlertTemplate[] = [
  T("user", "access", "medium", "new", "Helpdesk INC-88190", (e) => `${e.user.displayName} cannot connect to GlobalProtect`, (e) => `Repeated portal login failures for ${e.user.email} from ${e.user.location}.`),
  T("user", "access", "low", "resolved", "GlobalProtect", (e) => `Repeated GlobalProtect login failures for ${e.user.email}`, () => "Password expired. User reset it and reconnected."),
  T("user", "access", "low", "resolved", "GlobalProtect", (e) => `VPN reconnect loop for ${e.user.email}`, () => "Client on an unstable home network. No gateway issue found."),
  T("user", "access", "low", "resolved", "Helpdesk INC-88121", (e) => `${e.user.displayName} cannot reach internal wiki`, () => "Stale DNS cache on the laptop. Cleared and confirmed."),
  T("user", "access", "low", "investigating", "Helpdesk INC-88176", (e) => `Slow Microsoft 365 for ${e.user.displayName}`, (e) => `Latency reports from ${e.user.location}. Checking gateway load.`),
  T("user", "policy", "low", "resolved", "URL filtering", (e) => `Zoom blocked for ${e.user.email}`, () => "Browser extension was hitting a blocked category. Extension removed."),
  T("user", "policy", "low", "resolved", "URL filtering", (e) => `Upload to cloud storage blocked for ${e.user.email}`, () => "Category online-storage-and-backup is blocked by policy. User directed to the approved tool."),
  T("user", "access", "low", "resolved", "Helpdesk INC-88150", (e) => `Certificate warning on intranet site for ${e.user.displayName}`, () => "Root CA missing on a new laptop. Pushed through device management."),
  T("user", "policy", "low", "investigating", "URL filtering", (e) => `Repeated social networking blocks for ${e.user.email}`, () => "More than 60 blocked requests in 24 hours."),
  T("user", "policy", "low", "new", "Application control", (e) => `Peer to peer traffic blocked from ${e.user.email}`, () => "BitTorrent sessions denied by Block-P2P."),
  T("user", "policy", "medium", "new", "Application control", (e) => `Unapproved remote access tool blocked for ${e.user.email}`, () => "TeamViewer sessions denied by Block-Unapproved-Remote-Access."),
  T("user", "policy", "medium", "new", "URL filtering", (e) => `Upload to unsanctioned storage blocked for ${e.user.email}`, () => "Requests to mega.nz denied. Check for data exfiltration intent."),
  T("user", "access", "medium", "investigating", "GlobalProtect", (e) => `GlobalProtect login from a new country for ${e.user.email}`, () => "Login from an unusual location. Waiting on confirmation from the user."),
  T("user", "threat", "low", "resolved", "WildFire", (e) => `Grayware download by ${e.user.email}`, () => "WildFire verdict grayware. Blocked and the user was informed."),
  T("user", "threat", "high", "escalated", "Threat prevention", (e) => `Outbound connection to a known bad address from ${e.user.email}`, () => "Blocked by Block-Known-Bad-IPs. Endpoint scan requested from IR."),
  T("site", "connectivity", "high", "investigating", "Remote network monitor", (e) => `Remote network ${e.site}: tunnel flapping`, (e) => `${e.site} tunnel went down and up repeatedly in the last hours.`),
  T("site", "connectivity", "high", "resolved", "Remote network monitor", (e) => `Remote network ${e.site}: tunnel down`, () => "ISP link restored by the provider. Tunnel recovered on its own."),
  T("site", "connectivity", "low", "resolved", "Remote network monitor", (e) => `Duplicate: ${e.site} tunnel flapping`, () => "Duplicate of an open alert. Merged."),
  T("site", "connectivity", "medium", "new", "Remote network monitor", (e) => `Remote network ${e.site}: high latency`, () => "Round trip time above 120 ms for 30 minutes."),
  T("site", "connectivity", "medium", "resolved", "Remote network monitor", (e) => `Remote network ${e.site}: DPD timeout`, () => "Single DPD timeout during an ISP maintenance window."),
  T("site", "connectivity", "low", "new", "Remote network monitor", (e) => `Remote network ${e.site}: bandwidth above 90 percent`, () => "Sustained high use during backup hours."),
  T("site", "connectivity", "medium", "resolved", "Remote network monitor", (e) => `Remote network ${e.site}: path monitor failed`, () => "Path monitor probe target was rebooted. Recovered."),
  T("site", "connectivity", "low", "resolved", "HA monitor", (e) => `HA failover on ${e.site}`, () => "Planned maintenance. Peer took over and failed back."),
  T("sc", "connectivity", "medium", "resolved", "Service connection monitor", (e) => `Service connection ${e.sc}: BGP session reset`, () => "Hold timer expired once. Session re-established in 40 seconds."),
  T("sc", "connectivity", "medium", "new", "Service connection monitor", (e) => `Service connection ${e.sc}: latency above threshold`, () => "Round trip time above threshold for 15 minutes."),
  T("host", "threat", "medium", "new", "Threat prevention", (e) => `Port scan from external address against ${e.host.hostname}`, () => "Reconnaissance from a single external source. Blocked at the edge."),
  T("host", "threat", "low", "resolved", "Threat prevention", (e) => `Duplicate: port scan against ${e.host.hostname}`, () => "Duplicate of an earlier alert. Merged."),
  T("host", "threat", "high", "investigating", "Threat prevention", (e) => `SSH brute force against ${e.host.hostname}`, () => "More than 200 failed logins from several sources."),
  T("host", "threat", "medium", "resolved", "Threat prevention", (e) => `Log4j exploit attempt blocked on ${e.host.hostname}`, () => "Attempt blocked by threat prevention. Host is patched."),
  T("host", "threat", "medium", "resolved", "Threat prevention", (e) => `SQL injection attempt against ${e.host.hostname}`, () => "Blocked at the edge. No application errors seen."),
  T("host", "threat", "medium", "false_positive", "DNS security", (e) => `Dynamic DNS query from ${e.host.hostname}`, () => "Known developer test domain. No further activity."),
  T("host", "threat", "medium", "false_positive", "DNS security", (e) => `Possible DNS tunneling from ${e.host.hostname}`, () => "High query volume came from a monitoring agent."),
  T("host", "threat", "low", "false_positive", "Threat prevention", (e) => `Internal vulnerability scan from ${e.host.hostname}`, () => "Scheduled scan approved by the security team."),
  T("host", "policy", "low", "false_positive", "Application control", (e) => `Legacy protocol blocked for ${e.host.hostname}`, () => "Old print job script. Owner updated it."),
  T("host", "policy", "low", "new", "Decryption", (e) => `Decryption failures on ${e.host.hostname}`, () => "Unsupported cipher suite offered by a legacy client."),
  T("site", "policy", "low", "resolved", "Config audit", () => "Config change outside the change window", () => "Rule description edited by secops.admin. Documented and approved."),
  T("site", "connectivity", "low", "new", "Remote network monitor", (e) => `Remote network ${e.site}: certificate expiring`, () => "Device certificate expires in 29 days."),
];

function buildAlerts(): Alert[] {
  const ids = faker.helpers.shuffle(
    Array.from({ length: 40 }, (_, i) => 1019 + i).filter((n) => ![1037, 1042, 1049].includes(n)),
  );
  const assignees = ["Priya Nair", "Arjun Rao", "Meera Iyer", "Karan Shah"];
  const siteNames = networks.filter((n) => n.name !== "Pune-Branch-01").map((n) => n.name);
  const noiseHosts = hosts.filter((h) => h.hostname !== "prod-api-07" && h.role !== "firewall");
  const alerts: Alert[] = alertTemplates.map((tpl, i) => {
    const ent: Ent = {
      user: pick(noiseUsers),
      host: pick(noiseHosts),
      site: pick(siteNames),
      sc: pick(serviceConnections).name,
    };
    const entities: Alert["entities"] =
      tpl.kind === "user" ? { users: [ent.user.email], ips: [ent.user.ip] }
      : tpl.kind === "host" ? { hosts: [ent.host.hostname], ips: [ent.host.ip] }
      : tpl.kind === "site" ? { sites: [ent.site], ips: [networks.find((n) => n.name === ent.site)?.peerIp ?? ""] }
      : { sites: [ent.sc] };
    const assignee = tpl.status === "new" && faker.number.float({ min: 0, max: 1 }) < 0.7 ? undefined : pick(assignees);
    return {
      id: `ALR-${ids[i]}`, title: tpl.title(ent), severity: tpl.severity, status: tpl.status,
      createdAt: iso(noiseMs()), source: tpl.source, category: tpl.category, entities,
      ...(assignee ? { assignee } : {}), summary: tpl.summary(ent),
    };
  });
  return [...scenarioAlerts(), ...alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---------- write ----------

function write(name: string, data: unknown): void {
  writeFileSync(path.join(OUT_DIR, name), `${JSON.stringify(data, null, 2)}\n`);
}

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  const logs = buildLogs();
  const alerts = buildAlerts();
  if (securityRules.length !== 25) throw new Error(`Expected 25 security rules, got ${securityRules.length}`);
  if (logs.length !== 500) throw new Error(`Expected 500 logs, got ${logs.length}`);
  if (alerts.length !== 40) throw new Error(`Expected 40 alerts, got ${alerts.length}`);

  write("alerts.json", alerts);
  write("logs.json", logs);
  write("rules.json", securityRules);
  write("decryption-rules.json", decryptionRules);
  write("networks.json", networks);
  write("service-connections.json", serviceConnections);
  write("users.json", users);
  write("hosts.json", hosts);
  console.log(
    `generate-data: ${alerts.length} alerts, ${logs.length} logs, ${securityRules.length} rules, ` +
      `${decryptionRules.length} decryption rules, ${networks.length} networks, ${serviceConnections.length} service connections, ` +
      `${users.length} users, ${hosts.length} hosts`,
  );
}

main();
