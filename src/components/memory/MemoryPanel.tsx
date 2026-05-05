import { BrainCircuit, FileClock } from "lucide-react";
import type { MemoryStats } from "../../lib/memory/memoryTypes";
import { formatRelativeTime } from "../../lib/utils";

export function MemoryPanel({ stats }: { stats: MemoryStats }) {
  return (
    <div className="rounded-[22px] border border-border/80 bg-card/60 p-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <BrainCircuit className="h-3.5 w-3.5 text-primary" />
        Memory
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <MemoryMetric label="Stored" value={stats.totalItems} />
        <MemoryMetric label="Retrieved" value={stats.retrievedForCurrentRequest} />
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-2xl border border-border/70 bg-background/50 px-3 py-2 text-[11px] text-muted-foreground">
        <FileClock className="h-3.5 w-3.5 text-primary" />
        <span className="truncate">
          {stats.generatedFiles} files
          {stats.lastUpdatedAt ? ` - updated ${formatRelativeTime(stats.lastUpdatedAt)}` : ""}
        </span>
      </div>
    </div>
  );
}

function MemoryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/50 p-2">
      <div className="text-sm font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
