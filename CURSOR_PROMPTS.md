# Cursor Prompts v2: Triage Console

How to run this:
1. Start a new branch `v2` (or wipe the repo). Put `PLAN.md` in the root and `.cursor/rules/project.mdc` in place.
2. Paste one phase at a time into Cursor Agent. Do not move on until the phase's tests pass and you have looked at the screenshots yourself.
3. After each phase, paste the Review prompt (bottom). Fix what it finds. Commit and push. Check the Vercel preview with your own clicks.
4. If Cursor says "done" without showing test results, paste: "Show me the Playwright output and the screenshots. Not done until both are shown."

---

## Phase 0: Fresh foundation

```
Read PLAN.md sections 0, 10, 11 and the project rules. Do not build features yet.

1. Create a Vite + React + TypeScript (strict) app with React Router. Client only.
2. Install: tailwindcss, shadcn/ui (init, Radix based), zustand, @tanstack/react-table, @tanstack/react-virtual, recharts, motion, cmdk, lucide-react, geist, date-fns, date-fns-tz. Dev: vitest, @playwright/test, @faker-js/faker, tsx.
3. Add the color, type, radius, and spacing tokens from PLAN.md section 7 as CSS variables and Tailwind theme values. Load Geist Sans and Geist Mono.
4. Add vercel.json rewriting all routes to /index.html.
5. Scripts: dev, build, preview, lint, typecheck, test, e2e, generate.
6. src/lib/time.ts with the fixed demo clock and IST/UTC format helpers, with unit tests.
7. Router with placeholder routes for every page in PLAN.md section 6, a root error boundary with a designed fallback, and a designed 404.
8. Playwright config that runs against `vite preview`. One smoke test: every route loads with no console errors, and a hard refresh on /tickets/TKT-24817 does not 404.

List assumptions first. Then build. Show test output.
```
Commit `chore: v2 foundation` and push. Confirm the Vercel deploy and refresh a deep link yourself.

---

## Phase 1: Data and case engine

```
Read PLAN.md sections 3, 4, 5, 11.

1. src/types.ts: types for Ticket, Message, ScopeQuestion, LogRecord (traffic, url, threat, decryption, globalprotect, system, config), SecurityRule, AddressObject, ServiceObject, AppGroup, DecryptionRule, RemoteNetwork, MobileUser, ConfigChange, PlatformAlert, User, Evidence.
2. scripts/generate-data.ts with a fixed seed writing src/data/*.json with the counts in section 5.
3. Hand-write every case record from section 4 with exact values: users, IPs, ports, times, rule names, service object, change ids, messages. Do not randomize them.
4. Noise must be realistic for an enterprise on Prisma Access: real app names (ms-teams, slack-base, zoom, office365, salesforce-base, github-base, ssl, web-browsing, dns), realistic rule names, ports, zones, locations.
5. Log fields must match what a PAN-OS engineer expects: receive time, type, src/dst IP, src/dst zone, src user, app, rule, action, session end reason, bytes, packets, ports, protocol, device/location, container.
6. src/content: scope questions (section 3) with ids, and conversation scripts per case (customer replies keyed by question id and by events: acknowledge, approval request, retry, confirm).
7. src/lib/case-engine.ts (zustand slice): per-ticket state (status, step, answered questions, pinned evidence, thread, approval, fix applied, verified, closed) with actions. Derived selectors: tunnel status for Pune, which rule a Meet flow matches, whether verify passes. Persist with try/catch, plus resetDemo().
8. Unit tests: dataset counts and time range, every case needle exists with exact values, every reference resolves, case engine transitions for both cases (cannot verify before fix, cannot close before customer confirms).

Print the Case 1 and Case 2 evidence rows when done.
```
Commit `feat(data): seeded dataset and case engine`

---

## Phase 2: Developer splash and login

```
Read PLAN.md sections 6.1, 6.2, 7.

This is the first impression. Treat it like a flagship product launch, not a template.

1. Splash exactly as section 6.1: animated network mesh on canvas or SVG, links converging into "Sarthak Pant", subtitle, progress line, crossfade to Login, skip on any key or click, once per session, reduced motion variant. 60fps, no layout shift, under 3.5s.
2. Login exactly as section 6.2: split layout with live network visual (labeled nodes, Pune-Branch-01 pulsing amber), sign-in panel, show/hide password, caps lock warning, disabled SSO with tooltip, demo credentials card "admin / 12345" with "Fill for me".
3. Auth: admin / 12345 only. Wrong: inline error, one shake, focus password. Right: "Signing in" then /home. Session in sessionStorage. Route guard redirects every app route to /login when signed out, and back to the original route after sign-in.
4. Playwright: splash shows name and skips; wrong creds show the error; right creds land on /home; signed-out visit to /tickets/TKT-24817 redirects to login then back to that ticket. Screenshots of splash mid-animation, splash final frame, login, login error.

Review the screenshots against section 7 before reporting. If it looks like a generic template, redo it.
```
Commit `feat: developer splash and login`

---

## Phase 3: Shell and Home grid

```
Read PLAN.md sections 6.3, 6.4, 7.

1. App shell: collapsible left nav with all items, top bar (tenant, command palette, demo clock with IST/UTC, Guide toggle, Annotations toggle, notifications bell, user menu with Reset demo and Sign out). Console drawer placeholder toggled with Ctrl+`.
2. Command palette (cmdk): navigate to any page, open a ticket by id, search users, IPs, rules.
3. Home as a 12-column grid with tiles of different sizes, exactly the tiles in 6.4, all fed by seeded data and case engine state. Pune shows down until Case 2 is fixed; the stun spike and Pune traffic drop are visible in the charts.
4. Each tile links to its page with filters applied (e.g. Recent config changes opens Config audit filtered to the last 24h).
5. Playwright: home renders all tiles with data, each tile link lands on a non-empty page, palette opens a ticket. Screenshot of Home.
```
Commit `feat: shell and home`

---

## Phase 4: Tickets and the workspace frame

```
Read PLAN.md sections 4, 6.5, 6.6.

1. Tickets page: card grid (default) and table toggle, tabs Active, Waiting on customer, Resolved, All. Cards per 6.5 with live SLA rings from the demo clock. 2 workable tickets + 10 history tickets.
2. History tickets open a read-only workspace showing their closed thread and RCA.
3. Ticket workspace layout per 6.6: header, playbook rail (9 steps with done/active/locked states and reasons), active step panel area, right ticket thread with customer, engineer, internal note, and system message styles, evidence list, reply box with templates.
4. Implement step 1 Intake and step 2 Scope fully for both cases: Ask customer per question, Ask all at once, typing indicator, scripted replies from src/content, Mark as key finding, live Scope summary card, step unlock rules with reasons.
5. Unknown ticket id shows a designed not-found state, never a crash.
6. Playwright: open both tickets from the grid and by hard refresh; complete Intake and Scope for Case 1; bad id shows not-found. Screenshots of Tickets grid, workspace at Intake, workspace at Scope with answers.
```
Commit `feat: tickets and scoping`

---

## Phase 5: Evidence, logs explorer, compare, reproduce

```
Read PLAN.md sections 4, 6.6 steps 3 to 5, 6.7 Logs.

1. src/lib/query-parser.ts (PAN-OS style): `( addr.src in 10.20.31.44 ) and ( port.dst geq 19302 )`. Fields: addr.src, addr.dst, user.src, app, rule, action, zone.src, zone.dst, port.dst, proto, container, location, type. Operators: eq, neq, in, contains, geq, leq, and, or, parentheses. Returns a predicate or an error with position. Write tests first.
2. Log explorer component: type tabs with counts, query bar with autocomplete and inline error underline, time window bar with presets and a draggable histogram, virtualized table with sticky header, column show/hide, density toggle, cell menu (Filter by, Exclude, Copy, Pin), row detail drawer with all fields and Pin.
3. Step 3 Evidence: explorer pre-scoped from Scope (failing user and time window), plus "Config changes in this window" strip linking to Config audit.
4. Step 4 Compare: failing vs working user side by side with the diff table, differences highlighted, Pin comparison. Case 2 compares Pune with a healthy branch (Mumbai-Branch-02).
5. Step 5 Reproduce: Ask customer to retry, 10 second live stream with new rows animating in, Live badge, packet capture table per case, Pin.
6. /logs page uses the same explorer unscoped.
7. Playwright: Case 1 evidence shows Block-QUIC drops for ankit at 10:02; compare highlights rule and container differences; reproduce adds new rows; /logs shows 600 records and a query filters them. Screenshots of each step.
```
Commit `feat: evidence, compare, reproduce`

---

## Phase 6: Prove: console and troubleshooting tools

```
Read PLAN.md sections 4, 6.6 step 6, 6.7 Troubleshooting, 6.8.

1. src/lib/console: command registry with pattern, mode, help, and handler reading data and case engine state. Implement every command in section 4 plus the general ones in 6.8, with realistic PAN-OS output formatting (tables, aligned columns, headers like the real CLI).
2. Console drawer per 6.8: two modes, prompt per mode, tab completion, history, help, closest-match suggestions, copy and Pin output.
3. Troubleshooting page and Step 6 panel: Security policy match (pre-filled per case), Ping, Traceroute, Tunnel status. Results come from case engine state.
4. Case 1 policy match returns Block-QUIC deny before fix. Case 2 IKE up, IPsec SA missing, ikemgr.log shows the DH group mismatch.
5. Unit tests for command parsing and for outputs changing with case state. Playwright: run the Case 2 commands in the console and pin one; run policy match for Case 1. Screenshots of console in both modes and the tools page.
```
Commit `feat: console and troubleshooting`

---

## Phase 7: Fix, verify, RCA, close

```
Read PLAN.md sections 4, 6.6 steps 7 to 9.

1. Step 7 Fix. Case 1: rule table diff (before/after) and object removal, Request approval posts to thread, scripted approval, Push config job with stages (queued, validating, pushing to India West, India South, success). Case 2: branch vs Prisma crypto profile diff, revert command block with copy, Request customer action, scripted "Applied and committed", state flips.
2. Step 8 Verify: one-click re-run of the original failing test now passes; Ask customer to confirm; scripted confirmation. Pune turns up on Home and Remote networks; Pune traffic resumes in logs; Meet flows now match Allow-Collab-Apps.
3. Step 9: auto-drafted RCA (summary, timeline from pinned evidence, root cause, fix, prevention), editable, Close ticket enabled only after confirmation with a reason when disabled. Closing moves the ticket to Resolved and returns to Tickets with a toast.
4. Audit trail at the bottom of the workspace showing every action with time and actor.
5. Playwright: Case 1 end to end from login to closed; Case 2 end to end; Reset demo restores both. Screenshots of fix, verify, RCA for both cases.
```
Commit `feat: fix, verify, close`

---

## Phase 8: Supporting pages

```
Read PLAN.md section 6.7.

Build Policies (security and decryption tabs, grouped by container, hit counts, modified markers, rule drawer with history), Objects (all object types, where-used links), Remote networks (table plus tunnel history drawer), Mobile users, Config audit (diff view), Brief.
Every page: filters, search, loading, empty, and error states, links between related items (rule to object, change to rule, network to its logs).
Playwright: every page shows seeded data and each cross-link lands correctly. Screenshots of every page.
```
Commit `feat: supporting pages`

---

## Phase 9: Guide, annotations, docs, final QA

```
Read PLAN.md sections 6.9, 8, 9, 12.

1. Guide: coach marks per playbook step for both cases, anchored to real elements, with Next, Back, Skip, Do it for me. Never blocks the real UI. Resumes where left off. First line for Case 1: "Do not open logs yet. First find out when it started, who is affected, and what changed."
2. Annotations: 5 to 7 numbered pins each on Home, Tickets, and the Ticket workspace with design decision, user problem, and metric.
3. Show me all guide and annotation copy for review before wiring it in.
4. docs/WRITEUP.md (one printed page), docs/DEV_ACTION_ITEMS.md, README.md per section 12 with screenshot slots in docs/screenshots/.
5. Final QA: run every item in section 12 and report pass/fail per item. Run Lighthouse accessibility on Home and Tickets. Fix anything failing.
```
Commit `docs: guide, annotations, write-up, README`. Capture screenshots with Annotations on, add them to the README, push.

---

## Review prompt (after every phase)

```
Review this phase as two people: a strict Apple-level product designer and a Palo Alto Networks TAC engineer with 15 years of experience.

1. Click through every flow touched in this phase on the production build. List every button that does nothing, every crash, every empty view.
2. List anything PLAN.md asked for that is missing or partial, and anything built that was not asked for.
3. Technical accuracy: anything a real PAN-OS or Prisma Access engineer would find wrong (CLI output, log fields, policy order, IKE/IPsec behaviour).
4. Design: open the screenshots. List anything that looks generic, cramped, misaligned, low contrast, or inconsistent with section 7. Check for raw hex, all-caps labels, em/en dashes, missing focus, missing loading/empty/error states.
5. Rank everything by impact. Do not fix yet.
```

## If something breaks on Vercel

```
The deployed app shows "<paste the error>" when I <paste what you clicked>. Reproduce it with Playwright against the production build, read the browser console, find the root cause, write a failing test, fix it, and show the test passing. Do not guess.
```
