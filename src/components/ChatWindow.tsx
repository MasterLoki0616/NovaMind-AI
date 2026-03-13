import { BrainCircuit } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ChatMessage } from "../types/app";
import { MessageBubble } from "./MessageBubble";

interface ChatWindowProps {
  messages: ChatMessage[];
  emptyTitle: string;
  emptyDescription: string;
  speakingMessageId?: string | null;
  onSpeak?: (messageId: string, text: string) => void;
}

export function ChatWindow({
  messages,
  emptyTitle,
  emptyDescription,
  speakingMessageId,
  onSpeak
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary/12 text-primary shadow-glow">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <h2 className="font-heading text-2xl font-semibold">{emptyTitle}</h2>
          <p className="mt-3 max-w-xl text-balance text-sm leading-7 text-muted-foreground">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              speaking={speakingMessageId === message.id}
              onSpeak={onSpeak}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
