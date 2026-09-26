import { AUTH_MESSAGES } from "@/lib/auth/constants"

export function getSafeNext(next: string | null | undefined, fallback = "/profile"): string {
  if (!next) return fallback
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return fallback
  }
  return next
}

export function loginPath(next?: string | null): string {
  const safe = next ? getSafeNext(next, "") : ""
  if (!safe) return "/login"
  return `/login?next=${encodeURIComponent(safe)}`
}

const YANDEX_NOTICES: Record<string, string> = {
  link_required: AUTH_MESSAGES.yandexLinkRequired,
  yandex_oauth_failed: AUTH_MESSAGES.yandexOauthFailed,
  yandex_oauth_cancelled: AUTH_MESSAGES.yandexOauthCancelled,
  yandex_state_invalid: AUTH_MESSAGES.yandexStateInvalid,
  already_linked: AUTH_MESSAGES.yandexAlreadyLinked,
  yandex_already_linked: AUTH_MESSAGES.yandexAlreadyLinked,
  yandex_no_email: AUTH_MESSAGES.yandexNoEmail,
  linked: AUTH_MESSAGES.yandexLinked,
  rate_limited: AUTH_MESSAGES.yandexRateLimited,
}

export function yandexNotice(code: string | null | undefined): string | null {
  if (!code) return null
  return YANDEX_NOTICES[code] ?? null
}

export function registerPath(next?: string | null): string {
  const safe = next ? getSafeNext(next, "") : ""
  if (!safe) return "/register"
  return `/register?next=${encodeURIComponent(safe)}`
}
