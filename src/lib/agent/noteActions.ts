import { createAgentId, createExecutionResult, nowIso } from "./actions";
import { getActionContent } from "./fileActions";
import type {
  AgentEmailMockAction,
  AgentExecutionResult,
  AgentMemoryAction,
  AgentNoteAction,
  AgentReportAction,
  AgentStoredDocument,
  AgentStoredEmail,
  AgentStoredMemory,
  AgentStoredNote
} from "./types";
import type { AgentExecutionState, AgentExecutorContext } from "./executor";

export function executeNoteAction(
  action: AgentNoteAction,
  context: AgentExecutorContext,
  state: AgentExecutionState
): AgentExecutionResult {
  const content = getActionContent(action, state) || action.title;
  const record: AgentStoredNote = {
    id: createAgentId(),
    title: action.title,
    content,
    createdAt: nowIso()
  };

  context.store.addNote(record);
  state.lastContent = content;
  state.contentByActionId.set(action.id, content);

  return createExecutionResult(action, "completed", "Note saved.", {
    recordId: record.id,
    output: content
  });
}

export function executeMemoryAction(
  action: AgentMemoryAction,
  context: AgentExecutorContext
): AgentExecutionResult {
  const record: AgentStoredMemory = {
    id: createAgentId(),
    key: action.key,
    value: action.value,
    createdAt: nowIso()
  };

  context.store.addMemory({
    ...record,
    type: action.memoryType,
    confidence: action.confidence
  });
  context.store.advanced.addActivity({
    type: "store_memory",
    label: "Stored memory preference",
    detail: action.key,
    status: "completed",
    actionId: action.id
  });

  return createExecutionResult(action, "completed", "Memory stored.", {
    recordId: record.id,
    output: action.value
  });
}

export async function executeEmailDraftAction(
  action: AgentEmailMockAction,
  context: AgentExecutorContext,
  state: AgentExecutionState
): Promise<AgentExecutionResult> {
  const body =
    getActionContent(action, state) ||
    action.body?.trim() ||
    (await context.generateText?.(
      `Draft a concise professional email.\nSubject: ${action.subject}\nRecipient: ${action.to ?? "unspecified"}`
    )) ||
    `Hi,\n\n${action.subject}\n\nBest,`;
  const record: AgentStoredEmail = {
    id: createAgentId(),
    to: action.to,
    subject: action.subject,
    body,
    sent: false,
    createdAt: nowIso()
  };

  context.store.addEmail(record);
  state.lastContent = body;
  state.contentByActionId.set(action.id, body);

  return createExecutionResult(action, "completed", "Email draft prepared.", {
    recordId: record.id,
    output: body
  });
}

export async function executeReportAction(
  action: AgentReportAction,
  context: AgentExecutorContext,
  state: AgentExecutionState
): Promise<AgentExecutionResult> {
  const content =
    getActionContent(action, state) ||
    action.content?.trim() ||
    (await context.generateText?.(
      `Create a polished markdown report about: ${action.topic}. Include summary, key points, risks, and next steps.`
    )) ||
    `# ${action.title}\n\n## Summary\n${action.topic}\n\n## Next Steps\n- Review\n- Improve\n- Execute`;
  const record: AgentStoredDocument = {
    id: createAgentId(),
    title: action.title,
    content,
    format: "docx",
    createdAt: nowIso()
  };

  context.store.addDocument(record);
  state.lastContent = content;
  state.contentByActionId.set(action.id, content);

  return createExecutionResult(action, "completed", "Report created.", {
    recordId: record.id,
    output: content
  });
}
