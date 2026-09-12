import { describe, expect, test } from "vitest"
import type { Product } from "@/lib/mock-data"
import {
  countActiveFilters,
  EMPTY_PRODUCT_FILTERS,
  filterCatalogProducts,
  sortCatalogProducts,
} from "@/lib/product-catalog"

function product(overrides: Partial<Product> & Pick<Product, "id" | "name" | "category">): Product {
  return {
    slug: overrides.id,
    stoneName: overrides.name,
    stoneType: "Гранит",
    description: "Описание камня для каталога",
    image: "/placeholder.jpg",
    ...overrides,
  }
}

const slabBlack = product({
  id: "slab-black",
  category: "slabs",
  name: "Гранит Absolute Black",
  stoneName: "Absolute Black",
})

const slabWhite = product({
  id: "slab-white",
  category: "slabs",
  name: "Мрамор Bianco",
  stoneName: "Bianco",
  stoneType: "Мрамор",
})

const tileBlack = product({
  id: "tile-black",
  category: "tiles",
  name: "Гранит Absolute Black",
  stoneName: "Absolute Black",
})

const catalog = [slabBlack, slabWhite, tileBlack]

describe("filterCatalogProducts", () => {
  test("поиск по имени оставляет товар нужной категории", () => {
    const result = filterCatalogProducts(catalog, "slabs", {
      ...EMPTY_PRODUCT_FILTERS,
      search: "absolute",
    })

    expect(result.map((item) => item.id)).toEqual(["slab-black"])
  })

  test("исключает товар другой категории", () => {
    const result = filterCatalogProducts(catalog, "slabs", EMPTY_PRODUCT_FILTERS)

    expect(result.map((item) => item.id)).toEqual(["slab-black", "slab-white"])
    expect(result.some((item) => item.category === "tiles")).toBe(false)
  })

  test("возвращает пустой список, если запрос ничего не находит", () => {
    const result = filterCatalogProducts(catalog, "slabs", {
      ...EMPTY_PRODUCT_FILTERS,
      search: "несуществующий-камень-xyz",
    })

    expect(result).toEqual([])
  })
})

describe("sortCatalogProducts", () => {
  test("сортирует по названию в русской локали", () => {
    const yashta = product({ id: "y", category: "slabs", name: "Яшма" })
    const agat = product({ id: "a", category: "slabs", name: "Агат" })
    const granite = product({ id: "g", category: "slabs", name: "Гранит" })

    const result = sortCatalogProducts([yashta, granite, agat], "name", "")

    expect(result.map((item) => item.name)).toEqual(["Агат", "Гранит", "Яшма"])
  })
})

describe("countActiveFilters", () => {
  test("не считает значения all", () => {
    expect(countActiveFilters(EMPTY_PRODUCT_FILTERS, ["material", "color"])).toBe(0)
  })

  test("считает только выбранные фильтры", () => {
    expect(
      countActiveFilters({ ...EMPTY_PRODUCT_FILTERS, color: "белый" }, ["material", "color"]),
    ).toBe(1)
  })
})
