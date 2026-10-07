import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui";

type DetailDrawerProps = {
  title: string;
  onClose: () => void;
  closeLabel: string;
  testId: string;
  children: ReactNode;
};

export function DetailDrawer({
  title,
  onClose,
  closeLabel,
  testId,
  children,
}: DetailDrawerProps) {
  return (
    <aside
      className="absolute inset-y-0 right-0 z-20 flex w-full max-w-md flex-col border-l border-border bg-surface-1 shadow-lg"
      data-testid={testId}
      role="dialog"
      aria-label={title}
    >
      <div className="flex items-start justify-between gap-2 border-b border-border px-4 py-3">
        <h3 className="text-sm font-medium text-text">{title}</h3>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label={closeLabel}
          onClick={onClose}
          data-testid={`${testId}-close`}
        >
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </aside>
  );
}
