import type { IndividualSlab, Product } from "./mock-data"
import { stoneTypeGenitive } from "./stone-inventory"
import {
  finishSummary,
  getLotItemContactsHref,
  pluralRu,
  thicknessRange,
} from "./measure-utils"
import { createLotFilterKit, type LotFilterDef } from "./lot-filter-utils"

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

export const SLAB_LOT_FILTER_DEFS: Record<SlabLotFilterKey, LotFilterDef> = {
  thickness: { label: "Толщина", allLabel: "Любая" },
  finish: { label: "Поверхность", allLabel: "Любая" },
  status: { label: "Статус", allLabel: "Любой" },
}

const SLAB_LOT_FILTER_KEYS: SlabLotFilterKey[] = ["thickness", "finish", "status"]

const slabKit = createLotFilterKit<IndividualSlab, SlabLotFilterKey>({
  keys: SLAB_LOT_FILTER_KEYS,
  empty: EMPTY_SLAB_LOT_FILTERS,
})

export function getProductSlabs(product: Product): IndividualSlab[] {
  return product.slabs ?? []
}

export function pluralSlabs(n: number): string {
  return pluralRu(n, ["слэб", "слэба", "слэбов"])
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

export function getSlabThicknessRange(slabs: IndividualSlab[]): string {
  return thicknessRange(slabs)
}

export function getSlabFinishSummary(slabs: IndividualSlab[]): string {
  return finishSummary(slabs)
}

export function getSlabContactsHref(product: Product, slab: IndividualSlab): string {
  return getLotItemContactsHref(product, slab)
}

export const uniqueSlabFieldValues = slabKit.uniqueFieldValues
export const getVisibleSlabLotFilterKeys = slabKit.getVisibleFilterKeys
export const filterSlabLot = slabKit.filterItems
export const slabLotFilterOptions = slabKit.filterOptions
export const hasActiveSlabLotFilters = slabKit.hasActiveFilters
export const pruneSlabLotFilters = slabKit.pruneFilters
