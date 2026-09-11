import type { IndividualTile, Product } from "./mock-data"
import { stoneTypeGenitive } from "./stone-inventory"

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

export const TILE_VARIANT_FILTER_DEFS: Record<
  TileVariantFilterKey,
  { label: string; allLabel: string }
> = {
  size: { label: "Формат", allLabel: "Любой" },
  thickness: { label: "Толщина", allLabel: "Любая" },
  finish: { label: "Поверхность", allLabel: "Любая" },
  status: { label: "Статус", allLabel: "Любой" },
}

const TILE_VARIANT_FILTER_KEYS: TileVariantFilterKey[] = ["size", "thickness", "finish", "status"]
const TILE_STATUS_ORDER = ["В наличии", "Зарезервирован", "Под заказ"]
const TILE_FINISH_ORDER = ["Полированная", "Матовая", "Сатинированная", "Шлифованная"]

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

function parseThickness(value: string): number | null {
  const match = value.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return null
  const n = Number(match[1].replace(",", "."))
  return Number.isNaN(n) ? null : n
}

function parseSizeSortKey(value: string): number {
  const match = value.match(/(\d[\d\s]*)\s*×\s*(\d[\d\s]*)/)
  if (!match) return 0
  const width = Number(match[1].replace(/\s/g, ""))
  const height = Number(match[2].replace(/\s/g, ""))
  if (Number.isNaN(width) || Number.isNaN(height)) return 0
  return width * height
}

export function getTileSizeSummary(tiles: IndividualTile[]): string {
  const unique = Array.from(new Set(tiles.map((tile) => tile.size).filter(Boolean)))
  unique.sort((a, b) => parseSizeSortKey(a) - parseSizeSortKey(b) || a.localeCompare(b, "ru"))
  return unique.join(" / ")
}

export function getTileThicknessRange(tiles: IndividualTile[]): string {
  const parsed = tiles
    .map((tile) => ({ tile, value: parseThickness(tile.thickness) }))
    .filter((item): item is { tile: IndividualTile; value: number } => item.value !== null)

  if (parsed.length === 0) return tiles[0]?.thickness ?? ""
  const values = parsed.map((item) => item.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return parsed[0].tile.thickness
  return `${min}–${max} мм`
}

export function getTileFinishSummary(tiles: IndividualTile[]): string {
  const unique = Array.from(new Set(tiles.map((tile) => tile.finish).filter(Boolean)))
  const ordered = TILE_FINISH_ORDER.filter((value) => unique.includes(value))
  const rest = unique.filter((value) => !TILE_FINISH_ORDER.includes(value))
  return [...ordered, ...rest].join(" / ")
}

export function getTileContactsHref(product: Product, tile: IndividualTile): string {
  return `/contacts?product=${encodeURIComponent(product.slug)}&ref=${encodeURIComponent(tile.label)}`
}

export function uniqueTileFieldValues(
  tiles: IndividualTile[],
  key: TileVariantFilterKey,
): string[] {
  const values = Array.from(new Set(tiles.map((tile) => tile[key]).filter(Boolean)))
  if (key === "status") {
    const ordered = TILE_STATUS_ORDER.filter((value) => values.includes(value))
    const rest = values.filter((value) => !TILE_STATUS_ORDER.includes(value))
    return [...ordered, ...rest]
  }
  if (key === "thickness") {
    return values.sort((a, b) => (parseThickness(a) ?? 0) - (parseThickness(b) ?? 0))
  }
  if (key === "finish") {
    const ordered = TILE_FINISH_ORDER.filter((value) => values.includes(value))
    const rest = values.filter((value) => !TILE_FINISH_ORDER.includes(value))
    return [...ordered, ...rest.sort((a, b) => a.localeCompare(b, "ru"))]
  }
  if (key === "size") {
    return values.sort((a, b) => parseSizeSortKey(a) - parseSizeSortKey(b) || a.localeCompare(b, "ru"))
  }
  return values.sort((a, b) => a.localeCompare(b, "ru"))
}

export function getVisibleTileVariantFilterKeys(tiles: IndividualTile[]): TileVariantFilterKey[] {
  return TILE_VARIANT_FILTER_KEYS.filter((key) => uniqueTileFieldValues(tiles, key).length > 1)
}

export function filterTileVariants(
  tiles: IndividualTile[],
  filters: TileVariantFilterState,
): IndividualTile[] {
  return tiles.filter((tile) => {
    if (filters.size !== "all" && tile.size !== filters.size) return false
    if (filters.thickness !== "all" && tile.thickness !== filters.thickness) return false
    if (filters.finish !== "all" && tile.finish !== filters.finish) return false
    if (filters.status !== "all" && tile.status !== filters.status) return false
    return true
  })
}

export function tileVariantFilterOptions(
  tiles: IndividualTile[],
  filters: TileVariantFilterState,
  key: TileVariantFilterKey,
): string[] {
  return uniqueTileFieldValues(filterTileVariants(tiles, { ...filters, [key]: "all" }), key)
}

export function hasActiveTileVariantFilters(filters: TileVariantFilterState): boolean {
  return TILE_VARIANT_FILTER_KEYS.some((key) => filters[key] !== EMPTY_TILE_VARIANT_FILTERS[key])
}

export function pruneTileVariantFilters(
  tiles: IndividualTile[],
  filters: TileVariantFilterState,
): TileVariantFilterState {
  const next = { ...filters }
  for (const key of TILE_VARIANT_FILTER_KEYS) {
    if (next[key] === "all") continue
    const options = uniqueTileFieldValues(filterTileVariants(tiles, { ...next, [key]: "all" }), key)
    if (!options.includes(next[key])) next[key] = "all"
  }
  return next
}
