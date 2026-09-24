import { afterEach, describe, expect, test, vi } from "vitest"
import { ContentRequestError, contentRequest } from "@/lib/content-request"

const fetchMock = vi.fn()

describe("contentRequest", () => {
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  test("сохраняет requestId и не показывает сырой текст сети", async () => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "Не удалось выполнить запрос. Попробуйте ещё раз.",
          code: "internal",
          requestId: "req_abc12345",
        }),
        { status: 500 },
      ),
    )

    await expect(contentRequest("/api/forum/posts")).rejects.toMatchObject({
      status: 500,
      code: "internal",
      requestId: "req_abc12345",
      message: "Не удалось выполнить запрос. Попробуйте ещё раз. Код: req_abc12345",
    })
  })

  test("сетевой сбой не протекает текстом fetch", async () => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockRejectedValue(new TypeError("ECONNREFUSED 10.0.0.15:5432"))

    try {
      await contentRequest("/api/forum/posts")
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(ContentRequestError)
      expect((error as ContentRequestError).message).not.toContain("ECONNREFUSED")
      expect((error as ContentRequestError).code).toBe("network")
    }
  })
})
