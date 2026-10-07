/**
 * Hand-written Case 1 and Case 2 evidence. Exact values from PLAN section 4.
 * Never randomize these records.
 */

import type {
  ConfigChange,
  ConfigLogRecord,
  DecryptionLogRecord,
  GlobalProtectLogRecord,
  PlatformAlert,
  RemoteNetwork,
  SecurityRule,
  ServiceObject,
  SystemLogRecord,
  Ticket,
  TrafficLogRecord,
  UrlLogRecord,
  User,
} from "../src/types";

export const DEMO_NOW = "2026-10-06T06:35:00.000Z";
export const WINDOW_START = "2026-10-05T06:35:00.000Z";

export const ANKIT = {
  email: "ankit.verma@acme.io",
  name: "Ankit Verma",
  privateIp: "10.20.31.44",
  publicIp: "49.36.112.18",
  location: "Pune",
};

export const SANA = {
  email: "sana.khan@acme.io",
  name: "Sana Khan",
  privateIp: "10.50.12.88",
  publicIp: "103.25.44.10",
  location: "Bengaluru",
};

export const MEET_DST = "74.125.250.69";
export const MEET_DST_NET = "74.125.250.0/24";
export const PUNE_PEER = "203.0.113.10";
export const PUNE_SUBNET = "10.60.0.0/16";

export const caseUsers: User[] = [
  {
    id: "user-ankit-verma",
    name: ANKIT.name,
    email: ANKIT.email,
    department: "Engineering",
    location: "Pune",
    title: "Software Engineer",
  },
  {
    id: "user-sana-khan",
    name: SANA.name,
    email: SANA.email,
    department: "Sales",
    location: "Bengaluru",
    title: "Account Executive",
  },
  {
    id: "user-neha-kapoor",
    name: "Neha Kapoor",
    email: "neha.kapoor@acme.io",
    department: "IT",
    location: "Mumbai",
    title: "IT Manager",
  },
  {
    id: "user-rohit-sharma",
    name: "Rohit Sharma",
    email: "rohit.sharma@acme.io",
    department: "Network",
    location: "Pune",
    title: "Network Lead",
  },
  {
    id: "user-secops-vikram",
    name: "Vikram Shah",
    email: "secops.vikram@acme.io",
    department: "SecOps",
    location: "Mumbai",
    title: "Security Engineer",
  },
  {
    id: "user-netops-admin",
    name: "NetOps Admin",
    email: "netops.admin@acme.io",
    department: "Network",
    location: "Pune",
    title: "Network Administrator",
  },
];

export const caseTickets: Ticket[] = [
  {
    id: "TKT-24817",
    subject: "Google Meet not working for remote users",
    priority: "P2",
    status: "open",
    openedAt: "2026-10-06T04:42:00.000Z",
    customer: "Acme Corp",
    contactName: "Neha Kapoor",
    contactEmail: "neha.kapoor@acme.io",
    contactTitle: "IT Manager",
    product: "mobile-users",
    workable: true,
    caseKey: "meet-quic",
    slaResponseMinutes: 240,
    description:
      "Since this morning a lot of our people cannot join Google Meet calls. The page opens but the call never connects.",
  },
  {
    id: "TKT-24823",
    subject: "Pune branch offline, tunnel down",
    priority: "P1",
    status: "open",
    openedAt: "2026-10-06T06:14:00.000Z",
    customer: "Acme Corp",
    contactName: "Rohit Sharma",
    contactEmail: "rohit.sharma@acme.io",
    contactTitle: "Network Lead",
    product: "remote-networks",
    workable: true,
    caseKey: "pune-tunnel",
    linkedAlertId: "ALT-88421",
    slaResponseMinutes: 60,
    description:
      "Pune branch lost all access to cloud apps and the internet about 10 minutes ago. 85 users down.",
  },
];

export const svcQuicBlock: ServiceObject = {
  id: "svc-svc-quic-block",
  name: "svc-quic-block",
  protocol: "udp",
  destinationPorts: "443,19302-19309",
  sourcePorts: "any",
  description: "Port-based QUIC and WebRTC media block (CHG-5120)",
  container: "Mobile Users",
};

export const blockQuicRule: SecurityRule = {
  id: "rule-block-quic",
  position: 12,
  name: "Block-QUIC",
  container: "Mobile Users",
  srcZone: ["GP-Mobile"],
  src: ["any"],
  user: ["any"],
  dst: ["any"],
  app: ["any"],
  service: ["svc-quic-block"],
  action: "drop",
  profileGroup: "none",
  hitCount: 1842,
  lastHit: "2026-10-06T04:32:31.000Z",
  modifiedBy: "secops.vikram",
  modifiedAt: "2026-10-05T18:11:00.000Z",
  disabled: false,
  description: "CHG-5120 block QUIC using UDP ports (incorrectly hits Meet media)",
};

export const allowCollabMobile: SecurityRule = {
  id: "rule-allow-collab-mu",
  position: 18,
  name: "Allow-Collab-Apps",
  container: "Mobile Users",
  srcZone: ["GP-Mobile"],
  src: ["any"],
  user: ["any"],
  dst: ["any"],
  app: ["google-meet", "ms-teams", "slack-base", "zoom"],
  service: ["application-default"],
  action: "allow",
  profileGroup: "acme-strict",
  hitCount: 42011,
  lastHit: "2026-10-06T06:20:00.000Z",
  modifiedBy: "secops.vikram",
  modifiedAt: "2026-09-12T10:00:00.000Z",
  disabled: false,
  description: "Collaboration apps for GlobalProtect users",
};

export const allowCollabRn: SecurityRule = {
  id: "rule-allow-collab-rn",
  position: 4,
  name: "Allow-Collab-Apps",
  container: "Remote Networks",
  srcZone: ["Trust-L3"],
  src: ["any"],
  user: ["any"],
  dst: ["any"],
  app: ["google-meet", "ms-teams", "slack-base", "zoom"],
  service: ["application-default"],
  action: "allow",
  profileGroup: "acme-strict",
  hitCount: 91002,
  lastHit: "2026-10-06T04:35:40.000Z",
  modifiedBy: "secops.vikram",
  modifiedAt: "2026-09-12T10:00:00.000Z",
  disabled: false,
  description: "Collaboration apps for branch users",
};

export const puneRemoteNetwork: RemoteNetwork = {
  id: "rn-pune-branch-01",
  name: "Pune-Branch-01",
  location: "India West",
  peerIp: PUNE_PEER,
  bandwidthMbps: 500,
  tunnelState: "down",
  tunnelUptimePct30d: 99.9,
  lastStateChange: "2026-10-06T06:12:08.000Z",
  ikeGateway: "gw-prisma-pune",
  ipsecTunnel: "tun-prisma-pune",
  branchHostname: "pune-fw-01",
  branchModel: "PA-440",
  subnet: PUNE_SUBNET,
};

export const caseAlert: PlatformAlert = {
  id: "ALT-88421",
  title: "Remote network Pune-Branch-01 tunnel down",
  severity: "critical",
  raisedAt: "2026-10-06T06:12:08.000Z",
  clearedAt: null,
  resourceType: "remote-network",
  resourceId: "rn-pune-branch-01",
  description:
    "IPsec tunnel to Pune-Branch-01 is down. IKE SA may still be up. Investigate Phase 2.",
  linkedTicketId: "TKT-24823",
};

export const chg5120: ConfigChange = {
  id: "cfg-chg-5120",
  changeId: "CHG-5120",
  timestamp: "2026-10-05T18:11:00.000Z",
  admin: "secops.vikram",
  container: "Mobile Users",
  summary: "Added Block-QUIC and service svc-quic-block above Allow-Collab-Apps",
  path: "rulebase/security/rules/Block-QUIC",
  before: JSON.stringify(
    {
      rule: null,
      service: null,
    },
    null,
    2,
  ),
  after: JSON.stringify(
    {
      rule: {
        name: "Block-QUIC",
        container: "Mobile Users",
        position: 12,
        app: ["any"],
        service: ["svc-quic-block"],
        action: "drop",
      },
      service: {
        name: "svc-quic-block",
        protocol: "udp",
        destinationPorts: "443,19302-19309",
      },
    },
    null,
    2,
  ),
  ticketHint: "TKT-24817",
};

export const chg4471: ConfigChange = {
  id: "cfg-chg-4471",
  changeId: "CHG-4471",
  timestamp: "2026-10-06T06:06:12.000Z",
  admin: "netops.admin",
  container: "branch",
  summary: "Changed ipsec-prisma PFS DH group from group14 to group19 on pune-fw-01",
  path: "network/ike/crypto-profiles/ipsec-crypto-profiles/ipsec-prisma/dh-group",
  before: "group14",
  after: "group19",
  ticketHint: "TKT-24823",
};

/** Case 1 traffic needles */
export const ankitDrop100214: TrafficLogRecord = {
  id: "log-traffic-ankit-100214",
  receiveTime: "2026-10-06T04:32:14.000Z",
  type: "traffic",
  deviceName: "prisma-mu-india-west",
  location: "India West",
  container: "Mobile Users",
  srcIp: ANKIT.privateIp,
  dstIp: MEET_DST,
  srcZone: "GP-Mobile",
  dstZone: "Untrust",
  srcUser: ANKIT.email,
  srcPort: 52144,
  dstPort: 19305,
  protocol: "udp",
  app: "stun",
  rule: "Block-QUIC",
  action: "drop",
  sessionEndReason: "policy-deny",
  bytes: 240,
  packets: 2,
  bytesSent: 240,
  bytesReceived: 0,
  inboundIf: "gp.tunnel",
  outboundIf: "ethernet1/1",
};

export const ankitDrop100231: TrafficLogRecord = {
  id: "log-traffic-ankit-100231",
  receiveTime: "2026-10-06T04:32:31.000Z",
  type: "traffic",
  deviceName: "prisma-mu-india-west",
  location: "India West",
  container: "Mobile Users",
  srcIp: ANKIT.privateIp,
  dstIp: MEET_DST,
  srcZone: "GP-Mobile",
  dstZone: "Untrust",
  srcUser: ANKIT.email,
  srcPort: 52145,
  dstPort: 19305,
  protocol: "udp",
  app: "stun",
  rule: "Block-QUIC",
  action: "drop",
  sessionEndReason: "policy-deny",
  bytes: 240,
  packets: 2,
  bytesSent: 240,
  bytesReceived: 0,
  inboundIf: "gp.tunnel",
  outboundIf: "ethernet1/1",
};

export const sanaAllow100540: TrafficLogRecord = {
  id: "log-traffic-sana-100540",
  receiveTime: "2026-10-06T04:35:40.000Z",
  type: "traffic",
  deviceName: "prisma-rn-india-south",
  location: "India South",
  container: "Remote Networks",
  srcIp: SANA.privateIp,
  dstIp: MEET_DST,
  srcZone: "Trust-L3",
  dstZone: "Untrust",
  srcUser: SANA.email,
  srcPort: 49821,
  dstPort: 19305,
  protocol: "udp",
  app: "google-meet",
  rule: "Allow-Collab-Apps",
  action: "allow",
  sessionEndReason: "tcp-fin",
  bytes: 482190,
  packets: 640,
  bytesSent: 210044,
  bytesReceived: 272146,
  inboundIf: "tunnel.7",
  outboundIf: "ethernet1/1",
};

export const ankitUrlAllow: UrlLogRecord = {
  id: "log-url-ankit-meet",
  receiveTime: "2026-10-06T04:32:10.000Z",
  type: "url",
  deviceName: "prisma-mu-india-west",
  location: "India West",
  container: "Mobile Users",
  srcIp: ANKIT.privateIp,
  dstIp: "142.250.183.14",
  srcUser: ANKIT.email,
  url: "https://meet.google.com/",
  category: "computer-and-internet-info",
  action: "allow",
  rule: "Allow-Web-Business",
  app: "ssl",
};

export const ankitDecryptOk: DecryptionLogRecord = {
  id: "log-decrypt-ankit-meet",
  receiveTime: "2026-10-06T04:32:10.500Z",
  type: "decryption",
  deviceName: "prisma-mu-india-west",
  location: "India West",
  container: "Mobile Users",
  srcIp: ANKIT.privateIp,
  dstIp: "142.250.183.14",
  srcUser: ANKIT.email,
  sni: "meet.google.com",
  app: "ssl",
  rule: "Decrypt-Outbound",
  action: "decrypt",
  tlsVersion: "TLS1.3",
  errorIndex: "None",
  proxyType: "forward",
};

export const ankitGpConnect: GlobalProtectLogRecord = {
  id: "log-gp-ankit-connect",
  receiveTime: "2026-10-06T03:55:00.000Z",
  type: "globalprotect",
  deviceName: "prisma-mu-india-west",
  location: "India West",
  container: "Mobile Users",
  srcUser: ANKIT.email,
  srcIp: ANKIT.privateIp,
  publicIp: ANKIT.publicIp,
  gateway: "India-West-GW",
  eventId: "gateway-connected",
  status: "success",
  os: "Windows 11",
  clientVersion: "6.2.5-c29",
  portal: "acme.gpcloudservice.com",
  loginDurationSec: 2,
};

export const puneSystemNoProposal: SystemLogRecord = {
  id: "log-system-pune-np-114208",
  receiveTime: "2026-10-06T06:12:08.000Z",
  type: "system",
  deviceName: "prisma-rn-india-west",
  location: "India West",
  container: "Remote Networks",
  severity: "high",
  eventId: "ike-nego-p2-fail",
  module: "ikemgr",
  description:
    "IKEv2 child SA negotiation failed, no proposal chosen, peer 203.0.113.10",
  opaque: "NO_PROPOSAL_CHOSEN peer=203.0.113.10 tunnel=tun-prisma-pune",
  peerIp: PUNE_PEER,
};

export const puneConfigDhChange: ConfigLogRecord = {
  id: "log-config-pune-dh-113612",
  receiveTime: "2026-10-06T06:06:12.000Z",
  type: "config",
  deviceName: "pune-fw-01",
  location: "Pune",
  container: "",
  admin: "netops.admin",
  client: "Web",
  cmd: "set",
  path: "network ike crypto-profiles ipsec-crypto-profiles ipsec-prisma dh-group",
  before: "group14",
  after: "group19",
  result: "succeeded",
  changeId: "CHG-4471",
};

/** Additional Case 1 early drops from 08:58 IST onward (noise needles with exact rule). */
export function case1EarlyDrops(): TrafficLogRecord[] {
  const times = [
    "2026-10-06T03:28:05.000Z",
    "2026-10-06T03:28:22.000Z",
    "2026-10-06T03:29:10.000Z",
    "2026-10-06T03:41:00.000Z",
    "2026-10-06T03:55:44.000Z",
    "2026-10-06T04:10:18.000Z",
    "2026-10-06T04:20:03.000Z",
  ];
  const users = [
    { user: "priya.desai@acme.io", ip: "10.20.14.9" },
    { user: "arjun.mehta@acme.io", ip: "10.20.22.17" },
    { user: "rita.nair@acme.io", ip: "10.20.8.55" },
    { user: ANKIT.email, ip: ANKIT.privateIp },
    { user: "dev.patel@acme.io", ip: "10.20.41.3" },
    { user: "meera.joshi@acme.io", ip: "10.20.19.77" },
    { user: "vikas.rao@acme.io", ip: "10.20.33.12" },
  ];
  const ports = [19302, 19303, 19304, 19305, 19306, 19307, 19308];
  return times.map((receiveTime, i) => ({
    id: `log-traffic-meet-drop-early-${i + 1}`,
    receiveTime,
    type: "traffic" as const,
    deviceName: "prisma-mu-india-west",
    location: "India West",
    container: "Mobile Users" as const,
    srcIp: users[i].ip,
    dstIp: `74.125.250.${10 + i}`,
    srcZone: "GP-Mobile",
    dstZone: "Untrust",
    srcUser: users[i].user,
    srcPort: 50000 + i,
    dstPort: ports[i],
    protocol: "udp" as const,
    app: "stun",
    rule: "Block-QUIC",
    action: "drop" as const,
    sessionEndReason: "policy-deny",
    bytes: 180 + i * 10,
    packets: 2,
    bytesSent: 180 + i * 10,
    bytesReceived: 0,
    inboundIf: "gp.tunnel",
    outboundIf: "ethernet1/1",
  }));
}

/** System logs every 30s from 11:42:08 for Case 2. */
export function case2SystemRetries(): SystemLogRecord[] {
  const base = Date.parse("2026-10-06T06:12:08.000Z");
  const rows: SystemLogRecord[] = [];
  for (let i = 0; i < 8; i += 1) {
    const receiveTime = new Date(base + i * 30_000).toISOString();
    rows.push({
      id: `log-system-pune-np-${i}`,
      receiveTime,
      type: "system",
      deviceName: "prisma-rn-india-west",
      location: "India West",
      container: "Remote Networks",
      severity: "high",
      eventId: "ike-nego-p2-fail",
      module: "ikemgr",
      description:
        "IKEv2 child SA negotiation failed, no proposal chosen, peer 203.0.113.10",
      opaque: "NO_PROPOSAL_CHOSEN peer=203.0.113.10 tunnel=tun-prisma-pune",
      peerIp: PUNE_PEER,
    });
  }
  return rows;
}
