import { getApiBaseUrl } from "@/lib/auth/api-client"

const DEFAULT_MESSAGE = "Не удалось выполнить запрос. Попробуйте ещё раз."

export function withRequestId(message: string, requestId?: string): string {
  if (!requestId) return message
  return `${message} Код: ${requestId}`
}

export class ContentRequestError extends Error {
  readonly requestId?: string

  constructor(
    readonly status: number,
    readonly code?: string,
    message = DEFAULT_MESSAGE,
    requestId?: string,
  ) {
    super(withRequestId(message, requestId))
    this.name = "ContentRequestError"
    this.requestId = requestId
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
    throw new ContentRequestError(0, "network", DEFAULT_MESSAGE)
  }

  const text = await response.text()
  let parsed: unknown = null
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown
    } catch {
      throw new ContentRequestError(response.status, "network", DEFAULT_MESSAGE)
    }
  }

  if (!response.ok) {
    const body = parsed as { code?: string; message?: string; requestId?: string } | null
    const requestId = typeof body?.requestId === "string" ? body.requestId : undefined
    throw new ContentRequestError(
      response.status,
      body?.code,
      typeof body?.message === "string" ? body.message : DEFAULT_MESSAGE,
      requestId,
    )
  }

  return parsed as T
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ContentRequestError && error.status === 404
}
