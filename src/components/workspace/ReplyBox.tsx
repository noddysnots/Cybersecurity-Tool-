import { useState } from "react";

import { Button } from "@/components/ui";
import { getConversation } from "@/content/conversations";
import { workspaceCopy } from "@/content/workspace";
import type { CaseKey } from "@/types";
import { cn } from "@/lib/utils";

type ReplyBoxProps = {
  caseKey: CaseKey;
  disabled?: boolean;
  onSend: (body: string, internal: boolean) => void;
};

export function ReplyBox({ caseKey, disabled = false, onSend }: ReplyBoxProps) {
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const script = getConversation(caseKey);

  const templates = [
    { id: "ack", label: workspaceCopy.templateAck, text: script.events.acknowledge },
    {
      id: "more",
      label: workspaceCopy.templateMoreInfo,
      text: "Could you share a bit more detail on the latest failure time and a failing user?",
    },
    {
      id: "working",
      label: workspaceCopy.templateWorking,
      text: "Still investigating on our side. I will update you shortly.",
    },
  ];

  function send() {
    if (!body.trim() || disabled) return;
    onSend(body, internal);
    setBody("");
  }

  return (
    <div
      className="border-t border-border px-3 py-2"
      data-testid="reply-box"
      data-annotation="reply-box"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex rounded-[var(--radius-control)] border border-border p-0.5">
          <button
            type="button"
            className={cn(
              "rounded-[var(--radius-control)] px-2 py-1 text-xs",
              !internal ? "bg-surface-3 text-text" : "text-text-muted",
            )}
            aria-pressed={!internal}
            disabled={disabled}
            onClick={() => setInternal(false)}
          >
            {workspaceCopy.replyModeCustomer}
          </button>
          <button
            type="button"
            className={cn(
              "rounded-[var(--radius-control)] px-2 py-1 text-xs",
              internal ? "bg-surface-3 text-text" : "text-text-muted",
            )}
            aria-pressed={internal}
            disabled={disabled}
            onClick={() => setInternal(true)}
          >
            {workspaceCopy.replyModeInternal}
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-text-faint">{workspaceCopy.templatesLabel}</span>
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              className="rounded-[var(--radius-control)] border border-border px-2 py-0.5 text-xs text-text-muted hover:bg-surface-2 hover:text-text disabled:opacity-50"
              onClick={() => setBody(t.text)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={body}
        disabled={disabled}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        data-testid="reply-input"
        placeholder={
          internal
            ? workspaceCopy.replyInternalPlaceholder
            : workspaceCopy.replyPlaceholder
        }
        className="w-full resize-none rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-faint disabled:opacity-50"
      />
      <div className="mt-2 flex justify-end">
        <Button
          type="button"
          size="sm"
          disabled={disabled || !body.trim()}
          data-testid="reply-send"
          title={disabled ? workspaceCopy.readOnlyBanner : undefined}
          onClick={send}
        >
          {internal ? workspaceCopy.replyNote : workspaceCopy.replySend}
        </Button>
      </div>
    </div>
  );
}
