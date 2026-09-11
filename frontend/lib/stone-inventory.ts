import { featuredMaterials, finishedProducts, stoneBlocks, type Material, type StoneBlock } from "@/lib/mock-data"

export type StoneInventoryKind = "blocks" | "slabs" | "tiles" | "products"

export function getStoneById(id: string): Material | undefined {
  return featuredMaterials.find((m) => m.id === id)
}

export function getStoneBlockLot(material: Material): StoneBlock | undefined {
  return stoneBlocks.find(
    (lot) =>
      lot.blockStoneId === material.id ||
      (material.blockSlug != null && lot.slug === material.blockSlug) ||
      lot.stoneName === material.name,
  )
}

export function hasBlocksInStock(material: Material): boolean {
  const lot = getStoneBlockLot(material)
  if (!lot) return false
  return lot.blocks.some((block) => block.status === "В наличии")
}

export function hasSlabsInStock(material: Material): boolean {
  return material.status !== "Продано" && material.slabs > 0
}

export function hasTilesInStock(material: Material): boolean {
  return material.tiles > 0
}

export function getStoneInventory(material: Material) {
  const hasBlocks = hasBlocksInStock(material)
  const hasSlabs = hasSlabsInStock(material)
  const hasTiles = hasTilesInStock(material)

  return {
    hasBlocks,
    hasSlabs,
    hasTiles,
    hasProducts: hasBlocks || hasSlabs || hasTiles,
  }
}

export function stoneSectionHref(stoneId: string, kind: StoneInventoryKind): string {
  return `/catalog/${stoneId}/${kind}`
}

export function getFinishedProductsForStone(material: Material) {
  return finishedProducts.filter((product) => product.stoneName === material.name)
}

export function stoneOrigin(material: Pick<Material, "quarry" | "country">): string {
  return `${material.quarry}, ${material.country}`
}

const STONE_TYPE_GENITIVE: Record<string, string> = {
  Мрамор: "мрамора",
  Кварцит: "кварцита",
  Гранит: "гранита",
  Оникс: "оникса",
  Травертин: "травертина",
  Известняк: "известняка",
  Песчаник: "песчаника",
}

export function stoneTypeGenitive(stoneType: string): string {
  const type = stoneType.trim()
  return STONE_TYPE_GENITIVE[type] ?? type.toLocaleLowerCase("ru")
}
