"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { RotateCcw, Send, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/blocks/status-badge"
import { ColumnHeaderFilter } from "@/components/products/column-header-filter"
import { SlabLightboxDialog } from "@/components/products/slab-lightbox-dialog"
import type { IndividualSlab, Product } from "@/lib/mock-data"
import {
  EMPTY_SLAB_LOT_FILTERS,
  SLAB_LOT_FILTER_DEFS,
  filterSlabLot,
  getVisibleSlabLotFilterKeys,
  hasActiveSlabLotFilters,
  pruneSlabLotFilters,
  slabLotFilterOptions,
  type SlabLotFilterKey,
  type SlabLotFilterState,
} from "@/lib/slab-utils"

export type LotTableCopy = {
  headingId: string
  title: string
  description: string
  entityLabel: string
  emptyTitle: string
  pageTitle?: string
  requestLabel?: string
  hint?: string
  itemNoun?: string
}

export function LotTable({
  product,
  items,
  copy,
  icon: Icon,
  contactsHref,
}: {
  product: Product
  items: IndividualSlab[]
  copy: LotTableCopy
  icon: LucideIcon
  contactsHref: (product: Product, item: IndividualSlab) => string
}) {
  const [filters, setFilters] = useState<SlabLotFilterState>(EMPTY_SLAB_LOT_FILTERS)
  const [activeLabel, setActiveLabel] = useState<string | null>(null)

  const visibleKeys = useMemo(() => getVisibleSlabLotFilterKeys(items), [items])
  const filtered = useMemo(() => filterSlabLot(items, filters), [items, filters])
  const optionMap = useMemo(() => {
    const map = {} as Record<SlabLotFilterKey, string[]>
    for (const key of visibleKeys) {
      map[key] = slabLotFilterOptions(items, filters, key)
    }
    return map
  }, [items, filters, visibleKeys])
  const canReset = hasActiveSlabLotFilters(filters)
  const activeIndex = activeLabel ? filtered.findIndex((item) => item.label === activeLabel) : -1

  useEffect(() => {
    if (!activeLabel) return
    if (!filtered.some((item) => item.label === activeLabel)) setActiveLabel(null)
  }, [activeLabel, filtered])

  function resetFilters() {
    setFilters(EMPTY_SLAB_LOT_FILTERS)
  }

  function onFilterChange(key: SlabLotFilterKey, value: string) {
    setFilters((current) => pruneSlabLotFilters(items, { ...current, [key]: value }))
  }

  function openItem(item: IndividualSlab) {
    setActiveLabel(item.label)
  }

  function headerCell(key: SlabLotFilterKey) {
    const def = SLAB_LOT_FILTER_DEFS[key]
    if (!visibleKeys.includes(key)) return def.label
    return (
      <ColumnHeaderFilter
        label={def.label}
        value={filters[key]}
        onValueChange={(next) => onFilterChange(key, next)}
        allLabel={def.allLabel}
        options={optionMap[key] ?? []}
      />
    )
  }

  function resetControl() {
    if (visibleKeys.length === 0) return null
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground"
        onClick={(event) => {
          event.stopPropagation()
          resetFilters()
        }}
        disabled={!canReset}
        aria-label="Сбросить фильтры"
        title="Сбросить фильтры"
      >
        <RotateCcw className="size-4" />
      </Button>
    )
  }

  return (
    <section className="mt-20" aria-labelledby={copy.headingId}>
      <div className="mb-8">
        <h2
          id={copy.headingId}
          className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {copy.title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{copy.description}</p>
      </div>

      {visibleKeys.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 md:hidden">
          {visibleKeys.map((key) => {
            const def = SLAB_LOT_FILTER_DEFS[key]
            return (
              <ColumnHeaderFilter
                key={key}
                label={def.label}
                value={filters[key]}
                onValueChange={(next) => onFilterChange(key, next)}
                allLabel={def.allLabel}
                options={optionMap[key] ?? []}
              />
            )
          })}
          {resetControl()}
        </div>
      )}

      <div className="hidden rounded-2xl border border-border bg-card md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/40 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <th scope="col" className="px-5 py-4" aria-label="№">
                №
              </th>
              <th scope="col" className="px-5 py-4">
                {copy.entityLabel}
              </th>
              <th scope="col" className="px-5 py-4">
                Фото
              </th>
              <th scope="col" className="px-5 py-4">
                Размер
              </th>
              <th scope="col" className="px-5 py-3">
                {headerCell("thickness")}
              </th>
              <th scope="col" className="px-5 py-3">
                {headerCell("finish")}
              </th>
              <th scope="col" className="px-5 py-3">
                {headerCell("status")}
              </th>
              <th scope="col" className="px-5 py-3 text-right">
                {resetControl() ?? <span className="sr-only">Действие</span>}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center">
                  <p className="text-foreground">{copy.emptyTitle}</p>
                  <p className="mt-2 text-sm font-normal normal-case tracking-normal text-muted-foreground">
                    Сбросьте фильтры, чтобы снова увидеть всю партию.
                  </p>
                  <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}>
                    Сбросить фильтры
                  </Button>
                </td>
              </tr>
            ) : (
              filtered.map((item, i) => (
                <tr
                  key={item.label}
                  onClick={() => openItem(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      openItem(item)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Показать ${item.label}`}
                  className="cursor-pointer border-b border-border/60 last:border-b-0 transition-colors hover:bg-secondary/40 focus:bg-secondary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                >
                  <td className="px-5 py-4 align-middle text-sm text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <span className="inline-flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-2 font-display text-base font-bold text-foreground">
                        <Icon className="size-4 text-primary" />
                        {item.label}
                      </span>
                      {item.note ? (
                        <span className="pl-6 text-xs text-muted-foreground">{item.note}</span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <div className="relative h-14 w-20 overflow-hidden rounded-lg border border-border bg-muted">
                      <Image
                        src={item.image ?? product.image}
                        alt={`Миниатюра: ${product.name} — ${item.label}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 align-middle font-medium text-foreground">{item.size}</td>
                  <td className="px-5 py-4 align-middle font-medium text-foreground">
                    {item.thickness}
                  </td>
                  <td className="px-5 py-4 align-middle font-medium text-foreground">{item.finish}</td>
                  <td className="px-5 py-4 align-middle">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-4 align-middle text-right">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={contactsHref(product, item)}>
                        <Send className="size-3.5" />
                        Запросить
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center md:hidden">
          <p className="text-foreground">{copy.emptyTitle}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Сбросьте фильтры, чтобы снова увидеть всю партию.
          </p>
          <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}>
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <ul className="space-y-4 md:hidden">
          {filtered.map((item) => (
            <li key={item.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => openItem(item)}
                  className="flex min-w-0 items-center gap-3"
                  aria-label={`Показать ${item.label}`}
                >
                  <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    <Image
                      src={item.image ?? product.image}
                      alt={`Миниатюра: ${product.name} — ${item.label}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </span>
                  <span className="flex min-w-0 flex-col items-start gap-1">
                    <span className="inline-flex items-center gap-1.5 font-display text-base font-bold text-foreground">
                      <Icon className="size-4 text-primary" />
                      {item.label}
                    </span>
                    {item.note ? (
                      <span className="text-xs text-muted-foreground">{item.note}</span>
                    ) : null}
                    <StatusBadge status={item.status} />
                  </span>
                </button>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">Размер</dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{item.size}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Толщина
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{item.thickness}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Поверхность
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{item.finish}</dd>
                </div>
              </dl>
              <Button asChild size="sm" className="mt-3 w-full gap-1.5">
                <Link href={contactsHref(product, item)}>
                  <Send className="size-3.5" />
                  Запросить
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {canReset && (
        <p className="mt-3 text-sm text-muted-foreground">
          Показано {filtered.length} из {items.length}
        </p>
      )}

      {activeIndex >= 0 && (
        <SlabLightboxDialog
          product={product}
          slabs={filtered}
          index={activeIndex}
          pageTitle={copy.pageTitle}
          contactsHref={contactsHref}
          requestLabel={copy.requestLabel}
          hint={copy.hint}
          itemNoun={copy.itemNoun}
          onClose={() => setActiveLabel(null)}
          onNavigate={(next) => {
            const nextItem = filtered[next]
            if (nextItem) setActiveLabel(nextItem.label)
          }}
        />
      )}
    </section>
  )
}
