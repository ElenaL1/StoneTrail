import { afterEach, describe, expect, test, vi } from "vitest"
import { catalogApi, CatalogRequestError } from "@/lib/catalog/api-client"
import { getApiBaseUrl } from "@/lib/auth/api-client"

const fetchMock = vi.fn()

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("catalogApi", () => {
  afterEach(() => {
    fetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  test("ходит в тот же API base без credentials", async () => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockResolvedValue(jsonResponse(200, []))

    await catalogApi.listStones()

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${getApiBaseUrl()}/catalog/stones`)
    expect(url.endsWith("/catalog/stones")).toBe(true)
    expect(init.credentials).not.toBe("include")
  })

  test("404 getStone возвращает null", async () => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockResolvedValue(
      jsonResponse(404, { message: "Не найдено.", code: "not_found" }),
    )

    await expect(catalogApi.getStone("missing")).resolves.toBeNull()
  })

  test("сеть даёт CatalogRequestError", async () => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))

    await expect(catalogApi.listProducts()).rejects.toBeInstanceOf(CatalogRequestError)
  })

  test("прокидывает category и group", async () => {
    vi.stubGlobal("fetch", fetchMock)
    fetchMock.mockResolvedValue(jsonResponse(200, []))

    await catalogApi.listProducts({ category: "paving", group: "interior" })

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain("/catalog/products?")
    expect(url).toContain("category=paving")
    expect(url).toContain("group=interior")
  })
})
