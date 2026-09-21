import { afterEach, describe, expect, test, vi } from "vitest"
import { authApi, getApiBaseUrl } from "@/lib/auth/api-client"
import { AUTH_MESSAGES } from "@/lib/auth/constants"
import type { ProfileUpdateInput, RegisterInput } from "@/lib/auth/types"

const fetchMock = vi.fn()

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

const registerInput: RegisterInput = {
  nickname: "StoneMaster",
  email: "ivan@company.ru",
  password: "StoneTrail1",
  termsAccepted: true,
  marketingConsent: false,
}

describe("getApiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test("в браузере без NEXT_PUBLIC_API_URL даёт same-origin", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "")
    vi.stubEnv("API_URL", "http://backend:8000")
    expect(getApiBaseUrl()).toBe("")
  })

  test("в браузере не подставляет server-only API_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:8000")
    vi.stubEnv("API_URL", "http://backend:8000")
    expect(getApiBaseUrl()).toBe("http://localhost:8000")
  })
})

describe("authApi", () => {
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  test("бьёт в NEXT_PUBLIC_API_URL с credentials include", async () => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        id: "1",
        email: "ivan@company.ru",
        nickname: "StoneMaster",
        name: "StoneMaster",
        firstName: "Иван",
        lastName: "Петров",
        company: "",
        position: "",
        activityType: "",
        avatar: "",
        country: "",
        city: "",
        bio: "",
        website: "",
        phone: "",
        emailVerified: true,
        canPublishArticles: false,
        role: "user",
        marketingConsent: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        lastLoginAt: null,
      }),
    )

    await authApi.me()

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${getApiBaseUrl()}/auth/me`)
    expect(init.credentials).toBe("include")
  })

  test("мапит ErrorBody в AuthFailure", async () => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockResolvedValue(
      jsonResponse(409, {
        message: AUTH_MESSAGES.emailTaken,
        code: "email_taken",
        fieldErrors: { email: AUTH_MESSAGES.emailTaken },
        retryAfterSeconds: null,
      }),
    )

    const result = await authApi.register(registerInput)

    expect(result).toEqual({
      ok: false,
      message: AUTH_MESSAGES.emailTaken,
      code: "email_taken",
      fieldErrors: { email: AUTH_MESSAGES.emailTaken },
    })
  })

  test("GET /me при 401 возвращает user: null", async () => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockResolvedValue(
      jsonResponse(401, {
        message: AUTH_MESSAGES.loginFailed,
        code: "invalid_credentials",
      }),
    )

    const result = await authApi.me()

    expect(result).toEqual({ ok: true, data: null })
  })

  test("сеть и не-JSON дают code network", async () => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))
    const offline = await authApi.login({ email: "ivan@company.ru", password: "StoneTrail1" })
    expect(offline).toEqual({
      ok: false,
      code: "network",
      message: AUTH_MESSAGES.network,
    })

    fetchMock.mockResolvedValue(new Response("<html>bad gateway</html>", { status: 502 }))
    const html = await authApi.login({ email: "ivan@company.ru", password: "StoneTrail1" })
    expect(html).toEqual({
      ok: false,
      code: "network",
      message: AUTH_MESSAGES.network,
    })
  })

  test("PATCH /profile не отправляет avatar", async () => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockResolvedValue(
      jsonResponse(200, {
        id: "1",
        email: "ivan@company.ru",
        nickname: "StoneMaster",
        name: "StoneMaster",
        firstName: "Иван",
        lastName: "Петров",
        company: "",
        position: "",
        activityType: "",
        avatar: "",
        country: "",
        city: "",
        bio: "",
        website: "",
        phone: "",
        emailVerified: true,
        canPublishArticles: false,
        role: "user",
        marketingConsent: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        lastLoginAt: null,
      }),
    )

    const input: ProfileUpdateInput = {
      nickname: "StoneMaster",
      firstName: "Иван",
      lastName: "Петров",
      company: "",
      position: "",
      activityType: "",
      country: "",
      city: "",
      bio: "",
      website: "",
      phone: "",
      avatar: "data:image/png;base64,AAAA",
      marketingConsent: false,
    }

    await authApi.updateProfile(input)

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body).not.toHaveProperty("avatar")
    expect(body).not.toHaveProperty("name")
    expect(body.nickname).toBe("StoneMaster")
  })
})
