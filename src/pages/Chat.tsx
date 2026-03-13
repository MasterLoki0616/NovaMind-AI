import { ChatWorkspace } from "../components/ChatWorkspace";
import type { AppSettings, Conversation } from "../types/app";

interface ChatPageProps {
  conversation: Conversation | null;
  settings: AppSettings;
  isSending: boolean;
  speakingMessageId: string | null;
  onSend: (value: string) => Promise<boolean>;
  onNewConversation: () => void;
  onSpeak: (messageId: string, text: string) => void;
}

export function ChatPage(props: ChatPageProps) {
  return (
    <ChatWorkspace
      {...props}
      title="Focused conversations, local history, fast iteration."
      subtitle="Use NovaMind as a clean desktop second brain for notes, ideation, research, drafting, and day-to-day AI chat. Streaming responses, markdown, code rendering, and slash commands are all live in the MVP."
      insights={[
        { label: "Chat History", value: "Saved locally so your recent sessions survive reloads." },
        { label: "Smart Commands", value: "Use /summarize, /rewrite, /translate, or /explain." },
        { label: "Shortcuts", value: "Ctrl/Cmd + K focuses the composer. Ctrl/Cmd + Enter sends." }
      ]}
      emptyTitle="Start a conversation with NovaMind"
      emptyDescription="Ask for planning help, writing support, explanations, or use slash commands to steer the response style without leaving the chat."
      showVoiceButton
    />
  );
}
