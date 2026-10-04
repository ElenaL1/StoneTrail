const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Moscow",
})

export function formatFeedDate(value: string | null | undefined): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return dateFormat.format(date).replace(/\s?г\.$/, "")
}

export function expiryNote(value: string): string {
  const formatted = formatFeedDate(value)
  return formatted ? `Предложение действительно до ${formatted}` : ""
}

export function isPromotionCurrent(expiresAt: string, now = new Date()): boolean {
  const expiry = new Date(expiresAt)
  if (Number.isNaN(expiry.getTime())) return false
  return expiry.getTime() >= now.getTime()
}

export function toExpiryInput(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
  return parts
}

export function fromExpiryInput(value: string): string {
  return `${value}T23:59:59+03:00`
}
