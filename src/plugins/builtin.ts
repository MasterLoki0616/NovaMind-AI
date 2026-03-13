import { createPluginRegistry } from "./registry";

export const pluginRegistry = createPluginRegistry([
  {
    id: "google-search",
    name: "Google Search",
    description: "Future plugin for live web lookups and research workflows.",
    commands: ["/search", "/research"]
  },
  {
    id: "notion",
    name: "Notion Integration",
    description: "Future plugin for syncing notes, knowledge bases, and action items.",
    commands: ["/notion", "/notes"]
  },
  {
    id: "calendar",
    name: "Calendar Assistant",
    description: "Future plugin for planning, scheduling, and reminders.",
    commands: ["/calendar", "/plan"]
  },
  {
    id: "editor",
    name: "Code Editor Bridge",
    description: "Future plugin for IDE handoff, repo context, and patch suggestions.",
    commands: ["/editor", "/repo"]
  }
]);
