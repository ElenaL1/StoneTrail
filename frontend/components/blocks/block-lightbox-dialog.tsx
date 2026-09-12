"use client"

import Image from "next/image"
import Link from "next/link"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/blocks/status-badge"
import { CatalogLightboxShell } from "@/components/catalog/catalog-lightbox-shell"
import type { StoneBlock } from "@/lib/mock-data"

type Props = {
  block: StoneBlock
  index: number
  total: number
  onClose: () => void
  onNavigate: (next: number) => void
}

export function BlockLightboxDialog({
  block,
  index,
  total,
  onClose,
  onNavigate,
}: Props) {
  const ib = block.blocks[index]
  if (!ib) return null

  const contactsHref = `/contacts?block=${encodeURIComponent(block.slug)}&ref=${encodeURIComponent(ib.label)}`

  return (
    <CatalogLightboxShell
      ariaLabel={`${block.stoneName} — ${ib.label}`}
      index={index}
      total={total}
      onClose={onClose}
      onNavigate={onNavigate}
      prevAriaLabel="Предыдущий блок"
      nextAriaLabel="Следующий блок"
    >
      <div className="relative aspect-[16/10] w-full bg-muted">
        <Image
          src={ib.image ?? block.image}
          alt={`${block.stoneName} — ${ib.label}`}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="space-y-5 p-6 sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {block.stoneType} · {block.quarry}, {block.country}
          </p>
          <h3 className="mt-1 font-display text-2xl font-bold text-foreground">
            {block.stoneName} — {ib.label}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-border/60 py-4 text-sm">
          <div>
            <span className="mr-2 text-muted-foreground">Габариты</span>
            <span className="font-semibold text-foreground">{ib.dimensions}</span>
          </div>
          <div>
            <span className="mr-2 text-muted-foreground">Вес</span>
            <span className="font-semibold text-foreground">{ib.weight}</span>
          </div>
          <StatusBadge status={ib.status} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild className="h-12 gap-2 text-base">
            <Link href={contactsHref}>
              Запросить блок
              <Send className="size-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground sm:max-w-xs sm:text-right">
            Цена и условия раскрою после осмотра блока — напишите, что планируете резать.
          </p>
        </div>
      </div>
    </CatalogLightboxShell>
  )
}
