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

export function registerPath(next?: string | null): string {
  const safe = next ? getSafeNext(next, "") : ""
  if (!safe) return "/register"
  return `/register?next=${encodeURIComponent(safe)}`
}
