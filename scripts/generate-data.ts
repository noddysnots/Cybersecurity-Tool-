/**
 * Fixed-seed dataset generator for Triage Console v2.
 * Case needles are hand-written in needles.ts and never randomized.
 */
import { faker } from "@faker-js/faker";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  AddressObject,
  AppGroup,
  ConfigChange,
  DecryptionRule,
  LogRecord,
  MobileUser,
  PlatformAlert,
  RemoteNetwork,
  SecurityRule,
  ServiceObject,
  Ticket,
  User,
} from "../src/types";
import {
  allowCollabMobile,
  allowCollabRn,
  ankitDecryptOk,
  ankitDrop100214,
  ankitDrop100231,
  ankitGpConnect,
  ankitUrlAllow,
  blockQuicRule,
  case1EarlyDrops,
  case2SystemRetries,
  caseAlert,
  caseTickets,
  caseUsers,
  chg4471,
  chg5120,
  DEMO_NOW,
  puneConfigDhChange,
  puneRemoteNetwork,
  puneSystemNoProposal,
  sanaAllow100540,
  svcQuicBlock,
  WINDOW_START,
} from "./needles";

const SEED = 24817;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../src/data");

const BRANCHES: Omit<RemoteNetwork, "id" | "tunnelState" | "lastStateChange" | "tunnelUptimePct30d">[] =
  [
    {
      name: "Mumbai-HQ-01",
      location: "India West",
      peerIp: "203.0.113.20",
      bandwidthMbps: 1000,
      ikeGateway: "gw-prisma-mumbai",
      ipsecTunnel: "tun-prisma-mumbai",
      branchHostname: "mumbai-fw-01",
      branchModel: "PA-850",
      subnet: "10.10.0.0/16",
    },
    {
      name: "Bengaluru-Branch-01",
      location: "India South",
      peerIp: "203.0.113.30",
      bandwidthMbps: 500,
      ikeGateway: "gw-prisma-blr",
      ipsecTunnel: "tun-prisma-blr",
      branchHostname: "blr-fw-01",
      branchModel: "PA-440",
      subnet: "10.50.0.0/16",
    },
    {
      name: "Hyderabad-Branch-01",
      location: "India South",
      peerIp: "203.0.113.40",
      bandwidthMbps: 300,
      ikeGateway: "gw-prisma-hyd",
      ipsecTunnel: "tun-prisma-hyd",
      branchHostname: "hyd-fw-01",
      branchModel: "PA-440",
      subnet: "10.70.0.0/16",
    },
    {
      name: "Chennai-Branch-01",
      location: "India South",
      peerIp: "203.0.113.50",
      bandwidthMbps: 300,
      ikeGateway: "gw-prisma-chn",
      ipsecTunnel: "tun-prisma-chn",
      branchHostname: "chn-fw-01",
      branchModel: "PA-440",
      subnet: "10.80.0.0/16",
    },
    {
      name: "Delhi-Branch-01",
      location: "India West",
      peerIp: "203.0.113.60",
      bandwidthMbps: 500,
      ikeGateway: "gw-prisma-del",
      ipsecTunnel: "tun-prisma-del",
      branchHostname: "del-fw-01",
      branchModel: "PA-850",
      subnet: "10.90.0.0/16",
    },
    {
      name: "Ahmedabad-Branch-01",
      location: "India West",
      peerIp: "203.0.113.70",
      bandwidthMbps: 200,
      ikeGateway: "gw-prisma-amd",
      ipsecTunnel: "tun-prisma-amd",
      branchHostname: "amd-fw-01",
      branchModel: "PA-440",
      subnet: "10.100.0.0/16",
    },
    {
      name: "Kolkata-Branch-01",
      location: "India South",
      peerIp: "203.0.113.80",
      bandwidthMbps: 200,
      ikeGateway: "gw-prisma-ccu",
      ipsecTunnel: "tun-prisma-ccu",
      branchHostname: "ccu-fw-01",
      branchModel: "PA-440",
      subnet: "10.110.0.0/16",
    },
    {
      name: "Jaipur-Branch-01",
      location: "India West",
      peerIp: "203.0.113.90",
      bandwidthMbps: 100,
      ikeGateway: "gw-prisma-jai",
      ipsecTunnel: "tun-prisma-jai",
      branchHostname: "jai-fw-01",
      branchModel: "PA-440",
      subnet: "10.120.0.0/16",
    },
    {
      name: "Kochi-Branch-01",
      location: "India South",
      peerIp: "203.0.113.100",
      bandwidthMbps: 100,
      ikeGateway: "gw-prisma-cok",
      ipsecTunnel: "tun-prisma-cok",
      branchHostname: "cok-fw-01",
      branchModel: "PA-440",
      subnet: "10.130.0.0/16",
    },
    {
      name: "Noida-Branch-01",
      location: "India West",
      peerIp: "203.0.113.110",
      bandwidthMbps: 300,
      ikeGateway: "gw-prisma-noid",
      ipsecTunnel: "tun-prisma-noid",
      branchHostname: "noid-fw-01",
      branchModel: "PA-440",
      subnet: "10.140.0.0/16",
    },
    {
      name: "Pune-DR-01",
      location: "India West",
      peerIp: "203.0.113.120",
      bandwidthMbps: 200,
      ikeGateway: "gw-prisma-pune-dr",
      ipsecTunnel: "tun-prisma-pune-dr",
      branchHostname: "pune-dr-fw-01",
      branchModel: "PA-440",
      subnet: "10.150.0.0/16",
    },
  ];

const APPS = [
  "ms-teams",
  "slack-base",
  "zoom",
  "office365",
  "salesforce-base",
  "github-base",
  "ssl",
  "web-browsing",
  "dns",
  "google-base",
  "outlook-web",
  "boxnet",
  "dropbox",
  "servicenow",
  "okta",
] as const;

const RULE_NAMES_SHARED = [
  "Allow-DNS",
  "Allow-NTP",
  "Deny-High-Risk",
  "Allow-Infra-Mgmt",
  "Cleanup-Deny",
];

const RULE_NAMES_MU = [
  "Allow-GP-Portal",
  "Allow-Web-Business",
  "Allow-Office365",
  "Allow-GitHub",
  "Allow-Salesforce",
  "Deny-File-Share-Personal",
  "Allow-Zoom",
  "Allow-Slack",
  "Allow-Internal-Apps",
  "Threat-Prevention-Alert",
  "Decrypt-Bypass-Finance",
];

const RULE_NAMES_RN = [
  "Allow-Branch-Internet",
  "Allow-Branch-Office365",
  "Allow-Branch-DNS",
  "Allow-Interbranch",
  "Deny-Risky-URL",
  "Allow-VoIP-Signaling",
  "Allow-Printer-Cloud",
  "Branch-Cleanup",
];

const LOCATIONS = [
  "Mumbai",
  "Pune",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Delhi",
  "Ahmedabad",
  "Kolkata",
  "Jaipur",
  "Kochi",
  "Noida",
  "Remote",
];

const DEPARTMENTS = [
  "Engineering",
  "Sales",
  "Finance",
  "HR",
  "IT",
  "Marketing",
  "Support",
  "Legal",
  "Operations",
  "Network",
  "SecOps",
];

function writeJson(name: string, data: unknown): void {
  writeFileSync(path.join(outDir, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function randomBetween(startMs: number, endMs: number): string {
  const t = faker.number.int({ min: startMs, max: endMs });
  return new Date(t).toISOString();
}

function buildUsers(): User[] {
  const users = [...caseUsers];
  let i = 0;
  while (users.length < 70) {
    i += 1;
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    const email = `${first}.${last}${i}@acme.io`.toLowerCase().replaceAll(" ", "");
    if (users.some((u) => u.email === email)) {
      continue;
    }
    users.push({
      id: `user-${i.toString().padStart(3, "0")}`,
      name: `${first} ${last}`,
      email,
      department: faker.helpers.arrayElement(DEPARTMENTS),
      location: faker.helpers.arrayElement(LOCATIONS),
      title: faker.person.jobTitle(),
    });
  }
  return users;
}

function buildRemoteNetworks(): RemoteNetwork[] {
  const networks: RemoteNetwork[] = [puneRemoteNetwork];
  for (const branch of BRANCHES) {
    networks.push({
      id: `rn-${branch.name.toLowerCase()}`,
      ...branch,
      tunnelState: "up",
      tunnelUptimePct30d: faker.number.float({ min: 99.2, max: 99.99, fractionDigits: 2 }),
      lastStateChange: randomBetween(
        Date.parse(WINDOW_START),
        Date.parse("2026-10-06T05:00:00.000Z"),
      ),
    });
  }
  return networks;
}

function buildServiceObjects(): ServiceObject[] {
  const extras: ServiceObject[] = [
    svcQuicBlock,
    {
      id: "svc-application-default",
      name: "application-default",
      protocol: "tcp-udp",
      destinationPorts: "application-default",
      sourcePorts: "any",
      description: "Application default ports",
      container: "Shared",
    },
    {
      id: "svc-service-https",
      name: "service-https",
      protocol: "tcp",
      destinationPorts: "443",
      sourcePorts: "any",
      description: "HTTPS",
      container: "Shared",
    },
    {
      id: "svc-service-http",
      name: "service-http",
      protocol: "tcp",
      destinationPorts: "80",
      sourcePorts: "any",
      description: "HTTP",
      container: "Shared",
    },
    {
      id: "svc-dns-udp",
      name: "service-dns",
      protocol: "udp",
      destinationPorts: "53",
      sourcePorts: "any",
      description: "DNS",
      container: "Shared",
    },
    {
      id: "svc-ntp-udp",
      name: "service-ntp",
      protocol: "udp",
      destinationPorts: "123",
      sourcePorts: "any",
      description: "NTP",
      container: "Shared",
    },
    {
      id: "svc-ike",
      name: "service-ike",
      protocol: "udp",
      destinationPorts: "500,4500",
      sourcePorts: "any",
      description: "IKE/NAT-T",
      container: "Shared",
    },
    {
      id: "svc-rdp",
      name: "service-rdp",
      protocol: "tcp",
      destinationPorts: "3389",
      sourcePorts: "any",
      description: "RDP",
      container: "Shared",
    },
    {
      id: "svc-ssh",
      name: "service-ssh",
      protocol: "tcp",
      destinationPorts: "22",
      sourcePorts: "any",
      description: "SSH",
      container: "Shared",
    },
    {
      id: "svc-smtp",
      name: "service-smtp",
      protocol: "tcp",
      destinationPorts: "25,587",
      sourcePorts: "any",
      description: "SMTP",
      container: "Shared",
    },
    {
      id: "svc-ldap",
      name: "service-ldap",
      protocol: "tcp",
      destinationPorts: "389,636",
      sourcePorts: "any",
      description: "LDAP",
      container: "Shared",
    },
    {
      id: "svc-syslog",
      name: "service-syslog",
      protocol: "udp",
      destinationPorts: "514",
      sourcePorts: "any",
      description: "Syslog",
      container: "Shared",
    },
  ];
  return extras;
}

function buildAddressObjects(): AddressObject[] {
  const objects: AddressObject[] = [
    {
      id: "addr-meet-media",
      name: "Google-Meet-Media",
      type: "ip-netmask",
      value: "74.125.250.0/24",
      members: [],
      description: "Google Meet media ranges (representative)",
      container: "Shared",
    },
    {
      id: "addr-pune-subnet",
      name: "Pune-Branch-Subnet",
      type: "ip-netmask",
      value: "10.60.0.0/16",
      members: [],
      description: "Pune branch LAN",
      container: "Remote Networks",
    },
    {
      id: "addr-blr-subnet",
      name: "Bengaluru-Branch-Subnet",
      type: "ip-netmask",
      value: "10.50.0.0/16",
      members: [],
      description: "Bengaluru branch LAN",
      container: "Remote Networks",
    },
    {
      id: "addr-mu-pool",
      name: "GP-Mobile-Pool",
      type: "ip-netmask",
      value: "10.20.0.0/16",
      members: [],
      description: "GlobalProtect mobile user pool",
      container: "Mobile Users",
    },
    {
      id: "addr-rfc1918",
      name: "RFC1918-Private",
      type: "group",
      value: "group",
      members: ["Private-10", "Private-172", "Private-192"],
      description: "Private address space",
      container: "Shared",
    },
    {
      id: "addr-private-10",
      name: "Private-10",
      type: "ip-netmask",
      value: "10.0.0.0/8",
      members: [],
      description: "10/8",
      container: "Shared",
    },
    {
      id: "addr-private-172",
      name: "Private-172",
      type: "ip-netmask",
      value: "172.16.0.0/12",
      members: [],
      description: "172.16/12",
      container: "Shared",
    },
    {
      id: "addr-private-192",
      name: "Private-192",
      type: "ip-netmask",
      value: "192.168.0.0/16",
      members: [],
      description: "192.168/16",
      container: "Shared",
    },
    {
      id: "addr-prisma-india-west",
      name: "Prisma-India-West",
      type: "fqdn",
      value: "india-west.gpcloudservice.com",
      members: [],
      description: "Prisma Access India West",
      container: "Shared",
    },
    {
      id: "addr-okta",
      name: "Okta-SaaS",
      type: "fqdn",
      value: "acme.okta.com",
      members: [],
      description: "Okta tenant",
      container: "Shared",
    },
    {
      id: "addr-office365",
      name: "Office365-Endpoints",
      type: "group",
      value: "group",
      members: ["O365-Exchange", "O365-SharePoint"],
      description: "Office 365 address group",
      container: "Shared",
    },
    {
      id: "addr-o365-exch",
      name: "O365-Exchange",
      type: "fqdn",
      value: "outlook.office365.com",
      members: [],
      description: "Exchange Online",
      container: "Shared",
    },
    {
      id: "addr-o365-sp",
      name: "O365-SharePoint",
      type: "fqdn",
      value: "acme.sharepoint.com",
      members: [],
      description: "SharePoint Online",
      container: "Shared",
    },
    {
      id: "addr-dns-google",
      name: "DNS-Google",
      type: "ip-netmask",
      value: "8.8.8.8/32",
      members: [],
      description: "Google DNS",
      container: "Shared",
    },
    {
      id: "addr-dns-cloudflare",
      name: "DNS-Cloudflare",
      type: "ip-netmask",
      value: "1.1.1.1/32",
      members: [],
      description: "Cloudflare DNS",
      container: "Shared",
    },
    {
      id: "addr-pune-peer",
      name: "Pune-Peer-Public",
      type: "ip-netmask",
      value: "203.0.113.10/32",
      members: [],
      description: "Pune branch public peer",
      container: "Remote Networks",
    },
    {
      id: "addr-finance-servers",
      name: "Finance-Servers",
      type: "ip-range",
      value: "10.10.40.10-10.10.40.50",
      members: [],
      description: "Finance app servers",
      container: "Shared",
    },
    {
      id: "addr-collab-dst",
      name: "Collaboration-Destinations",
      type: "group",
      value: "group",
      members: ["Google-Meet-Media", "Office365-Endpoints"],
      description: "Collaboration destinations",
      container: "Shared",
    },
    {
      id: "addr-sinkhole",
      name: "DNS-Sinkhole",
      type: "ip-netmask",
      value: "72.5.65.111/32",
      members: [],
      description: "Threat sinkhole",
      container: "Shared",
    },
    {
      id: "addr-branch-group",
      name: "All-Branch-Subnets",
      type: "group",
      value: "group",
      members: ["Pune-Branch-Subnet", "Bengaluru-Branch-Subnet"],
      description: "Branch LAN group",
      container: "Remote Networks",
    },
  ];
  return objects;
}

function buildAppGroups(): AppGroup[] {
  return [
    {
      id: "appgrp-collab",
      name: "app-collab",
      members: ["google-meet", "ms-teams", "slack-base", "zoom"],
      description: "Collaboration applications",
      container: "Shared",
    },
    {
      id: "appgrp-office",
      name: "app-office365",
      members: ["office365", "outlook-web", "ms-office365-base"],
      description: "Microsoft 365",
      container: "Shared",
    },
    {
      id: "appgrp-saas",
      name: "app-saas-core",
      members: ["salesforce-base", "boxnet", "dropbox", "servicenow"],
      description: "Core SaaS",
      container: "Shared",
    },
    {
      id: "appgrp-dev",
      name: "app-developer",
      members: ["github-base", "ssl", "web-browsing"],
      description: "Developer tools",
      container: "Shared",
    },
    {
      id: "appgrp-infra",
      name: "app-infra",
      members: ["dns", "ntp", "icmp", "ssl"],
      description: "Infrastructure",
      container: "Shared",
    },
    {
      id: "appgrp-web",
      name: "app-web-general",
      members: ["web-browsing", "ssl", "http-proxy"],
      description: "General web",
      container: "Shared",
    },
    {
      id: "appgrp-identity",
      name: "app-identity",
      members: ["okta", "ssl"],
      description: "Identity providers",
      container: "Shared",
    },
    {
      id: "appgrp-risky",
      name: "app-high-risk",
      members: ["tor", "proxy", "unknown-udp"],
      description: "High risk apps",
      container: "Shared",
    },
  ];
}

function buildSecurityRules(): SecurityRule[] {
  const rules: SecurityRule[] = [];
  let position = 1;

  for (const name of RULE_NAMES_SHARED) {
    rules.push({
      id: `rule-shared-${position}`,
      position,
      name,
      container: "Shared",
      srcZone: ["any"],
      src: ["any"],
      user: ["any"],
      dst: ["any"],
      app: name.includes("DNS") ? ["dns"] : name.includes("NTP") ? ["ntp"] : ["any"],
      service: ["application-default"],
      action: name.startsWith("Deny") || name.includes("Cleanup") ? "deny" : "allow",
      profileGroup: "acme-strict",
      hitCount: faker.number.int({ min: 100, max: 500000 }),
      lastHit: randomBetween(Date.parse(WINDOW_START), Date.parse(DEMO_NOW)),
      modifiedBy: faker.helpers.arrayElement(["secops.vikram", "netops.admin", "priya.nair"]),
      modifiedAt: randomBetween(Date.parse("2026-08-01T00:00:00.000Z"), Date.parse(WINDOW_START)),
      disabled: false,
      description: `${name} shared rule`,
    });
    position += 1;
  }

  // Mobile Users (18): Block-QUIC at 12 above Allow-Collab-Apps at 18
  const muFixed = new Map<number, SecurityRule>([
    [12, blockQuicRule],
    [18, allowCollabMobile],
  ]);
  let muPos = 1;
  let muNameIdx = 0;
  const muUsedNames = new Set<string>(["Block-QUIC", "Allow-Collab-Apps"]);
  while (rules.filter((r) => r.container === "Mobile Users").length < 18) {
    const fixed = muFixed.get(muPos);
    if (fixed) {
      rules.push(fixed);
    } else {
      const base = RULE_NAMES_MU[muNameIdx % RULE_NAMES_MU.length];
      muNameIdx += 1;
      const name = muUsedNames.has(base) ? `${base}-${muPos}` : base;
      muUsedNames.add(name);
      rules.push({
        id: `rule-mu-${muPos}`,
        position: muPos,
        name,
        container: "Mobile Users",
        srcZone: ["GP-Mobile"],
        src: ["any"],
        user: ["any"],
        dst: ["any"],
        app: [faker.helpers.arrayElement(APPS)],
        service: ["application-default"],
        action: base.startsWith("Deny") ? "deny" : "allow",
        profileGroup: "acme-strict",
        hitCount: faker.number.int({ min: 50, max: 200000 }),
        lastHit: randomBetween(Date.parse(WINDOW_START), Date.parse(DEMO_NOW)),
        modifiedBy: "secops.vikram",
        modifiedAt: randomBetween(Date.parse("2026-08-01T00:00:00.000Z"), Date.parse(WINDOW_START)),
        disabled: false,
        description: `${base} mobile users`,
      });
    }
    muPos += 1;
  }

  // Remote Networks (9): Allow-Collab-Apps at position 4
  const rnAllow = { ...allowCollabRn, position: 4 };
  const rnFixed = new Map<number, SecurityRule>([[4, rnAllow]]);
  let rnPos = 1;
  let rnNameIdx = 0;
  const rnUsedNames = new Set<string>(["Allow-Collab-Apps"]);
  while (rules.filter((r) => r.container === "Remote Networks").length < 9) {
    const fixed = rnFixed.get(rnPos);
    if (fixed) {
      rules.push(fixed);
    } else {
      const base = RULE_NAMES_RN[rnNameIdx % RULE_NAMES_RN.length];
      rnNameIdx += 1;
      const name = rnUsedNames.has(base) ? `${base}-${rnPos}` : base;
      rnUsedNames.add(name);
      rules.push({
        id: `rule-rn-${rnPos}`,
        position: rnPos,
        name,
        container: "Remote Networks",
        srcZone: ["Trust-L3"],
        src: ["any"],
        user: ["any"],
        dst: ["any"],
        app: [faker.helpers.arrayElement(APPS)],
        service: ["application-default"],
        action: base.startsWith("Deny") || base.includes("Cleanup") ? "deny" : "allow",
        profileGroup: "acme-strict",
        hitCount: faker.number.int({ min: 50, max: 300000 }),
        lastHit: randomBetween(Date.parse(WINDOW_START), Date.parse(DEMO_NOW)),
        modifiedBy: "netops.admin",
        modifiedAt: randomBetween(Date.parse("2026-08-01T00:00:00.000Z"), Date.parse(WINDOW_START)),
        disabled: false,
        description: `${base} remote networks`,
      });
    }
    rnPos += 1;
  }

  // Shared 5 + MU 18 + RN 9 = 32
  return rules.sort((a, b) => {
    if (a.container === b.container) {
      return a.position - b.position;
    }
    return a.container.localeCompare(b.container);
  });
}

function buildDecryptionRules(): DecryptionRule[] {
  return [
    {
      id: "decrypt-1",
      position: 1,
      name: "No-Decrypt-Finance",
      container: "Shared",
      src: ["any"],
      dst: ["Finance-Servers"],
      service: ["any"],
      urlCategory: ["financial-services"],
      action: "no-decrypt",
      decryptionProfile: "acme-decrypt",
      modifiedBy: "secops.vikram",
      modifiedAt: "2026-07-01T08:00:00.000Z",
    },
    {
      id: "decrypt-2",
      position: 2,
      name: "No-Decrypt-Health",
      container: "Shared",
      src: ["any"],
      dst: ["any"],
      service: ["any"],
      urlCategory: ["health-and-medicine"],
      action: "no-decrypt",
      decryptionProfile: "acme-decrypt",
      modifiedBy: "secops.vikram",
      modifiedAt: "2026-07-01T08:00:00.000Z",
    },
    {
      id: "decrypt-3",
      position: 3,
      name: "Decrypt-Outbound",
      container: "Mobile Users",
      src: ["GP-Mobile-Pool"],
      dst: ["any"],
      service: ["service-https"],
      urlCategory: ["any"],
      action: "decrypt",
      decryptionProfile: "acme-decrypt",
      modifiedBy: "secops.vikram",
      modifiedAt: "2026-08-15T09:30:00.000Z",
    },
    {
      id: "decrypt-4",
      position: 4,
      name: "Decrypt-Branch-Outbound",
      container: "Remote Networks",
      src: ["All-Branch-Subnets"],
      dst: ["any"],
      service: ["service-https"],
      urlCategory: ["any"],
      action: "decrypt",
      decryptionProfile: "acme-decrypt",
      modifiedBy: "netops.admin",
      modifiedAt: "2026-08-15T09:30:00.000Z",
    },
    {
      id: "decrypt-5",
      position: 5,
      name: "No-Decrypt-Pinned",
      container: "Shared",
      src: ["any"],
      dst: ["any"],
      service: ["any"],
      urlCategory: ["encrypted-dns"],
      action: "no-decrypt",
      decryptionProfile: "acme-decrypt",
      modifiedBy: "secops.vikram",
      modifiedAt: "2026-09-01T11:00:00.000Z",
    },
    {
      id: "decrypt-6",
      position: 6,
      name: "Decrypt-SaaS",
      container: "Mobile Users",
      src: ["GP-Mobile-Pool"],
      dst: ["any"],
      service: ["service-https"],
      urlCategory: ["computer-and-internet-info"],
      action: "decrypt",
      decryptionProfile: "acme-decrypt",
      modifiedBy: "secops.vikram",
      modifiedAt: "2026-09-20T07:00:00.000Z",
    },
  ];
}

function buildMobileUsers(users: User[]): MobileUser[] {
  const preferred = users.filter((u) =>
    ["ankit.verma@acme.io", "priya.desai@acme.io", "arjun.mehta@acme.io"].includes(u.email),
  );
  const pool = [...preferred, ...users.filter((u) => !preferred.includes(u))];
  const mobile: MobileUser[] = [];
  for (let i = 0; i < 60; i += 1) {
    const user = pool[i % pool.length];
    const isAnkit = user.email === "ankit.verma@acme.io";
    mobile.push({
      id: `mu-${(i + 1).toString().padStart(3, "0")}`,
      user: user.name,
      email: user.email,
      privateIp: isAnkit ? "10.20.31.44" : `10.20.${faker.number.int({ min: 1, max: 50 })}.${faker.number.int({ min: 2, max: 250 })}`,
      publicIp: isAnkit
        ? "49.36.112.18"
        : faker.internet.ipv4(),
      location: user.location === "Bengaluru" && !isAnkit ? "Remote" : user.location,
      gateway: faker.helpers.arrayElement(["India-West-GW", "India-South-GW"]),
      os: faker.helpers.arrayElement(["Windows 11", "Windows 10", "macOS 15", "macOS 14"]),
      gpVersion: faker.helpers.arrayElement(["6.2.5-c29", "6.2.4-c12", "6.1.5-c8"]),
      connectedSince: isAnkit
        ? "2026-10-06T03:55:00.000Z"
        : randomBetween(Date.parse(WINDOW_START), Date.parse(DEMO_NOW)),
      status: "connected",
    });
  }
  // Ensure unique ids; ankit appears once with exact IP
  const seen = new Set<string>();
  return mobile.filter((m) => {
    if (m.email === "ankit.verma@acme.io") {
      if (seen.has("ankit")) {
        return false;
      }
      seen.add("ankit");
      return true;
    }
    return true;
  }).slice(0, 60);
}

function buildConfigAudit(): ConfigChange[] {
  const changes: ConfigChange[] = [chg5120, chg4471];
  const admins = ["secops.vikram", "netops.admin", "priya.nair", "change.bot"];
  for (let i = 0; changes.length < 18; i += 1) {
    changes.push({
      id: `cfg-noise-${i + 1}`,
      changeId: `CHG-${4000 + i}`,
      timestamp: randomBetween(Date.parse(WINDOW_START), Date.parse(DEMO_NOW)),
      admin: faker.helpers.arrayElement(admins),
      container: faker.helpers.arrayElement(["Shared", "Mobile Users", "Remote Networks", "branch"]),
      summary: faker.helpers.arrayElement([
        "Updated URL category exception",
        "Raised hit-count logging",
        "Adjusted HIP object",
        "Rotated decoy cert",
        "Added address object for SaaS",
        "Tweaked decryption bypass",
        "Updated QoS profile",
        "Added service route",
      ]),
      path: faker.helpers.arrayElement([
        "rulebase/security/rules",
        "address",
        "device-group/templates",
        "network/interface",
        "profiles/url-filtering",
      ]),
      before: faker.helpers.arrayElement(["enabled", "any", "group14", "alert"]),
      after: faker.helpers.arrayElement(["disabled", "RFC1918-Private", "group14", "block"]),
      ticketHint: "",
    });
  }
  return changes.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function buildTickets(): Ticket[] {
  const historySubjects = [
    "GlobalProtect portal certificate warning",
    "Slow SharePoint for Hyderabad users",
    "Zoom intermittent audio India South",
    "Okta SSO loop on GP reconnect",
    "URL filtering false positive on docs site",
    "Decryption error on banking site",
    "Mobile user pool exhaustion India West",
    "Branch QoS complaint Chennai",
    "Threat log spike adware.generic",
    "Request to allow Box upload",
  ];
  const tickets = [...caseTickets];
  for (let i = 0; i < 10; i += 1) {
    tickets.push({
      id: `TKT-${24700 + i}`,
      subject: historySubjects[i],
      priority: faker.helpers.arrayElement(["P2", "P3", "P4"]),
      status: faker.helpers.arrayElement(["resolved", "closed"]),
      openedAt: randomBetween(
        Date.parse("2026-09-20T00:00:00.000Z"),
        Date.parse("2026-10-05T12:00:00.000Z"),
      ),
      customer: "Acme Corp",
      contactName: faker.person.fullName(),
      contactEmail: faker.internet.email({ provider: "acme.io" }).toLowerCase(),
      contactTitle: faker.person.jobTitle(),
      product: faker.helpers.arrayElement(["mobile-users", "remote-networks"]),
      workable: false,
      slaResponseMinutes: faker.helpers.arrayElement([60, 240, 480]),
      description: `${historySubjects[i]}. Resolved in prior shift.`,
    });
  }
  return tickets;
}

function buildAlerts(networks: RemoteNetwork[]): PlatformAlert[] {
  const alerts: PlatformAlert[] = [caseAlert];
  for (let i = 0; alerts.length < 25; i += 1) {
    const rn = networks[i % networks.length];
    const raisedAt = randomBetween(Date.parse(WINDOW_START), Date.parse(DEMO_NOW));
    const cleared =
      rn.name === "Pune-Branch-01"
        ? null
        : randomBetween(Date.parse(raisedAt), Date.parse(DEMO_NOW));
    alerts.push({
      id: `ALT-${88000 + i}`,
      title: faker.helpers.arrayElement([
        `${rn.name} tunnel flap`,
        `Gateway ${faker.helpers.arrayElement(["India-West-GW", "India-South-GW"])} high latency`,
        "Prisma Access service latency elevated",
        "Certificate expiry warning",
        "Mobile user auth failures spike",
      ]),
      severity: faker.helpers.arrayElement(["info", "warning", "critical"]),
      raisedAt,
      clearedAt: cleared,
      resourceType: faker.helpers.arrayElement([
        "remote-network",
        "mobile-user-gateway",
        "service",
        "tunnel",
      ]),
      resourceId: rn.id,
      description: "Auto-generated platform alert for desk realism.",
      linkedTicketId: null,
    });
  }
  return alerts;
}

function pickUser(users: User[]): User {
  return faker.helpers.arrayElement(users);
}

function buildLogs(users: User[]): LogRecord[] {
  const start = Date.parse(WINDOW_START);
  const end = Date.parse(DEMO_NOW);
  const needles: LogRecord[] = [
    ...case1EarlyDrops(),
    ankitDrop100214,
    ankitDrop100231,
    sanaAllow100540,
    ankitUrlAllow,
    ankitDecryptOk,
    ankitGpConnect,
    puneSystemNoProposal,
    ...case2SystemRetries().slice(1), // first duplicate of puneSystemNoProposal skipped
    puneConfigDhChange,
  ];

  // Pune traffic that stops at 11:42: include some before cutoff
  for (let i = 0; i < 12; i += 1) {
    needles.push({
      id: `log-traffic-pune-pre-${i}`,
      receiveTime: randomBetween(Date.parse("2026-10-06T05:00:00.000Z"), Date.parse("2026-10-06T06:11:50.000Z")),
      type: "traffic",
      deviceName: "prisma-rn-india-west",
      location: "India West",
      container: "Remote Networks",
      srcIp: `10.60.${faker.number.int({ min: 1, max: 40 })}.${faker.number.int({ min: 2, max: 250 })}`,
      dstIp: faker.internet.ipv4(),
      srcZone: "Trust-L3",
      dstZone: "Untrust",
      srcUser: "",
      srcPort: faker.number.int({ min: 1024, max: 65535 }),
      dstPort: faker.helpers.arrayElement([443, 80, 53]),
      protocol: faker.helpers.arrayElement(["tcp", "udp"]),
      app: faker.helpers.arrayElement(APPS),
      rule: "Allow-Branch-Internet",
      action: "allow",
      sessionEndReason: "tcp-fin",
      bytes: faker.number.int({ min: 500, max: 500000 }),
      packets: faker.number.int({ min: 4, max: 800 }),
      bytesSent: faker.number.int({ min: 200, max: 200000 }),
      bytesReceived: faker.number.int({ min: 200, max: 300000 }),
      inboundIf: "tunnel.7",
      outboundIf: "ethernet1/1",
    });
  }

  const targets = {
    traffic: 270,
    url: 90,
    threat: 60,
    decryption: 48,
    globalprotect: 48,
    system: 48,
    config: 36,
  } as const;

  const logs: LogRecord[] = [...needles];
  const countByType = () => {
    const c: Record<string, number> = {};
    for (const log of logs) {
      c[log.type] = (c[log.type] ?? 0) + 1;
    }
    return c;
  };

  let guard = 0;
  while (logs.length < 600 && guard < 5000) {
    guard += 1;
    const counts = countByType();
    const remaining = (Object.keys(targets) as (keyof typeof targets)[]).filter(
      (t) => (counts[t] ?? 0) < targets[t],
    );
    if (remaining.length === 0) {
      break;
    }
    const type = faker.helpers.arrayElement(remaining);
    const user = pickUser(users);
    const receiveTime = randomBetween(start, end);
    const id = `log-${type}-gen-${logs.length}`;

    if (type === "traffic") {
      // Avoid inventing Pune 10.60 traffic after tunnel down
      const usePune = faker.number.float({ min: 0, max: 1 }) < 0.08;
      const puneOk = Date.parse(receiveTime) < Date.parse("2026-10-06T06:12:08.000Z");
      const srcIp =
        usePune && puneOk
          ? `10.60.${faker.number.int({ min: 1, max: 40 })}.${faker.number.int({ min: 2, max: 250 })}`
          : `10.20.${faker.number.int({ min: 1, max: 50 })}.${faker.number.int({ min: 2, max: 250 })}`;
      const container = srcIp.startsWith("10.60.") ? "Remote Networks" : "Mobile Users";
      logs.push({
        id,
        receiveTime,
        type: "traffic",
        deviceName: container === "Remote Networks" ? "prisma-rn-india-west" : "prisma-mu-india-west",
        location: "India West",
        container,
        srcIp,
        dstIp: faker.internet.ipv4(),
        srcZone: container === "Remote Networks" ? "Trust-L3" : "GP-Mobile",
        dstZone: "Untrust",
        srcUser: container === "Mobile Users" ? user.email : "",
        srcPort: faker.number.int({ min: 1024, max: 65535 }),
        dstPort: faker.helpers.arrayElement([443, 80, 53, 5222, 3478]),
        protocol: faker.helpers.arrayElement(["tcp", "udp"]),
        app: faker.helpers.arrayElement(APPS),
        rule:
          container === "Remote Networks"
            ? faker.helpers.arrayElement(["Allow-Branch-Internet", "Allow-Collab-Apps", "Allow-Branch-Office365"])
            : faker.helpers.arrayElement(["Allow-Web-Business", "Allow-Office365", "Allow-Collab-Apps", "Allow-Slack"]),
        action: "allow",
        sessionEndReason: faker.helpers.arrayElement(["tcp-fin", "udp-aged-out", "tcp-rst-from-client"]),
        bytes: faker.number.int({ min: 200, max: 2_000_000 }),
        packets: faker.number.int({ min: 2, max: 2000 }),
        bytesSent: faker.number.int({ min: 100, max: 1_000_000 }),
        bytesReceived: faker.number.int({ min: 100, max: 1_000_000 }),
        inboundIf: container === "Remote Networks" ? "tunnel.7" : "gp.tunnel",
        outboundIf: "ethernet1/1",
      });
    } else if (type === "url") {
      logs.push({
        id,
        receiveTime,
        type: "url",
        deviceName: "prisma-mu-india-west",
        location: "India West",
        container: "Mobile Users",
        srcIp: `10.20.${faker.number.int({ min: 1, max: 50 })}.${faker.number.int({ min: 2, max: 250 })}`,
        dstIp: faker.internet.ipv4(),
        srcUser: user.email,
        url: faker.helpers.arrayElement([
          "https://www.office.com/",
          "https://github.com/",
          "https://acme.slack.com/",
          "https://login.salesforce.com/",
          "https://teams.microsoft.com/",
        ]),
        category: faker.helpers.arrayElement([
          "computer-and-internet-info",
          "business-and-economy",
          "collaboration",
        ]),
        action: "allow",
        rule: "Allow-Web-Business",
        app: "ssl",
      });
    } else if (type === "threat") {
      logs.push({
        id,
        receiveTime,
        type: "threat",
        deviceName: "prisma-mu-india-west",
        location: "India West",
        container: "Mobile Users",
        srcIp: faker.internet.ipv4(),
        dstIp: `10.20.${faker.number.int({ min: 1, max: 50 })}.${faker.number.int({ min: 2, max: 250 })}`,
        srcUser: user.email,
        threatName: faker.helpers.arrayElement([
          "Adware/Win32.Generic",
          "InfoLookup Spyware",
          "DNS Sinkhole Hit",
          "Suspicious HTTP header",
        ]),
        threatId: String(faker.number.int({ min: 30000, max: 90000 })),
        severity: faker.helpers.arrayElement(["informational", "low", "medium"]),
        category: "spyware",
        action: faker.helpers.arrayElement(["alert", "block"]),
        app: "web-browsing",
        rule: "Threat-Prevention-Alert",
      });
    } else if (type === "decryption") {
      logs.push({
        id,
        receiveTime,
        type: "decryption",
        deviceName: "prisma-mu-india-west",
        location: "India West",
        container: "Mobile Users",
        srcIp: `10.20.${faker.number.int({ min: 1, max: 50 })}.${faker.number.int({ min: 2, max: 250 })}`,
        dstIp: faker.internet.ipv4(),
        srcUser: user.email,
        sni: faker.internet.domainName(),
        app: "ssl",
        rule: "Decrypt-Outbound",
        action: "decrypt",
        tlsVersion: "TLS1.3",
        errorIndex: "None",
        proxyType: "forward",
      });
    } else if (type === "globalprotect") {
      logs.push({
        id,
        receiveTime,
        type: "globalprotect",
        deviceName: "prisma-mu-india-west",
        location: "India West",
        container: "Mobile Users",
        srcUser: user.email,
        srcIp: `10.20.${faker.number.int({ min: 1, max: 50 })}.${faker.number.int({ min: 2, max: 250 })}`,
        publicIp: faker.internet.ipv4(),
        gateway: faker.helpers.arrayElement(["India-West-GW", "India-South-GW"]),
        eventId: faker.helpers.arrayElement(["gateway-connected", "gateway-logout", "portal-auth"]),
        status: "success",
        os: faker.helpers.arrayElement(["Windows 11", "macOS 15"]),
        clientVersion: "6.2.5-c29",
        portal: "acme.gpcloudservice.com",
        loginDurationSec: faker.number.int({ min: 1, max: 8 }),
      });
    } else if (type === "system") {
      logs.push({
        id,
        receiveTime,
        type: "system",
        deviceName: "prisma-rn-india-west",
        location: "India West",
        container: "Remote Networks",
        severity: "informational",
        eventId: faker.helpers.arrayElement(["general", "auth-success", "tunnel-status"]),
        module: faker.helpers.arrayElement(["general", "authd", "rasmgr"]),
        description: faker.helpers.arrayElement([
          "User authentication succeeded",
          "Tunnel keepalive ok",
          "Config commit job finished",
          "Route update applied",
        ]),
        opaque: "",
        peerIp: "",
      });
    } else {
      logs.push({
        id,
        receiveTime,
        type: "config",
        deviceName: "prisma-mu-india-west",
        location: "India West",
        container: "Mobile Users",
        admin: faker.helpers.arrayElement(["secops.vikram", "netops.admin", "priya.nair"]),
        client: "Web",
        cmd: faker.helpers.arrayElement(["set", "edit", "delete"]),
        path: "rulebase/security/rules",
        before: "any",
        after: "RFC1918-Private",
        result: "succeeded",
        changeId: `CHG-${4100 + logs.length}`,
      });
    }
  }

  // Trim per-type if overshot, keeping all needle ids
  const needleIds = new Set(needles.map((n) => n.id));
  const byType: Record<string, LogRecord[]> = {};
  for (const log of logs) {
    byType[log.type] = byType[log.type] ?? [];
    byType[log.type].push(log);
  }

  const trimmed: LogRecord[] = [];
  for (const type of Object.keys(targets) as (keyof typeof targets)[]) {
    const group = byType[type] ?? [];
    const keepNeedles = group.filter((g) => needleIds.has(g.id));
    const noise = group.filter((g) => !needleIds.has(g.id));
    const need = targets[type] - keepNeedles.length;
    trimmed.push(...keepNeedles, ...noise.slice(0, Math.max(0, need)));
  }

  // If under 600 due to needle overshoot in a type, pad traffic
  while (trimmed.length < 600) {
    const user = pickUser(users);
    trimmed.push({
      id: `log-traffic-pad-${trimmed.length}`,
      receiveTime: randomBetween(start, end),
      type: "traffic",
      deviceName: "prisma-mu-india-west",
      location: "India West",
      container: "Mobile Users",
      srcIp: `10.20.${faker.number.int({ min: 1, max: 50 })}.${faker.number.int({ min: 2, max: 250 })}`,
      dstIp: faker.internet.ipv4(),
      srcZone: "GP-Mobile",
      dstZone: "Untrust",
      srcUser: user.email,
      srcPort: faker.number.int({ min: 1024, max: 65535 }),
      dstPort: 443,
      protocol: "tcp",
      app: "ssl",
      rule: "Allow-Web-Business",
      action: "allow",
      sessionEndReason: "tcp-fin",
      bytes: 4096,
      packets: 10,
      bytesSent: 2048,
      bytesReceived: 2048,
      inboundIf: "gp.tunnel",
      outboundIf: "ethernet1/1",
    });
  }

  // Final exact 600: if over, drop non-needle traffic pads first
  if (trimmed.length > 600) {
    const sorted = [...trimmed].sort((a, b) => {
      const aN = needleIds.has(a.id) ? 0 : 1;
      const bN = needleIds.has(b.id) ? 0 : 1;
      return aN - bN;
    });
    return sorted.slice(0, 600).sort((a, b) => a.receiveTime.localeCompare(b.receiveTime));
  }

  return trimmed.sort((a, b) => a.receiveTime.localeCompare(b.receiveTime));
}

function assertCounts(label: string, actual: number, expected: number): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function main(): void {
  faker.seed(SEED);
  mkdirSync(outDir, { recursive: true });

  const users = buildUsers();
  const remoteNetworks = buildRemoteNetworks();
  const serviceObjects = buildServiceObjects();
  const addressObjects = buildAddressObjects();
  const appGroups = buildAppGroups();
  // objects must be exactly 40: trim or pad app groups / addresses
  const addresses = addressObjects;
  const services = serviceObjects;
  let apps = appGroups;
  let total = addresses.length + services.length + apps.length;
  if (total > 40) {
    const overflow = total - 40;
    apps = apps.slice(0, Math.max(0, apps.length - overflow));
  }
  total = addresses.length + services.length + apps.length;
  while (total < 40) {
    apps.push({
      id: `appgrp-pad-${total}`,
      name: `app-pad-${total}`,
      members: ["ssl", "web-browsing"],
      description: "Padding app group",
      container: "Shared",
    });
    total = addresses.length + services.length + apps.length;
  }

  const securityRules = buildSecurityRules();
  const decryptionRules = buildDecryptionRules();
  let mobileUsers = buildMobileUsers(users);
  while (mobileUsers.length < 60) {
    const u = users[mobileUsers.length % users.length];
    mobileUsers.push({
      id: `mu-pad-${mobileUsers.length}`,
      user: u.name,
      email: u.email,
      privateIp: `10.20.99.${mobileUsers.length}`,
      publicIp: `49.36.200.${mobileUsers.length}`,
      location: u.location,
      gateway: "India-West-GW",
      os: "Windows 11",
      gpVersion: "6.2.5-c29",
      connectedSince: WINDOW_START,
      status: "connected",
    });
  }
  mobileUsers = mobileUsers.slice(0, 60);

  const configAudit = buildConfigAudit();
  const tickets = buildTickets();
  const alerts = buildAlerts(remoteNetworks);
  const logs = buildLogs(users);

  assertCounts("users", users.length, 70);
  assertCounts("remoteNetworks", remoteNetworks.length, 12);
  assertCounts("objects", addresses.length + services.length + apps.length, 40);
  assertCounts("securityRules", securityRules.length, 32);
  assertCounts("decryptionRules", decryptionRules.length, 6);
  assertCounts("mobileUsers", mobileUsers.length, 60);
  assertCounts("configAudit", configAudit.length, 18);
  assertCounts("tickets", tickets.length, 12);
  assertCounts("alerts", alerts.length, 25);
  assertCounts("logs", logs.length, 600);

  const logTypeCounts = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.type] = (acc[log.type] ?? 0) + 1;
    return acc;
  }, {});

  // Allow small type drift if needles forced overage in a bucket; prefer exact.
  // Rebalance: already targeted; verify traffic roughly 45%.
  console.log("log type counts", logTypeCounts);

  writeJson("meta.json", {
    generatedAt: DEMO_NOW,
    seed: SEED,
    demoNow: DEMO_NOW,
    windowStart: WINDOW_START,
    windowEnd: DEMO_NOW,
    counts: {
      logs: logs.length,
      securityRules: securityRules.length,
      objects: addresses.length + services.length + apps.length,
      addressObjects: addresses.length,
      serviceObjects: services.length,
      appGroups: apps.length,
      decryptionRules: decryptionRules.length,
      remoteNetworks: remoteNetworks.length,
      mobileUsers: mobileUsers.length,
      configAudit: configAudit.length,
      tickets: tickets.length,
      users: users.length,
      platformAlerts: alerts.length,
      ...Object.fromEntries(
        Object.entries(logTypeCounts).map(([k, v]) => [`logs.${k}`, v]),
      ),
    },
  });
  writeJson("users.json", users);
  writeJson("tickets.json", tickets);
  writeJson("logs.json", logs);
  writeJson("security-rules.json", securityRules);
  writeJson("address-objects.json", addresses);
  writeJson("service-objects.json", services);
  writeJson("app-groups.json", apps);
  writeJson("decryption-rules.json", decryptionRules);
  writeJson("remote-networks.json", remoteNetworks);
  writeJson("mobile-users.json", mobileUsers);
  writeJson("config-audit.json", configAudit);
  writeJson("platform-alerts.json", alerts);

  // evidence seed file for case pins (static catalog, not runtime state)
  writeJson("evidence-catalog.json", [
    {
      id: "ev-ankit-drop-1",
      ticketId: "TKT-24817",
      pinnedAt: DEMO_NOW,
      source: "traffic",
      label: "ankit.verma drop UDP 19305 Block-QUIC at 10:02:14 IST",
      refId: ankitDrop100214.id,
      note: "Failing Meet media attempt",
    },
    {
      id: "ev-ankit-drop-2",
      ticketId: "TKT-24817",
      pinnedAt: DEMO_NOW,
      source: "traffic",
      label: "ankit.verma drop UDP 19305 Block-QUIC at 10:02:31 IST",
      refId: ankitDrop100231.id,
      note: "Retry still dropped",
    },
    {
      id: "ev-sana-allow",
      ticketId: "TKT-24817",
      pinnedAt: DEMO_NOW,
      source: "traffic",
      label: "sana.khan allow google-meet Allow-Collab-Apps",
      refId: sanaAllow100540.id,
      note: "Working branch user",
    },
    {
      id: "ev-chg-5120",
      ticketId: "TKT-24817",
      pinnedAt: DEMO_NOW,
      source: "config",
      label: "CHG-5120 Block-QUIC",
      refId: chg5120.id,
      note: "Change that introduced the bad service object",
    },
    {
      id: "ev-pune-alert",
      ticketId: "TKT-24823",
      pinnedAt: DEMO_NOW,
      source: "network",
      label: "Pune-Branch-01 tunnel down",
      refId: caseAlert.id,
      note: "Platform alert at 11:42:08 IST",
    },
    {
      id: "ev-pune-system",
      ticketId: "TKT-24823",
      pinnedAt: DEMO_NOW,
      source: "system",
      label: "NO_PROPOSAL_CHOSEN peer 203.0.113.10",
      refId: puneSystemNoProposal.id,
      note: "Phase 2 failure",
    },
    {
      id: "ev-chg-4471",
      ticketId: "TKT-24823",
      pinnedAt: DEMO_NOW,
      source: "config",
      label: "CHG-4471 dh-group group19",
      refId: chg4471.id,
      note: "Branch crypto drift",
    },
  ]);

  console.log(`Wrote dataset to ${outDir}`);
  console.log(`objects breakdown: addr=${addresses.length} svc=${services.length} app=${apps.length}`);
}

main();
