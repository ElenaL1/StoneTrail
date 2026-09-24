"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Layers, RotateCcw, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/blocks/status-badge"
import { ColumnHeaderFilter } from "@/components/products/column-header-filter"
import type { BlockStatus, Product } from "@/lib/mock-data"
import type { LotStatus } from "@/lib/block-utils"
import type { LotFilterDef } from "@/lib/lot-filter-utils"

export type VariantRow = {
  label: string
  size: string
  thickness: string
  finish: string
  status: BlockStatus | LotStatus
}

type VariantFilterKey = "size" | "thickness" | "finish" | "status"
type VariantFilterState = Record<VariantFilterKey, string>

export type VariantTableCopy = {
  headingId: string
  title: string
  description: string
  emptyTitle: string
  emptyHint: string
  finishLabel: string
}

export function VariantTable<T extends VariantRow>({
  product,
  items,
  copy,
  emptyFilters,
  filterDefs,
  getVisibleKeys,
  filterItems,
  pruneFilters,
  filterOptions,
  hasActiveFilters,
  contactsHref,
}: {
  product: Product
  items: T[]
  copy: VariantTableCopy
  emptyFilters: VariantFilterState
  filterDefs: Record<VariantFilterKey, LotFilterDef>
  getVisibleKeys: (items: T[]) => VariantFilterKey[]
  filterItems: (items: T[], filters: VariantFilterState) => T[]
  pruneFilters: (items: T[], filters: VariantFilterState) => VariantFilterState
  filterOptions: (items: T[], filters: VariantFilterState, key: VariantFilterKey) => string[]
  hasActiveFilters: (filters: VariantFilterState) => boolean
  contactsHref: (product: Product, item: T) => string
}) {
  const [filters, setFilters] = useState<VariantFilterState>(emptyFilters)

  const visibleKeys = useMemo(() => getVisibleKeys(items), [getVisibleKeys, items])
  const filtered = useMemo(() => filterItems(items, filters), [filterItems, items, filters])
  const optionMap = useMemo(() => {
    const map = {} as Record<VariantFilterKey, string[]>
    for (const key of visibleKeys) {
      map[key] = filterOptions(items, filters, key)
    }
    return map
  }, [filterOptions, items, filters, visibleKeys])
  const canReset = hasActiveFilters(filters)

  function resetFilters() {
    setFilters(emptyFilters)
  }

  function onFilterChange(key: VariantFilterKey, value: string) {
    setFilters((current) => pruneFilters(items, { ...current, [key]: value }))
  }

  function headerCell(key: VariantFilterKey) {
    const def = filterDefs[key]
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
            const def = filterDefs[key]
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
              <th scope="col" className="px-5 py-3">
                {headerCell("size")}
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
                <td colSpan={6} className="px-5 py-12 text-center">
                  <p className="text-foreground">{copy.emptyTitle}</p>
                  <p className="mt-2 text-sm font-normal normal-case tracking-normal text-muted-foreground">
                    {copy.emptyHint}
                  </p>
                  <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}>
                    Сбросить фильтры
                  </Button>
                </td>
              </tr>
            ) : (
              filtered.map((item, i) => (
                <tr
                  key={`${item.thickness}-${item.finish}-${item.size}`}
                  className="border-b border-border/60 last:border-b-0"
                >
                  <td className="px-5 py-4 align-middle text-sm text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <span className="inline-flex items-center gap-2 font-display text-base font-bold text-foreground">
                      <Layers className="size-4 text-primary" />
                      {item.size}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-middle font-medium text-foreground">
                    {item.thickness}
                  </td>
                  <td className="px-5 py-4 align-middle font-medium text-foreground">{item.finish}</td>
                  <td className="px-5 py-4 align-middle">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-4 align-middle text-right">
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
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
          <p className="mt-2 text-sm text-muted-foreground">{copy.emptyHint}</p>
          <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}>
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <ul className="space-y-4 md:hidden">
          {filtered.map((item) => (
            <li
              key={`${item.thickness}-${item.finish}-${item.size}`}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 font-display text-base font-bold text-foreground">
                  <Layers className="size-4 text-primary" />
                  {item.size}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Толщина
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{item.thickness}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    {copy.finishLabel}
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
    </section>
  )
}
