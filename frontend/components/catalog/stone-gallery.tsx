"use client"

import { useState } from "react"
import Image from "next/image"
import { CatalogLightboxShell } from "@/components/catalog/catalog-lightbox-shell"
import type { StoneTexture } from "@/lib/types"

type Frame = {
  url: string
  caption: string
}

export function StoneGallery({
  name,
  image,
  textures = [],
}: {
  name: string
  image: string
  textures?: StoneTexture[]
}) {
  const frames: Frame[] = [
    ...(image ? [{ url: image, caption: "" }] : []),
    ...textures.filter((texture) => texture.url && texture.url !== image),
  ]
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const openFrame = openIndex !== null ? frames[openIndex] : undefined

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-secondary">
        {image ? (
          <button
            type="button"
            onClick={() => setOpenIndex(0)}
            className="absolute inset-0 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            aria-label={`Увеличить фото ${name}`}
          >
            <Image src={image} alt={name} fill className="object-cover" unoptimized />
          </button>
        ) : null}
      </div>

      {textures.some((texture) => texture.url && texture.url !== image) ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {textures
            .filter((texture) => texture.url && texture.url !== image)
            .map((texture, index) => {
              const frameIndex = frames.findIndex((frame) => frame.url === texture.url)
              return (
                <button
                  key={`${texture.url}-${index}`}
                  type="button"
                  onClick={() => setOpenIndex(frameIndex >= 0 ? frameIndex : 0)}
                  className="w-28 shrink-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={texture.caption ? `Увеличить: ${texture.caption}` : `Увеличить фото ${index + 2}`}
                >
                  {texture.caption ? (
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {texture.caption}
                    </p>
                  ) : null}
                  <span className="relative block aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                    <Image src={texture.url} alt={texture.caption || name} fill className="object-cover" unoptimized />
                  </span>
                </button>
              )
            })}
        </div>
      ) : null}

      {openFrame ? (
        <CatalogLightboxShell
          ariaLabel={openFrame.caption ? `${name}, ${openFrame.caption}` : name}
          index={openIndex ?? 0}
          total={frames.length}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
          prevAriaLabel="Предыдущее фото"
          nextAriaLabel="Следующее фото"
        >
          <div className="relative aspect-[4/5] w-full bg-muted sm:aspect-[16/10]">
            <Image
              src={openFrame.url}
              alt={openFrame.caption ? `${name}, ${openFrame.caption}` : name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          {openFrame.caption ? (
            <p className="px-6 py-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {openFrame.caption}
            </p>
          ) : null}
        </CatalogLightboxShell>
      ) : null}
    </div>
  )
}
