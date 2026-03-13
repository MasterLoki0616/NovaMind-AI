import { LoaderCircle, MessageSquareText } from "lucide-react";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileDropzone } from "../components/FileDropzone";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { askDocumentQuestion, uploadDocument } from "../services/ai";
import type { AppSettings, DocumentRecord } from "../types/app";
import { bytesToReadable, formatRelativeTime, truncate } from "../lib/utils";

interface DocumentsPageProps {
  settings: AppSettings;
}

export function DocumentsPage({ settings }: DocumentsPageProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "asking">("idle");
  const [error, setError] = useState<string | null>(null);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === selectedDocumentId) ?? documents[0] ?? null,
    [documents, selectedDocumentId]
  );

  async function handleUpload(files: FileList | File[]) {
    const file = Array.from(files)[0];
    if (!file) return;

    setStatus("uploading");
    setError(null);

    try {
      const record = await uploadDocument(settings.apiBaseUrl, file, settings.defaultModel);
      setDocuments((current) => [record, ...current]);
      setSelectedDocumentId(record.id);
      setAnswer("");
    } catch (innerError) {
      setError(innerError instanceof Error ? innerError.message : "Document upload failed.");
    } finally {
      setStatus("idle");
    }
  }

  async function handleAsk() {
    if (!selectedDocument || !question.trim()) return;

    setStatus("asking");
    setError(null);

    try {
      const result = await askDocumentQuestion(
        settings.apiBaseUrl,
        selectedDocument.extractedText,
        question,
        settings.defaultModel
      );

      setAnswer(result.answer);
    } catch (innerError) {
      setError(innerError instanceof Error ? innerError.message : "Document Q&A failed.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="panel p-6">
          <div className="mb-3 flex items-center gap-2">
            <Badge className="border-primary/20 bg-primary/10 text-primary">Document Intelligence</Badge>
            <Badge>PDF / TXT / DOCX / MD</Badge>
          </div>
          <h2 className="font-heading text-3xl font-semibold">Summarize, inspect, and question files.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Upload a document into NovaMind and get a fast summary, extracted text, and Q&A against the content. This is useful for reports, notes, markdown docs, and lightweight knowledge work.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How it works</CardTitle>
            <CardDescription>Server-side extraction, model summary, and follow-up Q&A.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              Upload a supported file type from the desktop app.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              Extract text with PDF and DOCX parsing on the backend.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              Ask targeted questions against the extracted content.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="panel p-5">
            <FileDropzone disabled={status !== "idle"} onFiles={handleUpload} />
            {status === "uploading" ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Parsing and summarizing document...
              </div>
            ) : null}
            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
          </div>

          <div className="panel min-h-0 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-heading text-lg font-semibold">Uploaded Files</h3>
              <Badge>{documents.length}</Badge>
            </div>
            <div className="space-y-2 overflow-y-auto">
              {documents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">
                  No documents uploaded yet.
                </div>
              ) : (
                documents.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => setSelectedDocumentId(document.id)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                      selectedDocument?.id === document.id
                        ? "border-primary/35 bg-primary/10"
                        : "border-white/10 bg-black/20 hover:border-white/16"
                    }`}
                  >
                    <div className="font-medium text-foreground">{truncate(document.name, 34)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {bytesToReadable(document.size)} / {formatRelativeTime(document.createdAt)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="panel flex min-h-0 flex-col p-5">
          {selectedDocument ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h3 className="font-heading text-2xl font-semibold">{selectedDocument.name}</h3>
                {selectedDocument.truncated ? (
                  <Badge className="border-amber-400/20 bg-amber-400/10 text-amber-200">
                    Large document context truncated for MVP
                  </Badge>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)]">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 text-sm font-medium text-foreground">Summary</div>
                  <div className="prose prose-invert prose-sm max-w-none text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedDocument.summary}</ReactMarkdown>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                    <MessageSquareText className="h-4 w-4 text-primary" />
                    Ask about this document
                  </div>
                  <Input
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="What are the key risks in this document?"
                  />
                  <Button
                    className="mt-3 w-full"
                    onClick={() => void handleAsk()}
                    disabled={status !== "idle" || !question.trim()}
                  >
                    {status === "asking" ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquareText className="h-4 w-4" />
                    )}
                    Ask NovaMind
                  </Button>
                </div>
              </div>

              <div className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-3xl border border-white/10 bg-black/20 p-4">
                {answer ? (
                  <div className="prose prose-invert prose-sm max-w-none text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
                    Ask a question to get a grounded answer from the uploaded document.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <h3 className="font-heading text-xl font-semibold">Upload a document to begin</h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                  The MVP extracts text on the Express backend, summarizes it with OpenAI, and keeps the extracted content in memory for follow-up questions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
