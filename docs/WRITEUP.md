# Triage Console write-up

One printed page. Built by Sarthak Pant.

**Problem.** A customer reports Google Meet is broken, or the platform raises a branch tunnel down. The engineer must turn a vague complaint into a precise scope (who, when, what changed), find evidence across logs, config history, and CLI, prove the root cause, get the fix approved, verify with the customer, and document it. Today that context lives in 5 to 7 different tools, so time to root cause is slow and evidence is lost.

**Persona.** Priya Nair, Cloud Security TAC Engineer (L2) on a Prisma Access style SASE for about 4,000 users and 12 branch sites. She holds 6 to 10 active tickets. Method: never trust the first description. Scope first, then logs, then compare failing vs working, then reproduce live, then prove in CLI. Never changes customer config without written approval.

## Features by priority

1. **P0 Ticket workspace with the TAC playbook rail.** Turns a vague complaint into a guided, auditable path.
2. **P0 Scoping questions with live answers.** The when, who, what changed step decides everything downstream.
3. **P0 Time and user scoped evidence with pinning.** Evidence becomes the immutable spine for the rest of the case.
4. **P0 Compare failing vs working user.** The fastest route to root cause in policy cases.
5. **P1 Live reproduce and in-workspace console.** Prove before changing anything.
6. **P1 Fix with approval, push job, and verify gate.** Stops unapproved pushes and unverified closes.
7. **P1 Auto-drafted RCA from evidence.** Close only after customer confirmation.
8. **P2 Guide mode for new engineers.** Coach marks on real controls per playbook step.

**Prioritization.** Ranked by time saved per ticket times tickets per shift, and by risk reduced (wrong fixes, unapproved changes, reopened tickets). Cut anything that does not shorten time to root cause or improve fix quality.

## Success metrics

| Kind | Metric |
|---|---|
| Input | % tickets with scope questions completed before log search; % with a pinned time window; compare view usage |
| Output | Median time to root cause; mean time to resolve; first-response SLA met % |
| Check | Reopen rate within 7 days; changes pushed without approval (target 0); customer satisfaction on close |
