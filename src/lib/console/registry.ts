import { CONSOLE_COMMANDS } from "@/lib/console/commands";
import type {
  ConsoleCommand,
  ConsoleContext,
  ConsoleMode,
  RunCommandResult,
} from "@/lib/console/types";

function normalizeLine(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export function commandsForMode(mode: ConsoleMode): ConsoleCommand[] {
  return CONSOLE_COMMANDS.filter((c) => c.modes.includes(mode));
}

export function findCommand(
  mode: ConsoleMode,
  input: string,
): { command: ConsoleCommand; args: string } | null {
  const line = normalizeLine(input);
  if (!line) return null;
  for (const command of commandsForMode(mode)) {
    const match = command.pattern.exec(line);
    if (match) {
      return { command, args: (match[1] ?? "").trim() };
    }
  }
  return null;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array.from({ length: n + 1 }, () => 0),
  );
  for (let i = 0; i <= m; i += 1) dp[i]![0] = i;
  for (let j = 0; j <= n; j += 1) dp[0]![j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(
        (dp[i - 1]![j] ?? 0) + 1,
        (dp[i]![j - 1] ?? 0) + 1,
        (dp[i - 1]![j - 1] ?? 0) + cost,
      );
    }
  }
  return dp[m]![n] ?? 0;
}

export function closestCommand(mode: ConsoleMode, input: string): string | undefined {
  const line = normalizeLine(input).toLowerCase();
  if (!line) return undefined;
  let best: { usage: string; score: number } | undefined;
  for (const command of commandsForMode(mode)) {
    if (command.id === "help" || command.id === "question") continue;
    const usage = command.usage.toLowerCase();
    const score = levenshtein(line, usage);
    // Also score against a shortened prefix comparison for partial typos
    const prefixScore = levenshtein(line, usage.slice(0, Math.max(line.length, 1)));
    const combined = Math.min(score, prefixScore);
    if (!best || combined < best.score) {
      best = { usage: command.usage, score: combined };
    }
  }
  if (!best) return undefined;
  // Reject very distant suggestions
  if (best.score > Math.max(8, Math.floor(best.usage.length * 0.45))) {
    return undefined;
  }
  return best.usage;
}

export function completeCommand(mode: ConsoleMode, input: string): string {
  const line = normalizeLine(input);
  if (!line) return line;
  const lower = line.toLowerCase();
  const candidates = commandsForMode(mode)
    .map((c) => c.usage)
    .filter((usage) => usage.toLowerCase().startsWith(lower));
  if (candidates.length === 0) {
    // Complete token by token against usages that share the same prefix words
    const partial = commandsForMode(mode)
      .map((c) => c.usage)
      .filter((usage) => usage.toLowerCase().startsWith(lower.split(" ")[0] ?? ""));
    if (partial.length === 1) return partial[0]!;
    if (partial.length > 1) {
      return commonPrefix(partial);
    }
    return line;
  }
  if (candidates.length === 1) return candidates[0]!;
  return commonPrefix(candidates);
}

function commonPrefix(values: string[]): string {
  if (values.length === 0) return "";
  let prefix = values[0]!;
  for (let i = 1; i < values.length; i += 1) {
    const value = values[i]!;
    let j = 0;
    while (j < prefix.length && j < value.length && prefix[j] === value[j]) {
      j += 1;
    }
    prefix = prefix.slice(0, j);
  }
  return prefix.trimEnd();
}

export function listCompletions(mode: ConsoleMode, input: string): string[] {
  const line = normalizeLine(input).toLowerCase();
  return commandsForMode(mode)
    .map((c) => c.usage)
    .filter((usage) => !line || usage.toLowerCase().startsWith(line));
}

export function runCommand(mode: ConsoleMode, input: string, ctx: ConsoleContext): RunCommandResult {
  const line = normalizeLine(input);
  if (!line) {
    return { ok: false, output: "" };
  }
  const found = findCommand(mode, line);
  if (!found) {
    const suggestion = closestCommand(mode, line);
    const message = suggestion
      ? `Unknown command: ${line}\nDid you mean: ${suggestion}`
      : `Unknown command: ${line}\nType help or ? to list commands.`;
    return { ok: false, output: message, suggestion };
  }
  try {
    const output = found.command.handler(found.args, { ...ctx, mode });
    return { ok: true, output, commandId: found.command.id };
  } catch {
    return {
      ok: false,
      output: `Command failed: ${found.command.usage}`,
    };
  }
}

export function promptForMode(mode: ConsoleMode): string {
  return mode === "branch" ? "admin@pune-fw-01>" : "admin@prisma-access>";
}

export function modeLabel(mode: ConsoleMode): string {
  return mode === "branch" ? "Branch firewall CLI" : "Prisma diagnostics";
}
