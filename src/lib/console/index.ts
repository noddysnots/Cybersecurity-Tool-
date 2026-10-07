export { CONSOLE_COMMANDS, CASE_2_SUGGESTED_COMMANDS, buildCommands } from "./commands";
export {
  closestCommand,
  commandsForMode,
  completeCommand,
  findCommand,
  listCompletions,
  modeLabel,
  promptForMode,
  runCommand,
} from "./registry";
export {
  CASE_1_POLICY_DEFAULTS,
  CASE_2_POLICY_DEFAULTS,
  formatPolicyMatchCli,
  runPing,
  runPolicyMatch,
  runTraceroute,
  runTunnelStatus,
  type PingResult,
  type PolicyMatchInput,
  type PolicyMatchResult,
  type TracerouteResult,
  type TunnelStatusResult,
} from "./tools";
export type {
  CommandHandler,
  ConsoleCommand,
  ConsoleContext,
  ConsoleMode,
  RunCommandResult,
} from "./types";
