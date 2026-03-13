function buildUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export async function fetchJson<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(buildUrl(baseUrl, path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const error = await safeReadError(response);
    throw new Error(error);
  }

  return (await response.json()) as T;
}

export async function fetchFormData<T>(
  baseUrl: string,
  path: string,
  body: FormData
): Promise<T> {
  const response = await fetch(buildUrl(baseUrl, path), {
    method: "POST",
    body
  });

  if (!response.ok) {
    const error = await safeReadError(response);
    throw new Error(error);
  }

  return (await response.json()) as T;
}

export async function safeReadError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || "Request failed.";
  } catch {
    return response.statusText || "Request failed.";
  }
}

export async function fetchBlob(baseUrl: string, path: string, init?: RequestInit) {
  const response = await fetch(buildUrl(baseUrl, path), init);

  if (!response.ok) {
    throw new Error(await safeReadError(response));
  }

  return response.blob();
}

export function getApiUrl(baseUrl: string, path: string) {
  return buildUrl(baseUrl, path);
}
