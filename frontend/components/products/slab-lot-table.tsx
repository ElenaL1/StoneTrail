"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Layers, RotateCcw, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/blocks/status-badge"
import { ColumnHeaderFilter } from "@/components/products/column-header-filter"
import { SlabLightboxDialog } from "@/components/products/slab-lightbox-dialog"
import type { IndividualSlab, Product } from "@/lib/mock-data"
import {
  EMPTY_SLAB_LOT_FILTERS,
  SLAB_LOT_FILTER_DEFS,
  filterSlabLot,
  getSlabContactsHref,
  getSlabLotSectionTitle,
  getVisibleSlabLotFilterKeys,
  hasActiveSlabLotFilters,
  pruneSlabLotFilters,
  slabLotFilterOptions,
  type SlabLotFilterKey,
  type SlabLotFilterState,
} from "@/lib/slab-utils"

export function SlabLotTable({
  product,
  slabs,
}: {
  product: Product
  slabs: IndividualSlab[]
}) {
  const [filters, setFilters] = useState<SlabLotFilterState>(EMPTY_SLAB_LOT_FILTERS)
  const [activeLabel, setActiveLabel] = useState<string | null>(null)

  const visibleKeys = useMemo(() => getVisibleSlabLotFilterKeys(slabs), [slabs])
  const filtered = useMemo(() => filterSlabLot(slabs, filters), [slabs, filters])
  const canReset = hasActiveSlabLotFilters(filters)
  const activeIndex = activeLabel ? filtered.findIndex((slab) => slab.label === activeLabel) : -1

  useEffect(() => {
    if (!activeLabel) return
    if (!filtered.some((slab) => slab.label === activeLabel)) setActiveLabel(null)
  }, [activeLabel, filtered])

  function resetFilters() {
    setFilters(EMPTY_SLAB_LOT_FILTERS)
  }

  function onFilterChange(key: SlabLotFilterKey, value: string) {
    setFilters((current) => pruneSlabLotFilters(slabs, { ...current, [key]: value }))
  }

  function openSlab(slab: IndividualSlab) {
    setActiveLabel(slab.label)
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
        options={slabLotFilterOptions(slabs, filters, key)}
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
    <section className="mt-20" aria-labelledby="slabs-list-heading">
      <div className="mb-8">
        <h2
          id="slabs-list-heading"
          className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {getSlabLotSectionTitle(product.stoneType, product.stoneName)}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Каждый слэб может отличаться по рисунку, размеру и статусу — выбирайте
          конкретную плиту под раскрой.
        </p>
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
                options={slabLotFilterOptions(slabs, filters, key)}
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
                Слэб
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
                  <p className="text-foreground">Нет слэбов с выбранными параметрами</p>
                  <p className="mt-2 text-sm font-normal normal-case tracking-normal text-muted-foreground">
                    Сбросьте фильтры, чтобы снова увидеть всю партию.
                  </p>
                  <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}>
                    Сбросить фильтры
                  </Button>
                </td>
              </tr>
            ) : (
              filtered.map((slab, i) => (
                <tr
                  key={slab.label}
                  onClick={() => openSlab(slab)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      openSlab(slab)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Показать ${slab.label}`}
                  className="cursor-pointer border-b border-border/60 last:border-b-0 transition-colors hover:bg-secondary/40 focus:bg-secondary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                >
                  <td className="px-5 py-4 align-middle text-sm text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <span className="inline-flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-2 font-display text-base font-bold text-foreground">
                        <Layers className="size-4 text-primary" />
                        {slab.label}
                      </span>
                      {slab.note ? (
                        <span className="pl-6 text-xs text-muted-foreground">{slab.note}</span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <div className="relative h-14 w-20 overflow-hidden rounded-lg border border-border bg-muted">
                      <Image
                        src={slab.image ?? product.image}
                        alt={`Миниатюра: ${product.name} — ${slab.label}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 align-middle font-medium text-foreground">
                    {slab.size}
                  </td>
                  <td className="px-5 py-4 align-middle font-medium text-foreground">
                    {slab.thickness}
                  </td>
                  <td className="px-5 py-4 align-middle font-medium text-foreground">
                    {slab.finish}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <StatusBadge status={slab.status} />
                  </td>
                  <td className="px-5 py-4 align-middle text-right">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={getSlabContactsHref(product, slab)}>
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
          <p className="text-foreground">Нет слэбов с выбранными параметрами</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Сбросьте фильтры, чтобы снова увидеть всю партию.
          </p>
          <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}>
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <ul className="space-y-4 md:hidden">
          {filtered.map((slab) => (
            <li key={slab.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => openSlab(slab)}
                  className="flex min-w-0 items-center gap-3"
                  aria-label={`Показать ${slab.label}`}
                >
                  <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    <Image
                      src={slab.image ?? product.image}
                      alt={`Миниатюра: ${product.name} — ${slab.label}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </span>
                  <span className="flex min-w-0 flex-col items-start gap-1">
                    <span className="inline-flex items-center gap-1.5 font-display text-base font-bold text-foreground">
                      <Layers className="size-4 text-primary" />
                      {slab.label}
                    </span>
                    {slab.note ? (
                      <span className="text-xs text-muted-foreground">{slab.note}</span>
                    ) : null}
                    <StatusBadge status={slab.status} />
                  </span>
                </button>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Размер
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{slab.size}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Толщина
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{slab.thickness}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Поверхность
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{slab.finish}</dd>
                </div>
              </dl>
              <Button asChild size="sm" className="mt-3 w-full gap-1.5">
                <Link href={getSlabContactsHref(product, slab)}>
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
          Показано {filtered.length} из {slabs.length}
        </p>
      )}

      {activeIndex >= 0 && (
        <SlabLightboxDialog
          product={product}
          slabs={filtered}
          index={activeIndex}
          onClose={() => setActiveLabel(null)}
          onNavigate={(next) => {
            const nextSlab = filtered[next]
            if (nextSlab) setActiveLabel(nextSlab.label)
          }}
        />
      )}
    </section>
  )
}
