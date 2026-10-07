/** Copy for Verify step. No em or en dashes. */

export const verifyCopy = {
  title: "Verify",
  case1Hint: "Re-run the security policy match. After the push it should hit Allow-Collab-Apps allow.",
  case2Hint: "Re-run the IPsec SA test. After the revert, Phase 2 should come up and Pune traffic resumes.",
  rerun: "Re-run failing test",
  rerunPassed: "Test passed",
  rerunNeedFix: "Apply the fix before verifying.",
  rerunNeedPush: "Wait for the config push to finish.",
  askConfirm: "Ask customer to confirm",
  confirmSent: "Confirmation requested",
  waitingConfirm: "Waiting for customer confirmation…",
  confirmed: "Customer confirmed.",
  continueRca: "Continue to RCA",
  matchResult: "Policy match result",
  tunnelResult: "Tunnel test result",
  homeHint: "Home and Remote networks will show Pune up after the fix.",
} as const;
