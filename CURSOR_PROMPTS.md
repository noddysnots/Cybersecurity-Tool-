# Cursor Prompts: Triage Console

How to use:
1. Put `PLAN.md` in the repo root and `.cursor/rules/project.mdc` in place before Phase 0.
2. Paste one phase at a time into Cursor Agent. Do not paste the next phase until the current one passes its checks.
3. After every phase, run the Review prompt at the bottom. Fix what it finds, then commit with the given message and push. Vercel redeploys on every push.

---

## Phase 0: Setup and deploy pipeline

```
Read PLAN.md fully. Do not write feature code yet.

1. Create a Next.js App Router project with TypeScript strict, Tailwind, ESLint, src/ directory.
2. Install: shadcn/ui (init only), zustand, @tanstack/react-table, @tanstack/react-virtual, cmdk, lucide-react, motion, date-fns, date-fns-tz. Dev: vitest, @faker-js/faker, tsx.
3. Add IBM Plex Sans and IBM Plex Mono via next/font.
4. Create the CSS variables from PLAN.md section 8 (light + dark) in globals.css and map them in the Tailwind theme. Nothing else styled yet.
5. Create the folder structure from PLAN.md section 13 with empty index files where needed.
6. Add scripts: dev, build, lint, test, generate.
7. Create src/lib/time.ts exporting the fixed demo clock and IST/UTC format helpers. Add a test for it.
8. A placeholder home page that says "Triage Console" using the tokens.

Before coding, list any assumptions or questions about PLAN.md. If none, proceed.
Done when: lint, build, test pass.
```
Commit: `chore: project setup, tokens, demo clock`
Then: push to GitHub, import the repo in Vercel, confirm the placeholder is live.

---

## Phase 1: Data

```
Read PLAN.md sections 4 and 5.

1. Write src/types.ts exactly as in section 5 (extend only if a scenario record needs a field, and tell me which).
2. Write scripts/generate-data.ts with a fixed faker seed that outputs to src/data/: alerts.json, logs.json, rules.json, decryption-rules.json, networks.json, service-connections.json, users.json, hosts.json.
3. Hand-insert every scenario record from section 4 (A, B, C) with the exact values: IPs, users, times, rule names, messages. Do not randomize them.
4. Noise must look realistic: plausible apps, ports, rule names, users, sites. Include duplicates, false positives, already-resolved alerts.
5. Tests in tests/data.test.ts:
   - logs.json has exactly 500 records, all within 24h before the demo clock.
   - log type mix is within +/-5% of section 5.
   - every scenario needle exists with exact values.
   - every alert entity references a real user/host/ip in the data.
6. Run generate, commit the JSON.

Show me 5 sample noise rows and all Scenario A rows when done.
```
Commit: `feat(data): seeded dataset with scenario needles`

---

## Phase 2: App shell, splash, start screen

```
Read PLAN.md sections 6, 8, 9.

1. App shell: collapsible graphite left nav (Alerts, Investigate, Logs, Policies, Remote networks, Brief), top bar (tenant "Acme Corp", global search trigger, IST/UTC toggle, Guide toggle, Annotations toggle, theme toggle, user menu with "Reset demo").
2. Splash: shown on first visit only (remember in localStorage), skippable with any key or click. Shows "Triage Console" and "Built by Sarthak Pant". One orchestrated entrance moment, under 2 seconds, nothing else animates. Respect reduced motion.
3. Start screen after splash: three scenario cards (A, B, C) with one line each describing the situation as the user would hear it (not the answer), plus "Explore freely". Picking a scenario turns Guide on and opens that alert's investigation.
4. Zustand store skeleton in src/lib/store.ts: timezone, guideOn, annotationsOn, theme, activeScenario. Persisted safely.
5. Command palette (Cmd/Ctrl+K) with navigation entries only for now.
6. Responsive notice below 1024px.

Done when: keyboard-only navigation works across shell, splash skip works, reset demo clears everything, lint/build/test pass.
```
Commit: `feat(shell): app shell, splash, start screen`

---

## Phase 3: Screen 1, Alerts queue

```
Read PLAN.md section 7 (Screen 1) and 9.

Build /alerts:
1. Severity summary as compact clickable filters (not big stat cards).
2. Filter bar: severity, status, category, time range, assignee, text search. Active filters as removable chips. All filter state in URL search params.
3. Table with TanStack: severity (icon + label), alert title + id, entities as mono chips, first seen (relative, absolute on hover, timezone aware), status, assignee. Default sort severity then time.
4. Row hover quick actions: Assign to me, Mark false positive (updates store, toast).
5. Keyboard: j/k to move, Enter to open, / to focus search.
6. Loading skeleton on filter change (simulated 300ms), empty state with a "Clear filters" action.
7. "Guided" badge on scenario alerts only when Guide is on.

Done when: filters survive refresh via URL, keyboard flow works, lint/build/test pass.
```
Commit: `feat(alerts): alerts queue`

---

## Phase 4: Screen 2, Investigation workspace (logs)

```
Read PLAN.md section 7 (Screen 2) and 9. This is the most important screen. Take care.

1. Query parser in src/lib/query-parser.ts supporting PAN-OS style:
   ( addr.src in 10.20.14.37 ) and ( app eq ssl ), operators eq, neq, in, contains, and, or, parentheses.
   Fields: addr.src, addr.dst, user.src, app, rule, action, url.category, threat.name, port.dst, device.
   Return either a predicate or an error with position. Write tests first (valid, invalid, nested), then implement.
2. /investigate/[alertId]:
   - Alert header with entities as chips, status, Resolve / Escalate buttons (Resolve goes to /resolve/[id]).
   - Step rail: Scope time, Check logs, Verify in console, Resolve. Shows completion state.
   - Time scope bar: prefilled from alert, +/-15 min default, presets (+/-5m, 15m, 1h), mini histogram of events that can be dragged to adjust.
   - Correlated timeline strip: dots per log type across the window.
   - Log tabs with counts: Traffic, Threat, URL, Decryption, System, Config.
   - Query bar prefilled from alert entities, with autocomplete for fields and operators, inline error with the bad part underlined.
   - Virtualized table, sticky header, column resize and show/hide, compact/comfortable density.
   - Cell values (IP, user, rule) open a menu: Filter by, Exclude, Copy, Pin.
   - Row click opens a right detail drawer with all fields and "Pin as evidence".
   - Evidence tray listing pinned items, removable, reorderable, persisted per alert.
3. /logs reuses the same components without an alert scope.

Verify with Scenario A: opening ALR-1042 must show the decrypt-error traffic rows and the pinned-cert decryption rows within the default window.
Done when: parser tests pass, A, B, C each surface their key evidence with default scope, lint/build/test pass.
```
Commit: `feat(investigate): workspace, query parser, evidence`

---

## Phase 5: Console

```
Read PLAN.md sections 4 (console commands per scenario) and 7 (Console help).

1. src/lib/console/commands.ts: a command registry. Each command has: pattern, mode (prisma | branch), help text, and a handler that returns output text built from src/data, not hardcoded strings where the data exists.
2. Implement every command listed in section 4 for A, B, C with realistic PAN-OS style output formatting. Add 3-4 general commands (show system info, show clock, help).
3. Scenario B state: after the fix is applied in Screen 3, test vpn ipsec-sa and show vpn ipsec-sa must show the tunnel up. Scenario A: after the no-decrypt rule is added, test decryption-policy-match must match it. Read this state from the store.
4. Console UI: bottom drawer, always dark, resizable, Ctrl+` toggle, mode switch (Prisma diagnostics / Branch firewall CLI), prompt shows mode and device (e.g. admin@pune-fw-01>).
   - Tab completion, Up/Down history, `?` and `help` list commands for current mode.
   - Unknown command: say it is unknown and suggest the closest match.
   - Copy button per output block, "Pin output as evidence" per block.
5. Tests for the command parser and for scenario state changes.

Done when: each scenario's verify command can be run and pinned, tests pass, lint/build pass.
```
Commit: `feat(console): diagnostic console with branch CLI`

---

## Phase 6: Screen 3, Resolution

```
Read PLAN.md section 7 (Screen 3).

Build /resolve/[alertId]:
1. Root cause selector + free text.
2. Outcome panel by type:
   - Policy fix (A): before/after rule table diff, new rule No-Decrypt-Pinned-SaaS highlighted in position above Decrypt-All-Outbound. "Stage change" button.
   - Config fix (B): side-by-side config diff for ipsec-prisma, mismatch highlighted. "Apply fix on pune-fw-01" button.
   - Escalation (C): package preview (timeline, IOCs, pinned evidence, affected assets), "Add host to quarantine group", "Copy as text", "Download .md".
3. Pinned evidence carried over. Closure note pre-drafted from evidence and root cause, editable.
4. Verify step: runs the scenario's verify command and shows pass/fail inline.
5. Final button (Resolve alert / Escalate to IR) disabled until verify passes or package generated, with a tooltip saying why.
6. Audit trail listing every action taken in this alert with time and actor (Priya Nair).
7. Completing sets alert status in the store and returns to /alerts with a toast.

Done when: A, B, C each complete end to end and status updates show in the queue.
```
Commit: `feat(resolve): resolution, verify gate, audit trail`

---

## Phase 7: Guide mode and Annotations

```
Read PLAN.md section 7 (Guidance) and 3.

1. src/content/guide-steps.ts: steps per scenario. Each step: target element id, title, body (what to do and why a TAC engineer does it), optional "Do it for me" action.
   Scenario A must start with: "The user said around 2:20 PM. Set the window first." 
2. Coach mark component anchored to the target, with Next, Back, Skip, Do it for me. Progress synced with the step rail. Resume where left off.
3. src/content/annotations.ts: 5 to 7 pins per screen (Alerts, Investigate, Resolve). Each pin: design decision, user problem, metric it moves (input/output/check from PLAN.md section 10).
4. Annotations toggle shows numbered pins; clicking opens a popover. Pins do not block interaction.
5. Both work with keyboard and close with Esc.

Write all copy in plain, short sentences. No em dashes. Show me all guide and annotation copy for review before wiring it in.
```
Commit: `feat(guide): guided mode and design annotations`

---

## Phase 8: Brief page, docs, polish, submission

```
Read PLAN.md sections 2, 10, 11, 14.

1. /brief page: problem, persona, write-up, dev action items, how to review, "Built by Sarthak Pant".
2. docs/WRITEUP.md from section 10. Must fit one printed page.
3. docs/DEV_ACTION_ITEMS.md from section 11, each with a one-line why and an acceptance check.
4. Polish pass against section 9 checklist. List any item not met and fix it.
5. Run Lighthouse accessibility on /alerts, fix to >= 95.
6. README.md: one-paragraph problem, persona, live link placeholder, "Review in 5 minutes" steps, 3 annotated screenshots (placeholders in docs/screenshots/ for me to capture), links to docs, local setup, tech stack.

Done when: every item in PLAN.md section 14 passes. Report each item as pass/fail.
```
Commit: `docs: brief, write-up, dev items, README`
Then: capture screenshots with Annotations on, add to docs/screenshots/, fill the live link in README, push.

---

## Review prompt (run after every phase)

```
Act as a strict reviewer for this phase. Compare what was built against PLAN.md and .cursor/rules.
1. List anything built that the phase did not ask for.
2. List anything the phase asked for that is missing or partial.
3. List UX nuance gaps from PLAN.md section 9 on the screens touched.
4. List any hardcoded colors, all-caps labels, em/en dashes, missing focus states, or missing loading/empty/error states.
5. Walk through the relevant scenario as a first-time user and note every point of confusion.
Do not fix anything yet. Give me the list, ranked by impact.
```
