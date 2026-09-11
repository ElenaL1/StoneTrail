"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Layers, RotateCcw, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/blocks/status-badge"
import { ColumnHeaderFilter } from "@/components/products/column-header-filter"
import type { IndividualTile, Product } from "@/lib/mock-data"
import {
  EMPTY_TILE_VARIANT_FILTERS,
  TILE_VARIANT_FILTER_DEFS,
  filterTileVariants,
  getTileContactsHref,
  getTileVariantSectionTitle,
  getVisibleTileVariantFilterKeys,
  hasActiveTileVariantFilters,
  pruneTileVariantFilters,
  tileVariantFilterOptions,
  type TileVariantFilterKey,
  type TileVariantFilterState,
} from "@/lib/tile-utils"

export function TileVariantTable({
  product,
  tiles,
}: {
  product: Product
  tiles: IndividualTile[]
}) {
  const [filters, setFilters] = useState<TileVariantFilterState>(EMPTY_TILE_VARIANT_FILTERS)

  const visibleKeys = useMemo(() => getVisibleTileVariantFilterKeys(tiles), [tiles])
  const filtered = useMemo(() => filterTileVariants(tiles, filters), [tiles, filters])
  const canReset = hasActiveTileVariantFilters(filters)

  function resetFilters() {
    setFilters(EMPTY_TILE_VARIANT_FILTERS)
  }

  function onFilterChange(key: TileVariantFilterKey, value: string) {
    setFilters((current) => pruneTileVariantFilters(tiles, { ...current, [key]: value }))
  }

  function headerCell(key: TileVariantFilterKey) {
    const def = TILE_VARIANT_FILTER_DEFS[key]
    if (!visibleKeys.includes(key)) return def.label
    return (
      <ColumnHeaderFilter
        label={def.label}
        value={filters[key]}
        onValueChange={(next) => onFilterChange(key, next)}
        allLabel={def.allLabel}
        options={tileVariantFilterOptions(tiles, filters, key)}
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
    <section className="mt-20" aria-labelledby="tiles-list-heading">
      <div className="mb-8">
        <h2
          id="tiles-list-heading"
          className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          {getTileVariantSectionTitle(product.stoneType, product.stoneName)}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Каждый вариант — формат, толщина 20 или 30 мм и поверхность:
          полированная или матовая.
        </p>
      </div>

      {visibleKeys.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 md:hidden">
          {visibleKeys.map((key) => {
            const def = TILE_VARIANT_FILTER_DEFS[key]
            return (
              <ColumnHeaderFilter
                key={key}
                label={def.label}
                value={filters[key]}
                onValueChange={(next) => onFilterChange(key, next)}
                allLabel={def.allLabel}
                options={tileVariantFilterOptions(tiles, filters, key)}
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
                  <p className="text-foreground">Нет плиты с выбранными параметрами</p>
                  <p className="mt-2 text-sm font-normal normal-case tracking-normal text-muted-foreground">
                    Сбросьте фильтры, чтобы снова увидеть все варианты.
                  </p>
                  <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}>
                    Сбросить фильтры
                  </Button>
                </td>
              </tr>
            ) : (
              filtered.map((tile, i) => (
                <tr key={`${tile.thickness}-${tile.finish}-${tile.size}`} className="border-b border-border/60 last:border-b-0">
                  <td className="px-5 py-4 align-middle text-sm text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <span className="inline-flex items-center gap-2 font-display text-base font-bold text-foreground">
                      <Layers className="size-4 text-primary" />
                      {tile.size}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-middle font-medium text-foreground">
                    {tile.thickness}
                  </td>
                  <td className="px-5 py-4 align-middle font-medium text-foreground">
                    {tile.finish}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <StatusBadge status={tile.status} />
                  </td>
                  <td className="px-5 py-4 align-middle text-right">
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <Link href={getTileContactsHref(product, tile)}>
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
          <p className="text-foreground">Нет плиты с выбранными параметрами</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Сбросьте фильтры, чтобы снова увидеть все варианты.
          </p>
          <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}>
            Сбросить фильтры
          </Button>
        </div>
      ) : (
        <ul className="space-y-4 md:hidden">
          {filtered.map((tile) => (
            <li key={`${tile.thickness}-${tile.finish}-${tile.size}`} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 font-display text-base font-bold text-foreground">
                  <Layers className="size-4 text-primary" />
                  {tile.size}
                </span>
                <StatusBadge status={tile.status} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Толщина
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{tile.thickness}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                    Поверхность
                  </dt>
                  <dd className="mt-0.5 font-semibold text-foreground">{tile.finish}</dd>
                </div>
              </dl>
              <Button asChild size="sm" className="mt-3 w-full gap-1.5">
                <Link href={getTileContactsHref(product, tile)}>
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
          Показано {filtered.length} из {tiles.length}
        </p>
      )}
    </section>
  )
}
