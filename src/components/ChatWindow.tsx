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
  onEditUserMessage?: (messageId: string, content: string) => void | Promise<void>;
  language?: AppLanguage;
  onOpenAttachment?: (attachment: AttachmentRecord) => void;
  onOpenGeneratedImage?: (image: { url: string; label: string }) => void;
}

export function ChatWindow({
  messages,
  emptyTitle,
  emptyDescription,
  speakingMessageId,
  onSpeak,
  onEditUserMessage,
  language = "en",
  onOpenAttachment,
  onOpenGeneratedImage
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="motion-fade-up flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
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
        <div className="mx-auto w-full max-w-[1040px] space-y-5 2xl:max-w-[1180px]">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              sequence={index}
              speaking={speakingMessageId === message.id}
              onSpeak={onSpeak}
              onEditUserMessage={onEditUserMessage}
              language={language}
              onOpenAttachment={onOpenAttachment}
              onOpenGeneratedImage={onOpenGeneratedImage}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
