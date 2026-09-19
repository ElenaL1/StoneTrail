import { CatalogIndex } from "@/components/catalog/catalog-index"
import { catalogApi } from "@/lib/catalog/api-client"

export const metadata = {
  title: "Каталог камня — StoneTrail",
  description: "Эксклюзивный фонд камня: блоки, слэбы, плитка и изделия.",
}

export default async function CatalogPage() {
  const materials = await catalogApi.listStones()
  return <CatalogIndex materials={materials} />
}
