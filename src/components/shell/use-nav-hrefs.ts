import { NAV_ITEMS, SCENARIO_CARDS } from "@/content/shell";
import { useAppStore } from "@/lib/store";

/** Investigate links to the active scenario's alert, otherwise to the alerts queue. */
export function useNavHrefs() {
  const activeScenario = useAppStore((s) => s.activeScenario);
  const alertId = SCENARIO_CARDS.find((c) => c.id === activeScenario)?.alertId;
  return NAV_ITEMS.map((item) => ({
    ...item,
    href:
      item.id === "investigate"
        ? alertId
          ? `/investigate/${alertId}`
          : "/alerts"
        : item.href,
    matchPrefix: item.id === "investigate" ? "/investigate" : item.href,
  }));
}
