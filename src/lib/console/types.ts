import type { CaseEngineState } from "@/lib/case-engine";

export type ConsoleMode = "prisma" | "branch";

export type ConsoleContext = {
  mode: ConsoleMode;
  tickets: CaseEngineState["tickets"];
};

export type CommandHandler = (args: string, ctx: ConsoleContext) => string;

export type ConsoleCommand = {
  id: string;
  /** Full usage string shown in help and used for matching / completion. */
  usage: string;
  help: string;
  modes: ConsoleMode[];
  /** Match the trimmed input line. Captures remaining args in group 1 when present. */
  pattern: RegExp;
  handler: CommandHandler;
};

export type RunCommandResult =
  | { ok: true; output: string; commandId: string }
  | { ok: false; output: string; suggestion?: string };
