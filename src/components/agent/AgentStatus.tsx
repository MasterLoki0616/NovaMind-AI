import { Activity, CheckCircle2, Sparkles, XCircle } from "lucide-react";

export interface AgentStatusSummary {
  actionsDetected: number;
  actionsExecuted: number;
  successCount: number;
  failureCount: number;
  lastActionType?: string;
}

export function AgentStatus({ summary }: { summary: AgentStatusSummary }) {
  return (
    <div className="rounded-[22px] border border-border/80 bg-card/60 p-3">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Agent
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <StatusPill icon={Activity} label="Detected" value={summary.actionsDetected} />
        <StatusPill icon={CheckCircle2} label="Executed" value={summary.actionsExecuted} />
        <StatusPill icon={CheckCircle2} label="Success" value={summary.successCount} tone="success" />
        <StatusPill icon={XCircle} label="Failed" value={summary.failureCount} tone="danger" />
      </div>
      <div className="mt-3 truncate rounded-2xl border border-border/70 bg-background/50 px-3 py-2 text-[11px] text-muted-foreground">
        Last: <span className="text-foreground">{summary.lastActionType ?? "No actions yet"}</span>
      </div>
    </div>
  );
}

function StatusPill({
  icon: Icon,
  label,
  value,
  tone = "default"
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  tone?: "default" | "success" | "danger";
}) {
  const color =
    tone === "success" ? "text-emerald-300" : tone === "danger" ? "text-red-300" : "text-primary";

  return (
    <div className="rounded-2xl border border-border/70 bg-background/50 p-2">
      <div className={`flex items-center gap-1.5 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        <span className="font-semibold">{value}</span>
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
