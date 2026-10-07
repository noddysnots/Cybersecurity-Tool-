import type { Message } from "@/types";

export type HistoryRca = {
  summary: string;
  timeline: string[];
  rootCause: string;
  fix: string;
  prevention: string;
};

export type HistoryTicketDetail = {
  ticketId: string;
  assigneeName: string;
  thread: Message[];
  rca: HistoryRca;
};

function msg(
  ticketId: string,
  id: string,
  author: Message["author"],
  authorName: string,
  body: string,
  createdAt: string,
  kind: Message["kind"],
): Message {
  return { id, ticketId, author, authorName, body, createdAt, kind };
}

const HISTORY_ASSIGNEES = [
  "Priya Nair",
  "Arjun Mehta",
  "Sofia Alvarez",
  "Kenji Watanabe",
  "Amelia Brooks",
] as const;

function assigneeFor(ticketId: string): string {
  const n = Number(ticketId.replace(/\D/g, "")) || 0;
  return HISTORY_ASSIGNEES[n % HISTORY_ASSIGNEES.length];
}

function closedThread(
  ticketId: string,
  contact: string,
  intake: string,
  ack: string,
  resolution: string,
  openedAt: string,
): Message[] {
  const base = Date.parse(openedAt);
  const t = (mins: number) => new Date(base + mins * 60_000).toISOString();
  return [
    msg(ticketId, `${ticketId}-h-intake`, "customer", contact, intake, t(0), "intake"),
    msg(ticketId, `${ticketId}-h-ack`, "engineer", assigneeFor(ticketId), ack, t(12), "acknowledge"),
    msg(
      ticketId,
      `${ticketId}-h-note`,
      "engineer",
      assigneeFor(ticketId),
      "Checked logs and config. Root cause confirmed.",
      t(45),
      "note",
    ),
    msg(
      ticketId,
      `${ticketId}-h-sys`,
      "system",
      "System",
      "Fix applied and verified.",
      t(90),
      "system",
    ),
    msg(ticketId, `${ticketId}-h-confirm`, "customer", contact, resolution, t(110), "confirm"),
  ];
}

const HISTORY_SEED: Omit<HistoryTicketDetail, "assigneeName">[] = [
  {
    ticketId: "TKT-24700",
    thread: closedThread(
      "TKT-24700",
      "Colin Cruickshank",
      "Users see a certificate warning on the GlobalProtect portal after the weekend renewal.",
      "Thanks, we are checking the portal certificate chain now.",
      "Warning is gone after the intermediate cert was re-imported. Thank you.",
      "2026-10-01T08:38:07.538Z",
    ),
    rca: {
      summary: "GlobalProtect portal presented an incomplete chain after renewal.",
      timeline: [
        "01 Oct 08:38 IST: Ticket opened with certificate warning.",
        "01 Oct 09:10 IST: Portal cert missing intermediate.",
        "01 Oct 10:05 IST: Intermediate re-imported, portal verified.",
      ],
      rootCause: "Renewal uploaded the leaf certificate without the intermediate.",
      fix: "Re-imported the intermediate certificate on the portal.",
      prevention: "Add a post-renewal portal reachability check to the change template.",
    },
  },
  {
    ticketId: "TKT-24701",
    thread: closedThread(
      "TKT-24701",
      "Lydia Rath",
      "SharePoint feels very slow for Hyderabad mobile users since yesterday.",
      "Acknowledged. We will compare Hyderabad vs Bengaluru traffic for SharePoint.",
      "SharePoint is normal again after the QoS tweak. Closing from our side.",
      "2026-09-24T11:29:28.705Z",
    ),
    rca: {
      summary: "Hyderabad mobile user QoS class was starving SharePoint uploads.",
      timeline: [
        "24 Sep: Slow SharePoint reports from Hyderabad GP users.",
        "Compared good vs bad users; QoS hit counts elevated.",
        "Adjusted collaboration class; latency recovered.",
      ],
      rootCause: "QoS priority for collaboration apps was too low on India South.",
      fix: "Raised collaboration class priority and verified SharePoint timings.",
      prevention: "Include SharePoint sample transfer in post-change checks.",
    },
  },
  {
    ticketId: "TKT-24702",
    thread: closedThread(
      "TKT-24702",
      "Jimmie Pacocha",
      "Zoom audio drops intermittently for India South users.",
      "Thanks, gathering Zoom media logs and policy hits now.",
      "Audio is stable after the UDP allow adjustment.",
      "2026-09-23T03:19:02.368Z",
    ),
    rca: {
      summary: "Intermittent Zoom media drops on India South remote users.",
      timeline: [
        "23 Sep: Intermittent Zoom audio reports.",
        "Traffic logs showed partial UDP drops on media ports.",
        "Policy service object corrected; calls stabilized.",
      ],
      rootCause: "Media port range in the Zoom allow service was incomplete.",
      fix: "Expanded the Zoom media service object to the full UDP range.",
      prevention: "Track vendor media port changes in the object review checklist.",
    },
  },
  {
    ticketId: "TKT-24703",
    thread: closedThread(
      "TKT-24703",
      "Rosemary Breitenberg",
      "Okta SSO loops when GlobalProtect reconnects after sleep.",
      "Looking at SAML and portal auth logs for reconnect loops.",
      "Reconnect works after the IdP timeout change. Thanks.",
      "2026-09-22T09:22:28.073Z",
    ),
    rca: {
      summary: "GP reconnect hit an Okta session timeout mismatch.",
      timeline: [
        "22 Sep: SSO loop on GP reconnect reported.",
        "Auth logs showed repeated SAML challenges.",
        "Aligned GP and Okta session lifetimes.",
      ],
      rootCause: "Okta session lifetime was shorter than GP reconnect grace.",
      fix: "Increased Okta session lifetime to match GP guidance.",
      prevention: "Document IdP and GP session pairing in the runbook.",
    },
  },
  {
    ticketId: "TKT-24704",
    thread: closedThread(
      "TKT-24704",
      "Katie Klocko",
      "Our internal docs site is blocked by URL filtering as malware.",
      "Acknowledged. Checking URL category and override options.",
      "Docs site loads after the allow exception. Appreciate the help.",
      "2026-10-04T01:08:37.397Z",
    ),
    rca: {
      summary: "False positive URL category on an internal documentation host.",
      timeline: [
        "04 Oct: Docs site blocked as malware.",
        "URL log confirmed category mismatch.",
        "Temporary allow and vendor recategorization requested.",
      ],
      rootCause: "URL filtering miscategorized the internal docs FQDN.",
      fix: "Added a scoped allow exception and filed a recategorization request.",
      prevention: "Keep an allowlist for known internal documentation hosts.",
    },
  },
  {
    ticketId: "TKT-24705",
    thread: closedThread(
      "TKT-24705",
      "Darrel Littel",
      "Users get a decryption error on our banking site.",
      "Thanks, reviewing decryption policy and certificate pin exclusions.",
      "Banking site works after the exclusion. Closing.",
      "2026-09-24T09:44:44.384Z",
    ),
    rca: {
      summary: "TLS decryption failed on a banking site with certificate pinning.",
      timeline: [
        "24 Sep: Decryption errors on banking domain.",
        "Decryption logs showed pin failure.",
        "Added exclusion; site verified.",
      ],
      rootCause: "Site uses certificate pinning incompatible with SSL forward proxy.",
      fix: "Added the banking domain to the decryption exclusion list.",
      prevention: "Maintain a pinned-site exclusion list for finance apps.",
    },
  },
  {
    ticketId: "TKT-24706",
    thread: closedThread(
      "TKT-24706",
      "Bernadette Monahan",
      "New GP users cannot connect in India West. Pool looks full.",
      "Checking mobile user license pool and gateway capacity now.",
      "Connections succeed after the pool increase.",
      "2026-09-29T19:13:06.510Z",
    ),
    rca: {
      summary: "India West mobile user pool exhausted during onboarding spike.",
      timeline: [
        "29 Sep: Connect failures in India West.",
        "Gateway showed pool exhaustion.",
        "Pool increased; onboarding resumed.",
      ],
      rootCause: "Licensed mobile user count was below the onboarding wave.",
      fix: "Increased the India West mobile user pool allocation.",
      prevention: "Alert at 80% pool utilization before onboarding waves.",
    },
  },
  {
    ticketId: "TKT-24707",
    thread: closedThread(
      "TKT-24707",
      "Miss Jan McCullough",
      "Chennai branch users report poor voice quality through the tunnel.",
      "Acknowledged. Comparing QoS and tunnel latency for Chennai.",
      "Voice quality is back after the QoS class fix.",
      "2026-10-02T18:47:08.444Z",
    ),
    rca: {
      summary: "Chennai branch voice traffic lacked the correct QoS class.",
      timeline: [
        "02 Oct: Voice quality complaint from Chennai.",
        "Tunnel up; QoS counters showed default class hits.",
        "Mapped voice apps to expedited class.",
      ],
      rootCause: "Voice App-IDs were missing from the expedited QoS class.",
      fix: "Added voice apps to the expedited class and verified MOS samples.",
      prevention: "Include voice sample calls in branch acceptance tests.",
    },
  },
  {
    ticketId: "TKT-24708",
    thread: closedThread(
      "TKT-24708",
      "Mrs. Wanda Moen",
      "Threat logs show a spike for adware.generic on several laptops.",
      "Thanks, correlating hosts and wildfire verdicts now.",
      "Cleanup complete on the affected endpoints. Thanks.",
      "2026-10-02T04:19:52.286Z",
    ),
    rca: {
      summary: "Adware.generic detections on a small set of unmanaged endpoints.",
      timeline: [
        "02 Oct: Threat spike for adware.generic.",
        "Hosts identified; no lateral movement.",
        "Endpoint cleanup and user education completed.",
      ],
      rootCause: "Browser helper adware on unmanaged contractor laptops.",
      fix: "Removed the adware and enforced GP HIP checks for those users.",
      prevention: "Require HIP compliant posture before network access.",
    },
  },
  {
    ticketId: "TKT-24709",
    thread: closedThread(
      "TKT-24709",
      "Gary Mayert DVM",
      "Please allow Box uploads from the Pune engineering VLAN.",
      "Reviewing the request against the current file sharing policy.",
      "Box uploads work after the change. Appreciate it.",
      "2026-10-01T22:49:10.155Z",
    ),
    rca: {
      summary: "Approved exception to allow Box uploads for Pune engineering.",
      timeline: [
        "01 Oct: Business request to allow Box upload.",
        "Change approved by security owner.",
        "Policy updated and verified with a test upload.",
      ],
      rootCause: "Box upload was denied by the default file sharing rule.",
      fix: "Added a scoped allow for Box upload from the engineering VLAN.",
      prevention: "Track SaaS allow requests in the weekly policy review.",
    },
  },
];

export const HISTORY_TICKETS: Record<string, HistoryTicketDetail> = Object.fromEntries(
  HISTORY_SEED.map((item) => [
    item.ticketId,
    { ...item, assigneeName: assigneeFor(item.ticketId) },
  ]),
);

export function getHistoryTicket(ticketId: string): HistoryTicketDetail | undefined {
  return HISTORY_TICKETS[ticketId];
}
