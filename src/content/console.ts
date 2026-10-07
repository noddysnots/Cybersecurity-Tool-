import type { ConsoleMode } from "@/types";

export const CONSOLE_COPY = {
  title: "Console",
  collapse: "Collapse console",
  expand: "Expand console",
  resize: "Resize console",
  modeLabel: "Console mode",
  modePrisma: "Prisma diagnostics",
  modeBranch: "Branch firewall CLI",
  inputLabel: "Console command",
  run: "Run command",
  clear: "Clear output",
  copyOutput: "Copy output",
  copied: "Copied",
  pinOutput: "Pin output as evidence",
  pinUnavailable: "Open an alert to pin evidence",
  pinned: "Pinned console output",
  alreadyPinned: "Already pinned",
  emptyHint: "Type a command and press Enter. Tab completes. Up and Down cycle history.",
  shortcutHint: "Ctrl `",
  toggleHint: "Toggle console",
  outputLabel: "Command output",
  promptBranch: "admin@pune-fw-01",
  promptPrisma: "admin@prisma-diag",
} as const;

export function promptForMode(mode: ConsoleMode): string {
  return mode === "branch" ? CONSOLE_COPY.promptBranch : CONSOLE_COPY.promptPrisma;
}

export const CONSOLE_TOASTS = {
  copied: "Copied output",
  pinned: "Pinned console output to evidence",
  alreadyPinned: "That output is already pinned",
} as const;
