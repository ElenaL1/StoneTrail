import type { UserRole } from "@/lib/auth/types"

export function isStaff(role: UserRole | undefined): boolean {
  return role === "moderator" || role === "editor" || role === "admin"
}

export function formatRuDate(value: string | null | undefined): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatReadTime(minutes: number): string {
  return `${minutes} мин`
}

export const ARTICLE_STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  pending_review: "На модерации",
  needs_revision: "Нужны правки",
  rejected: "Отклонена",
  published: "Опубликована",
  archived: "Снята с публикации",
}
