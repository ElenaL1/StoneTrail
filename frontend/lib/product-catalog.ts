import type { FinishedProduct, Product, ProductCategory } from "@/lib/mock-data"
import {
  CUSTOM_GROUP_ALL,
  FILTER_DEFS,
  getCustomFilterKeys,
  getCustomGroupLabel,
  getFilterValue,
  getProductAvailability,
  getProductPriceLabel,
  type ProductFilterKey,
} from "@/lib/custom-catalog"
import { getLotStatus } from "@/lib/block-utils"
import {
  getSlabFinishSummary,
  getSlabPageTitle,
  getSlabSizeRange,
  getSlabThicknessRange,
  pluralSlabs,
} from "@/lib/slab-utils"
import {
  getBlankFinishSummary,
  getBlankPageTitle,
  getBlankSizeRange,
  getBlankThicknessRange,
  pluralBlanks,
} from "@/lib/blank-utils"
import {
  getTileFinishSummary,
  getTilePageTitle,
  getTileSizeSummary,
  getTileThicknessRange,
} from "@/lib/tile-utils"
import {
  getPavingFinishSummary,
  getPavingPageTitle,
  getPavingSizeSummary,
  getPavingThicknessRange,
} from "@/lib/paving-utils"

export const DEFAULT_PRODUCT_CATEGORY: ProductCategory = "custom"

export const PRODUCT_CATEGORY_IDS: ProductCategory[] = ["slabs", "blanks", "tiles", "paving", "custom"]

export const PRODUCT_PAGE_SIZE = 12

export type ProductSortId = "relevance" | "name" | "availability"

export const PRODUCT_SORT_OPTIONS: { id: ProductSortId; label: string }[] = [
  { id: "relevance", label: "По релевантности" },
  { id: "name", label: "По названию" },
  { id: "availability", label: "Сначала в наличии" },
]

export const PRODUCT_CATEGORY_META: Record<
  ProductCategory,
  {
    id: ProductCategory
    label: string
    description: string
    searchPlaceholder: string
    emptyTitle: string
    emptyDescription: string
  }
> = {
  slabs: {
    id: "slabs",
    label: "Слэбы",
    description:
      "Крупноформатные плиты для столешниц, облицовки и акцентных поверхностей. Подбор выполняем по конкретной плите.",
    searchPlaceholder: "Название слэба или камень…",
    emptyTitle: "Слэбы не найдены",
    emptyDescription: "Измените фильтр или опишите задачу — подберём плиту под проект.",
  },
  blanks: {
    id: "blanks",
    label: "Заготовки",
    description:
      "Черновые и калиброванные заготовки под дальнейшую обработку и раскрой. Формат готовим под задачу объекта.",
    searchPlaceholder: "Название заготовки или камень…",
    emptyTitle: "Заготовки не найдены",
    emptyDescription: "Измените фильтр или опишите задачу — подберём полуслэб под раскрой.",
  },
  tiles: {
    id: "tiles",
    label: "Плита",
    description:
      "Облицовочная плита из натурального камня для полов, стен и влажных зон. Форматы подбираем под задачу объекта.",
    searchPlaceholder: "Название плиты или камень…",
    emptyTitle: "Плита не найдена",
    emptyDescription: "Попробуйте другой фильтр или уточните формат — изготовим партию под объект.",
  },
  paving: {
    id: "paving",
    label: "Брусчатка",
    description:
      "Гранитная брусчатка для дорожек, террас, входных групп и общественных пространств.",
    searchPlaceholder: "Название или камень…",
    emptyTitle: "Брусчатка не найдена",
    emptyDescription: "Измените параметры или расскажите о участке — подберём модуль и обработку.",
  },
  custom: {
    id: "custom",
    label: "Изделия под заказ",
    description:
      "Изготавливаем изделия из натурального камня по проекту, размерам и требованиям объекта.",
    searchPlaceholder: "Название, камень, месторождение или тип изделия…",
    emptyTitle: "Ничего не найдено",
    emptyDescription:
      "Попробуйте другой фильтр или обратитесь к эксперту — изготовим изделие под ваш проект.",
  },
}

export type ProductFilterState = {
  search: string
  productType: string
  stoneType: string
  origin: string
  color: string
  thickness: string
  finish: string
  availability: string
  size: string
  purpose: string
  height: string
  diameter: string
  format: string
  dimensions: string
}

export const EMPTY_PRODUCT_FILTERS: ProductFilterState = {
  search: "",
  productType: "all",
  stoneType: "all",
  origin: "all",
  color: "all",
  thickness: "all",
  finish: "all",
  availability: "all",
  size: "all",
  purpose: "all",
  height: "all",
  diameter: "all",
  format: "all",
  dimensions: "all",
}

export const FILTER_STATE_KEY: Record<ProductFilterKey, keyof ProductFilterState> = {
  material: "stoneType",
  origin: "origin",
  status: "availability",
  productType: "productType",
  thickness: "thickness",
  finish: "finish",
  purpose: "purpose",
  height: "height",
  diameter: "diameter",
  format: "format",
  dimensions: "dimensions",
  color: "color",
}

export function parseProductCategory(value: string | null | undefined): ProductCategory {
  if (
    value === "slabs" ||
    value === "blanks" ||
    value === "tiles" ||
    value === "paving" ||
    value === "custom"
  ) {
    return value
  }
  return DEFAULT_PRODUCT_CATEGORY
}

export function isCustomProduct(product: Product): product is FinishedProduct {
  return product.category === "custom"
}

export function getProductTypeLabel(product: Product): string {
  if (product.productType) return product.productType
  return PRODUCT_CATEGORY_META[product.category].label
}

const PRODUCT_BREADCRUMB_KIND: Record<ProductCategory, string | null> = {
  slabs: "Слэб",
  blanks: "Заготовка",
  tiles: "Плита",
  paving: "Брусчатка",
  custom: null,
}

export function getProductBreadcrumbTitle(product: Product): string {
  if (product.category === "slabs") return getSlabPageTitle(product.stoneName)
  if (product.category === "blanks") return getBlankPageTitle(product.stoneName)
  if (product.category === "tiles") return getTilePageTitle(product.stoneName)
  if (product.category === "paving") return getPavingPageTitle(product)

  const kind = PRODUCT_BREADCRUMB_KIND[product.category]
  const name = product.name.trim()
  if (!kind) return name

  const kindLower = kind.toLocaleLowerCase("ru")
  if (name.toLocaleLowerCase("ru").includes(kindLower)) return name
  return `${kind} ${name}`
}

export function uniqueProductValues(products: Product[], key: keyof Product): string[] {
  const values = products
    .map((product) => product[key])
    .filter((value): value is string => typeof value === "string" && value.length > 0)
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "ru"))
}

export function getCatalogFilterKeys(
  category: ProductCategory,
  customGroup: string,
  productType: string,
): ProductFilterKey[] {
  switch (category) {
    case "slabs":
      return ["material", "color", "thickness", "finish", "status"]
    case "blanks":
      return ["material", "color", "thickness", "finish", "status"]
    case "tiles":
      return ["material", "format", "thickness", "finish"]
    case "paving":
      return ["material", "format", "thickness", "finish"]
    case "custom":
      return getCustomFilterKeys(customGroup, productType)
  }
}

export function countActiveFilters(filters: ProductFilterState, keys: ProductFilterKey[]): number {
  return keys.reduce((count, key) => {
    const stateKey = FILTER_STATE_KEY[key]
    return filters[stateKey] !== "all" ? count + 1 : count
  }, 0)
}

export function filterCatalogProducts(
  products: Product[],
  category: ProductCategory,
  filters: ProductFilterState,
  customGroup: string = CUSTOM_GROUP_ALL,
): Product[] {
  const query = filters.search.trim().toLowerCase()
  const activeKeys = getCatalogFilterKeys(category, customGroup, filters.productType)

  return products.filter((product) => {
    if (product.category !== category) return false
    if (category === "custom" && customGroup !== CUSTOM_GROUP_ALL && product.customGroup !== customGroup) {
      return false
    }

    if (query && !productMatchesQuery(product, query)) return false

    for (const key of activeKeys) {
      if (key === "productType" && category !== "custom") continue
      const stateKey = FILTER_STATE_KEY[key]
      const selected = filters[stateKey]
      if (selected === "all") continue

      if (key === "format" && category === "tiles") {
        if (product.size !== selected && product.format !== selected) return false
        continue
      }
      if (key === "finish" && category === "tiles") {
        const tiles = product.tiles ?? []
        if (tiles.length > 0) {
          if (!tiles.some((tile) => tile.finish === selected)) return false
          continue
        }
      }
      if (category === "paving" && (key === "format" || key === "dimensions" || key === "thickness" || key === "finish")) {
        const items = product.paving ?? []
        if (items.length > 0) {
          if (key === "format" || key === "dimensions") {
            if (!items.some((item) => item.size === selected)) return false
          } else if (key === "thickness") {
            if (!items.some((item) => item.thickness === selected)) return false
          } else if (!items.some((item) => item.finish === selected)) {
            return false
          }
          continue
        }
        if (key === "format" || key === "dimensions") {
          if (product.size !== selected && product.dimensions !== selected && product.format !== selected) {
            return false
          }
          continue
        }
      }

      const value = getFilterValue(product, key)
      if (value !== selected) return false
    }

    return true
  })
}

export function sortCatalogProducts(
  products: Product[],
  sort: ProductSortId,
  query: string,
): Product[] {
  const copy = [...products]
  if (sort === "name") {
    return copy.sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }
  if (sort === "availability") {
    return copy.sort((a, b) => {
      const diff = availabilityRank(a) - availabilityRank(b)
      return diff !== 0 ? diff : a.name.localeCompare(b.name, "ru")
    })
  }
  if (query.trim()) {
    return copy.sort((a, b) => relevanceScore(b, query) - relevanceScore(a, query))
  }
  return copy
}

export function hasActiveProductFilters(filters: ProductFilterState): boolean {
  if (filters.search.trim()) return true
  return (Object.keys(EMPTY_PRODUCT_FILTERS) as (keyof ProductFilterState)[]).some((key) => {
    if (key === "search") return false
    return filters[key] !== EMPTY_PRODUCT_FILTERS[key]
  })
}

function productMatchesQuery(product: Product, query: string): boolean {
  const groupLabel = getCustomGroupLabel(product.customGroup)
  const haystack = [
    product.name,
    product.stoneName,
    product.stoneType,
    product.productType,
    product.description,
    product.origin,
    product.quarry,
    product.purpose,
    product.finish,
    product.color,
    groupLabel,
    PRODUCT_CATEGORY_META[product.category].label,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return haystack.includes(query)
}

function availabilityRank(product: Product): number {
  return getProductAvailability(product) === "В наличии" ? 0 : 1
}

function relevanceScore(product: Product, query: string): number {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  const fields: [string | undefined, number][] = [
    [product.name, 8],
    [product.productType, 5],
    [product.stoneType, 4],
    [product.stoneName, 3],
    [product.origin, 3],
    [product.quarry, 3],
    [getCustomGroupLabel(product.customGroup), 2],
    [product.purpose, 1],
  ]
  return fields.reduce((score, [value, weight]) => {
    if (!value) return score
    const lower = value.toLowerCase()
    if (lower === q) return score + weight * 3
    if (lower.startsWith(q)) return score + weight * 2
    if (lower.includes(q)) return score + weight
    return score
  }, 0)
}

function pluralRu(count: number, forms: [string, string, string]): string {
  const abs = Math.abs(count) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (last > 1 && last < 5) return forms[1]
  if (last === 1) return forms[0]
  return forms[2]
}

const CATEGORY_COUNT_FORMS: Record<ProductCategory, [string, string, string]> = {
  slabs: ["слэб", "слэба", "слэбов"],
  blanks: ["заготовка", "заготовки", "заготовок"],
  tiles: ["позиция", "позиции", "позиций"],
  paving: ["позиция", "позиции", "позиций"],
  custom: ["изделие", "изделия", "изделий"],
}

export function formatProductCount(count: number, category: ProductCategory): string {
  return `${count} ${pluralRu(count, CATEGORY_COUNT_FORMS[category])}`
}

export function getProductSpecifications(product: Product): { label: string; value: string }[] {
  const price = getProductPriceLabel(product)
  switch (product.category) {
    case "slabs": {
      const slabs = product.slabs ?? []
      if (slabs.length > 0) {
        return [
          { label: "Вид камня", value: product.stoneType },
          { label: "Размер", value: getSlabSizeRange(slabs) },
          { label: "Толщина", value: getSlabThicknessRange(slabs) },
          { label: "Поверхность", value: getSlabFinishSummary(slabs) },
          { label: "В партии", value: `${slabs.length} ${pluralSlabs(slabs.length)}` },
          { label: "Наличие", value: getLotStatus(slabs) },
        ].filter((row) => row.value)
      }
      return [
        { label: "Вид камня", value: product.stoneType },
        { label: "Размер", value: product.size ?? "" },
        { label: "Толщина", value: product.thickness ?? "" },
        { label: "Поверхность", value: product.finish ?? "" },
        { label: "Наличие", value: product.availability ?? "" },
      ].filter((row) => row.value)
    }
    case "blanks": {
      const blanks = product.blanks ?? []
      if (blanks.length > 0) {
        return [
          { label: "Вид камня", value: product.stoneType },
          { label: "Размер", value: getBlankSizeRange(blanks) },
          { label: "Толщина", value: getBlankThicknessRange(blanks) },
          { label: "Поверхность", value: getBlankFinishSummary(blanks) },
          { label: "В партии", value: `${blanks.length} ${pluralBlanks(blanks.length)}` },
          { label: "Наличие", value: getLotStatus(blanks) },
        ].filter((row) => row.value)
      }
      return [
        { label: "Вид камня", value: product.stoneType },
        { label: "Размер", value: product.size ?? product.dimensions ?? "" },
        { label: "Толщина", value: product.thickness ?? "" },
        { label: "Поверхность", value: product.finish ?? "" },
        { label: "Наличие", value: product.availability ?? "" },
      ].filter((row) => row.value)
    }
    case "tiles": {
      const tiles = product.tiles ?? []
      if (tiles.length > 0) {
        return [
          { label: "Вид камня", value: product.stoneType },
          { label: "Форматы", value: getTileSizeSummary(tiles) },
          { label: "Толщина", value: getTileThicknessRange(tiles) },
          { label: "Поверхность", value: getTileFinishSummary(tiles) },
          { label: "Изготовление", value: getLotStatus(tiles) },
        ].filter((row) => row.value)
      }
      return [
        { label: "Вид камня", value: product.stoneType },
        { label: "Форматы", value: product.size ?? product.format ?? "" },
        { label: "Толщина", value: product.thickness ?? "" },
        { label: "Поверхность", value: product.finish ?? "" },
        { label: "Изготовление", value: product.availability ?? "" },
      ].filter((row) => row.value)
    }
    case "paving": {
      const paving = product.paving ?? []
      if (paving.length > 0) {
        return [
          { label: "Вид камня", value: product.stoneType },
          { label: "Форматы", value: getPavingSizeSummary(paving) },
          { label: "Толщина", value: getPavingThicknessRange(paving) },
          { label: "Обработка", value: getPavingFinishSummary(paving) },
          { label: "Изготовление", value: getLotStatus(paving) },
        ].filter((row) => row.value)
      }
      return [
        { label: "Вид камня", value: product.stoneType },
        { label: "Форматы", value: product.size ?? product.dimensions ?? "" },
        { label: "Толщина", value: product.thickness ?? "" },
        { label: "Обработка", value: product.finish ?? "" },
        { label: "Изготовление", value: product.availability ?? "" },
      ].filter((row) => row.value)
    }
    case "custom": {
      const groupLabel = getCustomGroupLabel(product.customGroup)
      return [
        { label: "Категория", value: groupLabel ?? "" },
        { label: "Тип изделия", value: product.productType ?? "" },
        { label: "Материал", value: product.stoneType },
        { label: "Сорт", value: product.stoneName },
        { label: "Происхождение", value: product.origin ?? "" },
        { label: "Месторождение", value: product.quarry ?? "" },
        { label: "Назначение", value: product.purpose ?? "" },
        { label: "Размеры", value: product.dimensions ?? "" },
        { label: "Толщина", value: product.thickness ?? "" },
        { label: "Высота", value: product.height ?? "" },
        { label: "Диаметр", value: product.diameter ?? "" },
        { label: "Формат", value: product.format ?? "" },
        { label: "Обработка", value: product.finish ?? "" },
        { label: "Статус", value: getProductAvailability(product) ?? "" },
        { label: "Цена", value: price },
      ].filter((row) => row.value)
    }
  }
}

export { FILTER_DEFS, getProductAvailability, getProductPriceLabel }
