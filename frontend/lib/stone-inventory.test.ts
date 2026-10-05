import { describe, expect, test } from "vitest"
import type { Material, Product } from "@/lib/types"
import {
  getFinishedProductsForStone,
  getStoneInventory,
  productStoneLabel,
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
