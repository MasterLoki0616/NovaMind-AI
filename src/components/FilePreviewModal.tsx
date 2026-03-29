import { X } from "lucide-react";
import type { AppLanguage, AttachmentRecord } from "../types/app";
import { bytesToReadable } from "../lib/utils";
import { getAppText } from "../lib/i18n";
import { Button } from "./ui/button";
import { GlowLoader } from "./ui/glow-loader";

interface FilePreviewModalProps {
  attachment: AttachmentRecord | null;
  preview:
    | {
        kind: string;
        text?: string;
        url?: string;
        truncated?: boolean;
      }
    | null;
  isLoading?: boolean;
  error?: string | null;
  language?: AppLanguage;
  onClose: () => void;
}

export function FilePreviewModal({
  attachment,
  preview,
  isLoading = false,
  error,
  language = "en",
  onClose
}: FilePreviewModalProps) {
  const text = getAppText(language);

  if (!attachment) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-background/78 p-4 backdrop-blur-md">
      <div className="glass-panel flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border/80 px-5 py-4">
          <div className="min-w-0">
            <div className="truncate font-heading text-xl font-semibold text-foreground">
              {attachment.name}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {text.preview} · {bytesToReadable(attachment.size)}
            </div>
          </div>
          <Button variant="secondary" size="icon" onClick={onClose} aria-label={text.close}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {isLoading ? (
            <div className="flex h-full min-h-[300px] items-center justify-center gap-3 text-sm text-muted-foreground">
              <GlowLoader size="md" />
              {text.preview}
            </div>
          ) : error ? (
            <div className="rounded-[24px] border border-red-400/20 bg-red-400/10 px-4 py-4 text-sm text-red-100">
              {error}
            </div>
          ) : preview?.kind === "image" && preview.url ? (
            <img
              src={preview.url}
              alt={attachment.name}
              className="mx-auto max-h-[70vh] rounded-[24px] border border-border/80 bg-card/70 object-contain"
            />
          ) : preview?.kind === "video" && preview.url ? (
            <video
              src={preview.url}
              controls
              className="mx-auto max-h-[70vh] w-full rounded-[24px] border border-border/80 bg-card/70"
            />
          ) : preview?.kind === "pdf" && preview.url ? (
            <iframe
              src={preview.url}
              title={attachment.name}
              className="h-[70vh] w-full rounded-[24px] border border-border/80 bg-card/70"
            />
          ) : preview?.text ? (
            <div className="rounded-[24px] border border-border/80 bg-card/70 p-4">
              <pre className="overflow-auto whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
                <code>{preview.text}</code>
              </pre>
              {preview.truncated ? (
                <div className="mt-3 text-xs text-muted-foreground">Preview truncated.</div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[24px] border border-border/80 bg-card/70 px-4 py-4 text-sm text-muted-foreground">
              {text.previewUnavailable}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
