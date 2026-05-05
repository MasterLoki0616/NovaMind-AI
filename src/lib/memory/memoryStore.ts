import type { AgentGeneratedFileRecord } from "../agent/types";
import type { AgentActivityLogItem, MemoryItem, MemoryItemType, MemoryStats } from "./memoryTypes";

const MEMORY_ITEMS_KEY = "novamind:memory:items";
const GENERATED_FILES_KEY = "novamind:agent:generated-files";
const ACTIVITY_LOG_KEY = "novamind:agent:activity";
const RETRIEVED_COUNT_KEY = "novamind:memory:last-retrieved-count";

function createId() {
  return crypto.randomUUID();
}

function nowIso() {
  return new Date().toISOString();
}

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, records: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(records));
}

function normalizeKey(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, "_").slice(0, 90);
}

export function memoryStore() {
  return {
    loadItems: () => readList<MemoryItem>(MEMORY_ITEMS_KEY),
    saveItems: (items: MemoryItem[]) => writeList(MEMORY_ITEMS_KEY, items),
    addOrUpdateItem(input: {
      type: MemoryItemType;
      key: string;
      value: string;
      confidence?: number;
      sourceMessageId?: string;
    }) {
      const now = nowIso();
      const normalizedKey = normalizeKey(input.key);
      const items = readList<MemoryItem>(MEMORY_ITEMS_KEY);
      const existingIndex = items.findIndex(
        (item) => item.type === input.type && normalizeKey(item.key) === normalizedKey
      );
      const nextItem: MemoryItem =
        existingIndex >= 0
          ? {
              ...items[existingIndex],
              value: input.value,
              confidence: input.confidence ?? items[existingIndex].confidence,
              updatedAt: now,
              sourceMessageId: input.sourceMessageId ?? items[existingIndex].sourceMessageId
            }
          : {
              id: createId(),
              type: input.type,
              key: input.key.trim() || normalizedKey || "memory",
              value: input.value,
              confidence: input.confidence ?? 0.75,
              createdAt: now,
              updatedAt: now,
              sourceMessageId: input.sourceMessageId
            };

      const nextItems =
        existingIndex >= 0
          ? items.map((item, index) => (index === existingIndex ? nextItem : item))
          : [nextItem, ...items];
      writeList(MEMORY_ITEMS_KEY, nextItems.slice(0, 250));
      return nextItem;
    },
    loadGeneratedFiles: () => readList<AgentGeneratedFileRecord>(GENERATED_FILES_KEY),
    addGeneratedFile(file: AgentGeneratedFileRecord) {
      const files = readList<AgentGeneratedFileRecord>(GENERATED_FILES_KEY);
      writeList(GENERATED_FILES_KEY, [file, ...files].slice(0, 80));
      this.addOrUpdateItem({
        type: "file",
        key: `generated_file:${file.filename}`,
        value: JSON.stringify({
          filename: file.filename,
          format: file.format,
          createdAt: file.createdAt,
          size: file.size,
          path: file.path
        }),
        confidence: 0.9
      });
      return file;
    },
    getLastGeneratedFile() {
      return readList<AgentGeneratedFileRecord>(GENERATED_FILES_KEY)[0] ?? null;
    },
    loadActivity: () => readList<AgentActivityLogItem>(ACTIVITY_LOG_KEY),
    addActivity(input: Omit<AgentActivityLogItem, "id" | "createdAt">) {
      const item: AgentActivityLogItem = {
        id: createId(),
        createdAt: nowIso(),
        ...input
      };
      const current = readList<AgentActivityLogItem>(ACTIVITY_LOG_KEY);
      writeList(ACTIVITY_LOG_KEY, [item, ...current].slice(0, 100));
      return item;
    },
    setLastRetrievedCount(count: number) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(RETRIEVED_COUNT_KEY, String(Math.max(0, count)));
      }
    },
    stats(): MemoryStats {
      const items = readList<MemoryItem>(MEMORY_ITEMS_KEY);
      const generatedFiles = readList<AgentGeneratedFileRecord>(GENERATED_FILES_KEY);
      const retrievedForCurrentRequest =
        typeof window === "undefined"
          ? 0
          : Number(window.localStorage.getItem(RETRIEVED_COUNT_KEY) ?? 0) || 0;
      const lastUpdatedAt = items
        .map((item) => item.updatedAt)
        .sort()
        .reverse()[0];

      return {
        totalItems: items.length,
        retrievedForCurrentRequest,
        lastUpdatedAt,
        generatedFiles: generatedFiles.length
      };
    }
  };
}
