import { describe, expect, test } from "vitest"
import { getPopulatedCustomGroups, resolveCustomGroup } from "@/lib/custom-catalog"
import type { Product } from "@/lib/mock-data"
import {
  countActiveFilters,
  EMPTY_PRODUCT_FILTERS,
  filterCatalogProducts,
  formatProductCount,
  getCatalogFilterKeys,
  parseProductCategory,
  shuffleCatalogProducts,
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

  test("одно зерно даёт один и тот же случайный порядок", () => {
    const items = [slabBlack, slabWhite, tileBlack]
    const first = shuffleCatalogProducts(items, 42).map((item) => item.id)
    const second = sortCatalogProducts(items, "relevance", "", 42).map((item) => item.id)

    expect(second).toEqual(first)
    expect(new Set(first)).toEqual(new Set(["slab-black", "slab-white", "tile-black"]))
  })

  test("другое зерно может изменить порядок", () => {
    const items = [slabBlack, slabWhite, tileBlack]
    const orders = [1, 2, 3, 4, 5].map((seed) =>
      sortCatalogProducts(items, "relevance", "", seed)
        .map((item) => item.id)
        .join(","),
    )

    expect(new Set(orders).size).toBeGreaterThan(1)
  })

  test("поиск и явная сортировка не перемешивают выдачу", () => {
    const items = [slabWhite, slabBlack, tileBlack]

    expect(sortCatalogProducts(items, "name", "", 7).map((item) => item.id)).toEqual(
      sortCatalogProducts(items, "name", "").map((item) => item.id),
    )
    expect(sortCatalogProducts(items, "relevance", "bianco", 7).map((item) => item.id)).toEqual(
      sortCatalogProducts(items, "relevance", "bianco").map((item) => item.id),
    )
    expect(sortCatalogProducts(items, "relevance", "bianco")[0]?.id).toBe("slab-white")
  })
})

describe("parseProductCategory", () => {
  test("открывает все изделия по category=all", () => {
    expect(parseProductCategory("all")).toBe("all")
  })

  test("без параметра открывает все изделия", () => {
    expect(parseProductCategory(null)).toBe("all")
    expect(parseProductCategory("unknown")).toBe("all")
  })

  test("явная категория изделий под заказ сохраняется", () => {
    expect(parseProductCategory("custom")).toBe("custom")
  })
})

describe("каталог «Все»", () => {
  test("показывает изделия всех направлений", () => {
    const result = filterCatalogProducts(catalog, "all", EMPTY_PRODUCT_FILTERS)

    expect(result.map((item) => item.id)).toEqual(["slab-black", "slab-white", "tile-black"])
  })

  test("фильтрует смешанную выдачу по материалу", () => {
    const result = filterCatalogProducts(catalog, "all", {
      ...EMPTY_PRODUCT_FILTERS,
      stoneType: "Мрамор",
    })

    expect(result.map((item) => item.id)).toEqual(["slab-white"])
  })

  test("оставляет только фильтр материала", () => {
    expect(getCatalogFilterKeys("all", "all", "all")).toEqual(["material"])
  })

  test("считает позиции", () => {
    expect(formatProductCount(1, "all")).toBe("1 позиция")
    expect(formatProductCount(2, "all")).toBe("2 позиции")
    expect(formatProductCount(5, "all")).toBe("5 позиций")
  })
})

describe("живые группы изделий", () => {
  test("скрывает группу без позиций", () => {
    const interior = product({
      id: "countertop",
      category: "custom",
      name: "Столешница",
      customGroup: "interior",
    })
    const slab = product({ id: "slab", category: "slabs", name: "Слэб", customGroup: "memorial" })

    expect(getPopulatedCustomGroups([interior, slab]).map((group) => group.id)).toEqual(["interior"])
  })

  test("пустая группа в адресе открывает все изделия под заказ", () => {
    const interior = product({
      id: "countertop",
      category: "custom",
      name: "Столешница",
      customGroup: "interior",
    })

    expect(resolveCustomGroup("memorial", [interior])).toBe("all")
    expect(resolveCustomGroup("interior", [interior])).toBe("interior")
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
