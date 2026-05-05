import { memoryStore } from "./memoryStore";
import type { MemoryItem } from "./memoryTypes";

function tokenize(input: string) {
  return new Set(
    input
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2)
  );
}

function scoreMemory(queryTokens: Set<string>, item: MemoryItem) {
  if (queryTokens.size === 0) return 0;
  const haystack = `${item.type} ${item.key} ${item.value}`.toLowerCase();
  let score = 0;

  queryTokens.forEach((token) => {
    if (haystack.includes(token)) {
      score += item.type === "preference" || item.type === "instruction" ? 1.4 : 1;
    }
  });

  return score * item.confidence;
}

export function retrieveRelevantMemory(query: string, limit = 8) {
  const store = memoryStore();
  const tokens = tokenize(query);
  const items = store
    .loadItems()
    .map((item) => ({ item, score: scoreMemory(tokens, item) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.item);

  store.setLastRetrievedCount(items.length);
  return items;
}

export function extractMemoryCandidates(input: string, sourceMessageId?: string) {
  const lower = input.toLowerCase();
  const candidates: Array<Omit<MemoryItem, "id" | "createdAt" | "updatedAt">> = [];

  if (/\b(from now on|always|never|don't|do not|prefer|preference|bundan sonra|artik|artık|asla|her zaman)\b/i.test(lower)) {
    let key = "user_preference";
    if (/\b(md|markdown|txt|pdf|docx|file|format|note|not)\b/i.test(lower)) {
      key = "file_format_preference";
    } else if (/\b(short|concise|detailed|tone|language|turkish|english|kisa|kısa)\b/i.test(lower)) {
      key = "response_style_preference";
    }

    candidates.push({
      type: "preference",
      key,
      value: input.trim(),
      confidence: 0.86,
      sourceMessageId
    });
  }

  if (/\b(novamind|project|startup|sponsorship|investor|launch)\b/i.test(lower)) {
    candidates.push({
      type: "project",
      key: "project_context",
      value: input.trim(),
      confidence: 0.62,
      sourceMessageId
    });
  }

  if (/\bremember that|remember this|bunu hatirla|bunu hatırla|store this\b/i.test(lower)) {
    candidates.push({
      type: "instruction",
      key: input.trim().slice(0, 60) || "remembered_instruction",
      value: input.trim(),
      confidence: 0.9,
      sourceMessageId
    });
  }

  return candidates;
}
