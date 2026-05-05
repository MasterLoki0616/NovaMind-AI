export type PageId =
  | "chat"
  | "screen"
  | "documents"
  | "code"
  | "voice"
  | "settings";

export type ChatMode = "chat" | "code" | "voice";
export type SmartCommand = "summarize" | "explain" | "rewrite" | "translate" | "code";
export type ModelName = string;
export type TtsVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
export type AppTheme = "ai" | "dark" | "light";
export type AppLanguage = "en" | "tr";
export type AttachmentKind =
  | "document"
  | "video"
  | "image"
  | "text"
  | "code"
  | "pdf"
  | "file";
export type AttachmentPreviewKind =
  | "text"
  | "code"
  | "image"
  | "video"
  | "pdf"
  | "docx"
  | "file";
export type AttachmentOrigin = "upload";

export interface AttachmentRecord {
  id: string;
  kind: AttachmentKind;
  name: string;
  size: number;
  mimeType: string;
  extension?: string;
  path?: string;
  origin?: AttachmentOrigin;
  previewKind?: AttachmentPreviewKind;
  extractedText?: string;
  durationSeconds?: number;
}

export type AgentActionType =
  | "generate_content"
  | "create_file"
  | "create_note"
  | "create_document"
  | "save_file"
  | "download_file"
  | "convert_file"
  | "rename_file"
  | "update_file_content"
  | "update_file_title"
  | "export_file"
  | "regenerate_file"
  | "summarize_file"
  | "improve_file"
  | "create_task"
  | "create_checklist"
  | "create_report"
  | "create_email_draft"
  | "store_memory"
  | "retrieve_memory"
  | "summarize_content"
  | "export_content";
export type AgentPriority = "low" | "medium" | "high";
export type AgentExecutionStatus = "completed" | "failed" | "stopped";
export type AgentContentFormat = "text" | "markdown" | "json" | "csv" | "html";
export type AgentExportFormat =
  | "txt"
  | "md"
  | "pdf"
  | "docx"
  | "json"
  | "csv"
  | "html"
  | "xlsx"
  | "pptx";
export type AgentFileLocation = "desktop" | "downloads" | "browser";

interface AgentActionBase {
  id: string;
  type: AgentActionType;
  title: string;
}

export interface AgentTaskAction extends AgentActionBase {
  type: "create_task";
  time?: string;
  dueAt?: string;
  priority?: AgentPriority;
}

export interface AgentNoteAction extends AgentActionBase {
  type: "create_note";
  content?: string;
  contentFromActionId?: string;
}

export interface AgentGenerateContentAction extends AgentActionBase {
  type: "generate_content";
  topic: string;
  prompt: string;
  format: AgentContentFormat;
  content?: string;
}

export interface AgentCreateFileAction extends AgentActionBase {
  type: "create_file";
  topic: string;
  prompt: string;
  format: AgentExportFormat;
  location: AgentFileLocation;
  content?: string;
}

export interface AgentSaveFileAction extends AgentActionBase {
  type: "save_file";
  filename: string;
  location: AgentFileLocation;
  format: AgentExportFormat;
  content?: string;
  contentFromActionId?: string;
}

export interface AgentDownloadFileAction extends AgentActionBase {
  type: "download_file";
  filename: string;
  format: AgentExportFormat;
  content?: string;
  contentFromActionId?: string;
}

export interface AgentDocumentAction extends AgentActionBase {
  type: "create_document";
  topic: string;
  format: AgentExportFormat;
  content?: string;
  contentFromActionId?: string;
}

export interface AgentConvertFileAction extends AgentActionBase {
  type: "convert_file";
  sourceActionId?: string;
  sourceFilename?: string;
  sourceFormat?: AgentExportFormat;
  targetFormat: AgentExportFormat;
  filename?: string;
  location: AgentFileLocation;
}

export interface AgentRenameFileAction extends AgentActionBase {
  type: "rename_file" | "update_file_title";
  fileId?: string;
  sourceFormat?: AgentExportFormat;
  newTitle?: string;
  newFilename?: string;
  instruction?: string;
  location?: AgentFileLocation;
}

export interface AgentUpdateFileContentAction extends AgentActionBase {
  type: "update_file_content" | "improve_file" | "regenerate_file";
  fileId?: string;
  sourceFormat?: AgentExportFormat;
  instruction: string;
  content?: string;
  location?: AgentFileLocation;
}

export interface AgentExportFileAction extends AgentActionBase {
  type: "export_file";
  fileId?: string;
  sourceFormat?: AgentExportFormat;
  targetFormat: AgentExportFormat;
  location: AgentFileLocation;
}

export interface AgentSummarizeFileAction extends AgentActionBase {
  type: "summarize_file";
  fileId?: string;
  sourceFormat?: AgentExportFormat;
}

export interface AgentChecklistAction extends AgentActionBase {
  type: "create_checklist";
  items: string[];
  content?: string;
  contentFromActionId?: string;
}

export interface AgentReportAction extends AgentActionBase {
  type: "create_report";
  topic: string;
  content?: string;
  contentFromActionId?: string;
}

export interface AgentEmailMockAction extends AgentActionBase {
  type: "create_email_draft";
  to?: string;
  subject: string;
  body?: string;
  contentFromActionId?: string;
}

export interface AgentMemoryAction extends AgentActionBase {
  type: "store_memory";
  key: string;
  value: string;
  memoryType?: "preference" | "project" | "file" | "instruction" | "profile" | "context";
  confidence?: number;
}

export interface AgentRetrieveMemoryAction extends AgentActionBase {
  type: "retrieve_memory";
  query: string;
}

export interface AgentSummarizeContentAction extends AgentActionBase {
  type: "summarize_content";
  sourceText?: string;
  contentFromActionId?: string;
  format: AgentContentFormat;
}

export interface AgentExportContentAction extends AgentActionBase {
  type: "export_content";
  filename: string;
  format: AgentExportFormat;
  location: AgentFileLocation;
  content?: string;
  contentFromActionId?: string;
}

export type AgentAction =
  | AgentGenerateContentAction
  | AgentCreateFileAction
  | AgentTaskAction
  | AgentNoteAction
  | AgentDocumentAction
  | AgentSaveFileAction
  | AgentDownloadFileAction
  | AgentConvertFileAction
  | AgentRenameFileAction
  | AgentUpdateFileContentAction
  | AgentExportFileAction
  | AgentSummarizeFileAction
  | AgentChecklistAction
  | AgentReportAction
  | AgentEmailMockAction
  | AgentMemoryAction
  | AgentRetrieveMemoryAction
  | AgentSummarizeContentAction
  | AgentExportContentAction;

export interface AgentGeneratedFileRecord {
  id: string;
  filename: string;
  title: string;
  format: AgentExportFormat;
  content: string;
  contentBase64?: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  sourceMessageId?: string;
  version: number;
  status: "active" | "renamed" | "updated" | "converted";
  actionId: string;
  path?: string;
  downloadTriggered?: boolean;
}

export interface AgentExecutionResult {
  id: string;
  actionId: string;
  type: AgentActionType;
  title: string;
  status: AgentExecutionStatus;
  recordId?: string;
  message: string;
  createdAt: string;
  output?: string;
  filename?: string;
  path?: string;
  downloadTriggered?: boolean;
  format?: AgentExportFormat;
  size?: number;
  generatedFile?: AgentGeneratedFileRecord;
}

export interface AgentRunResult {
  message: string;
  actions: AgentAction[];
  executedActions: AgentExecutionResult[];
  createdAt: string;
}

export interface AgentStoredTask {
  id: string;
  title: string;
  time?: string;
  dueAt?: string;
  priority: AgentPriority;
  status: "todo" | "done";
  createdAt: string;
}

export interface AgentStoredNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface AgentStoredDocument {
  id: string;
  title: string;
  content: string;
  format: AgentContentFormat | AgentExportFormat;
  filename?: string;
  path?: string;
  createdAt: string;
}

export interface AgentStoredEmail {
  id: string;
  to?: string;
  subject: string;
  body: string;
  sent: false;
  createdAt: string;
}

export interface AgentStoredMemory {
  id: string;
  key: string;
  value: string;
  createdAt: string;
}

export interface AgentRelevantContextItem {
  id: string;
  type: "task" | "note" | "document" | "email" | "memory";
  title: string;
  content: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  meta?: {
    command?: SmartCommand | null;
    copiedFromScreen?: boolean;
    source?: "chat" | "document" | "screen" | "voice";
    attachments?: AttachmentRecord[];
    generation?: "image";
    agentRun?: AgentRunResult;
    stopped?: boolean;
  };
}

export interface Conversation {
  id: string;
  title: string;
  mode: ChatMode;
  messages: ChatMessage[];
  files?: AgentGeneratedFileRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  apiBaseUrl: string;
  defaultModel: ModelName;
  temperature: number;
  systemPrompt: string;
  voiceAutoSpeak: boolean;
  voiceName: TtsVoice;
  preferredInputDeviceId: string;
  preferredOutputDeviceId: string;
  inputGain: number;
  theme: AppTheme;
  language: AppLanguage;
}

export interface ScreenSelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentRecord {
  id: string;
  name: string;
  size: number;
  extractedText: string;
  summary: string;
  truncated: boolean;
  createdAt: string;
}
