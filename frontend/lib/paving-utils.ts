import type { IndividualPaving, Product } from "./mock-data"

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

export const PAVING_VARIANT_FILTER_DEFS: Record<
  PavingVariantFilterKey,
  { label: string; allLabel: string }
> = {
  size: { label: "Формат", allLabel: "Любой" },
  thickness: { label: "Толщина", allLabel: "Любая" },
  finish: { label: "Обработка", allLabel: "Любая" },
  status: { label: "Статус", allLabel: "Любой" },
}

const PAVING_VARIANT_FILTER_KEYS: PavingVariantFilterKey[] = ["size", "thickness", "finish", "status"]
const PAVING_STATUS_ORDER = ["В наличии", "Зарезервирован", "Под заказ"]
const PAVING_FINISH_ORDER = ["Колотая", "Пилено-колотая", "Термообработанная", "Пиленая"]

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

export function getPavingSizeSummary(items: IndividualPaving[]): string {
  const unique = Array.from(new Set(items.map((item) => item.size).filter(Boolean)))
  unique.sort((a, b) => parseSizeSortKey(a) - parseSizeSortKey(b) || a.localeCompare(b, "ru"))
  return unique.join(" / ")
}

export function getPavingThicknessRange(items: IndividualPaving[]): string {
  const parsed = items
    .map((item) => ({ item, value: parseThickness(item.thickness) }))
    .filter((entry): entry is { item: IndividualPaving; value: number } => entry.value !== null)

  if (parsed.length === 0) return items[0]?.thickness ?? ""
  const values = parsed.map((entry) => entry.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return parsed[0].item.thickness
  return `${min}–${max} мм`
}

export function getPavingFinishSummary(items: IndividualPaving[]): string {
  const unique = Array.from(new Set(items.map((item) => item.finish).filter(Boolean)))
  const ordered = PAVING_FINISH_ORDER.filter((value) => unique.includes(value))
  const rest = unique.filter((value) => !PAVING_FINISH_ORDER.includes(value))
  return [...ordered, ...rest].join(" / ")
}

export function getPavingContactsHref(product: Product, item: IndividualPaving): string {
  return `/contacts?product=${encodeURIComponent(product.slug)}&ref=${encodeURIComponent(item.label)}`
}

export function uniquePavingFieldValues(
  items: IndividualPaving[],
  key: PavingVariantFilterKey,
): string[] {
  const values = Array.from(new Set(items.map((item) => item[key]).filter(Boolean)))
  if (key === "status") {
    const ordered = PAVING_STATUS_ORDER.filter((value) => values.includes(value))
    const rest = values.filter((value) => !PAVING_STATUS_ORDER.includes(value))
    return [...ordered, ...rest]
  }
  if (key === "thickness") {
    return values.sort((a, b) => (parseThickness(a) ?? 0) - (parseThickness(b) ?? 0))
  }
  if (key === "finish") {
    const ordered = PAVING_FINISH_ORDER.filter((value) => values.includes(value))
    const rest = values.filter((value) => !PAVING_FINISH_ORDER.includes(value))
    return [...ordered, ...rest.sort((a, b) => a.localeCompare(b, "ru"))]
  }
  if (key === "size") {
    return values.sort((a, b) => parseSizeSortKey(a) - parseSizeSortKey(b) || a.localeCompare(b, "ru"))
  }
  return values.sort((a, b) => a.localeCompare(b, "ru"))
}

export function getVisiblePavingVariantFilterKeys(items: IndividualPaving[]): PavingVariantFilterKey[] {
  return PAVING_VARIANT_FILTER_KEYS.filter((key) => uniquePavingFieldValues(items, key).length > 1)
}

export function filterPavingVariants(
  items: IndividualPaving[],
  filters: PavingVariantFilterState,
): IndividualPaving[] {
  return items.filter((item) => {
    if (filters.size !== "all" && item.size !== filters.size) return false
    if (filters.thickness !== "all" && item.thickness !== filters.thickness) return false
    if (filters.finish !== "all" && item.finish !== filters.finish) return false
    if (filters.status !== "all" && item.status !== filters.status) return false
    return true
  })
}

export function pavingVariantFilterOptions(
  items: IndividualPaving[],
  filters: PavingVariantFilterState,
  key: PavingVariantFilterKey,
): string[] {
  return uniquePavingFieldValues(filterPavingVariants(items, { ...filters, [key]: "all" }), key)
}

export function hasActivePavingVariantFilters(filters: PavingVariantFilterState): boolean {
  return PAVING_VARIANT_FILTER_KEYS.some((key) => filters[key] !== EMPTY_PAVING_VARIANT_FILTERS[key])
}

export function prunePavingVariantFilters(
  items: IndividualPaving[],
  filters: PavingVariantFilterState,
): PavingVariantFilterState {
  const next = { ...filters }
  for (const key of PAVING_VARIANT_FILTER_KEYS) {
    if (next[key] === "all") continue
    const options = uniquePavingFieldValues(filterPavingVariants(items, { ...next, [key]: "all" }), key)
    if (!options.includes(next[key])) next[key] = "all"
  }
  return next
}
