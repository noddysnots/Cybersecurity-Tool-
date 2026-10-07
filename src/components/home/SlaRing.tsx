import { priorityTone, type SlaInfo } from "@/lib/home-metrics";
import type { TicketPriority } from "@/types";
import { cn } from "@/lib/utils";

type SlaRingProps = {
  sla: SlaInfo;
  priority: TicketPriority;
  size?: number;
};

export function SlaRing({ sla, priority, size = 56 }: SlaRingProps) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = sla.breached ? 0 : sla.fractionLeft;
  const offset = circumference * (1 - progress);
  const tone = sla.breached ? "var(--danger)" : priorityTone(priority);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`SLA ${sla.breached ? "breached" : `${sla.label} left`}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className={cn(
          "absolute font-mono text-[10px] leading-none",
          sla.breached ? "text-danger" : "text-text",
        )}
      >
        {sla.label}
      </span>
    </div>
  );
}
