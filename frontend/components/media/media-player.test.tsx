import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import { MediaPlayer, rutubeEmbedSrc } from "@/components/media/media-player"
import type { ForumAttachment } from "@/lib/types"

const item = (overrides: Partial<ForumAttachment>): ForumAttachment => ({
  id: "1",
  kind: "external_video",
  publicUrl: "https://rutube.ru/play/embed/a1b2c3d4e5f6789012345678abcdef01",
  mimeType: "external/rutube",
  sizeBytes: 0,
  alt: "Видео Rutube",
  ...overrides,
})

describe("rutubeEmbedSrc", () => {
  test("принимает только embed Rutube", () => {
    const id = "a1b2c3d4e5f6789012345678abcdef01"
    expect(rutubeEmbedSrc(`https://rutube.ru/play/embed/${id}`)).toBe(
      `https://rutube.ru/play/embed/${id}`,
    )
    expect(rutubeEmbedSrc("https://evil.com/play/embed/" + id)).toBeNull()
    expect(rutubeEmbedSrc(`https://rutube.ru.evil.com/play/embed/${id}`)).toBeNull()
  })
})

describe("MediaPlayer", () => {
  test("не вставляет произвольный iframe", () => {
    render(<MediaPlayer item={item({ publicUrl: "https://evil.com/watch" })} />)
    expect(screen.queryByTitle("Видео Rutube")).toBeNull()
  })
})
