export type AssistantMode = "chat" | "code" | "voice";
export type SmartCommand = "summarize" | "explain" | "rewrite" | "translate" | "code";

const commandPrompts: Record<SmartCommand, string> = {
  summarize:
    "Focus on concise synthesis. Return the main idea, essential details, and a short action list when useful.",
  explain:
    "Explain clearly from first principles. Use examples where they improve understanding and avoid jargon unless required.",
  rewrite:
    "Rewrite for clarity, tone, and structure while preserving the original meaning unless the user asks for stronger edits.",
  translate:
    "Translate accurately, preserve formatting, and call out ambiguous phrasing when needed. Default to English if the target language is not specified.",
  code:
    "Behave like a senior software engineer. Prefer correct, runnable code and explain tradeoffs briefly."
};

const modePrompts: Record<AssistantMode, string> = {
  chat:
    "You are NovaMind AI, a polished desktop second-brain assistant. Be concise, helpful, and practical.",
  code:
    "You are NovaMind AI in code-assistant mode. Optimize for correctness, debugging clarity, and maintainable code.",
  voice:
    "You are NovaMind AI in voice mode. Use slightly shorter phrasing that sounds natural when spoken aloud."
};

export function buildSystemPrompt(options: {
  mode: AssistantMode;
  command?: SmartCommand | null;
  userSystemPrompt?: string;
}) {
  const parts = [
    modePrompts[options.mode],
    "Tagline: Your Second Brain.",
    "If the user provides incomplete context, ask at most one targeted clarification question; otherwise make reasonable assumptions and move forward."
  ];

  if (options.command) {
    parts.push(commandPrompts[options.command]);
  }

  if (options.userSystemPrompt?.trim()) {
    parts.push(`User preference: ${options.userSystemPrompt.trim()}`);
  }

  return parts.join("\n\n");
}
