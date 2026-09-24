import { getApiBaseUrl } from "@/lib/auth/api-client"
import type { Material, Product, StoneBlock } from "@/lib/types"

const CATALOG_MESSAGE = "Не удалось загрузить каталог. Попробуйте обновить страницу."

class CatalogRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code?: string,
    message = CATALOG_MESSAGE,
  ) {
    super(message)
    this.name = "CatalogRequestError"
  }
}

async function request<T>(path: string): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
  } catch {
    throw new CatalogRequestError(0, "network", CATALOG_MESSAGE)
  }

  if (response.status === 404) {
    throw new CatalogRequestError(404, "not_found")
  }

  const text = await response.text()
  if (!response.ok) {
    throw new CatalogRequestError(response.status, undefined, CATALOG_MESSAGE)
  }

  if (!text) {
    throw new CatalogRequestError(response.status, "network", CATALOG_MESSAGE)
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new CatalogRequestError(response.status, "network", CATALOG_MESSAGE)
  }
}

export function isNotFound(error: unknown): boolean {
  return error instanceof CatalogRequestError && error.status === 404
}

export const catalogApi = {
  listStones(): Promise<Material[]> {
    return request<Material[]>("/api/catalog/stones")
  },

  async getStone(slug: string): Promise<Material | null> {
    try {
      return await request<Material>(`/api/catalog/stones/${encodeURIComponent(slug)}`)
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  },

  listBlocks(): Promise<StoneBlock[]> {
    return request<StoneBlock[]>("/api/catalog/blocks")
  },

  async getBlock(slug: string): Promise<StoneBlock | null> {
    try {
      return await request<StoneBlock>(`/api/catalog/blocks/${encodeURIComponent(slug)}`)
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  },

  listProducts(params?: { category?: string; group?: string }): Promise<Product[]> {
    const search = new URLSearchParams()
    if (params?.category) search.set("category", params.category)
    if (params?.group) search.set("group", params.group)
    const query = search.toString()
    return request<Product[]>(`/api/catalog/products${query ? `?${query}` : ""}`)
  },

  async getProduct(slug: string): Promise<Product | null> {
    try {
      return await request<Product>(`/api/catalog/products/${encodeURIComponent(slug)}`)
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  },
}

export { CatalogRequestError }
