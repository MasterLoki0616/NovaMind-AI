import { createAgentId, createExecutionResult, ensureFileExtension, nowIso } from "./actions";
import { convertGeneratedFile } from "./fileConverter";
import {
  createFileBlob,
  executeFileAction,
  persistGeneratedFile,
  type DesktopSaveFilePayload,
  type DesktopSaveFileResult
} from "./fileActions";
import {
  addGeneratedFile as addConversationFile,
  getConversationFiles
} from "./fileRegistry";
import { resolveFileReference } from "./fileReferenceResolver";
import { generateSmartFilename, generateSmartTitle } from "./filenameGenerator";
import { memory_store } from "./memory";
import { normalizeText } from "./textNormalizer";
import {
  executeEmailDraftAction,
  executeMemoryAction,
  executeNoteAction,
  executeReportAction
} from "./noteActions";
import { executeChecklistAction, executeTaskAction } from "./taskActions";
import type {
  AgentAction,
  AgentExecutionResult,
  AgentGeneratedFileRecord,
  AgentStoredDocument,
  AgentSummarizeContentAction
} from "./types";

export interface AgentExecutionState {
  lastContent: string;
  contentByActionId: Map<string, string>;
}

export interface AgentExecutorContext {
  store: ReturnType<typeof memory_store>;
  signal?: AbortSignal;
  generateText?: (prompt: string, options?: { signal?: AbortSignal }) => Promise<string>;
  saveFileToDesktop?: (payload: DesktopSaveFilePayload) => Promise<DesktopSaveFileResult>;
  conversationId?: string;
  sourceMessageId?: string;
  userInput?: string;
  conversationFiles?: AgentGeneratedFileRecord[];
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw Object.assign(new Error("Agent execution was stopped."), { name: "AbortError" });
  }
}

function summarizePrompt(action: AgentSummarizeContentAction, state: AgentExecutionState) {
  const source =
    action.sourceText?.trim() ||
    (action.contentFromActionId ? state.contentByActionId.get(action.contentFromActionId) : "") ||
    state.lastContent;
  return [
    "Summarize this content clearly. Keep useful details and action items.",
    `Return ${action.format === "markdown" ? "markdown" : action.format}.`,
    "",
    source || action.title
  ].join("\n");
}

function mergeFiles(...groups: Array<AgentGeneratedFileRecord[] | undefined>) {
  const byId = new Map<string, AgentGeneratedFileRecord>();
  groups.flatMap((group) => group ?? []).forEach((file) => byId.set(file.id, file));
  return [...byId.values()].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

function getContextFiles(context: AgentExecutorContext) {
  return mergeFiles(context.conversationFiles, getConversationFiles(context.conversationId));
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  signal: AbortSignal | undefined,
  timeoutMessage: string
) {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    const abortHandler = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      reject(Object.assign(new Error("Agent execution was stopped."), { name: "AbortError" }));
    };

    signal?.addEventListener("abort", abortHandler, { once: true });

    promise
      .then((value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        signal?.removeEventListener("abort", abortHandler);
        resolve(value);
      })
      .catch((error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        signal?.removeEventListener("abort", abortHandler);
        reject(error);
      });
  });
}

export async function action_router(
  action: AgentAction,
  context: AgentExecutorContext,
  state: AgentExecutionState
): Promise<AgentExecutionResult> {
  assertNotAborted(context.signal);

  switch (action.type) {
    case "generate_content": {
      const content =
        normalizeText(action.content?.trim() || "") ||
        (await context.generateText?.(action.prompt, { signal: context.signal })) ||
        `# ${action.title}\n\n${action.topic}`;
      const normalized = normalizeText(content);
      state.lastContent = normalized;
      state.contentByActionId.set(action.id, normalized);
      return createExecutionResult(action, "completed", "Content generated.", { output: normalized });
    }

    case "create_file": {
      const content =
        normalizeText(action.content?.trim() || "") ||
        (await context.generateText?.(action.prompt, { signal: context.signal })) ||
        `${action.title}\n\n${action.topic}`;
      const filename = generateSmartFilename({
        userInput: context.userInput || action.topic,
        generatedContent: content,
        intent: "create file",
        format: action.format
      });
      const generated = await createFileBlob(action.format, content, filename);
      const generatedFile = await persistGeneratedFile(generated, action, context, content, {
        location: action.location
      });
      state.lastContent = generatedFile.content;
      state.contentByActionId.set(action.id, generatedFile.content);
      return createExecutionResult(action, "completed", `File prepared as ${generatedFile.filename}.`, {
        filename: generatedFile.filename,
        path: generatedFile.path,
        output: generatedFile.content,
        downloadTriggered: generatedFile.downloadTriggered,
        format: generatedFile.format,
        size: generatedFile.size,
        generatedFile
      });
    }

    case "create_document": {
      const content = normalizeText(
        action.content?.trim() ||
        (action.contentFromActionId ? state.contentByActionId.get(action.contentFromActionId) : "") ||
        (await context.generateText?.(
          `Create polished ${action.format.toUpperCase()} ready content about: ${action.topic}. Keep it practical, structured, and useful.`,
          { signal: context.signal }
        )) ||
        `${action.title}\n\n${action.topic}`
      );
      const record: AgentStoredDocument = {
        id: createAgentId(),
        title: action.title,
        content,
        format: action.format,
        createdAt: nowIso()
      };
      context.store.addDocument(record);
      state.lastContent = content;
      state.contentByActionId.set(action.id, content);
      return createExecutionResult(action, "completed", "Document content created.", {
        recordId: record.id,
        output: content,
        format: action.format
      });
    }

    case "summarize_content": {
      const content = normalizeText(
        (await context.generateText?.(summarizePrompt(action, state), { signal: context.signal })) ||
        action.sourceText ||
        state.lastContent ||
        action.title
      );
      state.lastContent = content;
      state.contentByActionId.set(action.id, content);
      return createExecutionResult(action, "completed", "Summary created.", { output: content });
    }

    case "create_task":
      return executeTaskAction(action, context);

    case "create_checklist":
      return executeChecklistAction(action, context, state);

    case "create_note":
      return executeNoteAction(action, context, state);

    case "create_report":
      return executeReportAction(action, context, state);

    case "create_email_draft":
      return executeEmailDraftAction(action, context, state);

    case "store_memory":
      return executeMemoryAction(action, context);

    case "retrieve_memory": {
      const items = context.store.retrieveRelevantContext(action.query, 8);
      context.store.advanced.setLastRetrievedCount(items.length);
      const output = items.map((item) => `${item.title}: ${item.content}`).join("\n");
      return createExecutionResult(action, "completed", `Retrieved ${items.length} memory item${items.length === 1 ? "" : "s"}.`, {
        output
      });
    }

    case "save_file":
    case "download_file":
    case "export_content":
      return executeFileAction(action, context, state);

    case "convert_file": {
      const conversationFiles = getContextFiles(context);
      const source =
        (action.sourceActionId
          ? findGeneratedFileByActionId(conversationFiles, action.sourceActionId) ??
            findGeneratedFileByActionId(context.store.advanced.loadGeneratedFiles(), action.sourceActionId)
          : null) ??
        (action.sourceFormat ? conversationFiles.find((file) => file.format === action.sourceFormat) : null) ??
        resolveFileReference(context.userInput || action.title, conversationFiles) ??
        context.store.advanced.getLastGeneratedFile();

      if (!source) {
        return createExecutionResult(action, "failed", "Değiştirilecek dosya bulunamadı.");
      }

      const converted = await withTimeout(
        convertGeneratedFile(source, action.targetFormat, {
          saveFileToDesktop: context.saveFileToDesktop,
          location: action.location
        }),
        30000,
        context.signal,
        `Conversion to .${action.targetFormat} took too long and was stopped safely.`
      );
      const generatedFile: AgentGeneratedFileRecord = {
        ...converted,
        actionId: action.id
      };
      context.store.advanced.addGeneratedFile(generatedFile);
      addConversationFile(generatedFile, context.conversationId);
      context.store.advanced.addActivity({
        type: "convert_file",
        label: `Converted ${source.format.toUpperCase()} to ${action.targetFormat.toUpperCase()}`,
        detail: generatedFile.filename,
        status: "completed",
        actionId: action.id
      });
      state.lastContent = generatedFile.content;
      state.contentByActionId.set(action.id, generatedFile.content);
      return createExecutionResult(action, "completed", `Converted ${source.filename} to ${generatedFile.filename}.`, {
        filename: generatedFile.filename,
        path: generatedFile.path,
        output: generatedFile.content,
        downloadTriggered: generatedFile.downloadTriggered,
        format: generatedFile.format,
        size: generatedFile.size,
        generatedFile
      });
    }

    case "rename_file":
    case "update_file_title": {
      const source = resolveFileReferenceForAction(action, context);
      if (!source) {
        return createExecutionResult(action, "failed", "Değiştirilecek dosya bulunamadı.");
      }
      const requestedTitle = extractRequestedTitle(context.userInput || action.instruction || action.newTitle || "");
      const newTitle =
        action.newTitle ||
        requestedTitle ||
        generateSmartTitle({
          userInput: source.title,
          generatedContent: source.content,
          intent: "rename file",
          format: source.format
        });
      const filename = ensureFileExtension(
        action.newFilename ||
          generateSmartFilename({
            userInput: newTitle,
            generatedContent: source.content,
            intent: "rename file",
            format: source.format
          }),
        source.format
      );
      const generated = await createFileBlob(source.format, source.content, filename);
      const updated = await persistGeneratedFile(generated, action, context, source.content, {
        location: action.location ?? "browser",
        status: "renamed",
        existingFile: source,
        title: newTitle
      });
      state.lastContent = updated.content;
      state.contentByActionId.set(action.id, updated.content);
      return createExecutionResult(action, "completed", `Başlık değiştirildi: ${updated.title}.`, {
        filename: updated.filename,
        path: updated.path,
        output: updated.content,
        downloadTriggered: updated.downloadTriggered,
        format: updated.format,
        size: updated.size,
        generatedFile: updated
      });
    }

    case "update_file_content":
    case "improve_file":
    case "regenerate_file": {
      const source = resolveFileReferenceForAction(action, context);
      if (!source) {
        return createExecutionResult(action, "failed", "Değiştirilecek dosya bulunamadı.");
      }
      const rewritten =
        normalizeText(action.content || "") ||
        (await context.generateText?.(
          [
            "Rewrite the existing file content according to the user's instruction.",
            "Preserve the same topic, useful structure, Turkish characters, headings, bullet points, and paragraphs.",
            `Instruction: ${action.instruction || context.userInput || "Improve the file."}`,
            "",
            "Existing content:",
            source.content
          ].join("\n"),
          { signal: context.signal }
        )) ||
        source.content;
      const normalized = normalizeText(rewritten);
      const generated = await createFileBlob(source.format, normalized, source.filename);
      const updated = await persistGeneratedFile(generated, action, context, normalized, {
        location: action.location ?? "browser",
        status: "updated",
        existingFile: source,
        title: source.title
      });
      state.lastContent = updated.content;
      state.contentByActionId.set(action.id, updated.content);
      return createExecutionResult(action, "completed", `Dosya güncellendi: ${updated.title}.`, {
        filename: updated.filename,
        path: updated.path,
        output: updated.content,
        downloadTriggered: updated.downloadTriggered,
        format: updated.format,
        size: updated.size,
        generatedFile: updated
      });
    }

    case "export_file": {
      const source = resolveFileReferenceForAction(action, context);
      if (!source) {
        return createExecutionResult(action, "failed", "Değiştirilecek dosya bulunamadı.");
      }
      const converted = await withTimeout(
        convertGeneratedFile(source, action.targetFormat, {
          saveFileToDesktop: context.saveFileToDesktop,
          location: action.location
        }),
        30000,
        context.signal,
        `Export to .${action.targetFormat} took too long and was stopped safely.`
      );
      const generatedFile: AgentGeneratedFileRecord = {
        ...converted,
        actionId: action.id
      };
      context.store.advanced.addGeneratedFile(generatedFile);
      addConversationFile(generatedFile, context.conversationId);
      return createExecutionResult(action, "completed", `Exported ${source.filename} as ${generatedFile.filename}.`, {
        filename: generatedFile.filename,
        path: generatedFile.path,
        output: generatedFile.content,
        downloadTriggered: generatedFile.downloadTriggered,
        format: generatedFile.format,
        size: generatedFile.size,
        generatedFile
      });
    }

    case "summarize_file": {
      const source = resolveFileReferenceForAction(action, context);
      if (!source) {
        return createExecutionResult(action, "failed", "Değiştirilecek dosya bulunamadı.");
      }
      const summary =
        (await context.generateText?.(
          `Summarize this file clearly and preserve important details.\n\n${source.content}`,
          { signal: context.signal }
        )) || source.content;
      state.lastContent = normalizeText(summary);
      state.contentByActionId.set(action.id, state.lastContent);
      return createExecutionResult(action, "completed", `Summarized ${source.filename}.`, {
        output: state.lastContent
      });
    }

    default:
      return createExecutionResult(action, "failed", "Unsupported action.");
  }
}

function findGeneratedFileByActionId(files: AgentGeneratedFileRecord[], actionId: string) {
  return files.find((file) => file.actionId === actionId) ?? null;
}

function resolveFileReferenceForAction(
  action: AgentAction & { sourceFormat?: AgentGeneratedFileRecord["format"]; fileId?: string },
  context: AgentExecutorContext
) {
  const files = getContextFiles(context);
  if (action.fileId) {
    return files.find((file) => file.id === action.fileId) ?? null;
  }
  if (action.sourceFormat) {
    return files.find((file) => file.format === action.sourceFormat) ?? null;
  }
  return resolveFileReference(context.userInput || action.title, files);
}

function extractRequestedTitle(input: string) {
  const match =
    /(?:başlığını|basligini|title(?:\s+to)?|adını|adini|rename(?:\s+to)?)\s+(.+?)(?:\s+yap|\s+olarak|$)/i.exec(
      input
    );
  const title = match?.[1]?.replace(/^["']|["']$/g, "").trim() ?? "";
  if (!title || /\b(değiştir|degistir|change|update|rename)\b/i.test(title)) return "";
  return title;
}

export async function executor(
  actions: AgentAction[],
  context: Omit<AgentExecutorContext, "store"> & {
    store?: ReturnType<typeof memory_store>;
  } = {}
): Promise<AgentExecutionResult[]> {
  const resolvedContext: AgentExecutorContext = {
    ...context,
    store: context.store ?? memory_store()
  };
  const state: AgentExecutionState = {
    lastContent: "",
    contentByActionId: new Map()
  };
  const results: AgentExecutionResult[] = [];

  for (const action of actions) {
    try {
      assertNotAborted(resolvedContext.signal);
      const result = await action_router(action, resolvedContext, state);
      results.push(result);
      if (action.type !== "save_file" && action.type !== "download_file" && action.type !== "export_content" && action.type !== "convert_file" && action.type !== "store_memory") {
        resolvedContext.store.advanced.addActivity({
          type: action.type,
          label: result.message,
          detail: action.title,
          status: result.status,
          actionId: action.id
        });
      }
    } catch (error) {
      const stopped = error instanceof Error && error.name === "AbortError";
      const failedResult = createExecutionResult(
        action,
        stopped ? "stopped" : "failed",
        stopped ? "Action stopped." : error instanceof Error ? error.message : "Action failed."
      );
      results.push(failedResult);
      resolvedContext.store.advanced.addActivity({
        type: action.type,
        label: failedResult.message,
        detail: action.title,
        status: failedResult.status,
        actionId: action.id
      });
      if (stopped) {
        break;
      }
    }
  }

  return results;
}

export function storeGeneratedDocument(
  store: ReturnType<typeof memory_store>,
  title: string,
  content: string
) {
  const record: AgentStoredDocument = {
    id: createAgentId(),
    title,
    content,
    format: "markdown",
    createdAt: nowIso()
  };
  store.addDocument(record);
  return record;
}
