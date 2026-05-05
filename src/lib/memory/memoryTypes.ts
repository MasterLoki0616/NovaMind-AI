import type { AgentGeneratedFileRecord } from "../agent/types";

export type MemoryItemType = "preference" | "project" | "file" | "instruction" | "profile" | "context";

export interface MemoryItem {
  id: string;
  type: MemoryItemType;
  key: string;
  value: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  sourceMessageId?: string;
}

export interface AgentActivityLogItem {
  id: string;
  type: string;
  label: string;
  detail?: string;
  status: "completed" | "failed" | "stopped" | "info";
  createdAt: string;
  actionId?: string;
}

export interface MemoryStats {
  totalItems: number;
  retrievedForCurrentRequest: number;
  lastUpdatedAt?: string;
  generatedFiles: number;
}

export type StoredGeneratedFile = AgentGeneratedFileRecord;
