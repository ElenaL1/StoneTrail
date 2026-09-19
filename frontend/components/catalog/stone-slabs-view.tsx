"use client"

import Image from "next/image"
import Link from "next/link"
import { CheckCircle2, Clock, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StoneSectionHeader } from "@/components/catalog/stone-section-header"
import { useCatalog } from "@/lib/catalog-context"
import { hasSlabsInStock } from "@/lib/stone-inventory"
import type { Material } from "@/lib/types"

export function StoneSlabsView({ material }: { material: Material }) {
  const { addToSelection, selection } = useCatalog()
  const inStock = hasSlabsInStock(material)
  const isSelected = selection.some((m) => m.id === material.id)

  return (
    <div className="min-h-screen bg-background py-24 px-5 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <StoneSectionHeader
          material={material}
          title="Слэбы"
          description="Крупноформатные плиты для столешниц, облицовки и акцентных поверхностей."
        />

        <div className="grid gap-10 lg:grid-cols-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-secondary">
            <Image src={material.image} alt={`Слэб ${material.name}`} fill className="object-cover" unoptimized />
          </div>

          <div className="flex flex-col">
            <div className="grid grid-cols-2 gap-6 rounded-2xl border border-border bg-secondary/30 p-6">
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
                  {inStock ? `${material.slabs} слэбов` : "Нет в наличии"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                className="h-12 flex-1 text-lg"
                onClick={() => addToSelection(material)}
                disabled={!inStock || isSelected}
              >
                {isSelected ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="size-5" />
                    В подборке
                  </span>
                ) : (
                  "Добавить в подборку"
                )}
              </Button>
              <Button asChild variant="outline" className="h-12 px-6">
                <Link href={`/catalog/${material.id}`}>Карточка сорта</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
