import { contentRequest } from "@/lib/content-request"
import type { UserRole } from "@/lib/auth/types"

export type AdminUser = {
  id: string
  email: string
  nickname: string
  role: UserRole
}

export type Lookup = { code: string; label: string }

export type CatalogLookups = {
  stoneTypes: Lookup[]
  finishes: Lookup[]
  applications: Lookup[]
}

export type StoneEdit = {
  slug: string
  name: string
  stoneTypeCode: string
  quarry: string
  country: string
  description: string
}

export type BlockItemEdit = {
  label: string
  status: string
  lengthMm: number | null
  widthMm: number | null
  heightMm: number | null
  weightKg: string | null
  finishCode: string | null
  sortOrder: number
}

export type BlockEdit = {
  slug: string
  stoneSlug: string
  description: string
  expertNote: string
  items: BlockItemEdit[]
}

export type ProductItemEdit = {
  label: string
  kind: string | null
  status: string
  lengthMm: number | null
  widthMm: number | null
  thicknessMm: number | null
  weightKg: string | null
  finishCode: string
  note: string | null
  sortOrder: number
}

export type ProductEdit = {
  slug: string
  recordId: string
  name: string
  stoneSlug: string
  category: string
  description: string
  productType: string | null
  customGroup: string | null
  purpose: string | null
  priceType: string
  amount: string | null
  priceUnit: string | null
  characteristics: Record<string, string>
  height: string | null
  diameter: string | null
  format: string | null
  color: string | null
  thickness: string | null
  finish: string | null
  size: string | null
  dimensions: string | null
  expertNote: string | null
  status: string | null
  applicationCodes: string[]
  items: ProductItemEdit[]
}

export type MediaItem = {
  id: string
  publicUrl: string
  alt: string
  mimeType: string
  sizeBytes: number
}

export type PageSummary = {
  pageKey: string
  title: string
  legal: boolean
}

export type PageBlockAdmin = {
  blockKey: string
  kind: "text" | "markdown" | "image"
  label: string
  fallback: string
  draftValue: string
  publishedValue: string
  status: string
  effectiveFrom: string | null
}

export type PageAdmin = {
  pageKey: string
  title: string
  legal: boolean
  effectiveFrom: string | null
  blocks: PageBlockAdmin[]
}

export type AuditEvent = {
  id: string
  actorId: string | null
  action: string
  entityType: string
  entityId: string
  detail: Record<string, string>
  createdAt: string
}

export const adminApi = {
  listUsers: () => contentRequest<AdminUser[]>("/api/admin/users"),
  setRole: (id: string, role: UserRole) =>
    contentRequest<AdminUser>(`/api/admin/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  lookups: () => contentRequest<CatalogLookups>("/api/catalog/lookups"),
  stoneEdit: (slug: string) =>
    contentRequest<StoneEdit>(`/api/catalog/stones/${encodeURIComponent(slug)}/edit`),
  saveStone: (slug: string | null, body: Record<string, unknown>) =>
    contentRequest<Record<string, unknown>>(
      slug ? `/api/catalog/stones/${encodeURIComponent(slug)}` : "/api/catalog/stones",
      { method: slug ? "PATCH" : "POST", body: JSON.stringify(body) },
    ),
  deleteStone: (slug: string) =>
    contentRequest<void>(`/api/catalog/stones/${encodeURIComponent(slug)}`, { method: "DELETE" }),
  blockEdit: (slug: string) =>
    contentRequest<BlockEdit>(`/api/catalog/blocks/${encodeURIComponent(slug)}/edit`),
  saveBlock: (slug: string | null, body: Record<string, unknown>) =>
    contentRequest<Record<string, unknown>>(
      slug ? `/api/catalog/blocks/${encodeURIComponent(slug)}` : "/api/catalog/blocks",
      { method: slug ? "PATCH" : "POST", body: JSON.stringify(body) },
    ),
  deleteBlock: (slug: string) =>
    contentRequest<void>(`/api/catalog/blocks/${encodeURIComponent(slug)}`, { method: "DELETE" }),
  productEdit: (slug: string) =>
    contentRequest<ProductEdit>(
      `/api/catalog/products/${encodeURIComponent(slug)}/edit`,
    ),
  saveProduct: (slug: string | null, body: Record<string, unknown>) =>
    contentRequest<Record<string, unknown>>(
      slug ? `/api/catalog/products/${encodeURIComponent(slug)}` : "/api/catalog/products",
      { method: slug ? "PATCH" : "POST", body: JSON.stringify(body) },
    ),
  deleteProduct: (slug: string) =>
    contentRequest<void>(`/api/catalog/products/${encodeURIComponent(slug)}`, { method: "DELETE" }),
  listMedia: () => contentRequest<MediaItem[]>("/api/media"),
  presign: (contentType: string, sizeBytes: number) =>
    contentRequest<{
      storageKey: string
      uploadUrl: string
      publicUrl: string
      headers: Record<string, string>
    }>("/api/media/presign", {
      method: "POST",
      body: JSON.stringify({ contentType, sizeBytes }),
    }),
  confirmMedia: (body: Record<string, unknown>) =>
    contentRequest<MediaItem>("/api/media", { method: "POST", body: JSON.stringify(body) }),
  linkMedia: (id: string, body: Record<string, unknown>) =>
    contentRequest<Record<string, unknown>>(`/api/media/${id}/links`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteMedia: (id: string) => contentRequest<void>(`/api/media/${id}`, { method: "DELETE" }),
  listPages: () => contentRequest<PageSummary[]>("/api/admin/pages"),
  page: (pageKey: string) =>
    contentRequest<PageAdmin>(
      `/api/admin/pages/content?page_key=${encodeURIComponent(pageKey)}`,
    ),
  savePage: (pageKey: string, blocks: { blockKey: string; value: string }[]) =>
    contentRequest<PageAdmin>(
      `/api/admin/pages/content?page_key=${encodeURIComponent(pageKey)}`,
      { method: "PUT", body: JSON.stringify({ blocks }) },
    ),
  publishPage: (pageKey: string, effectiveFrom?: string) =>
    contentRequest<PageAdmin>(
      `/api/admin/pages/content/publish?page_key=${encodeURIComponent(pageKey)}`,
      {
        method: "POST",
        body: JSON.stringify(effectiveFrom ? { effectiveFrom } : {}),
      },
    ),
  audit: () => contentRequest<AuditEvent[]>("/api/admin/audit"),
}
