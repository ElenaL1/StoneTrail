import type { IndividualSlab, Product } from "./mock-data"
import { stoneTypeGenitive } from "./stone-inventory"

export type SlabLotFilterKey = "thickness" | "finish" | "status"

export type SlabLotFilterState = {
  thickness: string
  finish: string
  status: string
}

export const EMPTY_SLAB_LOT_FILTERS: SlabLotFilterState = {
  thickness: "all",
  finish: "all",
  status: "all",
}

export const SLAB_LOT_FILTER_DEFS: Record<
  SlabLotFilterKey,
  { label: string; allLabel: string }
> = {
  thickness: { label: "Толщина", allLabel: "Любая" },
  finish: { label: "Поверхность", allLabel: "Любая" },
  status: { label: "Статус", allLabel: "Любой" },
}

const SLAB_LOT_FILTER_KEYS: SlabLotFilterKey[] = ["thickness", "finish", "status"]
const SLAB_STATUS_ORDER = ["В наличии", "Зарезервирован", "Под заказ"]

export function getProductSlabs(product: Product): IndividualSlab[] {
  return product.slabs ?? []
}

export function pluralSlabs(n: number): string {
  if (n === 1) return "слэб"
  const nMod10 = n % 10
  const nMod100 = n % 100
  if (nMod10 >= 2 && nMod10 <= 4 && (nMod100 < 10 || nMod100 >= 20)) {
    return "слэба"
  }
  return "слэбов"
}

export function getSlabPageTitle(stoneName: string): string {
  const name = stoneName.trim()
  if (name.toLocaleLowerCase("ru").includes("слэб")) return name
  return `Слэб ${name}`
}

export function getSlabLotSectionTitle(stoneType: string, stoneName: string): string {
  return `Слэбы ${stoneTypeGenitive(stoneType)} ${stoneName.trim()}`
}

type ParsedSize = { width: number; height: number; unit: string }

function parseSize(value: string): ParsedSize | null {
  const match = value.match(/(\d[\d\s]*)\s*×\s*(\d[\d\s]*)\s*(мм|cm|см)?/i)
  if (!match) return null
  const width = Number(match[1].replace(/\s/g, ""))
  const height = Number(match[2].replace(/\s/g, ""))
  if (Number.isNaN(width) || Number.isNaN(height)) return null
  return { width, height, unit: match[3] ?? "мм" }
}

function formatRange(values: number[]): string {
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return String(min)
  return `${min}–${max}`
}

export function getSlabSizeRange(slabs: IndividualSlab[]): string {
  const parsed = slabs.map((slab) => parseSize(slab.size)).filter((item): item is ParsedSize => item !== null)
  if (parsed.length === 0) return slabs[0]?.size ?? ""
  if (parsed.length === 1) return slabs[0].size

  const widths = parsed.map((item) => item.width)
  const heights = parsed.map((item) => item.height)
  const unit = parsed[0].unit
  const single = widths.every((value) => value === widths[0]) && heights.every((value) => value === heights[0])
  if (single) return slabs[0].size
  return `${formatRange(widths)} × ${formatRange(heights)} ${unit}`
}

function parseThickness(value: string): number | null {
  const match = value.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return null
  const n = Number(match[1].replace(",", "."))
  return Number.isNaN(n) ? null : n
}

export function getSlabThicknessRange(slabs: IndividualSlab[]): string {
  const parsed = slabs
    .map((slab) => ({ slab, value: parseThickness(slab.thickness) }))
    .filter((item): item is { slab: IndividualSlab; value: number } => item.value !== null)

  if (parsed.length === 0) return slabs[0]?.thickness ?? ""
  const values = parsed.map((item) => item.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return parsed[0].slab.thickness
  return `${min}–${max} мм`
}

export function getSlabFinishSummary(slabs: IndividualSlab[]): string {
  const unique = Array.from(new Set(slabs.map((slab) => slab.finish).filter(Boolean)))
  return unique.join(" / ")
}

export function getSlabContactsHref(product: Product, slab: IndividualSlab): string {
  return `/contacts?product=${encodeURIComponent(product.slug)}&ref=${encodeURIComponent(slab.label)}`
}

export function uniqueSlabFieldValues(
  slabs: IndividualSlab[],
  key: SlabLotFilterKey,
): string[] {
  const values = Array.from(new Set(slabs.map((slab) => slab[key]).filter(Boolean)))
  if (key === "status") {
    const ordered = SLAB_STATUS_ORDER.filter((value) => values.includes(value))
    const rest = values.filter((value) => !SLAB_STATUS_ORDER.includes(value))
    return [...ordered, ...rest]
  }
  if (key === "thickness") {
    return values.sort((a, b) => (parseThickness(a) ?? 0) - (parseThickness(b) ?? 0))
  }
  return values.sort((a, b) => a.localeCompare(b, "ru"))
}

export function getVisibleSlabLotFilterKeys(slabs: IndividualSlab[]): SlabLotFilterKey[] {
  return SLAB_LOT_FILTER_KEYS.filter((key) => uniqueSlabFieldValues(slabs, key).length > 1)
}

export function filterSlabLot(
  slabs: IndividualSlab[],
  filters: SlabLotFilterState,
): IndividualSlab[] {
  return slabs.filter((slab) => {
    if (filters.thickness !== "all" && slab.thickness !== filters.thickness) return false
    if (filters.finish !== "all" && slab.finish !== filters.finish) return false
    if (filters.status !== "all" && slab.status !== filters.status) return false
    return true
  })
}

export function slabLotFilterOptions(
  slabs: IndividualSlab[],
  filters: SlabLotFilterState,
  key: SlabLotFilterKey,
): string[] {
  return uniqueSlabFieldValues(filterSlabLot(slabs, { ...filters, [key]: "all" }), key)
}

export function hasActiveSlabLotFilters(filters: SlabLotFilterState): boolean {
  return SLAB_LOT_FILTER_KEYS.some((key) => filters[key] !== EMPTY_SLAB_LOT_FILTERS[key])
}

export function pruneSlabLotFilters(
  slabs: IndividualSlab[],
  filters: SlabLotFilterState,
): SlabLotFilterState {
  const next = { ...filters }
  for (const key of SLAB_LOT_FILTER_KEYS) {
    if (next[key] === "all") continue
    const options = uniqueSlabFieldValues(filterSlabLot(slabs, { ...next, [key]: "all" }), key)
    if (!options.includes(next[key])) next[key] = "all"
  }
  return next
}
