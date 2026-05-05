import type { AgentExportFormat, AgentGeneratedFileRecord } from "./types";
import { generateSmartFilename } from "./filenameGenerator";
import { resolveFileReference as resolveFileReferenceFromList } from "./fileReferenceResolver";

const REGISTRY_KEY = "novamind:agent:conversation-files";
const DEFAULT_SCOPE = "__global__";

type Registry = Record<string, AgentGeneratedFileRecord[]>;

function readRegistry(): Registry {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(REGISTRY_KEY);
    return raw ? (JSON.parse(raw) as Registry) : {};
  } catch {
    return {};
  }
}

function writeRegistry(registry: Registry) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
}

function scope(conversationId?: string) {
  return conversationId || DEFAULT_SCOPE;
}

function dedupeAndSort(files: AgentGeneratedFileRecord[]) {
  const byId = new Map<string, AgentGeneratedFileRecord>();
  files.forEach((file) => byId.set(file.id, file));
  return [...byId.values()].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

export function addGeneratedFile(file: AgentGeneratedFileRecord, conversationId?: string) {
  const registry = readRegistry();
  const key = scope(conversationId);
  registry[key] = dedupeAndSort([file, ...(registry[key] ?? [])]).slice(0, 80);
  writeRegistry(registry);
  return file;
}

export const addFile = addGeneratedFile;

export function getConversationFiles(conversationId?: string) {
  const registry = readRegistry();
  return registry[scope(conversationId)] ?? [];
}

export const getAllFiles = getConversationFiles;

export function getLastGeneratedFile(conversationId?: string) {
  return getConversationFiles(conversationId)[0] ?? null;
}

export const getLastFile = getLastGeneratedFile;

export function getFileById(id: string, conversationId?: string) {
  return getConversationFiles(conversationId).find((file) => file.id === id) ?? null;
}

export function getFileByFormat(format: AgentExportFormat, conversationId?: string) {
  return getConversationFiles(conversationId).find((file) => file.format === format) ?? null;
}

export function getFileByTitle(title: string, conversationId?: string) {
  const normalized = title.toLowerCase().trim();
  return (
    getConversationFiles(conversationId).find(
      (file) =>
        file.title.toLowerCase().includes(normalized) ||
        file.filename.toLowerCase().includes(normalized)
    ) ?? null
  );
}

export function updateExistingFile(
  fileId: string,
  updates: Partial<AgentGeneratedFileRecord>,
  conversationId?: string
): AgentGeneratedFileRecord | null {
  const registry = readRegistry();
  const key = scope(conversationId);
  const files = registry[key] ?? [];
  let updated: AgentGeneratedFileRecord | null = null;

  registry[key] = files.map((file): AgentGeneratedFileRecord => {
    if (file.id !== fileId) {
      return file;
    }

    updated = {
      ...file,
      ...updates,
      id: file.id,
      version: updates.version ?? file.version + 1,
      updatedAt: new Date().toISOString()
    };
    return updated;
  });

  writeRegistry(registry);
  return updated;
}

export const updateFile = updateExistingFile;

export function renameExistingFile(
  fileId: string,
  newTitleOrFilename: string,
  conversationId?: string
) {
  const file = getConversationFiles(conversationId).find((item) => item.id === fileId);
  if (!file) return null;
  const title = newTitleOrFilename.replace(/\.[^.]+$/, "").trim() || file.title;
  const filename = generateSmartFilename({
    userInput: title,
    generatedContent: file.content,
    intent: "rename file",
    format: file.format
  });

  return updateExistingFile(
    fileId,
    {
      title,
      filename,
      status: "renamed"
    },
    conversationId
  );
}

export const renameFile = renameExistingFile;

export function replaceFileContent(fileId: string, newContent: string, conversationId?: string) {
  return updateExistingFile(
    fileId,
    {
      content: newContent,
      status: "updated"
    },
    conversationId
  );
}

export function resolveFileReference(userInput: string, files?: AgentGeneratedFileRecord[], conversationId?: string) {
  const sourceFiles = files ?? getConversationFiles(conversationId);
  return resolveFileReferenceFromList(userInput, sourceFiles);
}
