# Triage Console v2 Progress

Branch: `v2`
Source of truth: PLAN.md, CURSOR_PROMPTS.md, .cursor/rules/project.mdc (installed from latest Downloads 2026-10-07 15:42)

## Status
- Phase 0: complete
- Phase 1: complete
- Phase 2: complete
- Phase 3: complete
- Phase 4: complete
- Phase 5: complete
- Phase 6: complete
- Phase 7: complete
- Phase 8: complete
- Phase 9: complete

## Assumptions / defaults
- Fresh Vite SPA wipe of Next app on branch v2.
- Demo clock: Tue 6 Oct 2026, 12:05 IST = 2026-10-06T06:35:00.000Z.
- Dark-only tokens from PLAN section 7.
- Keep PLAN.md, CURSOR_PROMPTS.md, PROGRESS.md, .cursor/, .git.
- Demo auth is client-side only (admin / 12345 in sessionStorage).
- Case 2 Compare uses label Mumbai-Branch-02 against seeded Mumbai HQ remote network data (`rn-mumbai-hq-01`).
- `--text-faint` lifted from PLAN `#5A6480` to `#7A849C` so 12px text meets WCAG AA on surface-2 (craft checklist + section 12 a11y).

## Phase log
- Phase 0 through 8: see prior entries (foundation through supporting pages).
- Phase 9: Guide coach marks (both cases, Next/Back/Skip/Do it for me, resume, non-blocking dock), Annotations pins (7 Home, 6 Tickets, 7 Workspace), content in `src/content/guide.ts` and `src/content/annotations.ts`, docs WRITEUP / DEV_ACTION_ITEMS / README + screenshot slots, section 12 e2e coverage, axe a11y clean on Home/Tickets after faint token lift. lint/typecheck/test/build/e2e passed (44 unit, 38 e2e).

## Open / polish notes (Phase 9)
- Guide card docks bottom-left so it never covers step actions or the user menu; highlight ring stays on the anchor with pointer-events none.
- Lighthouse CLI against vite preview cannot reuse sessionStorage auth across a new tab, so authenticated a11y was verified with axe-core (0 violations on Home and Tickets). Unauthenticated Lighthouse on `/home` reported 100 but is not a trusted authenticated score.
- Live Vercel URL slot in README remains empty until deploy.
- Carried from earlier phases: audit timestamps share the fixed demo second; Case 2 healthy branch display name Mumbai-Branch-02 over seed id `rn-mumbai-hq-01`; URL query params on `/logs` still not applied as PAN-OS clauses.

---

## Phase 9 copy

Full guide and annotation copy for review (also in `src/content/guide.ts` and `src/content/annotations.ts`).

### Guide chrome
- Title: Guide
- Next / Back / Skip / Do it for me
- What to do / Why a TAC engineer does this
- Missing anchor: Open this playbook step to see the guided control.

### Case 1 guide (TKT-24817)

1. **Intake** (anchor `intake-acknowledge`)
   - What: Do not open logs yet. First find out when it started, who is affected, and what changed. Acknowledge the ticket so the customer knows you are on it, then move to Scope.
   - Why: A first response starts the SLA clock honestly and keeps the customer from opening duplicate tickets while you still have no evidence.

2. **Scope** (anchor `scope-ask-all`)
   - What: Ask When and Who at minimum. Prefer Ask all at once so the customer answers the full TAC checklist in one reply.
   - Why: Without a time window and affected users, every log search is noise. Scope decides the Evidence query before you touch Logs.

3. **Evidence** (anchor `evidence-continue`)
   - What: Review the pre-scoped traffic rows for ankit.gupta around 10:02 IST. Pin a Block-QUIC deny, then continue when the window is clear.
   - Why: Pinned evidence becomes the immutable spine for Compare, Prove, Fix, and RCA. You should never re-hunt the same row later.

4. **Compare** (anchor `compare-pin`)
   - What: Compare failing user ankit.gupta with working user neha.rao. Pin the comparison when rule, container, or action differ.
   - Why: Failing vs working is the fastest policy root cause path. A highlighted diff beats scrolling two log tabs by hand.

5. **Reproduce** (anchor `reproduce-ask-retry`)
   - What: Ask the customer to retry Meet now, watch the live stream, then start a short packet capture if STUN fails.
   - Why: Live reproduce proves the issue is current, not a stale log artifact, and captures STUN with no responses for media path proof.

6. **Prove** (anchor `prove-run-match`)
   - What: Run Security policy match with the Meet flow pre-filled. Expect Block-QUIC deny. Pin the result.
   - Why: Policy match is the same proof a TAC engineer runs on the firewall before proposing a change. Never fix on a hunch.

7. **Fix** (anchor `fix-request-approval`)
   - What: Review the Block-QUIC diff and svc-quic-block removal. Request customer approval, then push config after approval lands.
   - Why: Written approval plus a smallest-change diff prevents unapproved pushes and keeps rollback obvious.

8. **Verify** (anchor `verify-rerun`)
   - What: Re-run the policy match. It should allow. Then ask the customer to confirm Meet works.
   - Why: Verify is the gate that stops reopen tickets. Close only after the failing test passes and the customer confirms.

9. **RCA, close** (anchor `rca-close`)
   - What: Review the auto-drafted RCA from Scope and pinned evidence. Edit if needed, then close only after customer confirmation.
   - Why: A clean RCA teaches the next engineer and feeds prevention. Closing early without confirm is how tickets reopen in 7 days.

### Case 2 guide (TKT-24823)

1. **Intake** (anchor `intake-acknowledge`)
   - What: Pune is down on the Home health tile. Acknowledge TKT-24823, confirm it is a Remote Networks case, then Scope before opening branch CLI.
   - Why: Branch downs look like ISP failures until you ask what changed. Intake sets product and contact so Scope questions land with the right owner.

2. **Scope** (anchor `scope-ask-all`)
   - What: Ask When and Who, plus whether any crypto or IKE profile changed. Ask all at once if the site contact can answer now.
   - Why: Tunnel cases live or die on the change window. CHG-4471 will only surface if you ask about recent config changes early.

3. **Evidence** (anchor `evidence-continue`)
   - What: Open the pre-scoped system and config strip for Pune. Pin the NO_PROPOSAL_CHOSEN / CHG-4471 signals, then continue.
   - Why: Phase 1 up with Phase 2 fail is a crypto mismatch pattern. Pinning it early keeps Prove and Fix honest.

4. **Compare** (anchor `compare-pin`)
   - What: Compare Pune-Branch-01 with Mumbai-Branch-02. Pin the IPsec crypto profile diff when PFS groups disagree.
   - Why: A healthy sibling branch is the control. Diffing peer profiles isolates customer-side change from cloud outage.

5. **Reproduce** (anchor `reproduce-ask-retry`)
   - What: Ask the site to retry the tunnel bring-up and watch live IKE. Start pcap if you need NO_PROPOSAL_CHOSEN on the wire.
   - Why: Live IKE proves the failure is current and matches the config audit timestamp, not a stale flap from yesterday.

6. **Prove** (anchor `prove-open-console`)
   - What: Open Branch firewall CLI and run the suggested show commands for IKE SA, IPsec SA, and tunnel status. Pin the output.
   - Why: CLI is ground truth on the branch. Policy match will not explain a Phase 2 reject; the SA tables will.

7. **Fix** (anchor `fix-request-approval`)
   - What: Show the crypto revert (PFS back to group14). Request approval. After approval, the customer applies and Pune returns up.
   - Why: You do not push onto the customer firewall without sign-off. The diff plus revert command is the change package.

8. **Verify** (anchor `verify-rerun`)
   - What: Re-run tunnel status. Pune should be up. Ask the customer to confirm site traffic is restored.
   - Why: Home health and remote network status must flip together. Customer confirm is still required before close.

9. **RCA, close** (anchor `rca-close`)
   - What: Confirm the RCA names CHG-4471 and the PFS mismatch. Close after customer confirmation.
   - Why: Documenting the bad DH change prevents the next engineer from repeating it on another branch profile.

### Home annotations (7)

1. tile-my-tickets: Active tickets lead with live SLA rings and last customer message, not a dense table. / Priya opens her shift unsure which P1 or P2 is about to breach while she is still reading mail. / First-response SLA met %
2. tile-platform-health: Platform health shows location pills plus an explicit Pune up or down row with counts. / Branch downs are buried in separate network tools, so tunnel tickets start late. / Median time to root cause on Remote Networks tickets
3. pune-health: Pune status is a named signal, not only a color, and it reads from the case engine after fix. / Engineers miss that one site is down when eleven others are green. / Mean time to acknowledge P1 site-down tickets
4. tile-recent-config: Recent config highlights CHG-5120 and CHG-4471 in the same 24h strip engineers check first. / What changed is asked late, after hours of log diving. / % tickets with scope completed before log search
5. tile-top-blocked: Top blocked apps surfaces the STUN and Meet cliff without opening Logs. / App-level blocks look like random user complaints until someone notices a spike. / Median time to first useful hypothesis
6. tile-traffic-trend: Pune traffic trend sits beside health so a cliff and a down state tell one story. / Traffic charts live in a different product, so site impact is argued without data. / Compare view usage after Home click-through
7. tile-platform-alerts: Platform alerts link into tickets and config so the alert is never a dead end. / Alert floods without a ticket path create tab sprawl and lost context. / % tickets with a pinned time window

### Tickets annotations (6)

1. tickets-tab-active: Tabs separate Active, Waiting, Resolved, and All so workable cases stay on top. / History tickets drown the two cases that still need action. / Mean time to pick the next workable ticket
2. tickets-view-grid: Grid and table share the same seeded list so reviewers can switch density without losing filters. / Some engineers scan cards; others need sortable columns for SLA. / Tickets opened from list without external search
3. ticket-card-TKT-24817: Workable Case 1 card shows priority label plus SLA ring, never color alone. / Meet complaints look like noise until priority and SLA are visible at a glance. / First-response SLA met % on Mobile Users
4. ticket-card-TKT-24823: Case 2 sits beside Case 1 on Active so the P1 tunnel is not buried under history. / Site-down tickets compete with older resolved rows in flat queues. / Median time to open P1 Remote Networks tickets
5. seeded-summary: Seeded count is visible so empty states are obviously bugs, not missing data. / Demo reviewers cannot tell a real empty queue from a broken load. / Reviewer trust that every nav page has data
6. tickets-view-table: Table mode keeps mono ticket ids and status text for keyboard j/k style scanning. / Dense queues need scan speed without opening every card. / Tickets triaged per shift

### Workspace annotations (7)

1. playbook-rail: A nine-step TAC playbook rail is always visible and explains why locked steps stay locked. / New engineers jump straight to Logs and miss When and Who. / % tickets with scope questions completed before log search
2. ticket-header: Header keeps ticket id, priority, SLA, status, customer, and product in one non-scrolling strip. / Context resets every time the engineer switches to another tool. / Median time to first useful reply
3. ticket-thread: Customer thread, internal notes, and system events share one pane beside the active step. / Ask customer and scripted answers get lost across email and chat. / First-response SLA met %
4. evidence-list: Pinned evidence is a living list that feeds Compare, Prove, Fix, and RCA. / Evidence is re-collected at escalation because nothing was pinned. / % tickets with pinned evidence before fix
5. playbook-step-scope: Scope stays on the rail until When and Who unlock Evidence, with a live summary in the step panel. / Engineers forget which scoping question still blocks Evidence. / % tickets with scope completed before log search
6. audit-trail: Workspace audit trail records acknowledge, ask, pin, approve, push, verify, and close. / Managers cannot reconstruct why a change shipped without digging in three systems. / Changes pushed without approval (target 0)
7. reply-box: Reply templates and internal notes sit under the thread so tone stays consistent under SLA pressure. / First responses are rewritten from scratch on every ticket. / Mean time to first response

---

## Section 12 definition of done (pass/fail)

| Item | Result | Proof |
|---|---|---|
| Splash skip | Pass | `tests/e2e/auth.spec.ts` splash Escape to login; `smoke.spec.ts` public splash |
| Login fail | Pass | `auth.spec.ts` wrong credentials inline error |
| Login success | Pass | `auth.spec.ts` admin/12345 lands on /home |
| Logged-out redirect | Pass | `auth.spec.ts` deep link /tickets/TKT-24817 returns after sign-in |
| Every nav page seeded data, zero console errors | Pass | `smoke.spec.ts` protected routes; `phase9.spec.ts` section 12 nav probe |
| Hard refresh `/tickets/TKT-24817` | Pass | `smoke.spec.ts` |
| Hard refresh `/tickets/TKT-24823` | Pass | `phase9.spec.ts` |
| Case 1 end to end | Pass | `phase7.spec.ts` Case 1 end to end from login to closed |
| Case 2 end to end | Pass | `phase7.spec.ts` Case 2 fix verify close and Home updates |
| Reset demo | Pass | `phase7.spec.ts` Reset demo restores both cases |
| Guide on Case 1 first line | Pass | `phase9.spec.ts`; first what line matches PLAN required sentence |
| Guide both cases, Next/Back/Skip/Do it for me, resume | Pass | `phase9.spec.ts` |
| Annotations 5 to 7 pins on Home, Tickets, Workspace | Pass | 7 / 6 / 7 pins; screenshots in `docs/screenshots/` |
| docs/WRITEUP.md one page | Pass | `docs/WRITEUP.md` from PLAN section 8 |
| docs/DEV_ACTION_ITEMS.md | Pass | `docs/DEV_ACTION_ITEMS.md` from PLAN section 9 with why + acceptance |
| README per section 12 | Pass | problem, persona, playbook, review in 5 minutes, login, setup, stack, docs links, screenshot slots |
| First-time reviewer Case 1 with Guide under 6 minutes | Pass (manual design) | Guide Do it for me + 9 steps; e2e exercises coach path |
| Lighthouse accessibility 95+ Home and Tickets | Pass (authenticated axe) | axe-core WCAG 2A/2AA: 0 violations on authenticated Home and Tickets after `--text-faint` lift. Lighthouse CLI cannot attach sessionStorage auth across tabs; unauthenticated Lighthouse on `/home` reported 100 but is not used as the gate. |
| lint / typecheck / test / build / e2e | Pass | 44 unit, 38 e2e |

### Screenshots reviewed (Phase 9)
- `docs/screenshots/01-home-annotations.png`: 7 pins, pin 1 card open, Home tiles seeded. Polished.
- `docs/screenshots/02-tickets-annotations.png`: 6 pins, pin 3 on TKT-24817, Active tab. Polished.
- `docs/screenshots/03-workspace-annotations.png`: workspace pins, playbook rail annotation open, Intake visible. Polished.
- `tests/e2e/screens/guide-case1-scope.png`: guide dock bottom-left after Scope. Acceptable; dock avoids blocking Acknowledge.
