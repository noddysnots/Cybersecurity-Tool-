# Triage Console: Master Plan

Single source of truth for this project. If code and this file disagree, this file wins. Change this file first, then the code.

Developer: Sarthak Pant
Submission: GitHub repo link + live Vercel link. No Figma. The repo and the app ARE the submission.

---

## 1. The brief (what reviewers check)

Option chosen: **[2] Alert Triage Workflow.** Show how a security engineer investigates and resolves a cloud security alert.

Reviewers look for: clarity of problem understanding, simplicity and flow of design, quality of prioritization reasoning, practicality and originality.

Where each required item lives:

| Brief asks for | Where it lives |
|---|---|
| Problem statement and persona | README top + in-app "Brief" page |
| 2-3 screen wireframe with annotations | Live app with an Annotations toggle (numbered pins on each screen) + annotated screenshots in README |
| 1-page write-up | `docs/WRITEUP.md`, linked from README and app |
| Bonus: dev action items | `docs/DEV_ACTION_ITEMS.md` (optionally mirrored as GitHub Issues) |

## 2. Problem and persona

**Problem.** When a cloud security alert fires, the engineer jumps between the alert, four log types, policy config, and a CLI to answer one question: is this a real threat, a misconfiguration, or noise? Context is scattered, so reaching a confident decision is slow and evidence gets lost between tools.

**Persona: Priya Nair, L2 Cloud Security Engineer**
- Works on a team running Prisma Access style SASE for ~4,000 users and 12 branch sites.
- Handles 30 to 50 alerts per shift. Most are noise or config issues. A few are real.
- Comes from a TAC background: first move is always "when exactly did it happen, and who/what was involved?"
- Comfortable with CLI and log query syntax. Hates losing her place when switching tabs.
- Success for her: close the clear cases fast, escalate the real ones with evidence nobody has to re-collect.

## 3. Product principles

1. **Time first.** Every investigation starts by pinning the incident time window. Everything downstream is scoped to it.
2. **One workspace.** Alert, logs, console, and evidence on one screen. No tab hopping.
3. **Evidence is a first-class object.** Anything can be pinned (a log row, a console output). Pinned evidence flows into the resolution.
4. **Three honest outcomes.** Fix a policy, fix connectivity, or escalate. The UI must make "do not fix, escalate" as easy as fixing.
5. **Show the why.** Annotations explain design choices on the real screens.

## 4. Scenarios (all three ship in v1)

Demo clock is FIXED: **Tue 6 Oct 2026, 15:00 IST**. All data is relative to this. Never use the real system time. Timezone toggle IST / UTC, default IST.

### Scenario A (hero): SaaS app blocked, decryption error
- **Alert:** ALR-1042, Medium, "User cannot reach Salesforce". Source: helpdesk ticket INC-88213 forwarded to security.
- **Affected user:** rahul.mehta@acme.io, mobile user (GlobalProtect), Mumbai, src IP 10.20.14.37
- **Destination:** login.salesforce.com, 13.110.54.20:443
- **Incident time (user reported):** "around 2:20 PM". Real first failure: 14:17:42 IST. Repeats every 1-3 min until 14:48.
- **Evidence trail:**
  - Traffic log: app `ssl`, rule `Allow-SaaS-Business` (allow), session end reason `decrypt-error`, bytes received very low.
  - Decryption log: policy `Decrypt-All-Outbound`, error "Certificate pinned: client rejected forward proxy certificate".
  - URL log: category `business-and-economy`, action allow (proves URL filtering is NOT the cause, a deliberate red herring check).
- **Root cause:** Salesforce desktop client pins its certificate. Decryption policy has no exclusion for it, so the handshake fails.
- **Console (branch/firewall CLI mode):**
  - `test security-policy-match from trust to untrust source 10.20.14.37 destination 13.110.54.20 destination-port 443 protocol 6 application ssl` -> matches `Allow-SaaS-Business`, action allow.
  - `test decryption-policy-match category business-and-economy from trust to untrust source 10.20.14.37 destination 13.110.54.20` -> matches `Decrypt-All-Outbound`, action decrypt.
  - `show session all filter source 10.20.14.37` -> sessions with end reason decrypt-error.
  - `show counter global filter delta yes | match proxy` -> `proxy_decrypt_cert_pinned` counter increasing.
- **Resolution:** Add no-decrypt rule `No-Decrypt-Pinned-SaaS` above `Decrypt-All-Outbound` for `*.salesforce.com`. Show policy diff. Verify: re-run `test decryption-policy-match` -> now matches no-decrypt. Status: Resolved, root cause "Misconfiguration: decryption exclusion missing".

### Scenario B: IPsec tunnel down, config drift
- **Alert:** ALR-1037, High, "Remote network Pune-Branch-01: tunnel down".
- **Branch device:** PA-440 `pune-fw-01`, peer IP 203.0.113.10. Prisma side IP 198.51.100.24.
- **Tunnel down at:** 11:42:08 IST. Change window CHG-4471 at 11:30 to 11:40 by `netops.admin`.
- **Evidence trail:**
  - System log: 11:42 "IKEv2 child SA negotiation failed: NO_PROPOSAL_CHOSEN". Repeats every 30s.
  - Config log: 11:36 `netops.admin` edited IPsec crypto profile `ipsec-prisma`: PFS group `group14` -> `group19`.
  - Tunnel status history: up 99.9% for 30 days, down since 11:42.
- **Root cause:** Phase 1 (IKE) is fine. Phase 2 PFS DH group mismatch after the change window. Branch sends group19, Prisma side expects group14.
- **Console (branch firewall CLI):**
  - `show vpn ike-sa gateway gw-prisma-pune` -> IKE SA established (phase 1 OK).
  - `show vpn ipsec-sa tunnel tun-prisma-pune` -> no IPsec SA found.
  - `test vpn ipsec-sa tunnel tun-prisma-pune` -> fails.
  - `less mp-log ikemgr.log` -> "NO_PROPOSAL_CHOSEN ... received DH group 19, configured group 14".
  - `show vpn flow tunnel-id 7` -> state inactive.
- **Resolution:** Config diff panel (branch vs Prisma side) highlights the PFS mismatch. Engineer applies "Revert PFS group to group14 on pune-fw-01". After that, `test vpn ipsec-sa` succeeds and `show vpn ipsec-sa` shows the SA. Status: Resolved, root cause "Config drift after change CHG-4471". Suggest follow-up: add pre-change tunnel check to the change template.

### Scenario C: C2 callback, true threat
- **Alert:** ALR-1049, Critical, "Command and control traffic from prod workload".
- **Host:** `prod-api-07`, 10.40.2.15, AWS Mumbai via service connection `SC-AWS-Mumbai`.
- **First seen:** 09:12:05 IST. Beacon every 60s (+/- 3s jitter).
- **Evidence trail:**
  - DNS / Threat log: queries to `update-check.cdn-sync.net`, action sinkhole, threat "Generic C2 beacon", spyware.
  - Threat log 08:57: file `agent-update.sh` downloaded from `185.220.x.x`, WildFire verdict malicious.
  - Traffic log: repeated connections to sinkhole IP, small fixed byte counts (beacon pattern).
- **Root cause:** Compromised workload, not a misconfiguration. Do NOT "fix" a rule.
- **Console:** `show log threat src 10.40.2.15`, `show session all filter source 10.40.2.15`, `show dns-proxy cache`.
- **Resolution:** Tag host into Dynamic Address Group `quarantine` (policy already blocks it). Generate escalation package (timeline, IOCs, pinned evidence) for Incident Response. Status: Escalated.

## 5. Data

Generated once by `scripts/generate-data.ts` with a fixed seed. Output committed as JSON in `src/data/`. App never generates data at runtime.

**Counts**
- 500 log records total, spread over the last 24 hours before the demo clock.
  - Mix: ~40% traffic, ~20% URL, ~15% threat, ~10% decryption, ~15% system/config.
  - Theme of noise: ~40% policy and URL blocks, ~25% tunnel and connectivity events, ~25% threat events, ~10% pure noise.
- ~40 alerts: the 3 scenario alerts + noise alerts (duplicates, low severity, already resolved, false positives).
- ~25 security rules, ~6 decryption rules, ~12 remote networks, ~4 service connections, ~30 users, ~20 hosts.

**Planted needles:** each scenario's exact records (Section 4) are inserted by hand, not random. A test asserts they exist.

**Types (src/types.ts)**
```ts
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AlertStatus = 'new' | 'investigating' | 'resolved' | 'escalated' | 'false_positive';
type LogType = 'traffic' | 'threat' | 'url' | 'decryption' | 'system' | 'config';

interface Alert {
  id: string; title: string; severity: Severity; status: AlertStatus;
  createdAt: string; source: string; category: 'access' | 'connectivity' | 'threat' | 'policy';
  entities: { users?: string[]; ips?: string[]; hosts?: string[]; sites?: string[] };
  scenarioId?: 'A' | 'B' | 'C'; assignee?: string; summary: string;
}

interface LogRecord {
  id: string; type: LogType; time: string; srcIp?: string; dstIp?: string;
  srcUser?: string; dstPort?: number; app?: string; rule?: string; action?: string;
  urlCategory?: string; threatName?: string; severity?: Severity; sessionEndReason?: string;
  bytesSent?: number; bytesReceived?: number; device: string; location?: string;
  message?: string; // system/config/decryption detail
}
```
Extend only if a screen needs it. Keep it flat.

## 6. Information architecture

```
Splash (first visit only, skippable, "Sarthak Pant")
 └─ Start screen: pick Scenario A / B / C, or "Explore freely"

App shell
 ├─ Left nav (collapsible): Alerts · Investigate · Logs · Policies · Remote networks · Brief
 ├─ Top bar: tenant "Acme Corp", global search (Cmd+K), timezone IST/UTC, Guide toggle, Annotations toggle, theme toggle
 └─ Routes
     /alerts                 Screen 1: Alerts queue
     /investigate/[alertId]  Screen 2: Investigation workspace
     /resolve/[alertId]      Screen 3: Resolution
     /logs                   Full log viewer (same component as Screen 2, unscoped)
     /policies, /networks    Read-only reference lists
     /brief                  Problem, persona, write-up, dev items, credits
```

## 7. Screens

### Screen 1: Alerts queue
- Header: count summary by severity, shown as compact clickable filters (not big stat cards).
- Filter bar: severity, status, category, time range, assignee, free-text. Active filters shown as removable chips. Filters live in the URL so a view is shareable.
- Table: severity (icon + label, never color alone), alert, entities, first seen (relative, absolute on hover), status, assignee. Sort by severity then time by default.
- Row hover reveals quick actions: Assign to me, Mark false positive. Click opens investigation.
- Scenario alerts carry a subtle "Guided" badge only when Guide mode is on.

### Screen 2: Investigation workspace (the core)
Layout:
```
┌ Alert header: title, severity, status, entities as chips, "Mark resolved" / "Escalate" ┐
├ Step rail (left, narrow): 1 Scope time · 2 Check logs · 3 Verify in console · 4 Resolve ┤
│                                                                                         │
│  Time scope bar: "Incident around 14:20 IST" -> window 14:05 to 14:35 (+/-15 default)   │
│  Mini histogram of events in window, drag to adjust                                     │
│                                                                                         │
│  Log tabs: Traffic | Threat | URL | Decryption | System | Config (counts per tab)        │
│  Query bar (PAN-OS style): ( addr.src in 10.20.14.37 ) and ( app eq ssl )              │
│  Virtualized table, row click -> right detail drawer (all fields, Pin as evidence)     │
│                                                                                         │
├ Evidence tray (right or bottom): pinned rows and console outputs, reorderable           ┤
└ Console drawer (bottom, resizable, Ctrl+`): mode switch "Prisma diagnostics" / "Branch firewall CLI" ┘
```
- Opening an alert pre-fills the query bar from its entities and the time window from the alert. Engineer can still change both.
- Query bar: autocomplete for fields (addr.src, addr.dst, app, rule, action, user.src, url.category, threat.name) and operators (eq, neq, in, contains, and, or). Invalid query shows inline error with the problem part underlined.
- Clicking any IP, user, or rule value in a row offers: Filter by, Exclude, Copy, Pin.
- Correlated timeline strip above tabs: dots per log type across the window, so the pattern (beacons, repeats) is visible at a glance.

### Screen 3: Resolution
- Left: Root cause selector (Misconfiguration / Config drift / True threat / False positive / Other) + free-text root cause.
- Middle, depends on outcome:
  - Policy fix: before/after policy table diff, new rule highlighted in position.
  - Config fix: side-by-side config diff, mismatched lines highlighted.
  - Escalation: escalation package preview (timeline, IOCs, evidence, affected assets) with "Copy as text" and "Download .md".
- Right: Pinned evidence (carried from Screen 2), closure note (pre-drafted from evidence, editable), Verify step (runs the verification command and shows pass/fail).
- Footer: "Resolve alert" or "Escalate to IR". Disabled until verify passes (fix paths) or package is generated (escalation). Explain why when disabled.
- Activity / audit trail at bottom: every action with time and actor.

### Guidance
- **Guide mode** (default ON when entering from a scenario): step coach marks anchored to real UI elements. Each step: what to do, why a TAC engineer does it, and a "Do it for me" button. Progress shown on the step rail. Can exit any time; resume from where you left.
- **Annotations mode** (toggle in top bar): numbered pins on each screen. Clicking a pin opens a note: design decision, user problem it solves, metric it moves. 5-7 pins per screen max. This replaces the Figma wireframe.
- **Console help:** typing `?` or `help` lists available commands for the current mode and scenario. Tab completes commands. Up/Down cycles history. Unknown command gives a useful message with closest match.

## 8. Design system

Direction: an operations console, calm and dense, built for an 8-hour shift. Recognisably in the family of enterprise SASE consoles (dark left nav, light dense content, tabs, log tables) but with its own identity. No Palo Alto logos, names of their products in UI chrome, or their orange.

**Palette (light)**
- `--nav` #1B2430 (graphite nav)
- `--surface` #F6F8FA, `--panel` #FFFFFF, `--border` #E1E6EC
- `--text` #18202A, `--muted` #5B6675
- `--accent` #2F6F8F (steel blue-teal, used for primary actions, focus, selection only)
- Severity: critical #C0362C, high #D9691E, medium #B98A0B, low #3A6EA5, info #6B7785. Always paired with an icon and label.
- Success #2E7D4F for verify passed / tunnel up.

**Dark mode** supported with matching tokens. Light is default. Console drawer is always dark.

**Type**
- UI: IBM Plex Sans. Data that is genuinely technical (IPs, ports, commands, log values, rule names): IBM Plex Mono.
- Scale: 12 / 13 / 14 / 16 / 20 / 24. Tables at 13px. Sentence case everywhere. No all-caps labels.

**Density and layout**
- 4px spacing grid. Table rows 32px (compact) or 40px (comfortable) toggle.
- Radius: 6px for controls, 8px for panels, 0 for table cells. Not one radius for everything.
- Borders over shadows. Shadows only on floating layers (drawers, popovers, command palette).
- Desktop first, min useful width 1280px. Below 1024px show a polite "Best on a larger screen" notice but keep it usable.

**Motion**
- Only in response to user actions: drawers slide, pins fade, verify result transitions. Splash has one orchestrated moment, nothing else animates on load. Respect prefers-reduced-motion.

## 9. UX nuances checklist (all required)

- Keyboard: `/` focus query bar, `j/k` move rows, `Enter` open, `p` pin, `Esc` close drawer, `Cmd/Ctrl+K` command palette, ``Ctrl+` `` console. Shortcut sheet on `?` outside the console.
- Visible focus rings on everything. All interactive elements reachable by keyboard. Proper aria labels on icon buttons.
- Loading skeletons (simulate 300-600ms latency on query runs so states are visible). Empty states with a next action ("No logs in this window. Widen to +/-1h"). Error states that say what went wrong and how to fix it.
- Copy buttons on IPs, hashes, commands, with "Copied" toast.
- Relative time with absolute on hover, respecting IST/UTC toggle.
- Sticky table headers, column resize, column show/hide, virtualization for long lists.
- State survives navigation: filters, query, pinned evidence, console history, guide progress (localStorage, wrapped in try/catch).
- "Reset demo" in the user menu clears all saved state.
- Toasts match action names ("Pin evidence" -> "Pinned to evidence").
- No em dashes or en dashes in UI copy or docs.

## 10. Write-up content (source for docs/WRITEUP.md, max 1 page)

**Features, in priority order**
1. Time-scoped investigation workspace (P0). Biggest time sink today is re-scoping each tool to the incident window.
2. Evidence pinning that flows into resolution (P0). Removes re-collection at escalation and closure.
3. Integrated console with scenario-aware diagnostics (P0). TAC engineers verify in CLI before acting; keeping it in the workspace keeps context.
4. Outcome-specific resolution with verify gate (P1). Prevents closing without proof.
5. Guided mode (P1). Onboards new L1/L2 engineers into the TAC method.
6. Correlated timeline strip (P2). Makes patterns like beacons and retries obvious.

**Prioritization logic:** ranked by (time saved per alert x alerts per shift) and by risk reduced (wrong closures, missed threats). Anything that does not shorten time-to-evidence or improve decision quality is cut.

**Success metrics (input / output / check)**
- Input: % of alerts opened in the workspace (vs external tools), % with a pinned time window, console usage per investigation.
- Output: median time to first evidence, mean time to resolve (MTTR), % alerts closed at L2 without escalation.
- Check (guardrails): reopen rate within 7 days, false-negative escalations found later, verify-gate bypass attempts.

## 11. Dev action items (source for docs/DEV_ACTION_ITEMS.md)

1. Log query service: time-partitioned index, PAN-OS style query parser, p95 < 2s for 24h window.
2. Alert-to-log correlation: map alert entities to default query and time window.
3. Read-only diagnostic sandbox: allowlisted commands, per-user audit, rate limits, no config writes.
4. Policy and config diff engine with staged changes and one-click rollback.
5. Evidence model: immutable, timestamped, linked to alert, exportable.
6. Escalation package export (Markdown, JSON, ticketing integration).
7. Audit event schema for every triage action.
8. Guided mode content as data (JSON playbooks), so new scenarios ship without code changes.

## 12. Tech stack

- Next.js (App Router) + TypeScript (strict), static only, no backend, deploy on Vercel.
- Tailwind CSS + shadcn/ui primitives (restyled to tokens above).
- TanStack Table + TanStack Virtual for log tables.
- Zustand for app state (filters, evidence, console, guide progress).
- cmdk for command palette. lucide-react icons. Motion (framer-motion) only for drawers and coach marks.
- @faker-js/faker with fixed seed in the generator script only (dev dependency).
- Vitest for: data generator assertions, query parser, console command parser.
- Console is a custom React component (not xterm.js): simpler, accessible, themeable.

## 13. Repo structure

```
/docs            WRITEUP.md, DEV_ACTION_ITEMS.md, screenshots/
/scripts         generate-data.ts
/src/app         routes
/src/components  shell/, alerts/, investigate/, resolve/, console/, guide/, annotations/, ui/
/src/data        *.json (generated, committed)
/src/lib         query-parser.ts, console/commands.ts, console/outputs.ts, time.ts, store.ts
/src/content     guide-steps.ts, annotations.ts (copy as data)
/src/types.ts
/tests
PLAN.md  README.md
```

## 14. Definition of done

- A first-time reviewer goes README -> live app -> finishes Scenario A with Guide on in under 5 minutes.
- Scenarios B and C completable end to end.
- Annotations toggle works on all 3 screens.
- `npm run build`, `npm run lint`, `npm test` pass. No console errors in the browser.
- Lighthouse accessibility >= 95 on /alerts.
- README has: one-paragraph problem, persona, 3 annotated screenshots, live link, "Review in 5 minutes" steps, links to write-up and dev items.
