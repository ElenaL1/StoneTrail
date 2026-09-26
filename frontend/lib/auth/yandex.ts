import { getApiBaseUrl } from "@/lib/auth/api-client"
import { getSafeNext } from "@/lib/auth/paths"

export function yandexStartPath(next?: string | null, intent?: "link"): string {
  const params = new URLSearchParams()
  if (intent) params.set("intent", intent)
  const safe = next ? getSafeNext(next, "") : ""
  if (safe) params.set("next", safe)
  const query = params.toString()
  return `${getApiBaseUrl()}/auth/yandex${query ? `?${query}` : ""}`
}
