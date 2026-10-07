import {
  addressObjects,
  appGroups,
  configAudit,
  decryptionRules,
  securityRules,
  serviceObjects,
} from "@/data";
import type {
  AddressObject,
  AppGroup,
  ConfigChange,
  DecryptionRule,
  SecurityRule,
  ServiceObject,
} from "@/types";

export type ObjectKind = "address" | "address-group" | "service" | "app-group";

export type CatalogObject =
  | { kind: "address" | "address-group"; object: AddressObject }
  | { kind: "service"; object: ServiceObject }
  | { kind: "app-group"; object: AppGroup };

export type RuleUsage = {
  ruleId: string;
  ruleName: string;
  container: string;
  position: number;
  field: "src" | "dst" | "service" | "app" | "urlCategory";
};

export function isAddressGroup(obj: AddressObject): boolean {
  return obj.type === "group";
}

export function catalogObjects(): CatalogObject[] {
  const addresses: CatalogObject[] = addressObjects
    .filter((o) => !isAddressGroup(o))
    .map((object) => ({ kind: "address" as const, object }));
  const groups: CatalogObject[] = addressObjects
    .filter((o) => isAddressGroup(o))
    .map((object) => ({ kind: "address-group" as const, object }));
  const services: CatalogObject[] = serviceObjects.map((object) => ({
    kind: "service" as const,
    object,
  }));
  const apps: CatalogObject[] = appGroups.map((object) => ({
    kind: "app-group" as const,
    object,
  }));
  return [...addresses, ...groups, ...services, ...apps];
}

function fieldHits(names: string[], target: string): boolean {
  return names.some((n) => n.toLowerCase() === target.toLowerCase());
}

/** Rules (security + decryption) that reference an object by name. */
export function whereUsed(objectName: string): RuleUsage[] {
  const usages: RuleUsage[] = [];

  for (const rule of securityRules) {
    if (fieldHits(rule.src, objectName)) {
      usages.push({
        ruleId: rule.id,
        ruleName: rule.name,
        container: rule.container,
        position: rule.position,
        field: "src",
      });
    }
    if (fieldHits(rule.dst, objectName)) {
      usages.push({
        ruleId: rule.id,
        ruleName: rule.name,
        container: rule.container,
        position: rule.position,
        field: "dst",
      });
    }
    if (fieldHits(rule.service, objectName)) {
      usages.push({
        ruleId: rule.id,
        ruleName: rule.name,
        container: rule.container,
        position: rule.position,
        field: "service",
      });
    }
    if (fieldHits(rule.app, objectName)) {
      usages.push({
        ruleId: rule.id,
        ruleName: rule.name,
        container: rule.container,
        position: rule.position,
        field: "app",
      });
    }
  }

  for (const rule of decryptionRules) {
    if (fieldHits(rule.src, objectName)) {
      usages.push({
        ruleId: rule.id,
        ruleName: rule.name,
        container: rule.container,
        position: rule.position,
        field: "src",
      });
    }
    if (fieldHits(rule.dst, objectName)) {
      usages.push({
        ruleId: rule.id,
        ruleName: rule.name,
        container: rule.container,
        position: rule.position,
        field: "dst",
      });
    }
    if (fieldHits(rule.service, objectName)) {
      usages.push({
        ruleId: rule.id,
        ruleName: rule.name,
        container: rule.container,
        position: rule.position,
        field: "service",
      });
    }
    if (fieldHits(rule.urlCategory, objectName)) {
      usages.push({
        ruleId: rule.id,
        ruleName: rule.name,
        container: rule.container,
        position: rule.position,
        field: "urlCategory",
      });
    }
  }

  return usages;
}

export function findObjectByName(name: string): CatalogObject | null {
  const lower = name.toLowerCase();
  return catalogObjects().find((item) => item.object.name.toLowerCase() === lower) ?? null;
}

export function findSecurityRuleByName(name: string): SecurityRule | null {
  const lower = name.toLowerCase();
  return securityRules.find((r) => r.name.toLowerCase() === lower) ?? null;
}

export function findDecryptionRuleByName(name: string): DecryptionRule | null {
  const lower = name.toLowerCase();
  return decryptionRules.find((r) => r.name.toLowerCase() === lower) ?? null;
}

/** Config changes that mention a rule or object name in path/summary. */
export function changesForName(name: string): ConfigChange[] {
  const lower = name.toLowerCase();
  return configAudit
    .filter(
      (c) =>
        c.path.toLowerCase().includes(lower) ||
        c.summary.toLowerCase().includes(lower) ||
        c.before.toLowerCase().includes(lower) ||
        c.after.toLowerCase().includes(lower),
    )
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
}

export function objectDisplayValue(item: CatalogObject): string {
  if (item.kind === "service") {
    return `${item.object.protocol}/${item.object.destinationPorts}`;
  }
  if (item.kind === "app-group") {
    return item.object.members.join(", ");
  }
  if (item.kind === "address-group") {
    return item.object.members.join(", ") || item.object.value;
  }
  return item.object.value;
}
