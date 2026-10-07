import { contentRequest } from "@/lib/content-request"
import type {
  ActivePromotion,
  IndustryNews,
  NewsStatus,
  Notification,
  Promotion,
  PromotionLine,
} from "@/lib/types"
import type { BannerTemplateId } from "@/components/promo-banner"

export type NewsInput = {
  title: string
  excerpt: string
  content: string
  status?: NewsStatus
  slug?: string
}

export type PromotionInput = {
  title: string
  description: string
  content: string
  template: BannerTemplateId
  buttonLabel: string
  inquiryLabel: string
  isEnabled: boolean
  publishToCatalog: boolean
  offerNote: string
  expiresAt: string
  slug?: string
}

export type OfferPreview = {
  offerNote: string
  lines: PromotionLine[]
}

export type PromotionLinesInput = {
  offerNote: string
  publishToCatalog: boolean
  lines: Array<
    Omit<PromotionLine, "id" | "sortOrder"> & {
      createStone?: { stoneTypeCode: string; quarry: string; country: string } | null
    }
  >
}

export const newsApi = {
  listPublished() {
    return contentRequest<IndustryNews[]>("/api/news")
  },
  listManaged(deleted = false) {
    return contentRequest<IndustryNews[]>(`/api/news/manage?deleted=${deleted}`)
  },
  get(slug: string) {
    return contentRequest<IndustryNews>(`/api/news/${slug}`)
  },
  create(input: NewsInput) {
    return contentRequest<IndustryNews>("/api/news", { method: "POST", body: JSON.stringify(input) })
  },
  update(slug: string, input: Partial<NewsInput>) {
    return contentRequest<IndustryNews>(`/api/news/${slug}`, { method: "PATCH", body: JSON.stringify(input) })
  },
  publish(slug: string) {
    return contentRequest<IndustryNews>(`/api/news/${slug}/publish`, { method: "POST" })
  },
  remove(slug: string) {
    return contentRequest<void>(`/api/news/${slug}`, { method: "DELETE" })
  },
  restore(slug: string) {
    return contentRequest<IndustryNews>(`/api/news/${slug}/restore`, { method: "POST" })
  },
  like(slug: string) {
    return contentRequest<{ liked: boolean; likesCount: number }>(`/api/news/${slug}/likes`, { method: "POST" })
  },
}

export const promotionsApi = {
  listPublic() {
    return contentRequest<Promotion[]>("/api/promotions")
  },
  listActive() {
    return contentRequest<ActivePromotion[]>("/api/promotions/active")
  },
  listManaged(deleted = false) {
    return contentRequest<Promotion[]>(`/api/promotions/manage?deleted=${deleted}`)
  },
  get(slug: string) {
    return contentRequest<Promotion>(`/api/promotions/${slug}`)
  },
  create(input: PromotionInput) {
    return contentRequest<Promotion>("/api/promotions", { method: "POST", body: JSON.stringify(input) })
  },
  update(slug: string, input: Partial<PromotionInput>) {
    return contentRequest<Promotion>(`/api/promotions/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    })
  },
  remove(slug: string) {
    return contentRequest<void>(`/api/promotions/${slug}`, { method: "DELETE" })
  },
  restore(slug: string) {
    return contentRequest<Promotion>(`/api/promotions/${slug}/restore`, { method: "POST" })
  },
  like(slug: string) {
    return contentRequest<{ liked: boolean; likesCount: number }>(`/api/promotions/${slug}/likes`, {
      method: "POST",
    })
  },
  importSheet(file: File) {
    const body = new FormData()
    body.append("file", file)
    return contentRequest<OfferPreview>("/api/promotions/import", { method: "POST", body })
  },
  replaceLines(slug: string, input: PromotionLinesInput) {
    return contentRequest<Promotion>(`/api/promotions/${slug}/lines`, {
      method: "PUT",
      body: JSON.stringify(input),
    })
  },
  attachSheet(slug: string, file: File) {
    const body = new FormData()
    body.append("file", file)
    return contentRequest<Promotion>(`/api/promotions/${slug}/sheet`, { method: "POST", body })
  },
}

export const notificationsApi = {
  list() {
    return contentRequest<Notification[]>("/api/notifications")
  },
  markRead(id: string) {
    return contentRequest<Notification>(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: "POST",
    })
  },
  markAllRead() {
    return contentRequest<void>("/api/notifications/read", { method: "POST" })
  },
}
