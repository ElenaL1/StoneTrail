import { getApiBaseUrl } from "@/lib/auth/api-client"

export type PageCopy = {
  text: (key: string, fallback: string) => string
  effectiveFrom: string | null
}

const empty: PageCopy = {
  text: (_key, fallback) => fallback,
  effectiveFrom: null,
}

export async function loadCopy(pageKey: string): Promise<PageCopy> {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/pages/content?page_key=${encodeURIComponent(pageKey)}`,
      { headers: { Accept: "application/json" }, cache: "no-store" },
    )
    if (!response.ok) return empty
    const payload = (await response.json()) as {
      effectiveFrom?: string | null
      blocks?: { blockKey: string; value: string }[]
    }
    const values = new Map(
      (payload.blocks ?? []).map((block) => [block.blockKey, block.value]),
    )
    return {
      effectiveFrom: payload.effectiveFrom ?? null,
      text(key, fallback) {
        const value = values.get(key)?.trim()
        return value ? value : fallback
      },
    }
  } catch {
    return empty
  }
}
