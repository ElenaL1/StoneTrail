"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Box, RotateCcw, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/blocks/status-badge"
import { ColumnHeaderFilter } from "@/components/products/column-header-filter"
import { SlabLightboxDialog } from "@/components/products/slab-lightbox-dialog"
import type { IndividualBlank, Product } from "@/lib/mock-data"
import {
  BLANK_LOT_FILTER_DEFS,
  EMPTY_BLANK_LOT_FILTERS,
  blankLotFilterOptions,
  filterBlankLot,
  getBlankContactsHref,
  getBlankLotSectionTitle,
  getBlankPageTitle,
  getVisibleBlankLotFilterKeys,
  hasActiveBlankLotFilters,
  pruneBlankLotFilters,
  type BlankLotFilterKey,
  type BlankLotFilterState,
} from "@/lib/blank-utils"

export function BlankLotTable({
  product,
  blanks,
}: {
  product: Product
  blanks: IndividualBlank[]
}) {
  const [filters, setFilters] = useState<BlankLotFilterState>(EMPTY_BLANK_LOT_FILTERS)
  const [activeLabel, setActiveLabel] = useState<string | null>(null)

  const visibleKeys = useMemo(() => getVisibleBlankLotFilterKeys(blanks), [blanks])
  const filtered = useMemo(() => filterBlankLot(blanks, filters), [blanks, filters])
  const canReset = hasActiveBlankLotFilters(filters)
  const activeIndex = activeLabel ? filtered.findIndex((blank) => blank.label === activeLabel) : -1

  useEffect(() => {
    if (!activeLabel) return
    if (!filtered.some((blank) => blank.label === activeLabel)) setActiveLabel(null)
  }, [activeLabel, filtered])

  function resetFilters() {
    setFilters(EMPTY_BLANK_LOT_FILTERS)
  }

  function onFilterChange(key: BlankLotFilterKey, value: string) {
    setFilters((current) => pruneBlankLotFilters(blanks, { ...current, [key]: value }))
  }

  function openBlank(blank: IndividualBlank) {
    setActiveLabel(blank.label)
  }

  function headerCell(key: BlankLotFilterKey) {
    const def = BLANK_LOT_FILTER_DEFS[key]
    if (!visibleKeys.includes(key)) return def.label
    return (
      <ColumnHeaderFilter
        label={def.label}
        value={filters[key]}
        onValueChange={(next) => onFilterChange(key, next)}
        allLabel={def.allLabel}
        options={blankLotFilterOptions(blanks, filters, key)}
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
    <section className="mt-20" aria-labelledby="blanks-list-heading">
      <div className="mb-8">
        <h2
          id="blanks-list-heading"
          className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {getBlankLotSectionTitle(product.stoneType, product.stoneName)}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Каждая заготовка — полуслэб со своим рисунком, размером и статусом.
          Выбирайте конкретный кусок под раскрой.
        </p>
      </div>

      {visibleKeys.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 md:hidden">
          {visibleKeys.map((key) => {
            const def = BLANK_LOT_FILTER_DEFS[key]
            return (
              <ColumnHeaderFilter
                key={key}
                label={def.label}
                value={filters[key]}
                onValueChange={(next) => onFilterChange(key, next)}
                allLabel={def.allLabel}
                options={blankLotFilterOptions(blanks, filters, key)}
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
                Заготовка
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
                  <p className="text-foreground">Нет заготовок с выбранными параметрами</p>
                  <p className="mt-2 text-sm font-normal normal-case tracking-normal text-muted-foreground">
                    Сбросьте фильтры, чтобы снова увидеть всю партию.
                  </p>
                  <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}>
                    Сбросить фильтры
                  </Button>
                </td>
              </tr>
            ) : (
              filtered.map((blank, i) => (
                <tr
                  key={blank.label}
                  onClick={() => openBlank(blank)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      openBlank(blank)
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Показать ${blank.label}`}
                  className="cursor-pointer border-b border-border/60 last:border-b-0 transition-colors hover:bg-secondary/40 focus:bg-secondary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                >
                  <td className="px-5 py-4 align-middle text-sm text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <span className="inline-flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-2 font-display text-base font-bold text-foreground">
                        <Box className="size-4 text-primary" />
                        {blank.label}
                      </span>
                      {blank.note ? (
                        <span className="pl-6 text-xs text-muted-foreground">{blank.note}</span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <div className="relative h-14 w-20 overflow-hidden rounded-lg border border-border bg-muted">
                      <Image
                        src={blank.image ?? product.image}
                        alt={`Миниатюра: ${product.name} — ${blank.label}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 align-middle font-medium text-foreground">
                    {blank.size}
                  </td>
                  <td className="px-5 py-4 align-middle font-medium text-foreground">
                    {blank.thickness}
                  </td>
                  <td className="px-5 py-4 align-middle font-medium text-foreground">
                    {blank.finish}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <StatusBadge status={blank.status} />
                  </td>
                  <td className="px-5 py-4 align-middle text-right">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={getBlankContactsHref(product, blank)}>
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
          <p className="text-foreground">Нет заготовок с выбранными параметрами</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Сбросьте фильтры, чтобы снова увидеть всю партию.
          </p>
          <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}>
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <ul className="space-y-4 md:hidden">
          {filtered.map((blank) => (
            <li key={blank.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => openBlank(blank)}
                  className="flex min-w-0 items-center gap-3"
                  aria-label={`Показать ${blank.label}`}
                >
                  <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                    <Image
                      src={blank.image ?? product.image}
                      alt={`Миниатюра: ${product.name} — ${blank.label}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </span>
                  <span className="flex min-w-0 flex-col items-start gap-1">
                    <span className="inline-flex items-center gap-1.5 font-display text-base font-bold text-foreground">
                      <Box className="size-4 text-primary" />
                      {blank.label}
                    </span>
                    {blank.note ? (
                      <span className="text-xs text-muted-foreground">{blank.note}</span>
                    ) : null}
                    <StatusBadge status={blank.status} />
                  </span>
                </button>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Размер
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{blank.size}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Толщина
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{blank.thickness}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Поверхность
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{blank.finish}</dd>
                </div>
              </dl>
              <Button asChild size="sm" className="mt-3 w-full gap-1.5">
                <Link href={getBlankContactsHref(product, blank)}>
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
          Показано {filtered.length} из {blanks.length}
        </p>
      )}

      {activeIndex >= 0 && (
        <SlabLightboxDialog
          product={product}
          slabs={filtered}
          index={activeIndex}
          pageTitle={getBlankPageTitle(product.stoneName)}
          contactsHref={getBlankContactsHref}
          requestLabel="Запросить заготовку"
          hint="Подбор по конкретной заготовке: фото рисунка и карта раскроя — перед отгрузкой."
          itemNoun="заготовка"
          onClose={() => setActiveLabel(null)}
          onNavigate={(next) => {
            const nextBlank = filtered[next]
            if (nextBlank) setActiveLabel(nextBlank.label)
          }}
        />
      )}
    </section>
  )
}
