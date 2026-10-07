# Dev action items

Production backlog for Triage Console. Each item includes why and an acceptance check. From PLAN section 9.

1. **Log query service with time-partitioned index and PAN-OS query parser**
   - Why: Engineers need familiar query syntax and sub-2s search over a 24h window without exporting CSVs.
   - Acceptance: Time-partitioned index plus PAN-OS query parser; p95 under 2s for a 24h window.

2. **Ticket to telemetry linking**
   - Why: Opening a ticket should auto-map users, devices, sites, and time windows so Evidence starts scoped.
   - Acceptance: Ticket entities auto-map to users, devices, sites, and time windows; mappings remain editable.

3. **Read-only diagnostic sandbox for CLI and policy match**
   - Why: TAC proof belongs in the workflow without risking config writes on customer gear.
   - Acceptance: Allowlisted commands only, full audit, no config mutations.

4. **Config audit with structured before/after diffs per object**
   - Why: CHG style changes need a clear diff engineers can pin and cite in RCA.
   - Acceptance: Structured before/after diffs per object; linked from tickets and rules.

5. **Change approval workflow with customer sign-off recorded on the ticket**
   - Why: Unapproved pushes reopen tickets and break trust; sign-off must live on the case.
   - Acceptance: Customer sign-off recorded on the ticket before push; audit entry required.

6. **Live log streaming for reproduce sessions**
   - Why: Reproduce needs websocket-scoped filters so new rows appear while the customer retries.
   - Acceptance: Websocket live stream with scoped filters for a bounded reproduce window.

7. **Evidence model: immutable, timestamped, exportable, linked to RCA**
   - Why: Pinned items must survive handoff and closure without re-collection.
   - Acceptance: Evidence is immutable, timestamped, exportable, and linked to RCA.

8. **Playbooks as data (JSON) so new case types ship without code**
   - Why: Guide steps and gates should ship as content, not UI forks per case type.
   - Acceptance: JSON playbooks drive coach marks and unlock rules; new case types need no UI code edits.
