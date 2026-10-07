"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { APP_NAME, SCENARIO_CARDS, START_COPY, type ScenarioCard } from "@/content/shell";
import { useAppStore } from "@/lib/store";
import { ResponsiveNotice } from "./ResponsiveNotice";

export function StartScreen() {
  const router = useRouter();
  const setActiveScenario = useAppStore((s) => s.setActiveScenario);
  const setGuideOn = useAppStore((s) => s.setGuideOn);

  function pick(card: ScenarioCard) {
    setActiveScenario(card.id);
    setGuideOn(true);
    router.push(`/investigate/${card.alertId}`);
  }

  function explore() {
    setActiveScenario(null);
    setGuideOn(false);
    router.push("/alerts");
  }

  return (
    <div className="min-h-screen bg-surface text-text">
      <ResponsiveNotice />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-[13px] text-muted-fg">{APP_NAME}</p>
        <h1 className="mt-1 text-[24px] font-semibold">{START_COPY.heading}</h1>
        <p className="mt-2 text-[14px] text-muted-fg">{START_COPY.intro}</p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {SCENARIO_CARDS.map((card) => (
            <li key={card.id}>
              <button
                type="button"
                onClick={() => pick(card)}
                className="flex h-full w-full flex-col rounded-lg border border-border bg-panel p-4 text-left hover:border-accent"
              >
                <span className="text-[12px] text-muted-fg">Case {card.id}</span>
                <span className="mt-1 text-[16px] font-semibold">{card.title}</span>
                <span className="mt-2 text-[13px] text-muted-fg">{card.situation}</span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={explore}
          className="mt-6 flex items-center gap-2 rounded-md border border-border bg-panel px-3 py-2 text-[13px] font-medium hover:border-accent"
        >
          {START_COPY.explore}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
        <p className="mt-2 text-[12px] text-muted-fg">{START_COPY.exploreHint}</p>
      </main>
    </div>
  );
}
