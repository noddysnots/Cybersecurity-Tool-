# Triage Console v2: Master Plan

This file is the spec. If code disagrees with it, the code is wrong. If this file is unclear, ask before coding.

Built by: Sarthak Pant
Submission: GitHub repo + live Vercel link. The repo and the app are the whole submission.

---

## 0. Why v2 exists (do not repeat these mistakes)

v1 failed because:
- Opening any incident crashed with "This page couldn't load". Deep links and detail routes were never tested.
- "Pick a case" buttons did nothing. Only one path worked.
- Policies, logs, and other pages were empty. Data existed but was not wired.
- The splash and start screen looked like a template. No craft, no identity.
- The flow did not reflect how a real TAC engineer works a case.

v2 rules that prevent this:
- Fresh rebuild as a client-only Vite SPA. No server rendering, so no hydration bugs from localStorage.
- Every page reads from real seeded data. A page that renders empty with seeded data is a failing test.
- Every phase ends with Playwright tests clicking through the real flow on `vite build && vite preview`, including a hard refresh on a deep link.
- No phase is done until its tests pass and its screenshots are reviewed.

---

## 1. The brief

Option **[2] Alert Triage Workflow**: show how a security engineer investigates and resolves a cloud security alert.

Reviewers judge: clarity of problem understanding, simplicity and flow, quality of prioritization reasoning, practicality and originality. Bonus: dev action items.

Where each required item lives:
| Brief asks for | Where |
|---|---|
| Problem statement and persona | README top + in-app Brief page |
| 2-3 screen wireframe with annotations | Live app with Annotations toggle (numbered pins with design notes) + annotated screenshots in README |
| 1-page write-up | docs/WRITEUP.md |
| Dev action items | docs/DEV_ACTION_ITEMS.md |

---

## 2. Problem and persona

**Problem.** A customer reports "Google Meet is not working" or the platform raises "branch tunnel down". The engineer has to turn a vague complaint into a precise scope (who, when, what changed), find the evidence across logs, config history, and CLI, prove the root cause, get the fix approved, verify with the customer, and document it. Today that context lives in 5 to 7 different tools, so time to root cause is slow and evidence is lost.

**Persona: Priya Nair, Cloud Security TAC Engineer (L2)**
- Works customer cases on a Prisma Access style SASE platform: mobile users on GlobalProtect, branches on IPsec remote networks.
- 6 to 10 active tickets, P1 SLA is 1 hour to first response.
- Her method: never trust the first description. Scope first, then logs, then compare a working user with a failing one, then reproduce live, then prove it in the CLI.
- She never changes customer config without written approval.
- Success: correct root cause on the first attempt, customer confirms the fix, clean RCA.

---

## 3. How a real TAC engineer works a case (the product is built on this)

This is the playbook. It is also the step rail in the ticket workspace.

1. **Intake.** Read the ticket. Check priority, SLA, customer, product (Mobile Users or Remote Networks), contact.
2. **Scope (ask the right questions).** Never start logs before scoping. Standard questions:
   - What exactly fails? Exact error text or screenshot.
   - When did it start? Exact time and timezone of the first failure and of one recent failure.
   - Who is affected? All users, a location, a connection type (GlobalProtect vs branch), an OS?
   - Any changes? Policy pushes, upgrades, ISP or network changes, new certificates. Customers often say "no changes", so always verify in the config audit.
   - Is it consistent or intermittent?
   - What else is affected? Other apps working?
   - One failing user and one working user, with times.
   - Is there a workaround? What is the business impact?
3. **Collect evidence.** Pin the time window. Pull traffic, threat, URL, decryption, GlobalProtect, system, and config logs for the failing user.
4. **Isolate (compare good vs bad).** Put the failing user and the working user side by side. What differs: rule matched, container, app, port, action?
5. **Reproduce.** Ask the customer to retry while watching logs live. Optional packet capture.
6. **Prove in tools.** Policy match test, tunnel status, IKE/IPsec SA checks, logs on the branch firewall.
7. **Fix with approval.** Propose the smallest change, show the diff, get customer approval in the ticket, push the config, track the job.
8. **Verify.** Re-run the test that failed. Ask the customer to confirm.
9. **RCA and close.** Root cause, timeline, fix, prevention. Close only after customer confirmation.

---

## 4. The two cases

Fixed demo clock: **Tue 6 Oct 2026, 12:05 IST**. All data is relative to this. Never read the real system time. IST/UTC toggle, default IST.

Customer: **Acme Corp** (4,200 users, 12 branches, Prisma Access locations India West, India South).

### Case 1 (hero): TKT-24817, "Google Meet not working for remote users"
- **Priority:** P2. Opened 10:12 IST by Neha Kapoor (IT Manager, Acme). Product: Prisma Access, Mobile Users.
- **Customer's first message:** "Since this morning a lot of our people cannot join Google Meet calls. The page opens but the call never connects. Please check urgently, we have client calls all day."
- **Scoping answers** (returned when Priya clicks "Ask customer" on each question, with a 1 to 2 second typing indicator):
  - What fails: "The join screen loads. After clicking Join it says Connecting, then shows Could not connect to the call."
  - When: "First complaint around 9:05 IST. Everyone was fine yesterday evening."
  - Who: "Only people working from home on GlobalProtect. People in the Bengaluru office are fine."
  - Changes: "Our security team pushed a change last night to block QUIC. Reference CHG-5120."
  - Consistent: "Every time, for remote users."
  - Other apps: "Teams and Slack calls work. Only Meet so far."
  - Example users: "Failing: ankit.verma@acme.io, tried at 10:02 IST from Pune. Working: sana.khan@acme.io, joined at 10:05 IST from the Bengaluru office."
  - Workaround: "People are dialing in by phone. Not acceptable for client calls."
- **Real root cause:** CHG-5120 (pushed 23:41 IST on 5 Oct by `secops.vikram`) added rule `Block-QUIC` in the **Mobile Users** container, above `Allow-Collab-Apps`. Instead of using the `quic` App-ID it uses service object `svc-quic-block` = UDP 443 and UDP 19302-19309. Google Meet media uses UDP 19302-19309, so Meet media is dropped for mobile users only. The Remote Networks container was not changed, so office users are fine.
- **Evidence in data:**
  - Traffic logs: from 08:58 onward, many `drop` entries for mobile users (10.20.x.x), dst 74.125.250.0/24, UDP 19302-19309, app `stun`, rule `Block-QUIC`.
  - ankit.verma 10:02:14 and 10:02:31: drop, UDP 19305, rule Block-QUIC.
  - sana.khan 10:05:40: allow, same dst range, app `google-meet`, rule `Allow-Collab-Apps`, container Remote Networks, source 10.50.x.x.
  - Config audit: CHG-5120 with full before/after of the rule and service object.
  - GlobalProtect logs: ankit connected fine (rules out VPN issue).
  - URL and decryption logs: meet.google.com allowed, decryption OK (red herrings to rule out).
- **Compare view result:** same destination, different rule, different container. That is the "aha".
- **Reproduce:** Priya asks Ankit to retry. Live log stream shows 3 new drops within 5 seconds.
- **Troubleshoot tools:** Security policy match (mobile user ankit, src 10.20.31.44, dst 74.125.250.69, UDP 19305) returns `Block-QUIC`, deny. Packet capture shows STUN binding requests with no responses.
- **Fix:** Change `Block-QUIC` to application `quic` with service `application-default`, remove `svc-quic-block`. Diff shown. Priya sends approval request; Neha replies "Approved, go ahead." Push job runs (queued, validating, pushing to India West, India South, success) about 6 seconds.
- **Verify:** Policy match now returns `Allow-Collab-Apps`, allow. Ask customer to test: "Ankit confirms Meet works. Thank you!"
- **Close:** RCA with timeline. Prevention: use App-ID instead of port-based blocks; add Meet to the change test checklist.

### Case 2: TKT-24823, "Pune branch offline, tunnel down"
- **Priority:** P1. Opened 11:44 IST by Rohit Sharma (Network Lead, Acme), auto-linked to platform alert "Remote network Pune-Branch-01 tunnel down" at 11:42:08. Product: Prisma Access, Remote Networks. P1 response SLA 1 hour, so it shows about 39 minutes left at demo time.
- **Customer's first message:** "Pune branch lost all access to cloud apps and the internet about 10 minutes ago. 85 users down."
- **Scoping answers:**
  - What fails: "Nothing works from the branch. Local LAN is fine."
  - When: "Monitoring alarm at 11:42 IST."
  - Who: "All 85 users at Pune. Other branches are fine."
  - Changes: "No changes that I know of." (Customer is wrong. Config audit proves otherwise.)
  - ISP: "ISP link is up. Firewall can ping 8.8.8.8."
  - Device: "PA-440, hostname pune-fw-01."
- **Real root cause:** During change window CHG-4471 (11:30 to 11:40), `netops.admin` edited the branch IPsec crypto profile `ipsec-prisma` and changed PFS DH group from `group14` to `group19`. Prisma side expects group14. Phase 1 (IKE) stays up, Phase 2 (IPsec) fails with NO_PROPOSAL_CHOSEN.
- **Evidence in data:**
  - Remote networks page: Pune-Branch-01 down since 11:42, tunnel history 99.9% up for 30 days.
  - System logs (Prisma side): from 11:42:08, every 30s: "IKEv2 child SA negotiation failed, no proposal chosen, peer 203.0.113.10".
  - Branch config log: 11:36:12 `netops.admin` set network ike crypto ipsec-prisma dh-group group19.
  - Traffic from Pune subnet 10.60.0.0/16 stops at 11:42.
- **Troubleshoot tools (branch firewall CLI on pune-fw-01, and Prisma side tunnel status):**
  - `show vpn ike-sa gateway gw-prisma-pune`: IKE SA established.
  - `show vpn ipsec-sa tunnel tun-prisma-pune`: no IPsec SA.
  - `test vpn ipsec-sa tunnel tun-prisma-pune`: fails.
  - `less mp-log ikemgr.log`: NO_PROPOSAL_CHOSEN, received DH group 19, configured group 14.
  - `show config diff`: shows the group14 to group19 change.
  - `show vpn flow tunnel-id 7`: inactive.
  - Prisma side "IPsec crypto profile" view: group14.
- **Fix:** Side-by-side diff (branch vs Prisma). TAC does not touch the customer's firewall. Priya sends exact revert command for approval: `set network ike crypto-profiles ipsec-crypto-profiles ipsec-prisma dh-group group14` then commit. Rohit replies "Applied and committed." State flips.
- **Verify:** `test vpn ipsec-sa` succeeds, `show vpn ipsec-sa` shows the SA, remote network status turns up, traffic from 10.60.0.0/16 resumes in logs. Rohit confirms "Pune is back."
- **Close:** RCA: config drift during CHG-4471, customer unaware. Prevention: post-change tunnel check in their change template.

### Other tickets (realism only)
Queue also shows about 10 closed or resolved tickets (read-only history) so it feels like a real desk. Only the two cases above are workable.

---

## 5. Data (all hardcoded, seeded, committed)

Generated by `scripts/generate-data.ts` with a fixed seed into `src/data/*.json`. Case records are hand-written, not random.

| Dataset | Count | Notes |
|---|---|---|
| logs | 600 | traffic 45%, url 15%, threat 10%, decryption 8%, globalprotect 8%, system 8%, config 6%. Last 24h before demo clock. Includes all case evidence. |
| security rules | 32 | Across containers: Shared, Mobile Users, Remote Networks. Fields: position, name, container, src zone, src, user, dst, app, service, action, profile group, hit count, last hit, modified by, modified at. |
| objects | 40 | address objects, address groups, service objects (incl svc-quic-block), application groups |
| decryption rules | 6 | |
| remote networks | 12 | Pune-Branch-01 down, rest up. Location, peer IP, bandwidth, tunnel uptime, last state change. |
| mobile users | 60 | connected GP users with location, gateway, OS, GP version, connected since |
| config audit | 18 | includes CHG-5120 and CHG-4471 with before/after |
| tickets | 12 | 2 workable + 10 history |
| conversation scripts | per case | customer replies keyed by question id and by action (approval, retest) |
| users | 70 | name, email, department, location |
| platform alerts | 25 | includes the tunnel-down alert |

Tests must assert counts, the time range, every case needle with exact values, and that every reference (user, rule, object, network) resolves.

---

## 6. Screens and flow

```
Developer splash  ->  Login  ->  Home (grid)  ->  Tickets  ->  Ticket workspace  ->  Resolved
                                     |
                                     +-> Logs, Policies, Objects, Remote networks, Mobile users,
                                         Config audit, Troubleshooting, Brief
```

### 6.1 Developer splash (first visit per session, skippable)
The one place we spend boldness. About 3 seconds, cinematic, quiet.
- Dark field with a faint animated network mesh: nodes drift, a few links light up and converge toward the center.
- The converging links resolve into the name **Sarthak Pant**, set large in Geist with tight tracking. Below it, small: "Designed and built for the Alert Triage challenge".
- A thin progress line underneath, then a smooth crossfade to Login.
- "Press any key to skip" in the corner. Reduced motion: static composition, 1 second.
- Canvas or SVG, 60fps, no layout shift.

### 6.2 Login
- Split layout: left 60% is a live-looking network visual (subtle, same mesh, slower, with a few labeled nodes like "India West", "Pune-Branch-01" pulsing amber). Right 40% is the sign-in panel.
- Panel: product name, "Admin console", Username, Password (show/hide, caps lock warning), Sign in button, disabled "Sign in with SSO" (tooltip: not available in demo).
- Demo credentials card under the form: "Admin credentials for this demo: admin / 12345" with a "Fill for me" button.
- Wrong credentials: inline error "Username or password is incorrect", field shake once, focus returns to password.
- Correct: brief "Signing in" state then Home. Session stored in sessionStorage. Sign out in user menu. All app routes redirect to Login when signed out.
- Note in README: client-side demo auth only, not real security.

### 6.3 App shell
- Left nav (icons + labels, collapsible): Home, Tickets, Logs, Policies, Objects, Remote networks, Mobile users, Config audit, Troubleshooting, Brief.
- Top bar: tenant switcher (Acme Corp), global search / command palette (Cmd/Ctrl+K), demo clock with IST/UTC toggle, Guide toggle, Annotations toggle, notifications bell (new customer replies), user menu (Priya Nair, Reset demo, Sign out).
- Bottom console drawer available everywhere (Ctrl+`).

### 6.4 Home (grid)
A 12-column grid of tiles with deliberately different sizes (not identical cards):
- My active tickets (large): the 2 workable cases with SLA countdown rings, priority, last customer message, "Open".
- Platform health: Prisma Access locations status, mobile users connected (live-ish counter), remote networks 11/12 up with Pune highlighted.
- Recent config changes: last 5 from config audit. CHG-5120 and CHG-4471 visible here (a sharp engineer spots them early).
- Top blocked apps last 24h: small bar chart, `stun` spiking since 09:00.
- Traffic trend: sparkline with the Pune drop at 11:42.
- Platform alerts feed.
Each tile links to its full page with filters pre-applied.

### 6.5 Tickets
- Grid of ticket cards by default, table toggle. Tabs: Active, Waiting on customer, Resolved, All.
- Card: ticket id, subject, customer, product, priority badge (P1 to P4, icon + label + color), SLA ring with time left, status, last update, assignee avatar.
- Click opens the workspace. URL `/tickets/TKT-24817` must work on hard refresh.

### 6.6 Ticket workspace (the core)
```
┌ Header: TKT-24817 · P2 · SLA 2h 47m left · Status [In progress v] · Customer Acme Corp · Product Mobile Users ┐
├──────────────┬──────────────────────────────────────────────────────────┬────────────────────────────┤
│ Playbook     │ Active step panel                                        │ Ticket thread              │
│ 1 Intake  ✓  │  (changes per step, see below)                           │  customer messages,        │
│ 2 Scope   ●  │                                                          │  Priya replies,            │
│ 3 Evidence   │                                                          │  internal notes (yellow),  │
│ 4 Compare    │                                                          │  system events             │
│ 5 Reproduce  │                                                          │ ─────────────────────────  │
│ 6 Prove      │                                                          │ Evidence (pinned items)    │
│ 7 Fix        │                                                          │ Reply box + templates      │
│ 8 Verify     │                                                          │                            │
│ 9 RCA, close │                                                          │                            │
└──────────────┴──────────────────────────────────────────────────────────┴────────────────────────────┘
                              Console drawer (Ctrl+`)
```
Step panels:
1. **Intake:** ticket summary, customer, product, SLA, linked alert, affected service. "Acknowledge and start" sends a first response to the customer (template, editable). Status becomes In progress.
2. **Scope:** checklist of the standard questions from section 3. Each row: question, "Ask customer" (posts it in the thread, typing indicator, scripted answer arrives), answer chip, and "Mark as key finding". Option "Ask all at once" sends one combined message. A Scope summary card fills in live: What, When, Who, Changes, Example users. Unlocks step 3 once When and Who are answered (others can come later, show why locked).
3. **Evidence:** embedded log explorer pre-scoped to the failing user and time window from Scope. Log type tabs with counts, PAN-OS style query bar, time window with histogram, row detail drawer, pin to evidence. Also a "Config changes in window" strip from the config audit.
4. **Compare:** two columns, failing user vs working user, auto-filled from Scope. Shows their matching log rows and a diff table: source zone, container, rule, app, port, action, bytes. Differences highlighted. "Pin comparison".
5. **Reproduce:** "Ask customer to retry now" then a live log stream (new rows animate in at the top) for 10 seconds with a pulsing "Live" badge. Optional "Start packet capture" showing a simple pcap table (time, src, dst, proto, info) with STUN requests and no responses (Case 1) or IKE exchanges with NO_PROPOSAL_CHOSEN (Case 2). Pin.
6. **Prove:** opens the right tool. Case 1: Security policy match form pre-filled. Case 2: console in branch CLI mode with suggested commands as clickable chips. Result can be pinned.
7. **Fix:** proposed change with before/after diff (rule table diff for Case 1, config diff for Case 2). "Request approval" posts to customer. On approval: Case 1 "Push config" with job progress steps; Case 2 customer applies, state flips.
8. **Verify:** re-run the failing test (one click), show pass. "Ask customer to confirm". Customer confirms.
9. **RCA and close:** auto-drafted RCA from pinned evidence and Scope (summary, timeline, root cause, fix, prevention), editable. Close ticket only after customer confirmation. Toast, return to Tickets, ticket moves to Resolved, Home updates.

Every step shows what is needed to move on. Locked steps explain why. Engineers can jump back to any done step.

### 6.7 Supporting pages (all must show data)
- **Logs:** full explorer, same component as step 3, unscoped. Saved queries.
- **Policies:** security rules table grouped by container with position numbers, hit counts, last hit, modified by. Row drawer shows rule detail and change history. Block-QUIC shows a "Modified 12h ago" marker. Tab for decryption rules.
- **Objects:** address, address groups, services, application groups. svc-quic-block links to the rule using it.
- **Remote networks:** 12 sites, status, peer IP, location, bandwidth, uptime. Detail drawer with tunnel history timeline and IKE/IPsec profile.
- **Mobile users:** connected users, location, gateway, OS, GP version.
- **Config audit:** changes with who, when, container, before/after diff.
- **Troubleshooting:** tools page: Security policy match, Ping, Traceroute, Tunnel status. Results driven by data and case state.
- **Brief:** problem, persona, TAC playbook, write-up, dev items, how to review, credits.

### 6.8 Console
- Bottom drawer, resizable, always dark. Two modes: "Prisma diagnostics" and "Branch firewall CLI" (prompt `admin@pune-fw-01>`).
- Tab completion, history, `?` and `help` list commands for the mode, unknown commands suggest the closest match, copy and "Pin output" per block.
- Commands from section 4 plus general ones (`show system info`, `show clock`, `show interface all`, `ping host 8.8.8.8`). Output in realistic PAN-OS formatting, built from data and case state.

### 6.9 Guide and Annotations
- **Guide** (on by default for a reviewer's first case): coach marks on real elements per playbook step. Each: what to do, why a TAC engineer does it, "Do it for me". Never blocks clicking the real UI.
- **Annotations:** numbered pins on Home, Tickets, Ticket workspace (5 to 7 each). Each pin: design decision, user problem, metric it moves.

---

## 7. Design system (futuristic, calm, precise)

Direction: a mission-control console for network security. Dark, deep, crisp, with light that means something (status, focus, live data). Apple-level restraint: few colors, perfect spacing, motion only where it explains a change.

**Color tokens (dark only)**
- `--bg` #0A0E1A, `--surface-1` #0F1424, `--surface-2` #151B2E, `--surface-3` #1C2440
- `--border` #222B42, `--border-strong` #2E3955
- `--text` #E6EAF2, `--text-muted` #8A94AB, `--text-faint` #5A6480
- `--accent` #7C8CFF (ion indigo: primary actions, focus, selection)
- `--signal` #3DD6C6 (healthy, up, success, live)
- `--warn` #F5C451, `--danger` #FF5C5C
- Priority: P1 #FF5C5C, P2 #FF9F43, P3 #F5C451, P4 #6CA8FF. Always with label and icon.
- Light is used as information: a glowing 1px ring on focus, a soft pulse on live data, a status dot glow. No decorative gradients on content.

**Type**
- Geist Sans for UI, Geist Mono for technical values (IPs, ports, commands, rule names, log values, ticket ids).
- Scale: 12, 13, 14, 16, 20, 28, 44 (splash/login only). Tables 13px. Sentence case. No all-caps labels.

**Surfaces and layout**
- 4px grid. Panels use 1px borders and surface steps, not shadows. Floating layers (drawers, popovers, palette, coach marks) get a soft shadow and backdrop blur.
- Radius: 6 controls, 10 panels, 14 home tiles, 0 table cells.
- Desktop first, designed at 1440x900, works at 1280. Under 1024 a polite "best on a larger screen" message.

**Motion**
- Splash: one orchestrated sequence. Elsewhere only in response to actions: drawer slide 200ms, step transition 180ms, new live log rows slide in, SLA ring ticks. Ease out cubic. Respect reduced motion.

**Craft checklist**
- Keyboard: `/` search, `j/k` rows, `Enter` open, `p` pin, `Esc` close, Cmd/Ctrl+K palette, Ctrl+` console, `?` shortcuts sheet.
- Visible focus everywhere, aria labels, contrast AA.
- Skeleton loading (simulated 300 to 600ms on queries), empty states with a next action, error states that say what happened and what to do.
- Copy buttons on IPs, commands, ids. Toasts match action names.
- Hover on any time shows absolute time in both IST and UTC.
- State survives navigation and refresh: ticket progress, thread, evidence, console history (localStorage, try/catch). "Reset demo" restores the starting state.
- No em dashes or en dashes in any copy.

---

## 8. Write-up content (docs/WRITEUP.md, one page)

**Features by priority**
1. P0 Ticket workspace with the TAC playbook rail: turns a vague complaint into a guided, auditable path.
2. P0 Scoping questions with live answers: the "when, who, what changed" step decides everything downstream.
3. P0 Time and user scoped evidence with pinning.
4. P0 Compare failing vs working user: the fastest route to root cause in policy cases.
5. P1 Live reproduce and in-workspace console: prove before changing anything.
6. P1 Fix with approval, push job, and verify gate.
7. P1 Auto-drafted RCA from evidence.
8. P2 Guide mode for new engineers.

**Prioritization:** ranked by time saved per ticket times tickets per shift, and by risk reduced (wrong fixes, unapproved changes, reopened tickets). Cut anything that does not shorten time to root cause or improve fix quality.

**Success metrics**
- Input: % tickets with scope questions completed before log search, % with a pinned time window, compare view usage.
- Output: median time to root cause, mean time to resolve, first-response SLA met %.
- Check: reopen rate within 7 days, changes pushed without approval (target 0), customer satisfaction on close.

## 9. Dev action items (docs/DEV_ACTION_ITEMS.md)
1. Log query service with time-partitioned index and PAN-OS query parser, p95 under 2s for a 24h window.
2. Ticket to telemetry linking: ticket entities auto-map to users, devices, sites, time windows.
3. Read-only diagnostic sandbox for CLI and policy match, allowlisted commands, full audit.
4. Config audit with structured before/after diffs per object.
5. Change approval workflow with customer sign-off recorded on the ticket.
6. Live log streaming for reproduce sessions (websocket, scoped filters).
7. Evidence model: immutable, timestamped, exportable, linked to RCA.
8. Playbooks as data (JSON) so new case types ship without code.

## 10. Tech stack
- Vite + React 18 + TypeScript strict + React Router (client only).
- `vercel.json` rewrite of all routes to `/index.html` so deep links work on refresh.
- Tailwind CSS + Radix primitives (via shadcn/ui, restyled to tokens).
- Zustand (state), TanStack Table + Virtual (tables), Recharts (small charts), Motion (animation), cmdk (palette), lucide-react (icons), geist (fonts), date-fns + date-fns-tz.
- Vitest (unit) + Playwright (end to end).
- Faker with fixed seed in the generator only.

## 11. Repo structure
```
/docs              WRITEUP.md, DEV_ACTION_ITEMS.md, screenshots/
/scripts           generate-data.ts
/src/app           router.tsx, routes, guards
/src/components    shell/ splash/ login/ home/ tickets/ workspace/ logs/ policies/ network/ console/ guide/ annotations/ ui/
/src/data          *.json (generated, committed)
/src/content       questions.ts, conversation scripts, guide steps, annotations, copy
/src/lib           store.ts, time.ts, query-parser.ts, console/, case-engine.ts
/src/types.ts
/tests/unit  /tests/e2e
PLAN.md  README.md  vercel.json
```

`case-engine.ts` is the single place that holds case state (which questions answered, approval given, fix applied, verified) and derives outputs from it. Console, troubleshooting tools, logs, remote network status, and the thread all read from it, so everything stays consistent.

## 12. Definition of done
- Playwright passes on the production build for: splash skip, login fail and success, logged-out redirect, every nav page renders seeded data with zero console errors, hard refresh on `/tickets/TKT-24817` and `/tickets/TKT-24823`, Case 1 end to end, Case 2 end to end, reset demo.
- A first-time reviewer finishes Case 1 with Guide on in under 6 minutes.
- Lighthouse accessibility 95+ on Home and Tickets.
- README: problem, persona, TAC playbook, annotated screenshots, live link, "Review in 5 minutes", login credentials, setup, stack, links to docs.
