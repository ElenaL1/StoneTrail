import { cache } from "react"
import { getApiBaseUrl } from "@/lib/auth/api-client"
import type { ActivePromotion } from "@/lib/types"

export const loadActivePromotions = cache(async (): Promise<ActivePromotion[]> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/promotions/active`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
    if (!response.ok) return []
    const data = (await response.json()) as ActivePromotion[]
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
})

export async function hasActiveBanner(): Promise<boolean> {
  const items = await loadActivePromotions()
  return items.length > 0
}
