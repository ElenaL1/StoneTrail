import { AUTH_MESSAGES } from "@/lib/auth/constants"
import { withRequestId } from "@/lib/content-request"
import type {
  AuthErrorCode,
  AuthFailure,
  AuthResult,
  LoginInput,
  PasswordResetRequestResult,
  PasswordResetResult,
  ProfileUpdateInput,
  PublicUser,
  RegisterInput,
  ResendResult,
  YandexCompleteInput,
  YandexPending,
} from "@/lib/auth/types"

const AUTH_ERROR_CODES: ReadonlySet<string> = new Set([
  "email_taken",
  "nickname_taken",
  "invalid_credentials",
  "rate_limited",
  "unverified",
  "token_expired",
  "token_used",
  "token_invalid",
  "network",
  "validation",
])

export function getApiBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")
  if (typeof window === "undefined") {
    return process.env.API_URL?.replace(/\/$/, "") || publicUrl || "http://localhost:8000"
  }
  return publicUrl || ""
}

function fail(partial: Omit<AuthFailure, "ok">): AuthFailure {
  return { ok: false, ...partial }
}

function networkFailure(): AuthFailure {
  return fail({ message: AUTH_MESSAGES.network, code: "network" })
}

function asErrorCode(value: unknown): AuthErrorCode | undefined {
  return typeof value === "string" && AUTH_ERROR_CODES.has(value) ? (value as AuthErrorCode) : undefined
}

function toAuthFailure(body: unknown): AuthFailure {
  if (typeof body !== "object" || body === null) {
    return networkFailure()
  }
  const data = body as Record<string, unknown>
  if (typeof data.message !== "string") {
    return networkFailure()
  }
  const requestId = typeof data.requestId === "string" ? data.requestId : undefined
  return fail({
    message: withRequestId(data.message, requestId),
    code: asErrorCode(data.code),
    fieldErrors:
      typeof data.fieldErrors === "object" && data.fieldErrors !== null
        ? (data.fieldErrors as Record<string, string>)
        : undefined,
    retryAfterSeconds: typeof data.retryAfterSeconds === "number" ? data.retryAfterSeconds : undefined,
    requestId,
  })
}

function normalizeUser(data: PublicUser): PublicUser {
  return {
    ...data,
    name: data.name || data.nickname,
    avatar: data.avatar ?? "",
    yandexLinked: Boolean(data.yandexLinked),
    canPublishArticles: Boolean(data.canPublishArticles),
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<AuthResult<T>> {
  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    })
  } catch {
    return networkFailure()
  }

  let parsed: unknown = null
  const text = await response.text()
  if (text) {
    try {
      parsed = JSON.parse(text)
    } catch {
      return networkFailure()
    }
  }

  if (!response.ok) {
    return toAuthFailure(parsed)
  }

  return { ok: true, data: parsed as T }
}

export const authApi = {
  async me(): Promise<AuthResult<PublicUser | null>> {
    const result = await request<PublicUser>("/auth/me")
    if (result.ok) {
      return { ok: true, data: normalizeUser(result.data) }
    }
    if (result.code === "invalid_credentials") {
      return { ok: true, data: null }
    }
    return result
  },

  async register(input: RegisterInput): Promise<AuthResult<PublicUser & { demoVerificationPath?: string }>> {
    const result = await request<PublicUser & { demoVerificationPath?: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    })
    if (!result.ok) return result
    return {
      ok: true,
      data: {
        ...normalizeUser(result.data),
        demoVerificationPath: result.data.demoVerificationPath,
      },
    }
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const result = await request<PublicUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    })
    if (!result.ok) return result
    return { ok: true, data: normalizeUser(result.data) }
  },

  async logout(): Promise<void> {
    await request("/auth/logout", { method: "POST" })
  },

  async updateProfile(input: ProfileUpdateInput): Promise<AuthResult> {
    const { avatar: _avatar, ...payload } = input
    const result = await request<PublicUser>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
    if (!result.ok) return result
    return { ok: true, data: normalizeUser(result.data) }
  },

  async resendVerification(): Promise<AuthResult<ResendResult>> {
    return request<ResendResult>("/auth/resend-verification", { method: "POST" })
  },

  async changeEmail(email: string): Promise<AuthResult<ResendResult>> {
    return request<ResendResult>("/auth/change-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  },

  async verifyEmail(token: string): Promise<AuthResult> {
    const result = await request<PublicUser>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
    if (!result.ok) return result
    return { ok: true, data: normalizeUser(result.data) }
  },

  async requestPasswordReset(email: string): Promise<AuthResult<PasswordResetRequestResult>> {
    return request<PasswordResetRequestResult>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
  },

  async yandexPending(): Promise<AuthResult<YandexPending>> {
    return request<YandexPending>("/auth/yandex/pending")
  },

  async completeYandex(input: YandexCompleteInput): Promise<AuthResult> {
    const result = await request<PublicUser>("/auth/yandex/complete", {
      method: "POST",
      body: JSON.stringify(input),
    })
    if (!result.ok) return result
    return { ok: true, data: normalizeUser(result.data) }
  },

  async resetPassword(
    token: string,
    password: string,
    confirmPassword: string,
  ): Promise<AuthResult<PasswordResetResult>> {
    return request<PasswordResetResult>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password, confirmPassword }),
    })
  },
}
