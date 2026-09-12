import { notFound } from "next/navigation"
import { Package } from "lucide-react"
import { FinishedProductCard } from "@/components/products/finished-product-card"
import { StoneSectionHeader } from "@/components/catalog/stone-section-header"
import { getFinishedProductsForStone, getStoneById } from "@/lib/stone-inventory"

export default async function StoneProductsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const material = getStoneById(id)

  if (!material) {
    notFound()
  }

  const products = getFinishedProductsForStone(material)

  return (
    <div className="min-h-screen bg-background py-24 px-5 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <StoneSectionHeader
          material={material}
          title="Изделия из камня"
          description="Готовые объекты и проекты, выполненные из этого сорта."
        />

        {products.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <FinishedProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-secondary/10 py-24 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Package className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Изделий пока нет в витрине</h3>
            <p className="mx-auto mt-2 max-w-xs text-muted-foreground">
              Сорт доступен в сырье. Изделие можно заказать по проекту.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
