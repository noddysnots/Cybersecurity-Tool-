/** Types from PLAN.md section 5. Extensions are marked. */

export type Severity = "critical" | "high" | "medium" | "low" | "info";
export type AlertStatus =
  | "new"
  | "investigating"
  | "resolved"
  | "escalated"
  | "false_positive";
export type ScenarioId = "A" | "B" | "C";

/** Local status or assignee change for an alert, keyed by alert id in the store. */
export interface AlertOverride {
  status?: AlertStatus;
  assignee?: string;
}

export type LogType =
  | "traffic"
  | "threat"
  | "url"
  | "decryption"
  | "system"
  | "config";

export interface Alert {
  id: string;
  title: string;
  severity: Severity;
  status: AlertStatus;
  createdAt: string;
  source: string;
  category: "access" | "connectivity" | "threat" | "policy";
  entities: {
    users?: string[];
    ips?: string[];
    hosts?: string[];
    sites?: string[];
  };
  scenarioId?: "A" | "B" | "C";
  assignee?: string;
  summary: string;
}

export interface LogRecord {
  id: string;
  type: LogType;
  time: string;
  srcIp?: string;
  dstIp?: string;
  srcUser?: string;
  dstPort?: number;
  app?: string;
  rule?: string;
  action?: string;
  urlCategory?: string;
  threatName?: string;
  severity?: Severity;
  sessionEndReason?: string;
  bytesSent?: number;
  bytesReceived?: number;
  device: string;
  location?: string;
  message?: string; // system/config/decryption detail
  /** Extension: URL, domain (DNS or TLS SNI) or file location. Needed by URL, DNS threat and WildFire records. */
  url?: string;
}

/** Extension: reference data records, needed by the generated JSON files in src/data. */
export interface SecurityRule {
  id: string;
  name: string;
  order: number;
  fromZone: string;
  toZone: string;
  source: string;
  destination: string;
  application: string;
  action: "allow" | "deny" | "drop" | "reset-both";
  profile?: string;
  hitCount: number;
  description: string;
}

export interface DecryptionRule {
  id: string;
  name: string;
  order: number;
  fromZone: string;
  toZone: string;
  source: string;
  urlCategory: string;
  type: "ssl-forward-proxy" | "ssl-inbound-inspection";
  action: "decrypt" | "no-decrypt";
  hitCount: number;
  description: string;
}

export interface RemoteNetwork {
  id: string;
  name: string;
  location: string;
  device: string;
  deviceModel: string;
  peerIp: string;
  prismaIp: string;
  ipsecProfile: string;
  status: "up" | "down" | "degraded";
  uptime30d: number;
  statusSince?: string;
}

export interface ServiceConnection {
  id: string;
  name: string;
  kind: "aws" | "azure" | "gcp" | "datacenter";
  region: string;
  subnet: string;
  peerIp: string;
  prismaIp: string;
  status: "up" | "down" | "degraded";
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  department: string;
  location: string;
  connection: "globalprotect" | "branch";
  ip: string;
  site?: string;
}

export interface Host {
  id: string;
  hostname: string;
  ip: string;
  role: "workload" | "server" | "firewall";
  environment: "prod" | "staging" | "corp";
  location: string;
  via: string;
  os: string;
}

/** Extension: investigation workspace state, persisted per alert (key is the alert id, or "logs" for /logs). */
export type Density = "compact" | "comfortable";

export type StepId = "scope" | "logs" | "console" | "resolve";

export interface InvestigationView {
  query: string;
  /** ISO time, inclusive. */
  windowStart: string;
  /** ISO time, inclusive. */
  windowEnd: string;
  tab: LogType;
}

/** Pinned log row or console output carried into resolution. */
export type EvidenceItem =
  | {
      id: string;
      kind: "log";
      logId: string;
      /** Demo clock time when the item was pinned. */
      pinnedAt: string;
    }
  | {
      id: string;
      kind: "console";
      command: string;
      output: string;
      /** Demo clock time when the item was pinned. */
      pinnedAt: string;
    };

export type ConsoleMode = "prisma" | "branch";

/** Which scenario fixes have been applied (Screen 3). Console verify commands read this. */
export type ScenarioFixes = Partial<Record<ScenarioId, boolean>>;

/** Root cause categories on the resolution screen. */
export type RootCauseKind =
  | "misconfiguration"
  | "config_drift"
  | "true_threat"
  | "false_positive"
  | "other";

/** One audit trail entry for an alert (Screen 3). */
export interface AuditEvent {
  id: string;
  action: string;
  actor: string;
  /** Demo clock based ISO time. */
  at: string;
}

/** Draft fields for /resolve/[alertId], persisted per alert. */
export interface ResolutionDraft {
  rootCauseKind: RootCauseKind | null;
  rootCauseText: string;
  closureNote: string;
  /** Scenario C: host tagged into the quarantine DAG. */
  quarantineTagged: boolean;
  /** Scenario C: escalation package marked ready (copy or download). */
  packageGenerated: boolean;
  /** Last verify run result. null means not run yet. */
  verifyPassed: boolean | null;
}

/** Guide "Do it for me" actions executed by workspace hosts. */
export type GuideActionId =
  | "confirm-window"
  | "set-tab-traffic"
  | "set-tab-decryption"
  | "set-tab-url"
  | "set-tab-system"
  | "set-tab-config"
  | "set-tab-threat"
  | "pin-scenario-a-logs"
  | "pin-scenario-b-logs"
  | "pin-scenario-c-logs"
  | "run-decrypt-match-a"
  | "run-vpn-check-b"
  | "run-threat-c"
  | "go-resolve"
  | "set-root-misconfiguration"
  | "set-root-config-drift"
  | "set-root-true-threat"
  | "stage-policy-a"
  | "apply-config-b"
  | "prepare-escalation-c"
  | "run-verify";

/** One coach-mark step in a scenario playbook (Phase 7). */
export interface GuideStep {
  id: string;
  /** Matches data-guide-id on a real control. */
  targetId: string;
  title: string;
  body: string;
  actionId?: GuideActionId;
  /** Step rail highlight while this coach mark is active. */
  railStep?: StepId;
  /** Mark this investigation step done when the coach mark advances. */
  markDone?: StepId;
  /** Path prefix where the target exists, e.g. /investigate/. */
  pathPrefix?: string;
}

export type AnnotationScreen = "alerts" | "investigate" | "resolve";

export type MetricKind = "input" | "output" | "check";

/** Design annotation pin anchored to a screen control (Phase 7). */
export interface AnnotationPin {
  id: string;
  screen: AnnotationScreen;
  targetId: string;
  number: number;
  decision: string;
  problem: string;
  metricKind: MetricKind;
  metric: string;
}
