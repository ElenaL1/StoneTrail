"use client"

import { useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/blocks/status-badge"
import { cn } from "@/lib/utils"
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
  const total = slabs.length
  const title = pageTitle ?? getSlabPageTitle(product.stoneName)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft" && index > 0) {
        onNavigate(index - 1)
      } else if (e.key === "ArrowRight" && index < total - 1) {
        onNavigate(index + 1)
      }
    }
    window.addEventListener("keydown", handleKey)

    return () => {
      window.removeEventListener("keydown", handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [index, total, onClose, onNavigate])

  if (!slab) return null

  const canPrev = total > 1 && index > 0
  const canNext = total > 1 && index < total - 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} — ${slab.label}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-background/90 p-2 text-foreground backdrop-blur-sm transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Закрыть"
        >
          <X className="size-5" />
        </button>

        <div className="flex-1 overflow-y-auto">
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
              {slab.note ? (
                <p className="mt-1 text-sm text-muted-foreground">{slab.note}</p>
              ) : null}
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
              <p className="text-xs text-muted-foreground sm:max-w-xs sm:text-right">
                {hint}
              </p>
            </div>
          </div>
        </div>

        {total > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-background/60 px-4 py-3">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => onNavigate(index - 1)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors",
                "hover:border-primary/50 hover:text-primary",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground",
              )}
              aria-label={`Предыдущий ${itemNoun}`}
            >
              <ArrowLeft className="size-4" />
              Предыдущий
            </button>

            <span className="text-xs text-muted-foreground">
              {index + 1} / {total}
            </span>

            <button
              type="button"
              disabled={!canNext}
              onClick={() => onNavigate(index + 1)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors",
                "hover:border-primary/50 hover:text-primary",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground",
              )}
              aria-label={`Следующий ${itemNoun}`}
            >
              Следующий
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
