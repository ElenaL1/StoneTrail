import { notFound } from "next/navigation"
import Image from "next/image"
import { Clock, Layers } from "lucide-react"
import { StoneSectionHeader } from "@/components/catalog/stone-section-header"
import { getStoneById, hasTilesInStock } from "@/lib/stone-inventory"

export default async function StoneTilesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const material = getStoneById(id)

  if (!material) {
    notFound()
  }

  const inStock = hasTilesInStock(material)

  return (
    <div className="min-h-screen bg-background py-24 px-5 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <StoneSectionHeader
          material={material}
          title="Плитка"
          description="Форматы для полов, стен и влажных зон — из того же сорта, что и слэбы."
        />

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-secondary">
            <Image src={material.image} alt={`Плитка ${material.name}`} fill className="object-cover" unoptimized />
          </div>

          <div className="grid grid-cols-2 gap-6 self-start rounded-2xl border border-border bg-secondary/30 p-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="size-4" />
                Обработка
              </div>
              <p className="font-semibold text-foreground">{material.finish}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Layers className="size-4" />
                Толщина
              </div>
              <p className="font-semibold text-foreground">{material.thickness}</p>
            </div>
            <div className="space-y-1 col-span-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                Наличие
              </div>
              <p className="font-semibold text-foreground">
                {inStock ? `${material.tiles} м² плитки` : "Нет в наличии"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
