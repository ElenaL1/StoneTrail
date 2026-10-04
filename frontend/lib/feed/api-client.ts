import { contentRequest } from "@/lib/content-request"
import type { ActivePromotion, IndustryNews, NewsStatus, Promotion } from "@/lib/types"
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
  isEnabled: boolean
  expiresAt: string
  slug?: string
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
}
