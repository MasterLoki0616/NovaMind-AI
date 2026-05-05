function sanitizeFileName(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "") || "novamind-image";
}

async function sourceToBlob(source: string) {
  const response = await fetch(source);

  if (!response.ok) {
    throw new Error("Failed to prepare the generated image for download.");
  }

  return response.blob();
}

export function buildGeneratedImageName(label?: string) {
  return `${sanitizeFileName(label || "novamind image")}.png`;
}

export async function downloadGeneratedImage(source: string, label?: string) {
  const blob = await sourceToBlob(source);
  const suggestedName = buildGeneratedImageName(label);
  const browserWindow = window as Window & {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{
        description?: string;
        accept?: Record<string, string[]>;
      }>;
    }) => Promise<{
      createWritable: () => Promise<{
        write: (data: Blob) => Promise<void>;
        close: () => Promise<void>;
      }>;
    }>;
  };

  if (typeof browserWindow.showSaveFilePicker === "function") {
    const handle = await browserWindow.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: "PNG Image",
          accept: {
            "image/png": [".png"]
          }
        }
      ]
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = suggestedName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
