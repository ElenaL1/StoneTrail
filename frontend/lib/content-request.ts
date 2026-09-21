import { getApiBaseUrl } from "@/lib/auth/api-client"

export class ContentRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
    message = "Не удалось выполнить запрос. Попробуйте ещё раз.",
  ) {
    super(message)
    this.name = "ContentRequestError"
  }
}

export async function contentRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    })
  } catch {
    throw new ContentRequestError(0, "network")
  }

  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown
    } catch {
      throw new ContentRequestError(response.status, "network")
    }
  }

  if (!response.ok) {
    const body = parsed as { code?: string; message?: string } | null
    throw new ContentRequestError(
      response.status,
      body?.code,
      body?.message,
    )
  }

  return parsed as T
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ContentRequestError && error.status === 404
}
