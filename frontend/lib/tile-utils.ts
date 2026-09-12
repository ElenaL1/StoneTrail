import type { IndividualTile, Product } from "./mock-data"
import { stoneTypeGenitive } from "./stone-inventory"
import {
  finishSummary,
  getLotItemContactsHref,
  sizeSummary,
  thicknessRange,
} from "./measure-utils"
import { createLotFilterKit, type LotFilterDef } from "./lot-filter-utils"

export type TileVariantFilterKey = "size" | "thickness" | "finish" | "status"

export type TileVariantFilterState = {
  size: string
  thickness: string
  finish: string
  status: string
}

export const EMPTY_TILE_VARIANT_FILTERS: TileVariantFilterState = {
  size: "all",
  thickness: "all",
  finish: "all",
  status: "all",
}

export const TILE_VARIANT_FILTER_DEFS: Record<TileVariantFilterKey, LotFilterDef> = {
  size: { label: "Формат", allLabel: "Любой" },
  thickness: { label: "Толщина", allLabel: "Любая" },
  finish: { label: "Поверхность", allLabel: "Любая" },
  status: { label: "Статус", allLabel: "Любой" },
}

const TILE_VARIANT_FILTER_KEYS: TileVariantFilterKey[] = ["size", "thickness", "finish", "status"]
const TILE_FINISH_ORDER = ["Полированная", "Матовая", "Сатинированная", "Шлифованная"]

const tileKit = createLotFilterKit<IndividualTile, TileVariantFilterKey>({
  keys: TILE_VARIANT_FILTER_KEYS,
  empty: EMPTY_TILE_VARIANT_FILTERS,
  finishOrder: TILE_FINISH_ORDER,
})

export function getProductTiles(product: Product): IndividualTile[] {
  return product.tiles ?? []
}

export function getTilePageTitle(stoneName: string): string {
  const name = stoneName.trim()
  if (name.toLocaleLowerCase("ru").includes("плит")) return name
  return `Плита ${name}`
}

export function getTileVariantSectionTitle(stoneType: string, stoneName: string): string {
  return `Плиты ${stoneTypeGenitive(stoneType)} ${stoneName.trim()}`
}

export function getTileSizeSummary(tiles: IndividualTile[]): string {
  return sizeSummary(tiles)
}

export function getTileThicknessRange(tiles: IndividualTile[]): string {
  return thicknessRange(tiles)
}

export function getTileFinishSummary(tiles: IndividualTile[]): string {
  return finishSummary(tiles, TILE_FINISH_ORDER)
}

export function getTileContactsHref(product: Product, tile: IndividualTile): string {
  return getLotItemContactsHref(product, tile)
}

export const uniqueTileFieldValues = tileKit.uniqueFieldValues
export const getVisibleTileVariantFilterKeys = tileKit.getVisibleFilterKeys
export const filterTileVariants = tileKit.filterItems
export const tileVariantFilterOptions = tileKit.filterOptions
export const hasActiveTileVariantFilters = tileKit.hasActiveFilters
export const pruneTileVariantFilters = tileKit.pruneFilters
