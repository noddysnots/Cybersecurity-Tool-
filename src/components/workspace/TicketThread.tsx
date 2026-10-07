import { useEffect, useRef } from "react";

import { workspaceCopy } from "@/content/workspace";
import { formatAbsolute } from "@/lib/time";
import type { Message } from "@/types";
import { cn } from "@/lib/utils";

type TicketThreadProps = {
  messages: Message[];
  typing?: boolean;
  readOnly?: boolean;
};

function bubbleClass(message: Message): string {
  if (message.kind === "note") {
    return "border-[color-mix(in_srgb,var(--warn)_45%,var(--border))] bg-[color-mix(in_srgb,var(--warn)_12%,var(--surface-2))]";
  }
  if (message.author === "customer") {
    return "border-border bg-surface-2";
  }
  if (message.author === "system") {
    return "border-border bg-surface-1 text-text-muted";
  }
  return "border-[color-mix(in_srgb,var(--accent)_40%,var(--border))] bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface-2))]";
}

export function TicketThread({ messages, typing = false, readOnly = false }: TicketThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typing]);

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="ticket-thread">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((message) => (
          <article
            key={message.id}
            data-testid={`thread-msg-${message.id}`}
            data-author={message.author}
            data-kind={message.kind}
            className={cn(
              "rounded-[var(--radius-control)] border px-3 py-2",
              bubbleClass(message),
              message.author === "engineer" && message.kind !== "note" ? "ml-4" : "",
              message.author === "customer" ? "mr-4" : "",
              message.author === "system" ? "mx-2 text-center text-xs" : "",
            )}
          >
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs font-medium text-text">
                {message.kind === "note" ? `${message.authorName} (internal)` : message.authorName}
              </p>
              <time
                className="font-mono text-[10px] text-text-faint"
                title={formatAbsolute(new Date(message.createdAt), "UTC")}
              >
                {formatAbsolute(new Date(message.createdAt), "IST")}
              </time>
            </div>
            <p className="whitespace-pre-wrap text-sm text-text">{message.body}</p>
          </article>
        ))}
        {typing ? (
          <div
            className="mr-4 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-2 text-sm text-text-muted"
            data-testid="typing-indicator"
          >
            <span className="inline-flex items-center gap-2">
              <span className="flex gap-1" aria-hidden>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-faint" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-faint [animation-delay:120ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-faint [animation-delay:240ms]" />
              </span>
              {workspaceCopy.typing}
            </span>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
      {readOnly ? (
        <p className="border-t border-border px-3 py-2 text-xs text-text-faint">
          {workspaceCopy.readOnlyBanner}
        </p>
      ) : null}
    </div>
  );
}
