import { Star } from "lucide-react";

import { Button } from "@/components/ui";
import { getConversation } from "@/content/conversations";
import { questionsForCase } from "@/content/questions";
import { workspaceCopy } from "@/content/workspace";
import type { TicketCaseState } from "@/lib/case-engine";
import { unansweredQuestionIds } from "@/lib/playbook";
import { cn } from "@/lib/utils";

type ScopeStepProps = {
  state: TicketCaseState;
  asking: boolean;
  onAsk: (questionId: string) => void;
  onAskAll: () => void;
  onMarkKeyFinding: (questionId: string) => void;
};

const SUMMARY_FIELDS = [
  { key: "what" as const, label: workspaceCopy.scopeWhat, questionId: "what_fails" },
  { key: "when" as const, label: workspaceCopy.scopeWhen, questionId: "when" },
  { key: "who" as const, label: workspaceCopy.scopeWho, questionId: "who" },
  { key: "changes" as const, label: workspaceCopy.scopeChanges, questionId: "changes" },
  { key: "examples" as const, label: workspaceCopy.scopeExamples, questionId: "examples" },
];

export function ScopeStep({
  state,
  asking,
  onAsk,
  onAskAll,
  onMarkKeyFinding,
}: ScopeStepProps) {
  const questions = questionsForCase(state.caseKey);
  const script = getConversation(state.caseKey);
  const unanswered = unansweredQuestionIds(state);

  return (
    <div className="space-y-4 p-4" data-testid="step-scope">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-text">{workspaceCopy.scopeTitle}</h2>
          <p className="mt-1 text-sm text-text-muted">{workspaceCopy.scopeContinueHint}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          data-testid="scope-ask-all"
          disabled={asking || unanswered.length === 0}
          title={
            unanswered.length === 0
              ? "All questions already asked"
              : asking
                ? workspaceCopy.typing
                : undefined
          }
          onClick={onAskAll}
        >
          {workspaceCopy.scopeAskAll}
        </Button>
      </div>

      <div
        className="sticky top-0 z-10 rounded-[var(--radius-panel)] border border-border bg-surface-1 p-3"
        data-testid="scope-summary"
      >
        <h3 className="text-sm font-medium text-text">{workspaceCopy.scopeSummaryTitle}</h3>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          {SUMMARY_FIELDS.map((field) => {
            const answered = state.answeredQuestions.includes(field.questionId);
            const value = answered
              ? script.questions[field.questionId]
              : workspaceCopy.scopeEmptyField;
            return (
              <div key={field.key} data-testid={`scope-summary-${field.key}`}>
                <dt className="text-xs text-text-faint">{field.label}</dt>
                <dd
                  className={cn(
                    "mt-0.5 text-sm",
                    answered ? "text-text" : "text-text-faint",
                  )}
                >
                  {value}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <ul className="space-y-2">
        {questions.map((question) => {
          const answered = state.answeredQuestions.includes(question.id);
          const pending = state.pendingQuestions.includes(question.id);
          const keyFinding = state.keyFindings.includes(question.id);
          const answer = script.questions[question.id];

          return (
            <li
              key={question.id}
              className="rounded-[var(--radius-panel)] border border-border bg-surface-1 p-3"
              data-testid={`scope-question-${question.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm text-text">{question.label}</p>
                <div className="flex flex-wrap items-center gap-2">
                  {answered ? (
                    <span className="text-xs text-signal">{workspaceCopy.scopeAnswered}</span>
                  ) : pending ? (
                    <span className="text-xs text-warn">{workspaceCopy.scopeAsked}</span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      data-testid={`scope-ask-${question.id}`}
                      disabled={asking}
                      title={asking ? workspaceCopy.typing : undefined}
                      onClick={() => onAsk(question.id)}
                    >
                      {workspaceCopy.scopeAsk}
                    </Button>
                  )}
                  {answered ? (
                    <Button
                      type="button"
                      size="sm"
                      variant={keyFinding ? "default" : "secondary"}
                      data-testid={`scope-key-${question.id}`}
                      disabled={keyFinding}
                      title={keyFinding ? workspaceCopy.scopeKeyFindingOn : undefined}
                      onClick={() => onMarkKeyFinding(question.id)}
                    >
                      <Star className="h-3.5 w-3.5" aria-hidden />
                      {keyFinding
                        ? workspaceCopy.scopeKeyFindingOn
                        : workspaceCopy.scopeKeyFinding}
                    </Button>
                  ) : null}
                </div>
              </div>
              {answered && answer ? (
                <p className="mt-2 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 py-1.5 text-sm text-text">
                  {answer}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
