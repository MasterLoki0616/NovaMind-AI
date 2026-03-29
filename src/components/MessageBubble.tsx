import { Copy, FileCode2, FileImage, FileText, FileVideo, LoaderCircle, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import type { CSSProperties } from "react";
import { getAppText } from "../lib/i18n";
import { cn } from "../lib/utils";
import type { AppLanguage, AttachmentRecord, ChatMessage } from "../types/app";
import { FeedbackButton } from "./FeedbackButton";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface MessageBubbleProps {
  message: ChatMessage;
  onSpeak?: (messageId: string, text: string) => void;
  speaking?: boolean;
  language?: AppLanguage;
  onOpenAttachment?: (attachment: AttachmentRecord) => void;
  sequence?: number;
}

function attachmentIcon(attachment: AttachmentRecord) {
  switch (attachment.previewKind) {
    case "image":
      return FileImage;
    case "video":
      return FileVideo;
    case "code":
      return FileCode2;
    default:
      return FileText;
  }
}

function AttachmentPreview({
  attachment,
  language,
  onOpen
}: {
  attachment: AttachmentRecord;
  language: AppLanguage;
  onOpen?: (attachment: AttachmentRecord) => void;
}) {
  const text = getAppText(language);
  const Icon = attachmentIcon(attachment);
  const clickable = Boolean(onOpen && (attachment.path || attachment.extractedText));

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => onOpen?.(attachment)}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border border-border bg-background/70 px-3 py-2 text-left",
        clickable ? "transition hover:border-primary/35 hover:bg-card/80" : "opacity-90"
      )}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/70 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{attachment.name}</div>
        <div className="text-xs text-muted-foreground">
          {attachment.previewKind?.toUpperCase() ?? text.attachments}
        </div>
      </div>
    </button>
  );
}

export function MessageBubble({
  message,
  onSpeak,
  speaking = false,
  language = "en",
  onOpenAttachment,
  sequence = 0
}: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";
  const text = getAppText(language);
  const attachments = message.meta?.attachments ?? [];
  const bubbleStyle = {
    "--message-delay": `${Math.min(sequence * 36, 220)}ms`
  } as CSSProperties;

  return (
    <div
      className={cn("message-enter flex w-full", isAssistant ? "justify-start" : "justify-end")}
      style={bubbleStyle}
    >
      <div
        className={cn(
          "message-surface relative max-w-full rounded-[24px] border px-3.5 py-3.5 shadow-[0_20px_60px_rgba(2,6,23,0.2)] sm:max-w-[92%] sm:rounded-[28px] sm:px-4 sm:py-4 xl:max-w-[84%]",
          isAssistant ? "border-border bg-card/80" : "border-primary/25 bg-primary/12"
        )}
      >
        {message.meta?.command ? (
          <Badge className="mb-3 w-fit border-primary/20 bg-primary/10 text-primary">
            /{message.meta.command}
          </Badge>
        ) : null}

        {isAssistant ? (
          <>
            <div className="absolute right-2.5 top-2.5 flex items-center gap-2 sm:right-3 sm:top-3">
              <FeedbackButton
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-xl"
                successClassName="bg-emerald-500/15 text-emerald-100"
                idleLabel=""
                successLabel=""
                icon={Copy}
                onClick={() => navigator.clipboard.writeText(message.content)}
                disabled={!message.content}
                aria-label={text.copyMessage}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-xl"
                onClick={() => onSpeak?.(message.id, message.content)}
                disabled={!message.content || !onSpeak}
                aria-label={text.speakResponse}
              >
                {speaking ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>

            {attachments.length > 0 ? (
              <div className="mb-3 grid gap-2 pr-12 sm:pr-14">
                {attachments.map((attachment) => (
                  <AttachmentPreview
                    key={attachment.id}
                    attachment={attachment}
                    language={language}
                    onOpen={onOpenAttachment}
                  />
                ))}
              </div>
            ) : null}

            {message.content ? (
              <div className="prose prose-sm max-w-none pr-12 text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-code:text-primary prose-pre:bg-transparent prose-pre:p-0 sm:pr-14">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code({ inline, className, children, ...props }: any) {
                      const code = String(children).replace(/\n$/, "");

                      if (inline) {
                        return (
                          <code
                            className="rounded-md bg-background/80 px-1.5 py-0.5 text-[0.92em] text-primary"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }

                      return (
                        <div className="relative my-4 overflow-hidden rounded-2xl border border-border bg-background/80">
                          <div className="absolute right-3 top-3">
                            <FeedbackButton
                              size="sm"
                              variant="secondary"
                              idleLabel={text.copyCode}
                              successLabel={text.terminalCopied}
                              icon={Copy}
                              onClick={() => navigator.clipboard.writeText(code)}
                            />
                          </div>
                          <pre className="overflow-x-auto p-4 text-[13px] leading-6">
                            <code className={className} {...props}>
                              {code}
                            </code>
                          </pre>
                        </div>
                      );
                    }
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="w-40 space-y-3 py-2">
                <div className="thinking-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="h-2 animate-pulseLine rounded-full bg-border/90" />
                <div className="h-2 w-4/5 animate-pulseLine rounded-full bg-border/80 [animation-delay:0.12s]" />
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {attachments.length > 0 ? (
              <div className="grid gap-2">
                {attachments.map((attachment) => (
                  <AttachmentPreview
                    key={attachment.id}
                    attachment={attachment}
                    language={language}
                    onOpen={onOpenAttachment}
                  />
                ))}
              </div>
            ) : null}

            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 whitespace-pre-wrap text-sm leading-6 text-foreground sm:leading-7">
                {message.content}
              </p>
              <FeedbackButton
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0 rounded-xl"
                successClassName="bg-emerald-500/15 text-emerald-100"
                idleLabel=""
                successLabel=""
                icon={Copy}
                onClick={() => navigator.clipboard.writeText(message.content)}
                disabled={!message.content}
                aria-label={text.copyMessage}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
