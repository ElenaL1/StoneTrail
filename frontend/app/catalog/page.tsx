import { CatalogIndex } from "@/components/catalog/catalog-index"
import { catalogApi } from "@/lib/catalog/api-client"

export const metadata = {
  title: "Каталог камня — StoneTrail",
  description: "Эксклюзивный фонд камня: блоки, слэбы, плитка и изделия.",
}

export default async function CatalogPage() {
  const [materials, lots, products] = await Promise.all([
    catalogApi.listStones(),
    catalogApi.listBlocks(),
    catalogApi.listProducts(),
  ])
  return <CatalogIndex materials={materials} lots={lots} products={products} />
}
