import type { ForumAttachment } from "@/lib/types"

export function rutubeEmbedSrc(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:" || parsed.hostname !== "rutube.ru") return null
    const id = parsed.pathname.match(/^\/play\/embed\/([0-9a-fA-F]{32})\/?$/)?.[1]
    if (!id) return null
    return `https://rutube.ru/play/embed/${id}`
  } catch {
    return null
  }
}

export function MediaPlayer({ item }: { item: ForumAttachment }) {
  if (item.kind === "external_video") {
    const src = rutubeEmbedSrc(item.publicUrl)
    if (!src) return null
    return (
      <iframe
        src={src}
        title={item.alt || "Видео Rutube"}
        className="aspect-video w-full rounded-xl border border-border"
        allow="clipboard-write; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    )
  }
  if (item.kind === "video") {
    return (
      <video
        src={item.publicUrl}
        controls
        preload="metadata"
        className="aspect-video w-full rounded-xl bg-muted"
      />
    )
  }
  return (
    <img
      src={item.publicUrl}
      alt={item.alt || "Изображение"}
      className="max-h-96 w-full rounded-xl object-contain"
    />
  )
}
