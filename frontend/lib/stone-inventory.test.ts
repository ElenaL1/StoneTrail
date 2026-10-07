import { describe, expect, test } from "vitest"
import type { Material, Product, StoneBlock } from "@/lib/types"
import {
  getFinishedProductsForStone,
  getStoneInventory,
  productStoneLabel,
  stoneCategoryProduct,
  stoneMadeProducts,
  stoneMadeProductsHref,
  stoneMatchesWarehouse,
  stoneProductHref,
  stoneSectionHref,
} from "@/lib/stone-inventory"

function material(overrides: Partial<Material> = {}): Material {
  return {
    id: "dymovsky",
    name: "Дымовский",
    type: "Гранит",
    finish: "",
    thickness: "",
    image: "",
    supplier: "",
    location: "",
    quarry: "",
    country: "",
    status: "Продано",
    slabs: 0,
    tiles: 0,
    updated: "",
    ...overrides,
  }
}

function product(overrides: Partial<Product> & Pick<Product, "name" | "category">): Product {
  return {
    id: overrides.name,
    slug: overrides.name,
    stoneName: "Дымовский",
    stoneType: "Гранит",
    description: "",
    image: "",
    ...overrides,
  }
}

describe("getStoneInventory", () => {
  test("ссылка на изделия зависит от hasProducts, а не от склада", () => {
    const inventory = getStoneInventory(material({ hasProducts: true }))
    expect(inventory.hasProducts).toBe(true)
    expect(inventory.hasBlocks).toBe(false)
    expect(inventory.hasSlabs).toBe(false)
    expect(inventory.hasTiles).toBe(false)
  })

  test("блоки подсвечиваются, когда в партии есть камень в наличии", () => {
    const lot: StoneBlock = {
      id: "lot",
      slug: "lot",
      stoneName: "Дымовский",
      stoneType: "Гранит",
      quarry: "",
      country: "",
      blocks: [{ label: "A", dimensions: "", weight: "", status: "В наличии" }],
      image: "",
      description: "",
      expertNote: "",
      blockStoneId: "dymovsky",
    }
    const inventory = getStoneInventory(material({ blockSlug: "lot" }), [lot])
    expect(inventory.hasBlocks).toBe(true)
  })
})

describe("stoneSectionHref", () => {
  test("блоки остаются на странице сорта", () => {
    expect(stoneSectionHref("dymovsky", "blocks")).toBe("/catalog/dymovsky/blocks")
  })
})

describe("stoneCategoryProduct", () => {
  const gabbro = material({ id: "gabbro-diabaz", name: "Габбро-диабаз" })

  test("слэб и плита открывают изделие этого камня", () => {
    const slab = product({
      name: "Слэб",
      slug: "gabbro-slab",
      category: "slabs",
      stoneName: "Габбро-диабаз",
    })
    const tile = product({
      name: "Плиты с торцевыми пропилами",
      slug: "plity-s-tortsevymi-propilami-gabbro-diabaz",
      category: "tiles",
      stoneName: "Габбро-диабаз",
    })
    const other = product({
      name: "Облицовочные плиты",
      slug: "dymovsky-cladding-tiles",
      category: "tiles",
      stoneName: "Дымовский",
    })
    expect(stoneProductHref(stoneCategoryProduct(gabbro, [other, slab], "slabs")!)).toBe(
      "/catalog/products/gabbro-slab",
    )
    expect(stoneProductHref(stoneCategoryProduct(gabbro, [other, tile], "tiles")!)).toBe(
      "/catalog/products/plity-s-tortsevymi-propilami-gabbro-diabaz",
    )
    expect(stoneCategoryProduct(gabbro, [], "slabs")).toBeUndefined()
  })

  test("основной камень изделия важнее упоминания в списке", () => {
    const shared = product({
      name: "Смесь",
      slug: "shared-tiles",
      category: "tiles",
      stoneName: "Другой",
      stoneNames: ["Другой", "Габбро-диабаз"],
    })
    const own = product({
      name: "Плиты",
      slug: "gabbro-tiles",
      category: "tiles",
      stoneName: "Габбро-диабаз",
    })
    expect(stoneCategoryProduct(gabbro, [shared, own], "tiles")?.slug).toBe("gabbro-tiles")
  })
})

describe("stoneMadeProducts", () => {
  const gabbro = material({ id: "gabbro-diabaz", name: "Габбро-диабаз" })

  test("заготовка и брусчатка входят в изделия из камня, слэб и плита нет", () => {
    const blank = product({ name: "Заготовка", slug: "gabbro-blank", category: "blanks", stoneName: "Габбро-диабаз" })
    const paving = product({ name: "Брусчатка", slug: "gabbro-paving", category: "paving", stoneName: "Габбро-диабаз" })
    const custom = product({ name: "Столешница", slug: "gabbro-top", category: "custom", stoneName: "Габбро-диабаз" })
    const slab = product({ name: "Слэб", slug: "gabbro-slab", category: "slabs", stoneName: "Габбро-диабаз" })
    const tile = product({ name: "Плита", slug: "gabbro-tile", category: "tiles", stoneName: "Габбро-диабаз" })
    expect(stoneMadeProducts(gabbro, [slab, blank, tile, paving, custom]).map((item) => item.slug)).toEqual([
      "gabbro-blank",
      "gabbro-paving",
      "gabbro-top",
    ])
  })

  test("одно изделие открывается само, несколько открывают список сорта", () => {
    const blank = product({ name: "Заготовка", slug: "gabbro-blank", category: "blanks", stoneName: "Габбро-диабаз" })
    const paving = product({ name: "Брусчатка", slug: "gabbro-paving", category: "paving", stoneName: "Габбро-диабаз" })
    expect(stoneMadeProductsHref(gabbro, [blank])).toBe("/catalog/products/gabbro-blank")
    expect(stoneMadeProductsHref(gabbro, [blank, paving])).toBe("/catalog/gabbro-diabaz/products")
    expect(stoneMadeProductsHref(gabbro, [])).toBeNull()
  })
})

describe("stoneMatchesWarehouse", () => {
  test("все оставляет сорт, у которого в каталоге есть хотя бы один формат", () => {
    expect(stoneMatchesWarehouse(material({ slabs: 1, status: "Продано" }), "all")).toBe(true)
    expect(stoneMatchesWarehouse(material({ blockSlug: "lot" }), "all")).toBe(true)
    expect(stoneMatchesWarehouse(material({ tiles: 2 }), "all")).toBe(true)
    expect(stoneMatchesWarehouse(material({ hasProducts: true }), "all")).toBe(true)
    expect(stoneMatchesWarehouse(material(), "all")).toBe(false)
  })

  test("фильтр склада смотрит на наличие формата в каталоге", () => {
    const blocksOnly = material({ blockSlug: "lot" })
    expect(stoneMatchesWarehouse(blocksOnly, "blocks")).toBe(true)
    expect(stoneMatchesWarehouse(blocksOnly, "slabs")).toBe(false)
    expect(stoneMatchesWarehouse(blocksOnly, "tiles")).toBe(false)
    expect(stoneMatchesWarehouse(blocksOnly, "products")).toBe(false)
    expect(stoneMatchesWarehouse(material({ slabs: 3, status: "Продано" }), "slabs")).toBe(true)
    expect(stoneMatchesWarehouse(material({ tiles: 1 }), "tiles")).toBe(true)
    expect(stoneMatchesWarehouse(material({ hasProducts: true }), "products")).toBe(true)
  })
})

describe("getFinishedProductsForStone", () => {
  test("оставляет изделия любой категории, где сорт есть среди камней", () => {
    const paving = product({
      name: "Плиты мощения",
      category: "paving",
      stoneName: "Мансуровский",
      stoneNames: ["Мансуровский", "Габбро-диабаз"],
    })
    const other = product({
      name: "Столешница",
      category: "custom",
      stoneName: "Балморал Рэд",
      stoneNames: ["Балморал Рэд"],
    })
    const found = getFinishedProductsForStone(
      material({ id: "gabbro-diabaz", name: "Габбро-диабаз" }),
      [paving, other],
    )
    expect(found.map((item) => item.name)).toEqual(["Плиты мощения"])
    expect(productStoneLabel(paving)).toBe("Мансуровский · Габбро-диабаз")
  })
})
