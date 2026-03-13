import type { PointerEvent as ReactPointerEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Crosshair, Eraser, Monitor, RefreshCcw } from "lucide-react";
import type { ScreenSelection } from "../types/app";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

interface ScreenCaptureProps {
  imageDataUrl: string | null;
  selection: ScreenSelection | null;
  isCapturing: boolean;
  onCapture: () => void | Promise<void>;
  onSelectionChange: (selection: ScreenSelection | null) => void;
}

interface Dimensions {
  naturalWidth: number;
  naturalHeight: number;
}

export function ScreenCapture({
  imageDataUrl,
  selection,
  isCapturing,
  onCapture,
  onSelectionChange
}: ScreenCaptureProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState<Dimensions>({
    naturalWidth: 0,
    naturalHeight: 0
  });

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onSelectionChange(null);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onSelectionChange]);

  function getNaturalPoint(event: ReactPointerEvent<HTMLDivElement>) {
    const image = imgRef.current;
    if (!image) return null;
    const rect = image.getBoundingClientRect();
    const relativeX = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const relativeY = Math.min(Math.max(event.clientY - rect.top, 0), rect.height);

    return {
      x: Math.round((relativeX / rect.width) * image.naturalWidth),
      y: Math.round((relativeY / rect.height) * image.naturalHeight)
    };
  }

  function updateSelection(current: { x: number; y: number }) {
    const start = startPointRef.current;
    if (!start) return;

    const left = Math.min(start.x, current.x);
    const top = Math.min(start.y, current.y);
    const width = Math.abs(start.x - current.x);
    const height = Math.abs(start.y - current.y);

    onSelectionChange({ x: left, y: top, width, height });
  }

  const overlayStyle =
    selection && dimensions.naturalWidth && dimensions.naturalHeight
      ? {
          left: `${(selection.x / dimensions.naturalWidth) * 100}%`,
          top: `${(selection.y / dimensions.naturalHeight) * 100}%`,
          width: `${(selection.width / dimensions.naturalWidth) * 100}%`,
          height: `${(selection.height / dimensions.naturalHeight) * 100}%`
        }
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => void onCapture()} disabled={isCapturing}>
          {imageDataUrl ? <RefreshCcw className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
          {imageDataUrl ? "Recapture Screen" : "Capture Screen"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => onSelectionChange(null)}
          disabled={!selection}
        >
          <Eraser className="h-4 w-4" />
          Clear Selection
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Crosshair className="h-4 w-4" />
          Drag a rectangle over the captured screen to analyze a specific region.
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
        {!imageDataUrl ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary/12 text-primary">
              <Monitor className="h-8 w-8" />
            </div>
            <h3 className="font-heading text-xl font-semibold">Screen selection tool</h3>
            <p className="mt-3 max-w-lg text-sm leading-7 text-muted-foreground">
              Capture the current display, then draw a region over the preview. NovaMind will send that cropped image to the vision model and explain what it sees.
            </p>
          </div>
        ) : (
          <div
            className="relative w-full cursor-crosshair overflow-hidden bg-slate-950"
            onPointerDown={(event) => {
              const point = getNaturalPoint(event);
              if (!point) return;
              startPointRef.current = point;
              onSelectionChange({ x: point.x, y: point.y, width: 0, height: 0 });
            }}
            onPointerMove={(event) => {
              const point = getNaturalPoint(event);
              if (!point || !startPointRef.current) return;
              updateSelection(point);
            }}
            onPointerUp={(event) => {
              const point = getNaturalPoint(event);
              if (!point) {
                startPointRef.current = null;
                return;
              }
              updateSelection(point);
              startPointRef.current = null;
            }}
          >
            <img
              ref={imgRef}
              src={imageDataUrl}
              alt="Captured screen"
              className="max-h-[620px] w-full object-contain"
              onLoad={(event) => {
                setDimensions({
                  naturalWidth: event.currentTarget.naturalWidth,
                  naturalHeight: event.currentTarget.naturalHeight
                });
              }}
            />
            {selection && overlayStyle ? (
              <div
                className={cn(
                  "pointer-events-none absolute border border-primary bg-primary/20 shadow-[0_0_0_9999px_rgba(2,6,23,0.42)]"
                )}
                style={overlayStyle}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
