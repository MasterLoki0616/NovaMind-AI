import { normalizeText } from "../textNormalizer";

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownishToHtml(content: string) {
  let listOpen = false;
  const parts: string[] = [];

  normalizeText(content)
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        if (listOpen) {
          parts.push("</ul>");
          listOpen = false;
        }
        return;
      }

      if (trimmed.startsWith("# ")) {
        if (listOpen) {
          parts.push("</ul>");
          listOpen = false;
        }
        parts.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
        return;
      }

      if (trimmed.startsWith("## ")) {
        if (listOpen) {
          parts.push("</ul>");
          listOpen = false;
        }
        parts.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
        return;
      }

      if (/^[-*]\s+/.test(trimmed)) {
        if (!listOpen) {
          parts.push("<ul>");
          listOpen = true;
        }
        parts.push(`<li>${escapeHtml(trimmed.replace(/^[-*]\s+/, ""))}</li>`);
        return;
      }

      if (listOpen) {
        parts.push("</ul>");
        listOpen = false;
      }
      parts.push(`<p>${escapeHtml(trimmed)}</p>`);
    });

  if (listOpen) {
    parts.push("</ul>");
  }

  return parts.join("\n");
}

export function createHtmlBlob(content: string, title: string) {
  const normalized = normalizeText(content);
  const html = /<html[\s>]/i.test(normalized)
    ? normalized
    : `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { background: #0b1120; color: #e5edf8; font-family: Inter, ui-sans-serif, system-ui; line-height: 1.65; max-width: 820px; margin: 48px auto; padding: 0 24px; }
    h1, h2 { color: #7dd3fc; }
    p, li { color: #cbd5e1; }
  </style>
</head>
<body>
${markdownishToHtml(normalized)}
</body>
</html>`;

  return {
    content: html,
    blob: new Blob([new TextEncoder().encode(html)], {
      type: "text/html;charset=utf-8"
    })
  };
}
