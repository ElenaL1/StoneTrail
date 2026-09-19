import { BlocksIndex } from "@/components/blocks/blocks-index"
import { catalogApi } from "@/lib/catalog/api-client"

export const metadata = {
  title: "Блоки — StoneTrail",
  description: "Прямые поставки блоков из проверенных карьеров под раскрой.",
}

export default async function BlocksPage() {
  const lots = await catalogApi.listBlocks()
  return <BlocksIndex lots={lots} />
}
