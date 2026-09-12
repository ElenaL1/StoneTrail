"use client"

import { VariantTable } from "@/components/products/variant-table"
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
} from "@/lib/tile-utils"

export function TileVariantTable({
  product,
  tiles,
}: {
  product: Product
  tiles: IndividualTile[]
}) {
  return (
    <VariantTable
      product={product}
      items={tiles}
      emptyFilters={EMPTY_TILE_VARIANT_FILTERS}
      filterDefs={TILE_VARIANT_FILTER_DEFS}
      getVisibleKeys={getVisibleTileVariantFilterKeys}
      filterItems={filterTileVariants}
      pruneFilters={pruneTileVariantFilters}
      filterOptions={tileVariantFilterOptions}
      hasActiveFilters={hasActiveTileVariantFilters}
      contactsHref={getTileContactsHref}
      copy={{
        headingId: "tiles-list-heading",
        title: getTileVariantSectionTitle(product.stoneType, product.stoneName),
        description:
          "Каждый вариант — формат, толщина 20 или 30 мм и поверхность: полированная или матовая.",
        emptyTitle: "Нет плиты с выбранными параметрами",
        emptyHint: "Сбросьте фильтры, чтобы снова увидеть все варианты.",
        finishLabel: "Поверхность",
      }}
    />
  )
}
