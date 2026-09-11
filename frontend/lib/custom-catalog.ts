import type { Product } from "@/lib/mock-data"
import { getSlabPageTitle, getSlabThicknessRange, pluralSlabs } from "@/lib/slab-utils"
import { getBlankPageTitle, getBlankThicknessRange, pluralBlanks } from "@/lib/blank-utils"
import { getTilePageTitle, getTileThicknessRange } from "@/lib/tile-utils"
import { getPavingFinishSummary, getPavingPageTitle, getPavingThicknessRange } from "@/lib/paving-utils"

export const CUSTOM_GROUP_ALL = "all" as const

export type CustomGroupId =
  | "interior"
  | "exterior"
  | "facades"
  | "architectural"
  | "memorial"

export type ProductFilterKey =
  | "material"
  | "origin"
  | "status"
  | "productType"
  | "thickness"
  | "finish"
  | "purpose"
  | "height"
  | "diameter"
  | "format"
  | "dimensions"
  | "color"

export type CustomSubcategory = {
  id: string
  label: string
  filters: ProductFilterKey[]
}

export type CustomGroup = {
  id: CustomGroupId
  label: string
  description: string
  hidden?: boolean
  order: number
  filters: ProductFilterKey[]
  subcategories: CustomSubcategory[]
}

export const FILTER_DEFS: Record<
  ProductFilterKey,
  { label: string; allLabel: string }
> = {
  material: { label: "Материал", allLabel: "Любой" },
  origin: { label: "Происхождение", allLabel: "Любое" },
  status: { label: "Статус", allLabel: "Любой" },
  productType: { label: "Тип изделия", allLabel: "Все" },
  thickness: { label: "Толщина", allLabel: "Любая" },
  finish: { label: "Обработка", allLabel: "Любая" },
  purpose: { label: "Назначение", allLabel: "Любое" },
  height: { label: "Высота", allLabel: "Любая" },
  diameter: { label: "Диаметр", allLabel: "Любой" },
  format: { label: "Формат", allLabel: "Любой" },
  dimensions: { label: "Размеры", allLabel: "Любые" },
  color: { label: "Цвет", allLabel: "Любой" },
}

const INTERIOR_DEFAULT: ProductFilterKey[] = ["thickness", "finish", "dimensions", "purpose"]
const EXTERIOR_DEFAULT: ProductFilterKey[] = ["thickness", "finish", "format", "purpose"]
const FACADE_DEFAULT: ProductFilterKey[] = ["thickness", "format", "finish", "purpose"]
const ARCH_DEFAULT: ProductFilterKey[] = ["height", "diameter", "finish", "purpose"]
const MEMORIAL_DEFAULT: ProductFilterKey[] = ["finish", "dimensions", "purpose"]

export const CUSTOM_GROUPS: CustomGroup[] = [
  {
    id: "interior",
    label: "Интерьер",
    description: "Столешницы, лестницы, камины и другие изделия для жилых и общественных интерьеров.",
    order: 1,
    filters: INTERIOR_DEFAULT,
    subcategories: [
      { id: "countertops", label: "Столешницы", filters: ["thickness", "finish", "dimensions", "purpose"] },
      { id: "windowsills", label: "Подоконники", filters: ["thickness", "finish", "dimensions", "purpose"] },
      { id: "stairs", label: "Лестницы и ступени", filters: ["thickness", "finish", "dimensions", "purpose"] },
      { id: "fireplaces", label: "Камины", filters: ["finish", "dimensions", "purpose"] },
      { id: "sinks", label: "Мойки и ванны", filters: ["material", "finish", "dimensions", "purpose"] },
      { id: "mosaic", label: "Мозаика", filters: ["format", "finish", "purpose"] },
      { id: "carving", label: "Художественная резьба", filters: ["material", "finish", "purpose"] },
      { id: "reliefs", label: "Барельефы", filters: ["material", "finish", "dimensions", "purpose"] },
    ],
  },
  {
    id: "exterior",
    label: "Экстерьер и благоустройство",
    description: "Мощение, бордюры, лотки и массивные ступени для улицы и общественных пространств.",
    order: 2,
    filters: EXTERIOR_DEFAULT,
    subcategories: [
      { id: "paving-slabs", label: "Плиты мощения", filters: ["thickness", "format", "finish", "purpose"] },
      { id: "paving-stones", label: "Брусчатка", filters: ["thickness", "format", "finish", "purpose"] },
      { id: "curbs", label: "Бордюры", filters: ["thickness", "dimensions", "finish", "purpose"] },
      { id: "tactile", label: "Тактильные плиты", filters: ["format", "finish", "purpose"] },
      { id: "channels", label: "Водоприемные лотки", filters: ["dimensions", "finish", "purpose"] },
      { id: "massive-steps", label: "Массивные ступени", filters: ["thickness", "dimensions", "finish", "purpose"] },
    ],
  },
  {
    id: "facades",
    label: "Фасады",
    description: "Облицовка, вентфасады и фактурный камень для наружных стен.",
    order: 3,
    filters: FACADE_DEFAULT,
    subcategories: [
      { id: "cladding-tile", label: "Облицовочная плитка", filters: ["thickness", "format", "finish", "purpose"] },
      { id: "facade-slabs", label: "Фасадные плиты", filters: ["thickness", "format", "finish", "purpose"] },
      { id: "ventilated", label: "Плиты для вентфасадов", filters: ["thickness", "format", "finish", "purpose"] },
      { id: "split-stone", label: "Фактурный / колотый камень", filters: ["thickness", "finish", "purpose"] },
    ],
  },
  {
    id: "architectural",
    label: "Архитектурные изделия",
    description: "Колонны, балюстрады, фонтаны и малые архитектурные формы.",
    order: 4,
    filters: ARCH_DEFAULT,
    subcategories: [
      { id: "columns", label: "Колонны", filters: ["height", "diameter", "finish", "purpose"] },
      { id: "balustrades", label: "Балюстрады", filters: ["height", "finish", "purpose"] },
      { id: "balusters", label: "Балясины", filters: ["height", "diameter", "finish", "purpose"] },
      { id: "railings", label: "Перила", filters: ["height", "finish", "dimensions", "purpose"] },
      { id: "fountains", label: "Фонтаны", filters: ["height", "finish", "purpose"] },
      { id: "planters", label: "Вазоны", filters: ["height", "diameter", "finish", "purpose"] },
      { id: "benches", label: "Скамьи", filters: ["dimensions", "finish", "purpose"] },
      { id: "small-forms", label: "Другие малые архитектурные формы", filters: ["finish", "purpose"] },
    ],
  },
  {
    id: "memorial",
    label: "Мемориальные изделия",
    description: "Памятники, стелы и комплексы из натурального камня.",
    order: 5,
    filters: MEMORIAL_DEFAULT,
    subcategories: [
      { id: "monuments", label: "Памятники", filters: ["finish", "dimensions", "purpose"] },
      { id: "pedestals", label: "Постаменты", filters: ["height", "dimensions", "finish", "purpose"] },
      { id: "stelae", label: "Стелы", filters: ["height", "finish", "purpose"] },
      { id: "complexes", label: "Мемориальные комплексы", filters: ["finish", "purpose"] },
    ],
  },
]

export function getVisibleCustomGroups(): CustomGroup[] {
  return CUSTOM_GROUPS.filter((group) => !group.hidden).sort((a, b) => a.order - b.order)
}

export function getCustomGroup(id: string | null | undefined): CustomGroup | undefined {
  return CUSTOM_GROUPS.find((group) => group.id === id)
}

export function getCustomGroupLabel(id: string | null | undefined): string | undefined {
  if (!id || id === CUSTOM_GROUP_ALL) return undefined
  return getCustomGroup(id)?.label
}

export function parseCustomGroup(value: string | null | undefined): string {
  if (!value || value === CUSTOM_GROUP_ALL) return CUSTOM_GROUP_ALL
  const group = getCustomGroup(value)
  if (!group || group.hidden) return CUSTOM_GROUP_ALL
  return group.id
}

export function getSubcategory(groupId: string, productType: string): CustomSubcategory | undefined {
  const group = getCustomGroup(groupId)
  return group?.subcategories.find((item) => item.label === productType || item.id === productType)
}

export function getCustomFilterKeys(groupId: string, productType: string): ProductFilterKey[] {
  const common: ProductFilterKey[] = ["material", "origin", "status", "productType"]
  if (groupId === CUSTOM_GROUP_ALL) return common

  const group = getCustomGroup(groupId)
  if (!group) return common

  if (productType !== "all") {
    const sub = getSubcategory(groupId, productType)
    if (sub) return uniqueKeys([...common, ...sub.filters])
  }

  return uniqueKeys([...common, ...group.filters])
}

export const SEARCHABLE_FILTER_MIN_OPTIONS = 8

export type FilterOptionGroup = {
  label: string
  options: string[]
}

export function normalizeFilterQuery(value: string): string {
  return value.trim().toLocaleLowerCase("ru").replace(/ё/g, "е")
}

export function matchFilterOptions(options: string[], query: string): string[] {
  const q = normalizeFilterQuery(query)
  if (!q) return options

  const starts: string[] = []
  const contains: string[] = []
  for (const option of options) {
    const normalized = normalizeFilterQuery(option)
    if (normalized.startsWith(q)) starts.push(option)
    else if (normalized.includes(q)) contains.push(option)
  }
  return [...starts, ...contains]
}

export function getProductTypeOptions(products: Product[], groupId: string): string[] {
  return getProductTypeOptionGroups(products, groupId).flatMap((group) => group.options)
}

export function getProductTypeOptionGroups(
  products: Product[],
  groupId: string,
): FilterOptionGroup[] {
  const present = new Set(
    products
      .filter((product) => (groupId === CUSTOM_GROUP_ALL ? true : product.customGroup === groupId))
      .map((product) => product.productType)
      .filter((value): value is string => Boolean(value)),
  )

  const groups =
    groupId === CUSTOM_GROUP_ALL
      ? getVisibleCustomGroups()
      : ([getCustomGroup(groupId)].filter(Boolean) as CustomGroup[])

  const result: FilterOptionGroup[] = []
  const used = new Set<string>()

  for (const group of groups) {
    const options = group.subcategories
      .map((sub) => sub.label)
      .filter((label) => present.has(label) && !used.has(label))
    for (const label of options) used.add(label)
    if (options.length > 0) result.push({ label: group.label, options })
  }

  const leftovers = [...present].filter((label) => !used.has(label))
  if (leftovers.length > 0) {
    result.push({
      label: "Другие",
      options: leftovers.sort((a, b) => a.localeCompare(b, "ru")),
    })
  }

  return result
}

export function getFilterValue(product: Product, key: ProductFilterKey): string | undefined {
  switch (key) {
    case "material":
      return product.stoneType
    case "origin":
      return product.origin
    case "status":
      return product.availability ?? (product.status === "В наличии" ? "В наличии" : product.status === "Под заказ" ? "Под заказ" : undefined)
    case "productType":
      return product.productType
    case "thickness":
      return product.thickness
    case "finish":
      return product.finish
    case "purpose":
      return product.purpose
    case "height":
      return product.height ?? product.characteristics?.["Высота"]
    case "diameter":
      return product.diameter ?? product.characteristics?.["Диаметр"]
    case "format":
      return product.format ?? product.size
    case "dimensions":
      return product.dimensions ?? product.size
    case "color":
      return product.color
  }
}

export function uniqueFilterValues(products: Product[], key: ProductFilterKey): string[] {
  const values = products.flatMap((product) => {
    if (key === "finish" && (product.tiles?.length ?? 0) > 0) {
      return (product.tiles ?? []).map((tile) => tile.finish)
    }
    if (product.category === "paving" && (product.paving?.length ?? 0) > 0) {
      if (key === "finish") return (product.paving ?? []).map((item) => item.finish)
      if (key === "format" || key === "dimensions") return (product.paving ?? []).map((item) => item.size)
      if (key === "thickness") return (product.paving ?? []).map((item) => item.thickness)
    }
    const value = getFilterValue(product, key)
    return value ? [value] : []
  })
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((a, b) =>
    a.localeCompare(b, "ru"),
  )
}

export function getProductImages(product: Product): string[] {
  if (product.images && product.images.length > 0) return product.images
  const fromSlabs = (product.slabs ?? [])
    .map((slab) => slab.image)
    .filter((value): value is string => Boolean(value))
  const fromBlanks = (product.blanks ?? [])
    .map((blank) => blank.image)
    .filter((value): value is string => Boolean(value))
  const fromPaving = (product.paving ?? [])
    .map((item) => item.image)
    .filter((value): value is string => Boolean(value))
  return Array.from(
    new Set(
      [product.image, ...fromSlabs, ...fromBlanks, ...fromPaving, product.stoneImage].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  )
}

export function getProductPriceLabel(product: Product): string {
  if (product.priceType === "fixed" && product.price) return product.price
  if (product.price && product.priceType !== "on_request") return product.price
  return "Цена по запросу"
}

export function getProductAvailability(product: Product): string | undefined {
  if (product.availability) return product.availability
  if (product.status === "В наличии" || product.status === "Под заказ") return product.status
  return product.status
}

export function getProductCardTitle(product: Product): string {
  if (product.category === "slabs") return getSlabPageTitle(product.stoneName)
  if (product.category === "blanks") return getBlankPageTitle(product.stoneName)
  if (product.category === "tiles") return getTilePageTitle(product.stoneName)
  if (product.category === "paving") return getPavingPageTitle(product)

  let title = product.name.trim()

  const phrases = [product.stoneName, product.stoneType].filter(
    (value): value is string => Boolean(value),
  )
  for (const phrase of phrases) {
    title = stripWholePhrase(title, phrase)
    for (const word of phrase.split(/[\s/]+/)) {
      if (word.length > 2) title = stripWholePhrase(title, word)
    }
  }

  title = title
    .replace(
      /\s+из\s+(?:гранита|мрамора|травертина|оникса|песчаника|кварцита|известняка)\s*$/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim()

  return title.length >= 3 ? title : product.name
}

function stripWholePhrase(source: string, phrase: string): string {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return source
    .replace(new RegExp(`(?:^|[\\s·,./-]+)${escaped}(?=$|[\\s·,./-]+)`, "gi"), " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function getProductCardSpecs(product: Product): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = []
  const slabs = product.slabs ?? []
  const blanks = product.blanks ?? []
  const tiles = product.tiles ?? []
  if (product.category === "slabs" && slabs.length > 0) {
    rows.push({ label: "Толщина", value: getSlabThicknessRange(slabs) })
    rows.push({ label: "В партии", value: `${slabs.length} ${pluralSlabs(slabs.length)}` })
    return rows
  }
  if (product.category === "blanks" && blanks.length > 0) {
    rows.push({ label: "Толщина", value: getBlankThicknessRange(blanks) })
    rows.push({ label: "В партии", value: `${blanks.length} ${pluralBlanks(blanks.length)}` })
    return rows
  }
  if (product.category === "tiles" && tiles.length > 0) {
    rows.push({ label: "Толщина", value: getTileThicknessRange(tiles) })
    if (product.size) rows.push({ label: "Форматы", value: product.size })
    return rows.slice(0, 2)
  }
  const paving = product.paving ?? []
  if (product.category === "paving" && paving.length > 0) {
    rows.push({ label: "Толщина", value: getPavingThicknessRange(paving) })
    rows.push({ label: "Обработка", value: getPavingFinishSummary(paving) })
    return rows.slice(0, 2)
  }
  if (product.thickness) rows.push({ label: "Толщина", value: product.thickness })
  if (product.finish) rows.push({ label: "Обработка", value: product.finish })
  if (product.dimensions) rows.push({ label: "Размеры", value: product.dimensions })
  else if (product.format) rows.push({ label: "Формат", value: product.format })
  else if (product.size) rows.push({ label: "Размер", value: product.size })
  if (product.height) rows.push({ label: "Высота", value: product.height })
  if (product.diameter) rows.push({ label: "Диаметр", value: product.diameter })
  return rows.slice(0, 2)
}

function uniqueKeys(keys: ProductFilterKey[]): ProductFilterKey[] {
  return Array.from(new Set(keys))
}
