import type { Material, Product, StoneBlock } from "@/lib/types"

export type StoneInventoryKind = "blocks" | "slabs" | "tiles" | "products"

export function getStoneById(stones: Material[], id: string): Material | undefined {
  return stones.find((material) => material.id === id)
}

export function getStoneBlockLot(material: Material, lots: StoneBlock[]): StoneBlock | undefined {
  return lots.find(
    (lot) =>
      lot.blockStoneId === material.id ||
      (material.blockSlug != null && lot.slug === material.blockSlug) ||
      lot.stoneName === material.name,
  )
}

export function hasBlocksInStock(material: Material, lots: StoneBlock[]): boolean {
  const lot = getStoneBlockLot(material, lots)
  if (!lot) return false
  return lot.blocks.some((block) => block.status === "В наличии")
}

export function hasSlabsInStock(material: Material): boolean {
  return material.status !== "Продано" && material.slabs > 0
}

export function hasTilesInStock(material: Material): boolean {
  return material.tiles > 0
}

export function getStoneInventory(material: Material, lots: StoneBlock[] = []) {
  const hasBlocks = hasBlocksInStock(material, lots)
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

export function getFinishedProductsForStone(material: Material, products: Product[]) {
  return products.filter(
    (product) => product.category === "custom" && product.stoneName === material.name,
  )
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
