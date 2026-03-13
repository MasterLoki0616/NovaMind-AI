import type { ReactNode } from "react";
import type { AppSettings, Conversation } from "../types/app";
import { ChatWindow } from "./ChatWindow";
import { Composer } from "./Composer";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface ChatWorkspaceProps {
  title: string;
  subtitle: string;
  conversation: Conversation | null;
  settings: AppSettings;
  isSending: boolean;
  speakingMessageId: string | null;
  showVoiceButton?: boolean;
  insights: Array<{ label: string; value: string }>;
  emptyTitle: string;
  emptyDescription: string;
  onSend: (value: string) => Promise<boolean>;
  onNewConversation: () => void;
  onSpeak: (messageId: string, text: string) => void;
  hero?: ReactNode;
}

export function ChatWorkspace({
  title,
  subtitle,
  conversation,
  settings,
  isSending,
  speakingMessageId,
  showVoiceButton = false,
  insights,
  emptyTitle,
  emptyDescription,
  onSend,
  onNewConversation,
  onSpeak,
  hero
}: ChatWorkspaceProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="panel p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="border-primary/20 bg-primary/10 text-primary">Desktop MVP</Badge>
            <Badge>{settings.defaultModel}</Badge>
          </div>
          <h2 className="font-heading text-3xl font-semibold">{title}</h2>
          <p className="mt-3 max-w-3xl text-balance text-sm leading-7 text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-heading text-lg font-semibold">Session Controls</div>
              <div className="text-sm text-muted-foreground">Local history and smart commands</div>
            </div>
            <Button variant="secondary" onClick={onNewConversation}>
              New Session
            </Button>
          </div>
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.label}
                className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {insight.label}
                </div>
                <div className="mt-1 text-sm text-foreground">{insight.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {hero}

      <div className="panel flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatWindow
          messages={conversation?.messages ?? []}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          speakingMessageId={speakingMessageId}
          onSpeak={onSpeak}
        />
        <div className="border-t border-white/10 p-4">
          <Composer
            apiBaseUrl={settings.apiBaseUrl}
            isSending={isSending}
            placeholder="Message NovaMind... Try /summarize, /explain, or /code"
            showVoiceButton={showVoiceButton}
            onSend={onSend}
          />
        </div>
      </div>
    </div>
  );
}
