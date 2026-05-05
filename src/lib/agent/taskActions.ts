import { createAgentId, createExecutionResult, nowIso } from "./actions";
import { getActionContent } from "./fileActions";
import type {
  AgentChecklistAction,
  AgentExecutionResult,
  AgentStoredNote,
  AgentStoredTask,
  AgentTaskAction
} from "./types";
import type { AgentExecutionState, AgentExecutorContext } from "./executor";

export function executeTaskAction(
  action: AgentTaskAction,
  context: AgentExecutorContext
): AgentExecutionResult {
  const record: AgentStoredTask = {
    id: createAgentId(),
    title: action.title,
    time: action.time,
    dueAt: action.dueAt,
    priority: action.priority ?? "medium",
    status: "todo",
    createdAt: nowIso()
  };

  context.store.addTask(record);

  return createExecutionResult(action, "completed", "Task created.", {
    recordId: record.id
  });
}

export function executeChecklistAction(
  action: AgentChecklistAction,
  context: AgentExecutorContext,
  state: AgentExecutionState
): AgentExecutionResult {
  const referencedContent = getActionContent(action, state);
  const generatedItems = referencedContent
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*(?:\[[ x]\]\s*)?/i, "").trim())
    .filter((line) => line.length > 2 && !line.startsWith("#"))
    .slice(0, 12);
  const items =
    action.items.length > 0
      ? action.items
      : generatedItems.length > 0
        ? generatedItems
        : ["Review", "Execute", "Follow up"];
  const content =
    action.content?.trim() ||
    referencedContent ||
    [`# ${action.title}`, "", ...items.map((item) => `- [ ] ${item}`)].join("\n");
  const note: AgentStoredNote = {
    id: createAgentId(),
    title: action.title,
    content,
    createdAt: nowIso()
  };

  context.store.addNote(note);
  items.forEach((item) => {
    context.store.addTask({
      id: createAgentId(),
      title: item,
      priority: "medium",
      status: "todo",
      createdAt: nowIso()
    });
  });
  state.lastContent = content;
  state.contentByActionId.set(action.id, content);

  return createExecutionResult(action, "completed", "Checklist created and tasks added.", {
    recordId: note.id,
    output: content
  });
}
