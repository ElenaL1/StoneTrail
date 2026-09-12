"use client"

import Image from "next/image"
import Link from "next/link"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/blocks/status-badge"
import { CatalogLightboxShell } from "@/components/catalog/catalog-lightbox-shell"
import type { IndividualSlab, Product } from "@/lib/mock-data"
import { getSlabContactsHref, getSlabPageTitle } from "@/lib/slab-utils"

type Props = {
  product: Product
  slabs: IndividualSlab[]
  index: number
  onClose: () => void
  onNavigate: (next: number) => void
  pageTitle?: string
  contactsHref?: (product: Product, item: IndividualSlab) => string
  requestLabel?: string
  hint?: string
  itemNoun?: string
}

export function SlabLightboxDialog({
  product,
  slabs,
  index,
  onClose,
  onNavigate,
  pageTitle,
  contactsHref = getSlabContactsHref,
  requestLabel = "Запросить слэб",
  hint = "Подбор по конкретной плите: фото рисунка и карта раскроя — перед отгрузкой.",
  itemNoun = "слэб",
}: Props) {
  const slab = slabs[index]
  if (!slab) return null

  const title = pageTitle ?? getSlabPageTitle(product.stoneName)

  return (
    <CatalogLightboxShell
      ariaLabel={`${product.name} — ${slab.label}`}
      index={index}
      total={slabs.length}
      onClose={onClose}
      onNavigate={onNavigate}
      prevAriaLabel={`Предыдущий ${itemNoun}`}
      nextAriaLabel={`Следующий ${itemNoun}`}
    >
      <div className="relative aspect-[16/10] w-full bg-muted">
        <Image
          src={slab.image ?? product.image}
          alt={`${title} — ${slab.label}`}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="space-y-5 p-6 sm:p-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {product.stoneType} · {product.stoneName}
          </p>
          <h3 className="mt-1 font-display text-2xl font-bold text-foreground">
            {title} — {slab.label}
          </h3>
          {slab.note ? <p className="mt-1 text-sm text-muted-foreground">{slab.note}</p> : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-border/60 py-4 text-sm">
          <div>
            <span className="mr-2 text-muted-foreground">Размер</span>
            <span className="font-semibold text-foreground">{slab.size}</span>
          </div>
          <div>
            <span className="mr-2 text-muted-foreground">Толщина</span>
            <span className="font-semibold text-foreground">{slab.thickness}</span>
          </div>
          <div>
            <span className="mr-2 text-muted-foreground">Поверхность</span>
            <span className="font-semibold text-foreground">{slab.finish}</span>
          </div>
          <StatusBadge status={slab.status} />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild className="h-12 gap-2 text-base">
            <Link href={contactsHref(product, slab)}>
              {requestLabel}
              <Send className="size-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground sm:max-w-xs sm:text-right">{hint}</p>
        </div>
      </div>
    </CatalogLightboxShell>
  )
}
