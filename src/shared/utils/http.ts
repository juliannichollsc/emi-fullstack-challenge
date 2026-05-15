// Task 8 — wrapper de fetch con manejo de errores uniforme.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text().catch(() => null);
    }
    throw new HttpError(res.status, `HTTP ${res.status} ${res.statusText}`, body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
