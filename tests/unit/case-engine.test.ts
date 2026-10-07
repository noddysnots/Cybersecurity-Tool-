import { beforeEach, describe, expect, it } from "vitest";

import { SCOPE_QUESTIONS } from "@/content/questions";
import {
  selectCanClose,
  selectMeetRuleMatch,
  selectPuneTunnelStatus,
  selectVerifyPasses,
  useCaseEngine,
} from "@/lib/case-engine";

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

  it("records scoped answers from the conversation script", () => {
    const engine = useCaseEngine.getState();
    engine.askQuestion("TKT-24817", "changes");
    const ticket = useCaseEngine.getState().tickets["TKT-24817"];
    expect(ticket.answeredQuestions).toContain("changes");
    expect(ticket.thread.some((m) => m.body.includes("CHG-5120"))).toBe(true);
    expect(ticket.status).toBe("in_progress");
  });

  it("Case 1: cannot verify before fix, cannot close before confirm", () => {
    const engine = useCaseEngine.getState();
    expect(engine.verify("TKT-24817")).toEqual({
      ok: false,
      reason: "Cannot verify before the fix is applied.",
    });
    expect(selectVerifyPasses(useCaseEngine.getState(), "TKT-24817")).toBe(false);

    engine.askAllQuestions(
      "TKT-24817",
      SCOPE_QUESTIONS.map((q) => q.id),
    );
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
