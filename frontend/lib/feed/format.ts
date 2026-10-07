const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Moscow",
})

export function formatRelativeTime(value: string, now = new Date()): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const elapsed = now.getTime() - date.getTime()
  if (elapsed < 60_000) return "только что"
  const minutes = Math.floor(elapsed / 60_000)
  if (minutes < 60) return `${minutes} мин назад`
  const hours = Math.floor(elapsed / 3_600_000)
  if (hours < 24) return `${hours} ч назад`
  const days = Math.floor(elapsed / 86_400_000)
  if (days < 7) return `${days} д назад`
  return formatFeedDate(value)
}

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
