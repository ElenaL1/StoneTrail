"use client"

import { useRef, type KeyboardEvent } from "react"
import { Box, Grid3x3, Hammer, Layers, LayoutGrid } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ProductCategory } from "@/lib/mock-data"
import { PRODUCT_CATEGORY_IDS, PRODUCT_CATEGORY_META } from "@/lib/product-catalog"
import { cn } from "@/lib/utils"

const CATEGORY_ICONS: Record<ProductCategory, LucideIcon> = {
  slabs: Layers,
  blanks: Box,
  tiles: LayoutGrid,
  paving: Grid3x3,
  custom: Hammer,
}

export function ProductCategoryTabs({
  value,
  onChange,
}: {
  value: ProductCategory
  onChange: (category: ProductCategory) => void
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  function focusTab(index: number) {
    const next = (index + PRODUCT_CATEGORY_IDS.length) % PRODUCT_CATEGORY_IDS.length
    tabRefs.current[next]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault()
      focusTab(index + 1)
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault()
      focusTab(index - 1)
    } else if (event.key === "Home") {
      event.preventDefault()
      focusTab(0)
    } else if (event.key === "End") {
      event.preventDefault()
      focusTab(PRODUCT_CATEGORY_IDS.length - 1)
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onChange(PRODUCT_CATEGORY_IDS[index])
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Основные направления"
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0"
    >
      {PRODUCT_CATEGORY_IDS.map((id, index) => {
        const meta = PRODUCT_CATEGORY_META[id]
        const Icon = CATEGORY_ICONS[id]
        const selected = value === id

        return (
          <button
            key={id}
            ref={(node) => {
              tabRefs.current[index] = node
            }}
            type="button"
            role="tab"
            id={`product-category-${id}`}
            aria-selected={selected}
            aria-controls="product-catalog-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {meta.label}
          </button>
        )
      })}
    </div>
  )
}
