"use client";

import { BookOpen, StickyNote } from "lucide-react";
import { TENANT_NAME, TOP_BAR_COPY } from "@/content/shell";
import { useAppStore } from "@/lib/store";
import { FlagToggle } from "./FlagToggle";
import { SearchTrigger } from "./SearchTrigger";
import { ThemeToggle } from "./ThemeToggle";
import { TimezoneToggle } from "./TimezoneToggle";
import { UserMenu } from "./UserMenu";

export function TopBar() {
  const guideOn = useAppStore((s) => s.guideOn);
  const setGuideOn = useAppStore((s) => s.setGuideOn);
  const annotationsOn = useAppStore((s) => s.annotationsOn);
  const setAnnotationsOn = useAppStore((s) => s.setAnnotationsOn);

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-panel px-4">
      <div className="text-[14px] font-semibold text-text">{TENANT_NAME}</div>
      <div className="flex-1" />
      <SearchTrigger />
      <TimezoneToggle />
      <FlagToggle label={TOP_BAR_COPY.guide} icon={BookOpen} on={guideOn} onChange={setGuideOn} />
      <FlagToggle
        label={TOP_BAR_COPY.annotations}
        icon={StickyNote}
        on={annotationsOn}
        onChange={setAnnotationsOn}
      />
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
