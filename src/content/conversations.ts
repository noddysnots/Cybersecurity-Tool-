import type { CaseKey } from "@/types";

export type ConversationEventKey =
  | "acknowledge"
  | "approval_request"
  | "approval"
  | "retry_request"
  | "confirm"
  | "intake";

export interface CaseConversationScript {
  caseKey: CaseKey;
  ticketId: string;
  contactName: string;
  intake: string;
  questions: Record<string, string>;
  events: Record<ConversationEventKey, string>;
}

export const CASE_1_CONVERSATION: CaseConversationScript = {
  caseKey: "meet-quic",
  ticketId: "TKT-24817",
  contactName: "Neha Kapoor",
  intake:
    "Since this morning a lot of our people cannot join Google Meet calls. The page opens but the call never connects. Please check urgently, we have client calls all day.",
  questions: {
    what_fails:
      "The join screen loads. After clicking Join it says Connecting, then shows Could not connect to the call.",
    when: "First complaint around 9:05 IST. Everyone was fine yesterday evening.",
    who: "Only people working from home on GlobalProtect. People in the Bengaluru office are fine.",
    changes:
      "Our security team pushed a change last night to block QUIC. Reference CHG-5120.",
    consistent: "Every time, for remote users.",
    other_apps: "Teams and Slack calls work. Only Meet so far.",
    examples:
      "Failing: ankit.verma@acme.io, tried at 10:02 IST from Pune. Working: sana.khan@acme.io, joined at 10:05 IST from the Bengaluru office.",
    workaround: "People are dialing in by phone. Not acceptable for client calls.",
  },
  events: {
    intake:
      "Since this morning a lot of our people cannot join Google Meet calls. The page opens but the call never connects. Please check urgently, we have client calls all day.",
    acknowledge: "Thanks, we are looking into this now.",
    approval_request:
      "We identified Block-QUIC matching Meet media on UDP 19302-19309. Proposed fix: change the rule to application quic with service application-default and remove svc-quic-block. May we push this?",
    approval: "Approved, go ahead.",
    retry_request: "Config pushed. Ankit, please retry joining a Meet call and confirm.",
    confirm: "Ankit confirms Meet works. Thank you!",
  },
};

export const CASE_2_CONVERSATION: CaseConversationScript = {
  caseKey: "pune-tunnel",
  ticketId: "TKT-24823",
  contactName: "Rohit Sharma",
  intake:
    "Pune branch lost all access to cloud apps and the internet about 10 minutes ago. 85 users down.",
  questions: {
    what_fails: "Nothing works from the branch. Local LAN is fine.",
    when: "Monitoring alarm at 11:42 IST.",
    who: "All 85 users at Pune. Other branches are fine.",
    changes: "No changes that I know of.",
    consistent: "Total outage since the alarm. Not intermittent.",
    other_apps: "All cloud and internet apps from the branch are down.",
    examples:
      "Branch subnet 10.60.0.0/16 stopped reaching Prisma Access at 11:42 IST. Bengaluru-Branch-01 still fine.",
    workaround: "Users are on personal hotspots. Business impact is high for the Pune office.",
    isp: "ISP link is up. Firewall can ping 8.8.8.8.",
    device: "PA-440, hostname pune-fw-01.",
  },
  events: {
    intake:
      "Pune branch lost all access to cloud apps and the internet about 10 minutes ago. 85 users down.",
    acknowledge: "We see the tunnel-down alert and are checking IKE and IPsec now.",
    approval_request:
      "Branch ipsec-prisma PFS was changed to group19 during CHG-4471 while Prisma expects group14. Please run: set network ike crypto-profiles ipsec-crypto-profiles ipsec-prisma dh-group group14 then commit.",
    approval: "Applied and committed.",
    retry_request: "Please confirm Pune users can reach cloud apps again.",
    confirm: "Pune is back.",
  },
};

export const CONVERSATION_SCRIPTS: Record<CaseKey, CaseConversationScript> = {
  "meet-quic": CASE_1_CONVERSATION,
  "pune-tunnel": CASE_2_CONVERSATION,
};

export function getConversation(caseKey: CaseKey): CaseConversationScript {
  return CONVERSATION_SCRIPTS[caseKey];
}
