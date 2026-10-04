import { contentRequest } from "@/lib/content-request"

export type MediaPurpose = "avatar" | "forum_image" | "forum_video"

export type MediaUpload = {
  id: string
  storageKey: string
  uploadUrl: string
  publicUrl: string
  headers: Record<string, string>
}

export type StoredMedia = {
  id: string
  publicUrl: string
  alt: string
  mimeType: string
  sizeBytes: number
  kind: string
}

export const mediaApi = {
  init(purpose: MediaPurpose, contentType: string, sizeBytes: number) {
    return contentRequest<MediaUpload>("/api/media/uploads", {
      method: "POST",
      body: JSON.stringify({ purpose, contentType, sizeBytes }),
    })
  },

  complete(id: string) {
    return contentRequest<StoredMedia>(`/api/media/${encodeURIComponent(id)}/complete`, {
      method: "POST",
    })
  },

  external(url: string) {
    return contentRequest<StoredMedia>("/api/media/external", {
      method: "POST",
      body: JSON.stringify({ url }),
    })
  },

  clearAvatar() {
    return contentRequest<void>("/api/media/avatar", { method: "DELETE" })
  },
}
