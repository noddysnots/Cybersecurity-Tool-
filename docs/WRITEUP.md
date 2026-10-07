# Triage Console write-up

**Problem.** When a cloud security alert fires, the engineer jumps between the alert, four log types, policy config, and a CLI to answer one question: is this a real threat, a misconfiguration, or noise? Context is scattered, so reaching a confident decision is slow and evidence gets lost between tools.

**Persona.** Priya Nair, L2 Cloud Security Engineer on a Prisma Access style SASE for about 4,000 users and 12 branch sites. She handles 30 to 50 alerts per shift. Most are noise or config issues; a few are real. From a TAC background she pins time and entities first, stays fluent in CLI, and hates losing her place across tabs. Success means closing clear cases fast and escalating real ones with evidence nobody re-collects.

## Features (priority order)

1. **Time-scoped investigation workspace (P0).** Biggest time sink today is re-scoping each tool to the incident window.
2. **Evidence pinning that flows into resolution (P0).** Removes re-collection at escalation and closure.
3. **Integrated console with scenario-aware diagnostics (P0).** TAC engineers verify in CLI before acting; keeping it in the workspace keeps context.
4. **Outcome-specific resolution with verify gate (P1).** Prevents closing without proof.
5. **Guided mode (P1).** Onboards new L1 and L2 engineers into the TAC method.
6. **Correlated timeline strip (P2).** Makes patterns like beacons and retries obvious.

**Prioritization logic.** Ranked by (time saved per alert x alerts per shift) and by risk reduced (wrong closures, missed threats). Anything that does not shorten time-to-evidence or improve decision quality is cut.

## Success metrics

| Kind | Metric |
|---|---|
| Input | Share of alerts opened in the workspace (vs external tools); share with a pinned time window; console usage per investigation |
| Output | Median time to first evidence; mean time to resolve (MTTR); share of alerts closed at L2 without escalation |
| Check | Reopen rate within 7 days; false-negative escalations found later; verify-gate bypass attempts |

Built by Sarthak Pant.
