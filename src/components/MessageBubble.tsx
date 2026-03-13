import { Copy, LoaderCircle, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { ChatMessage } from "../types/app";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  onSpeak?: (messageId: string, text: string) => void;
  speaking?: boolean;
}

export function MessageBubble({ message, onSpeak, speaking = false }: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn("flex w-full", isAssistant ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "relative max-w-[88%] rounded-[28px] border px-4 py-4 shadow-[0_20px_60px_rgba(2,6,23,0.2)]",
          isAssistant
            ? "border-white/10 bg-white/[0.045]"
            : "border-primary/25 bg-[linear-gradient(180deg,rgba(20,184,166,0.18),rgba(8,47,73,0.35))]"
        )}
      >
        {message.meta?.command ? (
          <Badge className="mb-3 w-fit border-primary/20 bg-primary/10 text-primary">
            /{message.meta.command}
          </Badge>
        ) : null}

        {isAssistant ? (
          <>
            <div className="absolute right-3 top-3 flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-xl"
                onClick={() => navigator.clipboard.writeText(message.content)}
                disabled={!message.content}
                aria-label="Copy response"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-xl"
                onClick={() => onSpeak?.(message.id, message.content)}
                disabled={!message.content || !onSpeak}
                aria-label="Speak response"
              >
                {speaking ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>

            {message.content ? (
              <div className="prose prose-invert prose-sm max-w-none pr-14 text-foreground prose-headings:text-white prose-strong:text-white prose-code:text-emerald-200 prose-pre:bg-transparent prose-pre:p-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    code({ inline, className, children, ...props }: any) {
                      const code = String(children).replace(/\n$/, "");

                      if (inline) {
                        return (
                          <code
                            className="rounded-md bg-black/35 px-1.5 py-0.5 text-[0.92em] text-emerald-200"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }

                      return (
                        <div className="relative my-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75">
                          <button
                            type="button"
                            className="absolute right-3 top-3 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-muted-foreground transition hover:bg-white/10 hover:text-white"
                            onClick={() => navigator.clipboard.writeText(code)}
                          >
                            Copy code
                          </button>
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
              <div className="w-40 space-y-2 py-2">
                <div className="h-2 animate-pulseLine rounded-full bg-white/20" />
                <div className="h-2 w-4/5 animate-pulseLine rounded-full bg-white/15 [animation-delay:0.12s]" />
                <div className="h-2 w-3/5 animate-pulseLine rounded-full bg-white/10 [animation-delay:0.24s]" />
              </div>
            )}
          </>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{message.content}</p>
        )}
      </div>
    </div>
  );
}
