import { beforeEach, describe, expect, it } from "vitest";

import { SCOPE_QUESTIONS } from "@/content/questions";
import {
  selectCanClose,
  selectMeetRuleMatch,
  selectPuneTunnelStatus,
  selectVerifyPasses,
  useCaseEngine,
} from "@/lib/case-engine";
import { getPlaybookGates, scopeUnlocksEvidence } from "@/lib/playbook";

describe("case engine", () => {
  beforeEach(() => {
    useCaseEngine.getState().resetDemo();
  });

  it("starts both workable tickets open at intake with intake messages", () => {
    const { tickets } = useCaseEngine.getState();
    expect(tickets["TKT-24817"].status).toBe("open");
    expect(tickets["TKT-24817"].step).toBe("intake");
    expect(tickets["TKT-24817"].thread[0]?.kind).toBe("intake");
    expect(tickets["TKT-24823"].thread[0]?.body).toContain("85 users down");
    expect(selectPuneTunnelStatus(useCaseEngine.getState())).toBe("down");
    expect(selectMeetRuleMatch(useCaseEngine.getState(), "mobile-user")).toEqual({
      rule: "Block-QUIC",
      action: "drop",
      container: "Mobile Users",
    });
    expect(selectMeetRuleMatch(useCaseEngine.getState(), "remote-network").rule).toBe(
      "Allow-Collab-Apps",
    );
  });

  it("acknowledge moves to scope with first response", () => {
    const engine = useCaseEngine.getState();
    engine.acknowledge("TKT-24817", "Thanks, we are looking into this now.");
    const ticket = useCaseEngine.getState().tickets["TKT-24817"];
    expect(ticket.status).toBe("in_progress");
    expect(ticket.step).toBe("scope");
    expect(ticket.thread.some((m) => m.kind === "acknowledge")).toBe(true);
    expect(getPlaybookGates(ticket).scope.unlocked).toBe(true);
  });

  it("records scoped answers from the conversation script after delivery", () => {
    const engine = useCaseEngine.getState();
    engine.acknowledge("TKT-24817", "Thanks, we are looking into this now.");
    engine.askQuestion("TKT-24817", "changes");
    expect(useCaseEngine.getState().tickets["TKT-24817"].pendingQuestions).toContain(
      "changes",
    );
    expect(useCaseEngine.getState().tickets["TKT-24817"].status).toBe("pending_customer");
    engine.deliverAnswer("TKT-24817", "changes");
    const ticket = useCaseEngine.getState().tickets["TKT-24817"];
    expect(ticket.answeredQuestions).toContain("changes");
    expect(ticket.pendingQuestions).not.toContain("changes");
    expect(ticket.thread.some((m) => m.body.includes("CHG-5120"))).toBe(true);
    expect(ticket.status).toBe("in_progress");
  });

  it("unlocks evidence only after When and Who are answered", () => {
    const engine = useCaseEngine.getState();
    engine.acknowledge("TKT-24817", "Thanks, we are looking into this now.");
    engine.askQuestion("TKT-24817", "when");
    engine.deliverAnswer("TKT-24817", "when");
    expect(scopeUnlocksEvidence(useCaseEngine.getState().tickets["TKT-24817"])).toBe(
      false,
    );
    engine.askQuestion("TKT-24817", "who");
    engine.deliverAnswer("TKT-24817", "who");
    const ticket = useCaseEngine.getState().tickets["TKT-24817"];
    expect(scopeUnlocksEvidence(ticket)).toBe(true);
    expect(getPlaybookGates(ticket).evidence.unlocked).toBe(true);
    expect(getPlaybookGates(ticket).evidence.reason).toContain("failing user");
    expect(getPlaybookGates(ticket).isolate.unlocked).toBe(false);

    engine.pinEvidence("TKT-24817", {
      id: "ev-test",
      source: "traffic",
      label: "test pin",
      refId: "log-traffic-ankit-100214",
      note: "",
    });
    const afterPin = useCaseEngine.getState().tickets["TKT-24817"];
    expect(afterPin.evidenceComplete).toBe(true);
    expect(getPlaybookGates(afterPin).isolate.unlocked).toBe(true);
  });

  it("Case 1: cannot verify before fix, cannot close before confirm", () => {
    const engine = useCaseEngine.getState();
    expect(engine.verify("TKT-24817")).toEqual({
      ok: false,
      reason: "Cannot verify before the fix is applied.",
    });
    expect(selectVerifyPasses(useCaseEngine.getState(), "TKT-24817")).toBe(false);

    engine.acknowledge("TKT-24817", "Thanks, we are looking into this now.");
    engine.askAllQuestions(
      "TKT-24817",
      SCOPE_QUESTIONS.map((q) => q.id),
    );
    engine.deliverPendingAnswers("TKT-24817");
    engine.requestApproval("TKT-24817");
    engine.receiveApproval("TKT-24817");
    expect(
      useCaseEngine.getState().tickets["TKT-24817"].thread.some((m) => m.body === "Approved, go ahead."),
    ).toBe(true);

    engine.applyFix("TKT-24817");
    expect(useCaseEngine.getState().tickets["TKT-24817"].fixApplied).toBe(true);
    expect(useCaseEngine.getState().tickets["TKT-24817"].pushJobPhase).toBe("queued");
    expect(engine.verify("TKT-24817").ok).toBe(false);

    engine.advancePushJob("TKT-24817");
    engine.advancePushJob("TKT-24817");
    engine.advancePushJob("TKT-24817");
    engine.advancePushJob("TKT-24817");
    expect(useCaseEngine.getState().tickets["TKT-24817"].pushJobPhase).toBe("success");
    expect(selectMeetRuleMatch(useCaseEngine.getState(), "mobile-user")).toEqual({
      rule: "Allow-Collab-Apps",
      action: "allow",
      container: "Mobile Users",
    });
    expect(selectVerifyPasses(useCaseEngine.getState(), "TKT-24817")).toBe(true);
    expect(engine.verify("TKT-24817").ok).toBe(true);

    expect(engine.closeTicket("TKT-24817")).toEqual({
      ok: false,
      reason: "Cannot close before the customer confirms.",
    });
    expect(selectCanClose(useCaseEngine.getState(), "TKT-24817")).toBe(false);

    engine.requestCustomerConfirm("TKT-24817");
    engine.receiveCustomerConfirm("TKT-24817");
    expect(
      useCaseEngine
        .getState()
        .tickets["TKT-24817"].thread.some((m) => m.body.includes("Ankit confirms Meet works")),
    ).toBe(true);
    expect(engine.closeTicket("TKT-24817").ok).toBe(true);
    expect(useCaseEngine.getState().tickets["TKT-24817"].closed).toBe(true);
    expect(useCaseEngine.getState().tickets["TKT-24817"].status).toBe("closed");
  });

  it("Case 2: tunnel flips after fix; close requires customer confirm", () => {
    const engine = useCaseEngine.getState();
    expect(selectPuneTunnelStatus(useCaseEngine.getState())).toBe("down");
    expect(engine.verify("TKT-24823").ok).toBe(false);

    engine.requestApproval("TKT-24823");
    engine.receiveApproval("TKT-24823");
    expect(
      useCaseEngine
        .getState()
        .tickets["TKT-24823"].thread.some((m) => m.body === "Applied and committed."),
    ).toBe(true);

    engine.applyFix("TKT-24823");
    expect(selectPuneTunnelStatus(useCaseEngine.getState())).toBe("up");
    expect(engine.verify("TKT-24823").ok).toBe(true);

    expect(engine.closeTicket("TKT-24823").ok).toBe(false);
    engine.requestCustomerConfirm("TKT-24823");
    engine.receiveCustomerConfirm("TKT-24823");
    expect(
      useCaseEngine.getState().tickets["TKT-24823"].thread.some((m) => m.body === "Pune is back."),
    ).toBe(true);
    expect(engine.closeTicket("TKT-24823").ok).toBe(true);
  });

  it("resetDemo restores initial state", () => {
    const engine = useCaseEngine.getState();
    engine.requestApproval("TKT-24823");
    engine.receiveApproval("TKT-24823");
    engine.applyFix("TKT-24823");
    expect(selectPuneTunnelStatus(useCaseEngine.getState())).toBe("up");
    engine.resetDemo();
    expect(selectPuneTunnelStatus(useCaseEngine.getState())).toBe("down");
    expect(useCaseEngine.getState().tickets["TKT-24817"].answeredQuestions).toEqual([]);
  });
});
