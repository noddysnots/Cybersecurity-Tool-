/** Copy for the in-app Brief page. Keep in sync with docs/WRITEUP.md and docs/DEV_ACTION_ITEMS.md. */

export const BRIEF_COPY = {
  title: "Brief",
  problemHeading: "Problem",
  problem:
    "When a cloud security alert fires, the engineer jumps between the alert, four log types, policy config, and a CLI to answer one question: is this a real threat, a misconfiguration, or noise? Context is scattered, so reaching a confident decision is slow and evidence gets lost between tools.",
  personaHeading: "Persona",
  personaName: "Priya Nair, L2 Cloud Security Engineer",
  personaBullets: [
    "Works on a team running a Prisma Access style SASE for about 4,000 users and 12 branch sites.",
    "Handles 30 to 50 alerts per shift. Most are noise or config issues. A few are real.",
    "Comes from a TAC background: first move is always when exactly it happened, and who or what was involved.",
    "Comfortable with CLI and log query syntax. Hates losing her place when switching tabs.",
    "Success for her: close the clear cases fast, escalate the real ones with evidence nobody has to re-collect.",
  ],
  writeupHeading: "Write-up",
  writeupIntro:
    "Features ranked by time saved per alert times alerts per shift, and by risk reduced (wrong closures, missed threats).",
  writeupDocHint: "Full one-page write-up: docs/WRITEUP.md",
  features: [
    {
      name: "Time-scoped investigation workspace (P0)",
      why: "Biggest time sink today is re-scoping each tool to the incident window.",
    },
    {
      name: "Evidence pinning that flows into resolution (P0)",
      why: "Removes re-collection at escalation and closure.",
    },
    {
      name: "Integrated console with scenario-aware diagnostics (P0)",
      why: "TAC engineers verify in CLI before acting; keeping it in the workspace keeps context.",
    },
    {
      name: "Outcome-specific resolution with verify gate (P1)",
      why: "Prevents closing without proof.",
    },
    {
      name: "Guided mode (P1)",
      why: "Onboards new L1 and L2 engineers into the TAC method.",
    },
    {
      name: "Correlated timeline strip (P2)",
      why: "Makes patterns like beacons and retries obvious.",
    },
  ],
  metricsHeading: "Success metrics",
  metrics: [
    {
      label: "Input",
      text: "Share of alerts opened in the workspace (vs external tools), share with a pinned time window, console usage per investigation.",
    },
    {
      label: "Output",
      text: "Median time to first evidence, mean time to resolve (MTTR), share of alerts closed at L2 without escalation.",
    },
    {
      label: "Check",
      text: "Reopen rate within 7 days, false-negative escalations found later, verify-gate bypass attempts.",
    },
  ],
  devHeading: "Dev action items",
  devIntro: "Bonus deliverable for a real product backlog. Full list: docs/DEV_ACTION_ITEMS.md",
  reviewHeading: "How to review",
  reviewSteps: [
    "Open the live app (or run locally) and pick Scenario A from the start screen with Guide on.",
    "Follow the coach marks through time scope, logs, console, and resolve. Target under 5 minutes.",
    "Toggle Annotations on Screens 1 to 3 to see design decisions on the real UI.",
    "Optionally finish Scenarios B and C end to end.",
    "Read docs/WRITEUP.md and docs/DEV_ACTION_ITEMS.md in the repo.",
  ],
  credit: "Built by Sarthak Pant",
} as const;

export const BRIEF_DEV_ITEMS = [
  {
    title: "Log query service",
    why: "Engineers need fast, time-partitioned search with a familiar PAN-OS style query language.",
    acceptance: "p95 under 2s for a 24h window with the production index.",
  },
  {
    title: "Alert-to-log correlation",
    why: "Default query and window should come from alert entities so investigation starts scoped.",
    acceptance: "Opening an alert pre-fills query and window; engineer can still edit both.",
  },
  {
    title: "Read-only diagnostic sandbox",
    why: "CLI verification belongs in the workflow without risking config writes.",
    acceptance: "Allowlisted commands only, per-user audit, rate limits, no config mutations.",
  },
  {
    title: "Policy and config diff engine",
    why: "Fixes need a clear before and after plus a safe rollback path.",
    acceptance: "Staged changes show a diff; one-click rollback restores the prior state.",
  },
  {
    title: "Evidence model",
    why: "Pinned items must survive handoff and closure without re-collection.",
    acceptance: "Evidence is immutable, timestamped, linked to an alert, and exportable.",
  },
  {
    title: "Escalation package export",
    why: "IR needs a complete package without rebuilding the timeline by hand.",
    acceptance: "Export Markdown and JSON; ticketing integration can attach the same payload.",
  },
  {
    title: "Audit event schema",
    why: "Every triage action should be reconstructable for review and compliance.",
    acceptance: "Schema covers assign, pin, console, resolve, escalate, and verify outcomes.",
  },
  {
    title: "Guided mode content as data",
    why: "New scenarios should ship as playbooks, not code changes.",
    acceptance: "JSON playbooks drive coach marks; adding a scenario needs no UI code edits.",
  },
] as const;
