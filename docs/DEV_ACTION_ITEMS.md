# Dev action items

Bonus backlog for a production Triage Console. Each item has a one-line why and an acceptance check.

1. **Log query service**
   - Why: Engineers need fast, time-partitioned search with a familiar PAN-OS style query language.
   - Acceptance: Time-partitioned index plus query parser; p95 under 2s for a 24h window.

2. **Alert-to-log correlation**
   - Why: Default query and window should come from alert entities so investigation starts scoped.
   - Acceptance: Opening an alert maps entities to a default query and time window; both remain editable.

3. **Read-only diagnostic sandbox**
   - Why: CLI verification belongs in the workflow without risking config writes.
   - Acceptance: Allowlisted commands only, per-user audit, rate limits, no config mutations.

4. **Policy and config diff engine**
   - Why: Fixes need a clear before and after plus a safe rollback path.
   - Acceptance: Staged changes show a diff; one-click rollback restores the prior state.

5. **Evidence model**
   - Why: Pinned items must survive handoff and closure without re-collection.
   - Acceptance: Evidence is immutable, timestamped, linked to an alert, and exportable.

6. **Escalation package export**
   - Why: IR needs a complete package without rebuilding the timeline by hand.
   - Acceptance: Export Markdown and JSON; ticketing integration can attach the same payload.

7. **Audit event schema**
   - Why: Every triage action should be reconstructable for review and compliance.
   - Acceptance: Schema covers assign, pin, console, resolve, escalate, and verify outcomes.

8. **Guided mode content as data**
   - Why: New scenarios should ship as playbooks, not code changes.
   - Acceptance: JSON playbooks drive coach marks; adding a scenario needs no UI code edits.
