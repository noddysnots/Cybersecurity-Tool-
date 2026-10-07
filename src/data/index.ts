import type {
  AddressObject,
  AppGroup,
  ConfigChange,
  DatasetMeta,
  DecryptionRule,
  Evidence,
  LogRecord,
  MobileUser,
  PlatformAlert,
  RemoteNetwork,
  SecurityRule,
  ServiceObject,
  Ticket,
  User,
} from "@/types";

import addressObjectsJson from "./address-objects.json" with { type: "json" };
import appGroupsJson from "./app-groups.json" with { type: "json" };
import configAuditJson from "./config-audit.json" with { type: "json" };
import decryptionRulesJson from "./decryption-rules.json" with { type: "json" };
import evidenceCatalogJson from "./evidence-catalog.json" with { type: "json" };
import logsJson from "./logs.json" with { type: "json" };
import metaJson from "./meta.json" with { type: "json" };
import mobileUsersJson from "./mobile-users.json" with { type: "json" };
import platformAlertsJson from "./platform-alerts.json" with { type: "json" };
import remoteNetworksJson from "./remote-networks.json" with { type: "json" };
import securityRulesJson from "./security-rules.json" with { type: "json" };
import serviceObjectsJson from "./service-objects.json" with { type: "json" };
import ticketsJson from "./tickets.json" with { type: "json" };
import usersJson from "./users.json" with { type: "json" };

export const meta = metaJson as DatasetMeta;
export const users = usersJson as User[];
export const tickets = ticketsJson as Ticket[];
export const logs = logsJson as LogRecord[];
export const securityRules = securityRulesJson as SecurityRule[];
export const addressObjects = addressObjectsJson as AddressObject[];
export const serviceObjects = serviceObjectsJson as ServiceObject[];
export const appGroups = appGroupsJson as AppGroup[];
export const decryptionRules = decryptionRulesJson as DecryptionRule[];
export const remoteNetworks = remoteNetworksJson as RemoteNetwork[];
export const mobileUsers = mobileUsersJson as MobileUser[];
export const configAudit = configAuditJson as ConfigChange[];
export const platformAlerts = platformAlertsJson as PlatformAlert[];
export const evidenceCatalog = evidenceCatalogJson as Evidence[];
