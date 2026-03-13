import { LoaderCircle, ScanSearch } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScreenCapture } from "../components/ScreenCapture";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { analyzeScreenImage } from "../services/ai";
import { captureScreenImage, cropImageDataUrl } from "../services/screen";
import type { AppSettings, ScreenSelection } from "../types/app";

interface ScreenAIPageProps {
  settings: AppSettings;
}

export function ScreenAIPage({ settings }: ScreenAIPageProps) {
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [selection, setSelection] = useState<ScreenSelection | null>(null);
  const [prompt, setPrompt] = useState("Explain what is on this screen and help me with it.");
  const [analysis, setAnalysis] = useState("");
  const [status, setStatus] = useState<"idle" | "capturing" | "analyzing">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleCapture() {
    setStatus("capturing");
    setError(null);

    try {
      const capture = await captureScreenImage();
      setImageDataUrl(capture);
      setSelection(null);
    } catch (innerError) {
      setError(innerError instanceof Error ? innerError.message : "Screen capture failed.");
    } finally {
      setStatus("idle");
    }
  }

  async function handleAnalyze() {
    if (!imageDataUrl) return;

    setStatus("analyzing");
    setError(null);
    setAnalysis("");

    try {
      const cropped = await cropImageDataUrl(imageDataUrl, selection);
      const result = await analyzeScreenImage(
        settings.apiBaseUrl,
        cropped,
        prompt,
        settings.defaultModel
      );

      setAnalysis(result.analysis);
    } catch (innerError) {
      setError(innerError instanceof Error ? innerError.message : "Screen analysis failed.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="panel p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="border-primary/20 bg-primary/10 text-primary">Very Important MVP</Badge>
            <Badge>Vision API</Badge>
          </div>
          <h2 className="font-heading text-3xl font-semibold">Understand what is on screen.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            Capture the screen, draw a region over the relevant content, and send that cropped image to the model. This is useful for math problems, UI explanation, code screenshots, and visual debugging.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ScanSearch className="h-5 w-5 text-primary" />
              Workflow
            </CardTitle>
            <CardDescription>Capture, crop, analyze, explain.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              1. Capture the current display with Tauri or browser fallback.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              2. Drag a rectangle over the relevant region.
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              3. Ask NovaMind to explain, solve, summarize, or debug what it sees.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="panel min-h-0 p-5">
          <ScreenCapture
            imageDataUrl={imageDataUrl}
            selection={selection}
            isCapturing={status === "capturing"}
            onCapture={handleCapture}
            onSelectionChange={setSelection}
          />
        </div>

        <div className="panel flex min-h-0 flex-col p-5">
          <div className="mb-4">
            <h3 className="font-heading text-xl font-semibold">Screen prompt</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell NovaMind what you want from the captured region.
            </p>
          </div>

          <Input value={prompt} onChange={(event) => setPrompt(event.target.value)} />

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              onClick={() => void handleAnalyze()}
              disabled={!imageDataUrl || status !== "idle"}
            >
              {status === "analyzing" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ScanSearch className="h-4 w-4" />
              )}
              Analyze Selection
            </Button>
            <Badge>
              {selection
                ? `${selection.width} x ${selection.height}px selected`
                : "Using full captured screen"}
            </Badge>
          </div>

          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

          <div className="mt-6 min-h-0 flex-1 overflow-y-auto rounded-3xl border border-white/10 bg-black/20 p-4">
            {analysis ? (
              <div className="prose prose-invert prose-sm max-w-none text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  Awaiting analysis
                </div>
                <p className="max-w-sm text-sm leading-7 text-muted-foreground">
                  Capture the screen, select a region, and ask NovaMind what it should do with that image.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
