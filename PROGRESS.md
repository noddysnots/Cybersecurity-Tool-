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
- Next: Phase 9 guide, annotations, docs, final QA

## Assumptions / defaults
- Fresh Vite SPA wipe of Next app on branch v2.
- Demo clock: Tue 6 Oct 2026, 12:05 IST = 2026-10-06T06:35:00.000Z.
- Dark-only tokens from PLAN section 7.
- Keep PLAN.md, CURSOR_PROMPTS.md, PROGRESS.md, .cursor/, .git.
- Demo auth is client-side only (admin / 12345 in sessionStorage).
- Case 2 Compare uses label Mumbai-Branch-02 against seeded Mumbai HQ remote network data (`rn-mumbai-hq-01`).

## Phase log
- Phase 0: Vite + React + TS strict SPA foundation (router placeholders, tokens, time.ts, vercel rewrite, lint/typecheck/test/e2e). lint/typecheck/test/build/e2e all passed (3 unit, 3 e2e).
- Phase 1: types, seeded JSON (fixed seed), hand-written Case 1/2 needles, content scripts, case-engine zustand, unit tests. lint/typecheck/test/build/e2e passed (14 unit, 3 e2e).
- Phase 2: developer splash (canvas mesh, skip, once per session, reduced motion), login split with labeled network (Pune amber pulse), demo auth + route guard with return path. Screenshots reviewed: splash-mid, splash-final, login, login-error. lint/typecheck/test/build/e2e passed (16 unit, 8 e2e).
- Phase 3: App shell (collapsible nav, top bar, Cmd+K palette, demo clock IST/UTC, Guide/Annotations toggles, notifications, user menu Reset demo + Sign out, Ctrl+` console placeholder). Home 12-col grid from seeded data + case engine (SLA rings, Pune down, CHG-5120/CHG-4471, stun spike, traffic cliff, alerts). Tile links apply filters. Screenshots reviewed: home.png. lint/typecheck/test/build/e2e passed (23 unit, 11 e2e).
- Phase 4: Tickets grid/table with tabs and live SLA rings (2 workable + 10 history). Ticket workspace per 6.6 (header, playbook rail, step panel, thread, evidence, reply templates). Intake + Scope fully wired through case-engine (acknowledge, ask/ask-all, typing delay, deliver scripted replies, key findings, live Scope summary, unlock reasons). History tickets read-only with RCA. Unknown id designed not-found. Dead placeholder left: `src/app/routes/TicketPlaceholderPage.tsx` (unused). Screenshots reviewed: tickets-grid, workspace-intake, workspace-scope. lint/typecheck/test/build/e2e passed (25 unit, 15 e2e).
- Phase 5: PAN-OS query parser (tests first), shared LogExplorer (type tabs+counts, query autocomplete+error underline, time presets+draggable histogram, virtualized table, columns, density, cell menu, detail drawer+Pin), Evidence pre-scoped + config strip, Compare (Case 1 users / Case 2 branches) with highlighted diff + Pin, Reproduce live stream + pcap + Pin, `/logs` unscoped explorer. Playbook unlocks Evidence after When+Who, Compare after evidence pin/complete, Reproduce after compare pin. Screenshots reviewed: workspace-evidence, workspace-compare, workspace-reproduce, logs. lint/typecheck/test/build/e2e passed (33 unit, 18 e2e).
- Phase 6: Console command registry (`src/lib/console`) with every Case 2 CLI command plus general PAN-OS commands; realistic table/aligned output from case engine. Console drawer: Prisma diagnostics vs Branch firewall CLI, prompts, tab completion, history, help/?, closest-match, copy+Pin, resize. Troubleshooting page (policy match, ping, traceroute, tunnel status). Prove step: Case 1 policy match Block-QUIC deny; Case 2 suggested branch CLI chips. Outputs flip after fix. Screenshots reviewed: console-prisma, console-branch, tools. lint/typecheck/test/build/e2e passed (40 unit, 21 e2e).
- Phase 7: Fix (Case 1 rule diff + svc-quic-block removal, approval, push stages ~6s; Case 2 crypto diff + revert command + customer apply flips Pune), Verify (re-run policy/tunnel test, Ask customer confirm), RCA editable draft + Close only after confirm (Resolved + toast), workspace audit trail. Home/remote networks/Pune traffic resume from case-engine. Screenshots: case1-fix/verify/rca, case2-fix/verify/rca. lint/typecheck/test/build/e2e passed (41 unit, 24 e2e).
- Phase 8: Supporting pages replace placeholders. Policies (security/decryption tabs, container groups, hit counts, Block-QUIC Modified 12h ago, rule drawer + CHG history). Objects (address, groups, services, app groups, where-used svc-quic-block to Block-QUIC). Remote networks (12 sites, Pune from case-engine, tunnel history drawer + crypto mismatch). Mobile users (connected table). Config audit (CHG-5120/CHG-4471 before/after diffs). Brief (problem, persona, playbook, write-up/dev items, how to review, Built by Sarthak Pant). Filters/search/loading/empty/error + cross-links. Troubleshooting still works. Screenshots: policies-block-quic, policies-decryption, objects-svc-quic, remote-networks-pune, mobile-users, config-audit-5120/4471, brief, troubleshooting-phase8. lint/typecheck/test/build/e2e passed (44 unit, 32 e2e).

## Open / polish notes (Phase 8)
- Brief credits and write-up sections sit below the fold at 1440x900; first viewport shows problem, persona, playbook.
- Policy/object/config drawers overlay the right side of dense tables; usable but can hide trailing columns until closed.
- Audit trail timestamps all use the fixed demo clock (12:05 IST), so entries share the same second (carried from Phase 7).
- Console drawer default height (~260px) still dense on Intake (carried from Phase 6).
- URL query params on `/logs` still not applied as PAN-OS query clauses (carried from Phase 5).
- Case 2 healthy branch display name remains Mumbai-Branch-02 over seed id `rn-mumbai-hq-01` (carried from Phase 5).
