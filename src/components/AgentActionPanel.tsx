import {
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  FileText,
  Mail,
  StickyNote,
  ListChecks,
  Save,
  Sparkles,
  Wand2
} from "lucide-react";
import type { AgentAction, AgentRunResult } from "../types/app";
import { Badge } from "./ui/badge";

interface AgentActionPanelProps {
  run: AgentRunResult;
}

function actionIcon(action: AgentAction) {
  switch (action.type) {
    case "create_task":
      return ClipboardList;
    case "create_checklist":
      return ListChecks;
    case "create_note":
      return StickyNote;
    case "generate_content":
      return Sparkles;
    case "create_report":
    case "create_document":
    case "summarize_content":
    case "export_content":
      return FileText;
    case "convert_file":
      return Wand2;
    case "save_file":
      return Save;
    case "download_file":
      return Save;
    case "create_email_draft":
      return Mail;
    case "store_memory":
      return BrainCircuit;
    default:
      return CheckCircle2;
  }
}

function actionLabel(action: AgentAction) {
  switch (action.type) {
    case "create_email_draft":
      return "Email draft";
    case "store_memory":
      return "Memory";
    case "create_report":
      return "Report";
    case "create_document":
      return "Document";
    case "create_note":
      return "Note";
    case "create_task":
      return "Task";
    case "create_checklist":
      return "Checklist";
    case "generate_content":
      return "Generated";
    case "save_file":
      return "Saved file";
    case "download_file":
      return "Generated file";
    case "summarize_content":
      return "Summary";
    case "export_content":
      return "Export";
    case "convert_file":
      return "Conversion";
    case "retrieve_memory":
      return "Memory lookup";
    default:
      return "Action";
  }
}

function actionDetail(action: AgentAction) {
  if (action.type === "create_task") {
    return [action.time, action.priority].filter(Boolean).join(" - ") || "Ready";
  }

  if (action.type === "create_email_draft") {
    return action.subject;
  }

  if (action.type === "store_memory") {
    return action.value;
  }

  if (action.type === "create_checklist") {
    return action.items.join(" - ") || action.content || "Checklist ready";
  }

  if (action.type === "save_file" || action.type === "download_file" || action.type === "export_content") {
    return action.filename;
  }

  if (action.type === "generate_content" || action.type === "create_report" || action.type === "create_document") {
    return action.topic;
  }

  if (action.type === "convert_file") {
    return `To .${action.targetFormat}`;
  }

  if (action.type === "summarize_content") {
    return action.sourceText || action.contentFromActionId || "Summary ready";
  }

  return "Action ready";
}

export function AgentActionPanel({ run }: AgentActionPanelProps) {
  const payload = {
    message: run.message,
    actions: run.actions
  };

  return (
    <div className="mt-4 space-y-3 rounded-[22px] border border-primary/20 bg-primary/[0.06] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SparkleMark />
          Agent actions
        </div>
        <Badge className="border-primary/20 bg-primary/10 text-primary">
          {run.executedActions.filter((item) => item.status === "completed").length}/{run.actions.length} done
        </Badge>
      </div>

      <div className="grid gap-2">
        {run.actions.map((action) => {
          const Icon = actionIcon(action);
          const execution = run.executedActions.find((item) => item.actionId === action.id);

          return (
            <div
              key={action.id}
              className="rounded-[18px] border border-border/80 bg-background/70 p-3"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card/80 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{action.title}</span>
                    <span className="rounded-full border border-border bg-card/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {actionLabel(action)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {actionDetail(action)}
                  </p>
                  {execution ? (
                    <div className="mt-2 space-y-1 text-xs text-emerald-300">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {execution.message}
                      </div>
                      {execution.path || execution.filename ? (
                        <div className="truncate text-[11px] text-muted-foreground">
                          {execution.path ?? execution.filename}
                        </div>
                      ) : null}
                      {execution.generatedFile ? (
                        <GeneratedFileCard file={execution.generatedFile} />
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <details className="rounded-[18px] border border-border/80 bg-background/70 px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
          Structured JSON
        </summary>
        <pre className="mt-3 max-h-60 overflow-auto rounded-xl bg-black/25 p-3 text-xs leading-5 text-slate-200">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function GeneratedFileCard({ file }: {
  file: NonNullable<AgentRunResult["executedActions"][number]["generatedFile"]>;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-primary/20 bg-primary/[0.05] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-foreground">{file.title || file.filename}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {file.filename} - {file.format} - {formatBytes(file.size)}
          </div>
        </div>
        <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
          {file.status === "updated" ? "Updated" : file.status === "renamed" ? "Renamed" : file.status === "converted" ? "Converted" : "Created"}
        </Badge>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        Version {file.version} - {file.path ? "Saved locally" : "Prepared in this chat"}
      </div>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SparkleMark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
      <BrainCircuit className="h-4 w-4" />
    </span>
  );
}
