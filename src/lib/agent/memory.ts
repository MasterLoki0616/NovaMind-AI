import type {
  AgentRelevantContextItem,
  AgentStoredDocument,
  AgentStoredEmail,
  AgentStoredMemory,
  AgentStoredNote,
  AgentStoredTask
} from "./types";
import { memoryStore } from "../memory/memoryStore";
import type { MemoryItemType } from "../memory/memoryTypes";

const TASKS_KEY = "novamind:agent:tasks";
const NOTES_KEY = "novamind:agent:notes";
const DOCUMENTS_KEY = "novamind:agent:documents";
const EMAILS_KEY = "novamind:agent:emails";
const MEMORY_KEY = "novamind:agent:memory";

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

function appendRecord<T extends { id: string; createdAt: string }>(key: string, record: T) {
  const records = readList<T>(key);
  writeList(key, [record, ...records]);
  return record;
}

function tokenize(input: string) {
  return new Set(
    input
      .toLowerCase()
      .split(/[^a-z0-9ğüşıöç]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length > 2)
  );
}

function scoreText(queryTokens: Set<string>, text: string) {
  if (queryTokens.size === 0) return 0;
  const haystack = text.toLowerCase();
  let score = 0;

  queryTokens.forEach((token) => {
    if (haystack.includes(token)) {
      score += 1;
    }
  });

  return score;
}

export function memory_store() {
  const advancedMemory = memoryStore();

  return {
    loadTasks: () => readList<AgentStoredTask>(TASKS_KEY),
    loadNotes: () => readList<AgentStoredNote>(NOTES_KEY),
    loadDocuments: () => readList<AgentStoredDocument>(DOCUMENTS_KEY),
    loadEmails: () => readList<AgentStoredEmail>(EMAILS_KEY),
    loadMemories: () => [
      ...readList<AgentStoredMemory>(MEMORY_KEY),
      ...advancedMemory.loadItems().map((item) => ({
        id: item.id,
        key: item.key,
        value: item.value,
        createdAt: item.createdAt
      }))
    ],
    addTask: (record: AgentStoredTask) => appendRecord(TASKS_KEY, record),
    addNote: (record: AgentStoredNote) => appendRecord(NOTES_KEY, record),
    addDocument: (record: AgentStoredDocument) => appendRecord(DOCUMENTS_KEY, record),
    addEmail: (record: AgentStoredEmail) => appendRecord(EMAILS_KEY, record),
    addMemory: (
      record: AgentStoredMemory & {
        type?: MemoryItemType;
        confidence?: number;
        sourceMessageId?: string;
      }
    ) => {
      appendRecord(MEMORY_KEY, record);
      advancedMemory.addOrUpdateItem({
        type: record.type ?? "context",
        key: record.key,
        value: record.value,
        confidence: record.confidence,
        sourceMessageId: record.sourceMessageId
      });
      return record;
    },
    advanced: advancedMemory,
    retrieveRelevantContext(query: string, limit = 8): AgentRelevantContextItem[] {
      const queryTokens = tokenize(query);
      const tasks = readList<AgentStoredTask>(TASKS_KEY).map((task) => ({
        id: task.id,
        type: "task" as const,
        title: task.title,
        content: [task.title, task.time, task.dueAt, task.priority, task.status]
          .filter(Boolean)
          .join(" "),
        score: scoreText(
          queryTokens,
          [task.title, task.time, task.dueAt, task.priority, task.status].join(" ")
        )
      }));
      const notes = readList<AgentStoredNote>(NOTES_KEY).map((note) => ({
        id: note.id,
        type: "note" as const,
        title: note.title,
        content: note.content,
        score: scoreText(queryTokens, `${note.title} ${note.content}`)
      }));
      const documents = readList<AgentStoredDocument>(DOCUMENTS_KEY).map((document) => ({
        id: document.id,
        type: "document" as const,
        title: document.title,
        content: document.content,
        score: scoreText(queryTokens, `${document.title} ${document.content}`)
      }));
      const emails = readList<AgentStoredEmail>(EMAILS_KEY).map((email) => ({
        id: email.id,
        type: "email" as const,
        title: email.subject,
        content: [email.to, email.subject, email.body].filter(Boolean).join(" "),
        score: scoreText(queryTokens, [email.to, email.subject, email.body].join(" "))
      }));
      const memories = readList<AgentStoredMemory>(MEMORY_KEY).map((memory) => ({
        id: memory.id,
        type: "memory" as const,
        title: memory.key,
        content: memory.value,
        score: scoreText(queryTokens, `${memory.key} ${memory.value}`)
      }));
      const advancedMemories = advancedMemory.loadItems().map((memory) => ({
        id: memory.id,
        type: "memory" as const,
        title: `${memory.type}: ${memory.key}`,
        content: memory.value,
        score: scoreText(queryTokens, `${memory.type} ${memory.key} ${memory.value}`) * memory.confidence
      }));

      return [...tasks, ...notes, ...documents, ...emails, ...memories, ...advancedMemories]
        .filter((item) => item.score > 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, limit);
    }
  };
}
