import {
  Bot,
  Code2,
  FileText,
  Mic,
  Plus,
  ScanSearch,
  Settings,
  Sparkles
} from "lucide-react";
import type { ChatMode, Conversation, PageId } from "../types/app";
import { formatRelativeTime, pageToMode, truncate } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface SidebarProps {
  activePage: PageId;
  conversations: Conversation[];
  selectedConversationId: string | null;
  onNavigate: (page: PageId) => void;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: (mode: ChatMode) => void;
}

const navigationItems: Array<{
  id: PageId;
  label: string;
  description: string;
  icon: typeof Bot;
}> = [
  { id: "chat", label: "Chat", description: "General assistant", icon: Bot },
  { id: "screen", label: "Screen AI", description: "See the screen", icon: ScanSearch },
  { id: "documents", label: "Documents", description: "Analyze files", icon: FileText },
  { id: "code", label: "Code Assistant", description: "Build and debug", icon: Code2 },
  { id: "voice", label: "Voice Mode", description: "Talk to NovaMind", icon: Mic },
  { id: "settings", label: "Settings", description: "Models and audio", icon: Settings }
];

export function Sidebar({
  activePage,
  conversations,
  selectedConversationId,
  onNavigate,
  onSelectConversation,
  onNewConversation
}: SidebarProps) {
  const actionMode = pageToMode(activePage) ?? "chat";
  const recentConversations = conversations.slice(0, 8);

  return (
    <aside className="panel subtle-grid flex h-full min-h-0 flex-col overflow-hidden p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-semibold">NovaMind AI</h1>
            <p className="text-sm text-muted-foreground">Your Second Brain.</p>
          </div>
        </div>
        <Button size="icon" variant="secondary" onClick={() => onNewConversation(actionMode)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <nav className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all",
                active
                  ? "border-primary/40 bg-primary/12 text-foreground shadow-glow"
                  : "border-transparent bg-white/[0.03] text-muted-foreground hover:border-white/10 hover:bg-white/[0.06] hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl",
                  active ? "bg-primary/18 text-primary" : "bg-white/8 text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="font-medium">{item.label}</div>
                <div className="truncate text-xs text-muted-foreground">{item.description}</div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/20">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <div className="font-heading text-sm font-semibold">Recent Sessions</div>
            <div className="text-xs text-muted-foreground">Saved locally on this device</div>
          </div>
          <Badge>{conversations.length}</Badge>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {recentConversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-muted-foreground">
              Start a chat, code session, or voice session to build history.
            </div>
          ) : (
            recentConversations.map((conversation) => {
              const active = conversation.id === selectedConversationId;

              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelectConversation(conversation.id)}
                  className={cn(
                    "w-full rounded-2xl border px-3 py-3 text-left transition",
                    active
                      ? "border-primary/35 bg-primary/10"
                      : "border-white/8 bg-white/[0.03] hover:border-white/12 hover:bg-white/[0.05]"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge className="capitalize">{conversation.mode}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(conversation.updatedAt)}
                    </span>
                  </div>
                  <div className="font-medium text-foreground">
                    {truncate(conversation.title, 34)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {conversation.messages.length} messages
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-primary/15 bg-primary/8 p-4">
        <div className="mb-1 flex items-center gap-2 font-heading text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          MVP Focus
        </div>
        <div className="text-sm text-muted-foreground">
          Chat, screen capture, document intelligence, voice workflows, and plugin-ready architecture.
        </div>
      </div>
    </aside>
  );
}
