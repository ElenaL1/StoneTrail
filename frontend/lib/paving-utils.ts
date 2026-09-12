import type { IndividualPaving, Product } from "./mock-data"
import {
  finishSummary,
  getLotItemContactsHref,
  sizeSummary,
  thicknessRange,
} from "./measure-utils"
import { createLotFilterKit, type LotFilterDef } from "./lot-filter-utils"

export type PavingVariantFilterKey = "size" | "thickness" | "finish" | "status"

export type PavingVariantFilterState = {
  size: string
  thickness: string
  finish: string
  status: string
}

export const EMPTY_PAVING_VARIANT_FILTERS: PavingVariantFilterState = {
  size: "all",
  thickness: "all",
  finish: "all",
  status: "all",
}

export const PAVING_VARIANT_FILTER_DEFS: Record<PavingVariantFilterKey, LotFilterDef> = {
  size: { label: "Формат", allLabel: "Любой" },
  thickness: { label: "Толщина", allLabel: "Любая" },
  finish: { label: "Обработка", allLabel: "Любая" },
  status: { label: "Статус", allLabel: "Любой" },
}

const PAVING_VARIANT_FILTER_KEYS: PavingVariantFilterKey[] = ["size", "thickness", "finish", "status"]
const PAVING_FINISH_ORDER = ["Колотая", "Пилено-колотая", "Термообработанная", "Пиленая"]

const pavingKit = createLotFilterKit<IndividualPaving, PavingVariantFilterKey>({
  keys: PAVING_VARIANT_FILTER_KEYS,
  empty: EMPTY_PAVING_VARIANT_FILTERS,
  finishOrder: PAVING_FINISH_ORDER,
})

export function getProductPaving(product: Product): IndividualPaving[] {
  return product.paving ?? []
}

export function getPavingPageTitle(product: Pick<Product, "name" | "stoneName">): string {
  const name = product.name.trim()
  if (name.toLocaleLowerCase("ru").includes("брусчатк")) return name
  const stone = product.stoneName.trim()
  if (stone.toLocaleLowerCase("ru").includes("брусчатк")) return stone
  return `Брусчатка ${stone}`
}

export function getPavingVariantSectionTitle(stoneType: string, stoneName: string): string {
  return `Брусчатка ${stoneType.trim().toLocaleLowerCase("ru")} ${stoneName.trim()}`
}

export function getPavingSizeSummary(items: IndividualPaving[]): string {
  return sizeSummary(items)
}

export function getPavingThicknessRange(items: IndividualPaving[]): string {
  return thicknessRange(items)
}

export function getPavingFinishSummary(items: IndividualPaving[]): string {
  return finishSummary(items, PAVING_FINISH_ORDER)
}

export function getPavingContactsHref(product: Product, item: IndividualPaving): string {
  return getLotItemContactsHref(product, item)
}

export const uniquePavingFieldValues = pavingKit.uniqueFieldValues
export const getVisiblePavingVariantFilterKeys = pavingKit.getVisibleFilterKeys
export const filterPavingVariants = pavingKit.filterItems
export const pavingVariantFilterOptions = pavingKit.filterOptions
export const hasActivePavingVariantFilters = pavingKit.hasActiveFilters
export const prunePavingVariantFilters = pavingKit.pruneFilters
