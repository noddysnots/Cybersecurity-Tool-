/** Shared types for Triage Console v2. */

export type PlaceholderRouteId =
  | "splash"
  | "login"
  | "home"
  | "tickets"
  | "ticket-detail"
  | "logs"
  | "policies"
  | "objects"
  | "remote-networks"
  | "mobile-users"
  | "config-audit"
  | "troubleshooting"
  | "brief";

export type TicketPriority = "P1" | "P2" | "P3" | "P4";
export type TicketStatus =
  | "open"
  | "in_progress"
  | "pending_customer"
  | "resolved"
  | "closed";
export type ProductLine = "mobile-users" | "remote-networks";
export type CaseKey = "meet-quic" | "pune-tunnel";
export type PolicyContainer = "Shared" | "Mobile Users" | "Remote Networks";
export type PlaybookStep =
  | "intake"
  | "scope"
  | "evidence"
  | "isolate"
  | "reproduce"
  | "prove"
  | "fix"
  | "verify"
  | "rca";

export interface Ticket {
  id: string;
  subject: string;
  priority: TicketPriority;
  status: TicketStatus;
  openedAt: string;
  customer: string;
  contactName: string;
  contactEmail: string;
  contactTitle: string;
  product: ProductLine;
  workable: boolean;
  caseKey?: CaseKey;
  linkedAlertId?: string;
  slaResponseMinutes: number;
  description: string;
}

export type MessageAuthor = "customer" | "engineer" | "system";
export type MessageKind =
  | "intake"
  | "scope-ask"
  | "scope-reply"
  | "approval-request"
  | "approval"
  | "retry-request"
  | "confirm"
  | "note"
  | "system";

export interface Message {
  id: string;
  ticketId: string;
  author: MessageAuthor;
  authorName: string;
  body: string;
  createdAt: string;
  kind: MessageKind;
  questionId?: string;
}

export interface ScopeQuestion {
  id: string;
  label: string;
  order: number;
  summaryKey?: "what" | "when" | "who" | "changes" | "examples";
}

export type LogType =
  | "traffic"
  | "url"
  | "threat"
  | "decryption"
  | "globalprotect"
  | "system"
  | "config";

export type TrafficAction =
  | "allow"
  | "deny"
  | "drop"
  | "reset-both"
  | "reset-client"
  | "reset-server";

export type IpProtocol = "tcp" | "udp" | "icmp";

interface LogRecordBase {
  id: string;
  receiveTime: string;
  type: LogType;
  deviceName: string;
  location: string;
  container: PolicyContainer | "";
}

export interface TrafficLogRecord extends LogRecordBase {
  type: "traffic";
  srcIp: string;
  dstIp: string;
  srcZone: string;
  dstZone: string;
  srcUser: string;
  srcPort: number;
  dstPort: number;
  protocol: IpProtocol;
  app: string;
  rule: string;
  action: TrafficAction;
  sessionEndReason: string;
  bytes: number;
  packets: number;
  bytesSent: number;
  bytesReceived: number;
  inboundIf: string;
  outboundIf: string;
}

export interface UrlLogRecord extends LogRecordBase {
  type: "url";
  srcIp: string;
  dstIp: string;
  srcUser: string;
  url: string;
  category: string;
  action: "allow" | "block" | "alert";
  rule: string;
  app: string;
}

export interface ThreatLogRecord extends LogRecordBase {
  type: "threat";
  srcIp: string;
  dstIp: string;
  srcUser: string;
  threatName: string;
  threatId: string;
  severity: "informational" | "low" | "medium" | "high" | "critical";
  category: string;
  action: "alert" | "allow" | "block" | "reset-both";
  app: string;
  rule: string;
}

export interface DecryptionLogRecord extends LogRecordBase {
  type: "decryption";
  srcIp: string;
  dstIp: string;
  srcUser: string;
  sni: string;
  app: string;
  rule: string;
  action: "decrypt" | "no-decrypt" | "decrypt-error";
  tlsVersion: string;
  errorIndex: string;
  proxyType: string;
}

export interface GlobalProtectLogRecord extends LogRecordBase {
  type: "globalprotect";
  srcUser: string;
  srcIp: string;
  publicIp: string;
  gateway: string;
  eventId: string;
  status: "success" | "failure";
  os: string;
  clientVersion: string;
  portal: string;
  loginDurationSec: number;
}

export interface SystemLogRecord extends LogRecordBase {
  type: "system";
  severity: "informational" | "low" | "medium" | "high" | "critical";
  eventId: string;
  module: string;
  description: string;
  opaque: string;
  peerIp: string;
}

export interface ConfigLogRecord extends LogRecordBase {
  type: "config";
  admin: string;
  client: string;
  cmd: string;
  path: string;
  before: string;
  after: string;
  result: "submitted" | "succeeded" | "failed";
  changeId: string;
}

export type LogRecord =
  | TrafficLogRecord
  | UrlLogRecord
  | ThreatLogRecord
  | DecryptionLogRecord
  | GlobalProtectLogRecord
  | SystemLogRecord
  | ConfigLogRecord;

export interface SecurityRule {
  id: string;
  position: number;
  name: string;
  container: PolicyContainer;
  srcZone: string[];
  src: string[];
  user: string[];
  dst: string[];
  app: string[];
  service: string[];
  action: "allow" | "deny" | "drop";
  profileGroup: string;
  hitCount: number;
  lastHit: string;
  modifiedBy: string;
  modifiedAt: string;
  disabled: boolean;
  description: string;
}

export type AddressObjectType = "ip-netmask" | "ip-range" | "fqdn" | "group";

export interface AddressObject {
  id: string;
  name: string;
  type: AddressObjectType;
  value: string;
  members: string[];
  description: string;
  container: PolicyContainer;
}

export interface ServiceObject {
  id: string;
  name: string;
  protocol: "tcp" | "udp" | "tcp-udp";
  destinationPorts: string;
  sourcePorts: string;
  description: string;
  container: PolicyContainer;
}

export interface AppGroup {
  id: string;
  name: string;
  members: string[];
  description: string;
  container: PolicyContainer;
}

export interface DecryptionRule {
  id: string;
  position: number;
  name: string;
  container: PolicyContainer;
  src: string[];
  dst: string[];
  service: string[];
  urlCategory: string[];
  action: "decrypt" | "no-decrypt";
  decryptionProfile: string;
  modifiedBy: string;
  modifiedAt: string;
}

export type TunnelState = "up" | "down";

export interface RemoteNetwork {
  id: string;
  name: string;
  location: string;
  peerIp: string;
  bandwidthMbps: number;
  tunnelState: TunnelState;
  tunnelUptimePct30d: number;
  lastStateChange: string;
  ikeGateway: string;
  ipsecTunnel: string;
  branchHostname: string;
  branchModel: string;
  subnet: string;
}

export interface MobileUser {
  id: string;
  user: string;
  email: string;
  privateIp: string;
  publicIp: string;
  location: string;
  gateway: string;
  os: string;
  gpVersion: string;
  connectedSince: string;
  status: "connected" | "disconnected";
}

export interface ConfigChange {
  id: string;
  changeId: string;
  timestamp: string;
  admin: string;
  container: PolicyContainer | "branch";
  summary: string;
  path: string;
  before: string;
  after: string;
  ticketHint: string;
}

export type AlertSeverity = "info" | "warning" | "critical";

export interface PlatformAlert {
  id: string;
  title: string;
  severity: AlertSeverity;
  raisedAt: string;
  clearedAt: string | null;
  resourceType: "remote-network" | "mobile-user-gateway" | "service" | "tunnel";
  resourceId: string;
  description: string;
  linkedTicketId: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  location: string;
  title: string;
}

export type EvidenceSource =
  | "traffic"
  | "url"
  | "threat"
  | "decryption"
  | "globalprotect"
  | "system"
  | "config"
  | "policy"
  | "object"
  | "network"
  | "tool";

export interface Evidence {
  id: string;
  ticketId: string;
  pinnedAt: string;
  source: EvidenceSource;
  label: string;
  refId: string;
  note: string;
}

export interface DatasetMeta {
  generatedAt: string;
  seed: number;
  demoNow: string;
  windowStart: string;
  windowEnd: string;
  counts: Record<string, number>;
}
