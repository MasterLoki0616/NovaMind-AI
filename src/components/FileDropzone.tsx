import { FileUp, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "../lib/utils";

interface FileDropzoneProps {
  disabled?: boolean;
  onFiles: (files: FileList | File[]) => void;
}

export function FileDropzone({ disabled = false, onFiles }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled && event.dataTransfer.files.length > 0) {
          onFiles(event.dataTransfer.files);
        }
      }}
      className={cn(
        "flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-6 text-center transition",
        dragging
          ? "border-primary/45 bg-primary/8 shadow-glow"
          : "border-white/12 bg-black/20 hover:border-white/20 hover:bg-white/[0.03]",
        disabled && "cursor-not-allowed opacity-70"
      )}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary/12 text-primary">
        {dragging ? <UploadCloud className="h-7 w-7" /> : <FileUp className="h-7 w-7" />}
      </div>
      <h3 className="font-heading text-xl font-semibold">Drop a document here</h3>
      <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
        Upload PDF, TXT, DOCX, or Markdown files. NovaMind will summarize the document and answer questions about it.
      </p>
      <p className="mt-4 text-xs uppercase tracking-[0.24em] text-muted-foreground">
        Drag and drop or click to browse
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.docx,.md"
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) {
            onFiles(event.target.files);
          }
        }}
      />
    </div>
  );
}
