import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";
import { normalizeText } from "../textNormalizer";

const pdfMakeInstance = pdfMake as unknown as {
  vfs?: Record<string, string>;
  createPdf: (definition: TDocumentDefinitions) => {
    getBlob: (callback: (blob: Blob) => void) => void;
  };
};
const fontBundle = pdfFonts as unknown as {
  vfs?: Record<string, string>;
  pdfMake?: { vfs?: Record<string, string> };
};

pdfMakeInstance.vfs = fontBundle.vfs ?? fontBundle.pdfMake?.vfs ?? pdfMakeInstance.vfs;

function lineToPdfContent(line: string): Content | null {
  const trimmed = line.trim();

  if (!trimmed) {
    return { text: " ", margin: [0, 2, 0, 2] };
  }

  if (trimmed.startsWith("# ")) {
    return { text: trimmed.slice(2), fontSize: 20, bold: true, margin: [0, 0, 0, 10] };
  }

  if (trimmed.startsWith("## ")) {
    return { text: trimmed.slice(3), fontSize: 15, bold: true, margin: [0, 10, 0, 6] };
  }

  if (/^[-*]\s+/.test(trimmed)) {
    return {
      ul: [{ text: trimmed.replace(/^[-*]\s+/, ""), margin: [0, 1, 0, 1] }],
      margin: [12, 1, 0, 1]
    };
  }

  return { text: line, margin: [0, 2, 0, 6] };
}

export async function createPdfBlob(content: string, title: string) {
  const normalized = normalizeText(content);
  const body = normalized
    .split("\n")
    .map(lineToPdfContent)
    .filter((item): item is Content => Boolean(item));
  const definition: TDocumentDefinitions = {
    info: {
      title
    },
    pageSize: "A4",
    pageMargins: [48, 52, 48, 56],
    defaultStyle: {
      font: "Roboto",
      fontSize: 11,
      lineHeight: 1.2
    },
    content: body.length > 0 ? body : [{ text: title }]
  };

  return new Promise<{ blob: Blob; content: string }>((resolve) => {
    pdfMakeInstance.createPdf(definition).getBlob((blob) =>
      resolve({
        blob,
        content: normalized
      })
    );
  });
}
