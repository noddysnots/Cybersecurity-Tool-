/** Annotation pin copy for Home, Tickets, and Ticket workspace. No em or en dashes. */

export const annotationsChrome = {
  title: "Annotations",
  designLabel: "Design decision",
  problemLabel: "User problem",
  metricLabel: "Metric it moves",
  close: "Close pin",
  openPin: "Open annotation",
} as const;

export type AnnotationPage = "home" | "tickets" | "workspace";

export type AnnotationPinDef = {
  id: string;
  page: AnnotationPage;
  number: number;
  /** Matches data-annotation on a real element. */
  anchor: string;
  designDecision: string;
  userProblem: string;
  metric: string;
};

export const HOME_ANNOTATIONS: AnnotationPinDef[] = [
  {
    id: "home-1",
    page: "home",
    number: 1,
    anchor: "tile-my-tickets",
    designDecision:
      "Active tickets lead with live SLA rings and last customer message, not a dense table.",
    userProblem:
      "Priya opens her shift unsure which P1 or P2 is about to breach while she is still reading mail.",
    metric: "First-response SLA met %",
  },
  {
    id: "home-2",
    page: "home",
    number: 2,
    anchor: "tile-platform-health",
    designDecision:
      "Platform health shows location pills plus an explicit Pune up or down row with counts.",
    userProblem:
      "Branch downs are buried in separate network tools, so tunnel tickets start late.",
    metric: "Median time to root cause on Remote Networks tickets",
  },
  {
    id: "home-3",
    page: "home",
    number: 3,
    anchor: "pune-health",
    designDecision:
      "Pune status is a named signal, not only a color, and it reads from the case engine after fix.",
    userProblem:
      "Engineers miss that one site is down when eleven others are green.",
    metric: "Mean time to acknowledge P1 site-down tickets",
  },
  {
    id: "home-4",
    page: "home",
    number: 4,
    anchor: "tile-recent-config",
    designDecision:
      "Recent config highlights CHG-5120 and CHG-4471 in the same 24h strip engineers check first.",
    userProblem:
      "What changed is asked late, after hours of log diving.",
    metric: "% tickets with scope completed before log search",
  },
  {
    id: "home-5",
    page: "home",
    number: 5,
    anchor: "tile-top-blocked",
    designDecision:
      "Top blocked apps surfaces the STUN and Meet cliff without opening Logs.",
    userProblem:
      "App-level blocks look like random user complaints until someone notices a spike.",
    metric: "Median time to first useful hypothesis",
  },
  {
    id: "home-6",
    page: "home",
    number: 6,
    anchor: "tile-traffic-trend",
    designDecision:
      "Pune traffic trend sits beside health so a cliff and a down state tell one story.",
    userProblem:
      "Traffic charts live in a different product, so site impact is argued without data.",
    metric: "Compare view usage after Home click-through",
  },
  {
    id: "home-7",
    page: "home",
    number: 7,
    anchor: "tile-platform-alerts",
    designDecision:
      "Platform alerts link into tickets and config so the alert is never a dead end.",
    userProblem:
      "Alert floods without a ticket path create tab sprawl and lost context.",
    metric: "% tickets with a pinned time window",
  },
];

export const TICKETS_ANNOTATIONS: AnnotationPinDef[] = [
  {
    id: "tickets-1",
    page: "tickets",
    number: 1,
    anchor: "tickets-tab-active",
    designDecision:
      "Tabs separate Active, Waiting, Resolved, and All so workable cases stay on top.",
    userProblem:
      "History tickets drown the two cases that still need action.",
    metric: "Mean time to pick the next workable ticket",
  },
  {
    id: "tickets-2",
    page: "tickets",
    number: 2,
    anchor: "tickets-view-grid",
    designDecision:
      "Grid and table share the same seeded list so reviewers can switch density without losing filters.",
    userProblem:
      "Some engineers scan cards; others need sortable columns for SLA.",
    metric: "Tickets opened from list without external search",
  },
  {
    id: "tickets-3",
    page: "tickets",
    number: 3,
    anchor: "ticket-card-TKT-24817",
    designDecision:
      "Workable Case 1 card shows priority label plus SLA ring, never color alone.",
    userProblem:
      "Meet complaints look like noise until priority and SLA are visible at a glance.",
    metric: "First-response SLA met % on Mobile Users",
  },
  {
    id: "tickets-4",
    page: "tickets",
    number: 4,
    anchor: "ticket-card-TKT-24823",
    designDecision:
      "Case 2 sits beside Case 1 on Active so the P1 tunnel is not buried under history.",
    userProblem:
      "Site-down tickets compete with older resolved rows in flat queues.",
    metric: "Median time to open P1 Remote Networks tickets",
  },
  {
    id: "tickets-5",
    page: "tickets",
    number: 5,
    anchor: "seeded-summary",
    designDecision:
      "Seeded count is visible so empty states are obviously bugs, not missing data.",
    userProblem:
      "Demo reviewers cannot tell a real empty queue from a broken load.",
    metric: "Reviewer trust that every nav page has data",
  },
  {
    id: "tickets-6",
    page: "tickets",
    number: 6,
    anchor: "tickets-view-table",
    designDecision:
      "Table mode keeps mono ticket ids and status text for keyboard j/k style scanning.",
    userProblem:
      "Dense queues need scan speed without opening every card.",
    metric: "Tickets triaged per shift",
  },
];

export const WORKSPACE_ANNOTATIONS: AnnotationPinDef[] = [
  {
    id: "workspace-1",
    page: "workspace",
    number: 1,
    anchor: "playbook-rail",
    designDecision:
      "A nine-step TAC playbook rail is always visible and explains why locked steps stay locked.",
    userProblem:
      "New engineers jump straight to Logs and miss When and Who.",
    metric: "% tickets with scope questions completed before log search",
  },
  {
    id: "workspace-2",
    page: "workspace",
    number: 2,
    anchor: "ticket-header",
    designDecision:
      "Header keeps ticket id, priority, SLA, status, customer, and product in one non-scrolling strip.",
    userProblem:
      "Context resets every time the engineer switches to another tool.",
    metric: "Median time to first useful reply",
  },
  {
    id: "workspace-3",
    page: "workspace",
    number: 3,
    anchor: "ticket-thread",
    designDecision:
      "Customer thread, internal notes, and system events share one pane beside the active step.",
    userProblem:
      "Ask customer and scripted answers get lost across email and chat.",
    metric: "First-response SLA met %",
  },
  {
    id: "workspace-4",
    page: "workspace",
    number: 4,
    anchor: "evidence-list",
    designDecision:
      "Pinned evidence is a living list that feeds Compare, Prove, Fix, and RCA.",
    userProblem:
      "Evidence is re-collected at escalation because nothing was pinned.",
    metric: "% tickets with pinned evidence before fix",
  },
  {
    id: "workspace-5",
    page: "workspace",
    number: 5,
    anchor: "playbook-step-scope",
    designDecision:
      "Scope stays on the rail until When and Who unlock Evidence, with a live summary in the step panel.",
    userProblem:
      "Engineers forget which scoping question still blocks Evidence.",
    metric: "% tickets with scope completed before log search",
  },
  {
    id: "workspace-6",
    page: "workspace",
    number: 6,
    anchor: "audit-trail",
    designDecision:
      "Workspace audit trail records acknowledge, ask, pin, approve, push, verify, and close.",
    userProblem:
      "Managers cannot reconstruct why a change shipped without digging in three systems.",
    metric: "Changes pushed without approval (target 0)",
  },
  {
    id: "workspace-7",
    page: "workspace",
    number: 7,
    anchor: "reply-box",
    designDecision:
      "Reply templates and internal notes sit under the thread so tone stays consistent under SLA pressure.",
    userProblem:
      "First responses are rewritten from scratch on every ticket.",
    metric: "Mean time to first response",
  },
];

export const ALL_ANNOTATIONS: AnnotationPinDef[] = [
  ...HOME_ANNOTATIONS,
  ...TICKETS_ANNOTATIONS,
  ...WORKSPACE_ANNOTATIONS,
];

export function annotationsForPage(page: AnnotationPage): AnnotationPinDef[] {
  switch (page) {
    case "home":
      return HOME_ANNOTATIONS;
    case "tickets":
      return TICKETS_ANNOTATIONS;
    case "workspace":
      return WORKSPACE_ANNOTATIONS;
  }
}
