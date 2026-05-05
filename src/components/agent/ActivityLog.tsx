import { Clock3 } from "lucide-react";
import type { AgentActivityLogItem } from "../../lib/memory/memoryTypes";
import { formatRelativeTime } from "../../lib/utils";

export function ActivityLog({ items }: { items: AgentActivityLogItem[] }) {
  return (
    <div className="rounded-[22px] border border-border/80 bg-card/60 p-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Clock3 className="h-3.5 w-3.5 text-primary" />
        Activity
      </div>
      <div className="space-y-2">
        {items.slice(0, 5).map((item) => (
          <div key={item.id} className="rounded-2xl border border-border/60 bg-background/45 px-3 py-2">
            <div className="truncate text-xs font-medium text-foreground">{item.label}</div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
              <span className="truncate">{item.detail ?? item.type}</span>
              <span className="shrink-0">{formatRelativeTime(item.createdAt)}</span>
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 px-3 py-4 text-xs text-muted-foreground">
            Agent activity will appear here.
          </div>
        ) : null}
      </div>
    </div>
  );
}
