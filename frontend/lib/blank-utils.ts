import type { IndividualBlank, IndividualSlab, Product } from "./mock-data"
import { stoneTypeGenitive } from "./stone-inventory"
import { getLotItemContactsHref, pluralRu } from "./measure-utils"
import {
  EMPTY_SLAB_LOT_FILTERS,
  SLAB_LOT_FILTER_DEFS,
  filterSlabLot,
  getSlabFinishSummary,
  getSlabSizeRange,
  getSlabThicknessRange,
  getVisibleSlabLotFilterKeys,
  hasActiveSlabLotFilters,
  pruneSlabLotFilters,
  slabLotFilterOptions,
  type SlabLotFilterKey,
  type SlabLotFilterState,
} from "./slab-utils"

export type BlankLotFilterKey = SlabLotFilterKey
export type BlankLotFilterState = SlabLotFilterState

export const EMPTY_BLANK_LOT_FILTERS = EMPTY_SLAB_LOT_FILTERS
export const BLANK_LOT_FILTER_DEFS = SLAB_LOT_FILTER_DEFS

function asSlabs(blanks: IndividualBlank[]): IndividualSlab[] {
  return blanks
}

export function getProductBlanks(product: Product): IndividualBlank[] {
  return product.blanks ?? []
}

export function pluralBlanks(n: number): string {
  return pluralRu(n, ["заготовка", "заготовки", "заготовок"])
}

export function getBlankPageTitle(stoneName: string): string {
  const name = stoneName.trim()
  if (name.toLocaleLowerCase("ru").includes("заготов")) return name
  return `Заготовка ${name}`
}

export function getBlankLotSectionTitle(stoneType: string, stoneName: string): string {
  return `Заготовки ${stoneTypeGenitive(stoneType)} ${stoneName.trim()}`
}

export function getBlankSizeRange(blanks: IndividualBlank[]): string {
  return getSlabSizeRange(asSlabs(blanks))
}

export function getBlankThicknessRange(blanks: IndividualBlank[]): string {
  return getSlabThicknessRange(asSlabs(blanks))
}

export function getBlankFinishSummary(blanks: IndividualBlank[]): string {
  return getSlabFinishSummary(asSlabs(blanks))
}

export function getBlankContactsHref(product: Product, blank: IndividualBlank): string {
  return getLotItemContactsHref(product, blank)
}

export function getVisibleBlankLotFilterKeys(blanks: IndividualBlank[]): BlankLotFilterKey[] {
  return getVisibleSlabLotFilterKeys(asSlabs(blanks))
}

export function filterBlankLot(
  blanks: IndividualBlank[],
  filters: BlankLotFilterState,
): IndividualBlank[] {
  return filterSlabLot(asSlabs(blanks), filters)
}

export function blankLotFilterOptions(
  blanks: IndividualBlank[],
  filters: BlankLotFilterState,
  key: BlankLotFilterKey,
): string[] {
  return slabLotFilterOptions(asSlabs(blanks), filters, key)
}

export function hasActiveBlankLotFilters(filters: BlankLotFilterState): boolean {
  return hasActiveSlabLotFilters(filters)
}

export function pruneBlankLotFilters(
  blanks: IndividualBlank[],
  filters: BlankLotFilterState,
): BlankLotFilterState {
  return pruneSlabLotFilters(asSlabs(blanks), filters)
}
