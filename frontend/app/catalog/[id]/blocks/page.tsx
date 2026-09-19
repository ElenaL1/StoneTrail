import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StoneSectionHeader } from "@/components/catalog/stone-section-header"
import { catalogApi } from "@/lib/catalog/api-client"
import { getStoneBlockLot } from "@/lib/stone-inventory"

export default async function StoneBlocksPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [material, lots] = await Promise.all([
    catalogApi.getStone(id),
    catalogApi.listBlocks(),
  ])

  if (!material) {
    notFound()
  }

  const lot = getStoneBlockLot(material, lots)
  if (lot) {
    redirect(`/catalog/blocks/${lot.slug}`)
  }

  return (
    <div className="min-h-screen bg-background py-24 px-5 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <StoneSectionHeader
          material={material}
          title="Блоки"
          description="Сырьё под раскрой. Для этого сорта блоков в наличии сейчас нет."
        />
        <Button asChild variant="outline" className="h-10">
          <Link href="/catalog/blocks">Каталог блоков</Link>
        </Button>
      </div>
    </div>
  )
}
