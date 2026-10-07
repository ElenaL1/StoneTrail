import type { Material, Product, ProductCategory, StoneBlock } from "@/lib/types"

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
    hasProducts: material.hasProducts === true,
  }
}

export type WarehouseFormat = "all" | "blocks" | "slabs" | "tiles" | "products"

export function stoneMatchesWarehouse(material: Material, format: WarehouseFormat): boolean {
  const inCatalog = {
    blocks: Boolean(material.blockSlug),
    slabs: material.slabs > 0,
    tiles: material.tiles > 0,
    products: material.hasProducts === true,
  }
  if (format === "all") {
    return inCatalog.blocks || inCatalog.slabs || inCatalog.tiles || inCatalog.products
  }
  return inCatalog[format]
}

export function productStoneNames(
  product: Pick<Product, "stoneName" | "stoneNames">,
): string[] {
  const names = (product.stoneNames ?? []).map((name) => name.trim()).filter(Boolean)
  return names.length > 0 ? names : [product.stoneName]
}

export function productStoneLabel(
  product: Pick<Product, "stoneName" | "stoneNames">,
): string {
  return productStoneNames(product).join(" · ")
}

export function stoneSectionHref(stoneId: string, kind: StoneInventoryKind): string {
  return `/catalog/${stoneId}/${kind}`
}

export function stoneCategoryProduct(
  material: Pick<Material, "name">,
  products: Product[],
  category: ProductCategory,
): Product | undefined {
  const name = material.name.trim()
  const matches = products.filter(
    (product) => product.category === category && productStoneNames(product).includes(name),
  )
  return matches.find((product) => product.stoneName.trim() === name) ?? matches[0]
}

export function stoneProductHref(product: Pick<Product, "slug">): string {
  return `/catalog/products/${product.slug}`
}

const STONE_MADE_CATEGORIES = new Set<ProductCategory>(["blanks", "paving", "custom"])

export function stoneMadeProducts(
  material: Pick<Material, "name">,
  products: Product[],
): Product[] {
  const name = material.name.trim()
  return products.filter(
    (product) => STONE_MADE_CATEGORIES.has(product.category) && productStoneNames(product).includes(name),
  )
}

export function stoneMadeProductsHref(
  material: Pick<Material, "id" | "name">,
  products: Product[],
): string | null {
  const made = stoneMadeProducts(material, products)
  if (made.length === 0) return null
  if (made.length === 1) return stoneProductHref(made[0])
  return `/catalog/${material.id}/products`
}

export function getFinishedProductsForStone(material: Material, products: Product[]) {
  return products.filter((product) => productStoneNames(product).includes(material.name))
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
