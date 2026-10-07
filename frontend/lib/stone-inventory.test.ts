import { describe, expect, test } from "vitest"
import type { Material, Product, StoneBlock } from "@/lib/types"
import {
  getFinishedProductsForStone,
  getStoneInventory,
  productStoneLabel,
  stoneMatchesWarehouse,
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
  test("плита открывает каталог изделий, остальные форматы остаются на странице сорта", () => {
    expect(stoneSectionHref("dymovsky", "tiles")).toBe("/catalog/products?category=tiles")
    expect(stoneSectionHref("dymovsky", "blocks")).toBe("/catalog/dymovsky/blocks")
    expect(stoneSectionHref("dymovsky", "slabs")).toBe("/catalog/dymovsky/slabs")
    expect(stoneSectionHref("dymovsky", "products")).toBe("/catalog/dymovsky/products")
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
