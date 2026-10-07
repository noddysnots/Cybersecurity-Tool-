import { workspaceCopy } from "@/content/workspace";
import type { HistoryRca as HistoryRcaData } from "@/content/history";

type HistoryRcaProps = {
  rca: HistoryRcaData;
};

export function HistoryRca({ rca }: HistoryRcaProps) {
  return (
    <div className="space-y-4 p-4" data-testid="history-rca">
      <h2 className="text-base font-medium text-text">{workspaceCopy.historyRcaTitle}</h2>

      <section>
        <h3 className="text-xs text-text-faint">{workspaceCopy.historySummary}</h3>
        <p className="mt-1 text-sm text-text">{rca.summary}</p>
      </section>

      <section>
        <h3 className="text-xs text-text-faint">{workspaceCopy.historyTimeline}</h3>
        <ol className="mt-1 list-decimal space-y-1 pl-4 text-sm text-text">
          {rca.timeline.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="text-xs text-text-faint">{workspaceCopy.historyRootCause}</h3>
        <p className="mt-1 text-sm text-text">{rca.rootCause}</p>
      </section>

      <section>
        <h3 className="text-xs text-text-faint">{workspaceCopy.historyFix}</h3>
        <p className="mt-1 text-sm text-text">{rca.fix}</p>
      </section>

      <section>
        <h3 className="text-xs text-text-faint">{workspaceCopy.historyPrevention}</h3>
        <p className="mt-1 text-sm text-text">{rca.prevention}</p>
      </section>
    </div>
  );
}
