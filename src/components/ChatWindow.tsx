import { BrainCircuit } from "lucide-react";
import { useEffect, useRef } from "react";
import type { AppLanguage, AttachmentRecord, ChatMessage } from "../types/app";
import { MessageBubble } from "./MessageBubble";

interface ChatWindowProps {
  messages: ChatMessage[];
  emptyTitle: string;
  emptyDescription: string;
  speakingMessageId?: string | null;
  onSpeak?: (messageId: string, text: string) => void;
  language?: AppLanguage;
  onOpenAttachment?: (attachment: AttachmentRecord) => void;
}

export function ChatWindow({
  messages,
  emptyTitle,
  emptyDescription,
  speakingMessageId,
  onSpeak,
  language = "en",
  onOpenAttachment
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="motion-fade-up flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-5">
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary/12 text-primary shadow-glow motion-safe:animate-[float_8s_ease-in-out_infinite]">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <h2 className="font-heading text-xl font-semibold sm:text-2xl">{emptyTitle}</h2>
          <p className="mt-3 max-w-xl text-balance text-sm leading-7 text-muted-foreground">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-[840px] space-y-4">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              sequence={index}
              speaking={speakingMessageId === message.id}
              onSpeak={onSpeak}
              language={language}
              onOpenAttachment={onOpenAttachment}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
