import type { SmartCommand } from "../types/app";

export const SMART_COMMANDS: Array<{
  id: SmartCommand;
  label: string;
  description: string;
}> = [
  {
    id: "summarize",
    label: "/summarize",
    description: "Condense content into the most important takeaways."
  },
  {
    id: "explain",
    label: "/explain",
    description: "Break down a topic, screenshot, or document clearly."
  },
  {
    id: "rewrite",
    label: "/rewrite",
    description: "Improve clarity, style, and structure."
  },
  {
    id: "translate",
    label: "/translate",
    description: "Translate the text while preserving tone."
  },
  {
    id: "code",
    label: "/code",
    description: "Switch into implementation and debugging mode."
  }
];

export function parseSmartCommand(input: string): {
  command: SmartCommand | null;
  content: string;
} {
  const normalized = input.trim();

  if (!normalized.startsWith("/")) {
    return { command: null, content: normalized };
  }

  const [firstToken, ...rest] = normalized.split(/\s+/);
  const maybeCommand = firstToken.slice(1).toLowerCase() as SmartCommand;

  if (!SMART_COMMANDS.some((entry) => entry.id === maybeCommand)) {
    return { command: null, content: normalized };
  }

  return {
    command: maybeCommand,
    content: rest.join(" ").trim()
  };
}
