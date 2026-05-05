import type {
  AgentAction,
  AgentActionType,
  AgentContentFormat,
  AgentExecutionResult,
  AgentExportFormat,
  AgentPriority
} from "./types";
import {
  detectRequestedFormat,
  getDefaultFormatForIntent,
  isSupportedFormat,
  normalizeExtension
} from "./fileFormatResolver";

export const ACTION_TYPES: AgentActionType[] = [
  "generate_content",
  "create_file",
  "create_note",
  "create_document",
  "save_file",
  "download_file",
  "convert_file",
  "rename_file",
  "update_file_content",
  "update_file_title",
  "export_file",
  "regenerate_file",
  "summarize_file",
  "improve_file",
  "create_task",
  "create_checklist",
  "create_report",
  "create_email_draft",
  "store_memory",
  "retrieve_memory",
  "summarize_content",
  "export_content"
];

export function createAgentId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export function cleanTitle(input: string, fallback: string) {
  return input
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || fallback;
}

export function titleCase(input: string) {
  const cleaned = cleanTitle(input, "Untitled");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function inferPriority(input: string): AgentPriority {
  const lower = input.toLowerCase();
  if (/(urgent|important|critical|high|acil|önemli|onemli)/i.test(lower)) return "high";
  if (/(low|later|someday|düşük|dusuk|sonra)/i.test(lower)) return "low";
  return "medium";
}

export function inferExportFormat(input: string): AgentExportFormat {
  return detectRequestedFormat(input);
}

export function contentFormatFromExport(format: AgentExportFormat): AgentContentFormat {
  if (format === "json") return "json";
  if (format === "txt" || format === "pdf" || format === "docx" || format === "pptx") {
    return "text";
  }
  if (format === "csv" || format === "xlsx") return "csv";
  if (format === "html") return "html";
  return "markdown";
}

export function extensionForFormat(format: AgentExportFormat) {
  return format;
}

export function safeFilename(input: string, fallback = "novamind-output.md") {
  const trimmed = input.trim() || fallback;
  const [namePart, ...extensionParts] = trimmed.split(".");
  const extension = extensionParts.pop();
  const safeName = (namePart || "novamind-output")
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç\-_ ]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const safeExtension = extension?.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return `${safeName || "novamind-output"}${safeExtension ? `.${safeExtension}` : ""}`;
}

export function ensureFileExtension(filename: string, format: AgentExportFormat) {
  const extension = extensionForFormat(format);
  const safe = safeFilename(filename || `novamind-output.${extension}`);
  return safe.toLowerCase().endsWith(`.${extension}`) ? safe : `${safe}.${extension}`;
}

export { detectRequestedFormat, getDefaultFormatForIntent, isSupportedFormat, normalizeExtension };

export function createExecutionResult(
  action: AgentAction,
  status: AgentExecutionResult["status"],
  message: string,
  extra: Partial<AgentExecutionResult> = {}
): AgentExecutionResult {
  return {
    id: createAgentId(),
    actionId: action.id,
    type: action.type,
    title: action.title,
    status,
    message,
    createdAt: nowIso(),
    ...extra
  };
}

export function normalizeActionType(type: string): AgentActionType | null {
  const normalized = type.trim().toLowerCase().replace(/-/g, "_");

  if (ACTION_TYPES.includes(normalized as AgentActionType)) {
    return normalized as AgentActionType;
  }

  const legacyMap: Record<string, AgentActionType> = {
    task: "create_task",
    todo: "create_task",
    note: "create_note",
    document: "create_document",
    doc: "create_document",
    report: "create_report",
    convert: "convert_file",
    conversion: "convert_file",
    rename: "rename_file",
    update: "update_file_content",
    improve: "improve_file",
    regenerate: "regenerate_file",
    export: "export_file",
    summary: "summarize_file",
    email_mock: "create_email_draft",
    email: "create_email_draft",
    memory: "store_memory",
    retrieve: "retrieve_memory"
  };

  return legacyMap[normalized] ?? null;
}
