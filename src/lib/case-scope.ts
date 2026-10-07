import { DEMO_NOW_ISO } from "@/lib/time";
import type { CaseKey, LogType } from "@/types";

export type EvidenceScopePreset = {
  failingLabel: string;
  workingLabel: string;
  failingQuery: string;
  workingQuery: string;
  initialQuery: string;
  initialType: LogType | "all";
  windowStart: string;
  windowEnd: string;
  compareMode: "users" | "branches";
};

/** Scope-derived presets for Evidence / Compare. Fixed demo times, not the real clock. */
export function getEvidenceScope(caseKey: CaseKey): EvidenceScopePreset {
  if (caseKey === "meet-quic") {
    return {
      failingLabel: "ankit.verma@acme.io",
      workingLabel: "sana.khan@acme.io",
      failingQuery: "( user.src eq ankit.verma@acme.io )",
      workingQuery: "( user.src eq sana.khan@acme.io )",
      initialQuery: "( user.src eq ankit.verma@acme.io )",
      initialType: "traffic",
      // CHG-5120 overnight through demo now so config strip includes the change
      windowStart: "2026-10-05T17:30:00.000Z",
      windowEnd: DEMO_NOW_ISO,
      compareMode: "users",
    };
  }
  return {
    failingLabel: "Pune-Branch-01",
    workingLabel: "Mumbai-Branch-02",
    failingQuery: "( location contains India West ) and ( type eq system )",
    workingQuery: "( location contains India West ) and ( type eq traffic )",
    initialQuery: "( type eq system )",
    initialType: "system",
    // 11:30 IST change window through demo now
    windowStart: "2026-10-06T06:00:00.000Z",
    windowEnd: DEMO_NOW_ISO,
    compareMode: "branches",
  };
}
