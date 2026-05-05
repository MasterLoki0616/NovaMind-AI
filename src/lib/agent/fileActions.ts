import { createAgentId, createExecutionResult, ensureFileExtension, nowIso, safeFilename } from "./actions";
import { createDocxBlob } from "./exporters/docxExporter";
import { createHtmlBlob } from "./exporters/htmlExporter";
import { createPdfBlob } from "./exporters/pdfExporter";
import { createMarkdownBlob, createTxtBlob } from "./exporters/txtExporter";
import { addGeneratedFile as addConversationFile, updateExistingFile } from "./fileRegistry";
import { generateSmartTitle } from "./filenameGenerator";
import { normalizeText } from "./textNormalizer";
import type {
  AgentAction,
  AgentDownloadFileAction,
  AgentExecutionResult,
  AgentExportContentAction,
  AgentExportFormat,
  AgentGeneratedFileRecord,
  AgentSaveFileAction,
  AgentStoredDocument
} from "./types";
import type { AgentExecutionState, AgentExecutorContext } from "./executor";

export interface DesktopSaveFilePayload {
  filename: string;
  content: string;
  contentBase64?: string;
  mimeType?: string;
}

export interface DesktopSaveFileResult {
  filename: string;
  path: string;
  bytes: number;
}

export interface GeneratedFileBlob {
  blob: Blob;
  filename: string;
  format: AgentExportFormat;
  content: string;
  mimeType: string;
}

const MIME_TYPES: Record<AgentExportFormat, string> = {
  txt: "text/plain;charset=utf-8",
  md: "text/markdown;charset=utf-8",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  json: "application/json;charset=utf-8",
  csv: "text/csv;charset=utf-8",
  html: "text/html;charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
};

function normalizeJsonContent(data: unknown, filename: string) {
  if (typeof data === "string") {
    const normalized = normalizeText(data);
    try {
      return JSON.stringify(JSON.parse(normalized), null, 2);
    } catch {
      return JSON.stringify({ title: filename.replace(/\.json$/i, ""), content: normalized }, null, 2);
    }
  }

  return JSON.stringify(data, null, 2);
}

function normalizeCsvContent(rowsOrText: unknown) {
  if (Array.isArray(rowsOrText)) {
    return rowsOrText
      .map((row) => {
        const cells = Array.isArray(row) ? row : Object.values(row as Record<string, unknown>);
        return cells
          .map((cell) => {
            const value = normalizeText(String(cell ?? ""));
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(",");
      })
      .join("\n");
  }

  return normalizeText(String(rowsOrText ?? ""));
}

function createBlobResult(
  content: string,
  filename: string,
  format: AgentExportFormat,
  blob: Blob
): GeneratedFileBlob {
  return {
    blob,
    filename: ensureFileExtension(filename, format),
    format,
    content,
    mimeType: MIME_TYPES[format]
  };
}

export function createTxtFile(content: string, filename: string): GeneratedFileBlob {
  const result = createTxtBlob(content);
  return createBlobResult(result.content, filename, "txt", result.blob);
}

export function createMarkdownFile(content: string, filename: string): GeneratedFileBlob {
  const result = createMarkdownBlob(content);
  return createBlobResult(result.content, filename, "md", result.blob);
}

export function createJsonFile(data: unknown, filename: string): GeneratedFileBlob {
  const content = normalizeJsonContent(data, filename);
  return createBlobResult(
    content,
    filename,
    "json",
    new Blob([new TextEncoder().encode(content)], { type: MIME_TYPES.json })
  );
}

export function createCsvFile(rowsOrText: unknown, filename: string): GeneratedFileBlob {
  const content = normalizeCsvContent(rowsOrText);
  return createBlobResult(
    content,
    filename,
    "csv",
    new Blob([new TextEncoder().encode(content)], { type: MIME_TYPES.csv })
  );
}

export function createHtmlFile(content: string, filename: string): GeneratedFileBlob {
  const result = createHtmlBlob(content, filename.replace(/\.html$/i, ""));
  return createBlobResult(result.content, filename, "html", result.blob);
}

export function createDocxFile(content: string, filename: string): GeneratedFileBlob {
  const result = createDocxBlob(content, filename);
  return createBlobResult(result.content, filename, "docx", result.blob);
}

export async function createPdfFile(content: string, filename: string): Promise<GeneratedFileBlob> {
  const result = await createPdfBlob(content, filename.replace(/\.pdf$/i, ""));
  return createBlobResult(result.content, filename, "pdf", result.blob);
}

export function createXlsxFile(data: unknown, filename: string): GeneratedFileBlob {
  const content = normalizeCsvContent(data);
  const htmlTable = `<html><head><meta charset="utf-8" /></head><body><table>${content
    .split("\n")
    .map((line) => `<tr>${line.split(",").map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</table></body></html>`;
  return createBlobResult(
    content,
    filename,
    "xlsx",
    new Blob([new TextEncoder().encode(htmlTable)], { type: MIME_TYPES.xlsx })
  );
}

export function createPptxFile(content: string, filename: string): GeneratedFileBlob {
  const html = createHtmlBlob(content, filename.replace(/\.pptx$/i, ""));
  return createBlobResult(html.content, filename, "pptx", html.blob);
}

export async function createFileBlob(
  format: AgentExportFormat,
  content: string,
  filename: string
): Promise<GeneratedFileBlob> {
  switch (format) {
    case "txt":
      return createTxtFile(content, filename);
    case "md":
      return createMarkdownFile(content, filename);
    case "json":
      return createJsonFile(content, filename);
    case "csv":
      return createCsvFile(content, filename);
    case "html":
      return createHtmlFile(content, filename);
    case "docx":
      return createDocxFile(content, filename);
    case "pdf":
      return createPdfFile(content, filename);
    case "xlsx":
      return createXlsxFile(content, filename);
    case "pptx":
      return createPptxFile(content, filename);
    default:
      return createTxtFile(content, filename);
  }
}

export function downloadFile(blob: Blob, filename: string) {
  if (typeof document === "undefined") return false;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return true;
}

async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }

  return btoa(binary);
}

export async function saveFileDesktop(
  blob: Blob,
  filename: string,
  content: string,
  context?: Pick<AgentExecutorContext, "saveFileToDesktop">
) {
  if (!context?.saveFileToDesktop) return null;

  return context.saveFileToDesktop({
    filename,
    content,
    contentBase64: await blobToBase64(blob),
    mimeType: blob.type
  });
}

export function getActionContent(
  action: AgentAction & { content?: string; contentFromActionId?: string },
  state: AgentExecutionState
) {
  if (action.content?.trim()) return normalizeText(action.content);
  if (action.contentFromActionId) {
    const referenced = state.contentByActionId.get(action.contentFromActionId);
    if (referenced?.trim()) return normalizeText(referenced);
  }
  return normalizeText(state.lastContent);
}

function fileRecordFromBlob(
  generated: GeneratedFileBlob,
  action: AgentAction,
  context: AgentExecutorContext,
  options: {
    path?: string;
    downloadTriggered?: boolean;
    size: number;
    status?: AgentGeneratedFileRecord["status"];
    existingFile?: AgentGeneratedFileRecord;
    title?: string;
  }
): AgentGeneratedFileRecord {
  const timestamp = nowIso();
  const title =
    options.title ||
    options.existingFile?.title ||
    generateSmartTitle({
      userInput: context.userInput || action.title,
      generatedContent: generated.content,
      intent: action.type,
      format: generated.format
    });

  return {
    id: options.existingFile?.id ?? createAgentId(),
    filename: generated.filename,
    title,
    format: generated.format,
    content: generated.content,
    mimeType: generated.mimeType,
    size: options.size,
    createdAt: options.existingFile?.createdAt ?? timestamp,
    updatedAt: timestamp,
    sourceMessageId: options.existingFile?.sourceMessageId ?? context.sourceMessageId,
    version: options.existingFile ? options.existingFile.version + 1 : 1,
    status: options.status ?? "active",
    actionId: action.id,
    path: options.path,
    downloadTriggered: options.downloadTriggered
  };
}

export async function persistGeneratedFile(
  generated: GeneratedFileBlob,
  action: AgentAction,
  context: AgentExecutorContext,
  rawContent: string,
  options?: {
    status?: AgentGeneratedFileRecord["status"];
    location?: "desktop" | "downloads" | "browser";
    existingFile?: AgentGeneratedFileRecord;
    title?: string;
  }
) {
  const shouldTryDesktop = options?.location === "desktop" && context.saveFileToDesktop;
  const size = generated.blob.size;

  if (shouldTryDesktop) {
    const saved = await saveFileDesktop(generated.blob, generated.filename, rawContent, context);
    if (saved) {
      const generatedFile = fileRecordFromBlob(generated, action, context, {
        path: saved.path,
        size: saved.bytes,
        status: options.status,
        existingFile: options.existingFile,
        title: options.title
      });
      context.store.advanced.addGeneratedFile(generatedFile);
      if (options.existingFile) {
        updateExistingFile(options.existingFile.id, generatedFile, context.conversationId);
      } else {
        addConversationFile(generatedFile, context.conversationId);
      }
      return generatedFile;
    }
  }

  const downloadTriggered = downloadFile(generated.blob, generated.filename);
  const generatedFile = fileRecordFromBlob(generated, action, context, {
    downloadTriggered,
    size,
    status: options?.status,
    existingFile: options?.existingFile,
    title: options?.title
  });
  context.store.advanced.addGeneratedFile(generatedFile);
  if (options?.existingFile) {
    updateExistingFile(options.existingFile.id, generatedFile, context.conversationId);
  } else {
    addConversationFile(generatedFile, context.conversationId);
  }
  return generatedFile;
}

export async function executeFileAction(
  action: AgentSaveFileAction | AgentDownloadFileAction | AgentExportContentAction,
  context: AgentExecutorContext,
  state: AgentExecutionState
): Promise<AgentExecutionResult> {
  const format = action.format;
  const filename = ensureFileExtension(safeFilename(action.filename), format);
  const rawContent = getActionContent(action, state) || `${action.title}\n\nGenerated by NovaMind AI.`;
  const generated = await createFileBlob(format, rawContent, filename);
  const generatedFile = await persistGeneratedFile(generated, action, context, rawContent, {
    location: "location" in action ? action.location : "downloads"
  });
  const record: AgentStoredDocument = {
    id: createAgentId(),
    title: action.title,
    content: rawContent,
    format,
    filename: generatedFile.filename,
    path: generatedFile.path,
    createdAt: nowIso()
  };

  context.store.addDocument(record);
  context.store.advanced.addActivity({
    type: action.type,
    label: `${generatedFile.path ? "Saved" : "Generated"} ${format.toUpperCase()} file`,
    detail: generatedFile.filename,
    status: "completed",
    actionId: action.id
  });
  state.lastContent = rawContent;
  state.contentByActionId.set(action.id, rawContent);

  return createExecutionResult(
    action,
    "completed",
    generatedFile.path
      ? `Saved to Desktop as ${generatedFile.filename}.`
      : `File prepared as ${generatedFile.filename}.`,
    {
      recordId: record.id,
      filename: generatedFile.filename,
      path: generatedFile.path,
      downloadTriggered: generatedFile.downloadTriggered,
      output: rawContent,
      format,
      size: generatedFile.size,
      generatedFile
    }
  );
}
