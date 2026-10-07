/** Copy for console drawer and troubleshooting tools. No em or en dashes. */

export const consoleCopy = {
  title: "Console",
  hint: "Ctrl+`",
  modePrisma: "Prisma diagnostics",
  modeBranch: "Branch firewall CLI",
  copyOutput: "Copy",
  pinOutput: "Pin output",
  pinned: "Pinned",
  pinDisabled: "Open a workable ticket to pin output",
  copied: "Copied",
  empty: "Type a command. Tab completes. ? lists commands for this mode.",
  resize: "Resize console",
  close: "Close console",
  historyHint: "Up and Down recall history",
} as const;

export const toolsCopy = {
  title: "Troubleshooting",
  subtitle: "Run the same checks TAC uses on a case. Results follow live case state.",
  policyTitle: "Security policy match",
  policyHint: "Pre-filled for Case 1 Meet media. Change fields as needed.",
  policyRun: "Run match",
  policyPin: "Pin result",
  policyPinned: "Pinned",
  pingTitle: "Ping",
  pingHint: "ICMP to prove ISP and underlay are up.",
  pingRun: "Run ping",
  pingHost: "Host",
  tracerouteTitle: "Traceroute",
  tracerouteHint: "Path check from the branch underlay.",
  tracerouteRun: "Run traceroute",
  tunnelTitle: "Tunnel status",
  tunnelHint: "Prisma-side view of Pune IKE and IPsec.",
  tunnelRun: "Refresh status",
  resultEmpty: "Run a tool to see results.",
  backHome: "Back to Home",
  backTickets: "Back to Tickets",
} as const;

export const proveCopy = {
  title: "Prove",
  case1Hint:
    "Run a security policy match for Ankit Meet media. Before the fix it must hit Block-QUIC deny.",
  case2Hint:
    "Open the branch firewall CLI and run the suggested commands. IKE stays up while IPsec is missing.",
  runMatch: "Run policy match",
  openConsole: "Open branch CLI",
  pinResult: "Pin result",
  pinned: "Pinned",
  continue: "Continue",
  continueHint: "Pin a prove result to mark this step done. Fix arrives in Phase 7.",
  suggested: "Suggested commands",
  matchResult: "Policy match result",
} as const;
