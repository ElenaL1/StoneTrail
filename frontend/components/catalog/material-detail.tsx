"use client"

import React from "react"
import Image from "next/image"
import type { Material, StoneBlock } from "@/lib/types"
import { useCatalog } from "@/lib/catalog-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StoneInventoryLinks } from "@/components/catalog/stone-inventory-links"
import { ArrowLeft, Clock, MapPin, Layers, Mountain, CheckCircle2, Info, Box, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export function MaterialDetailPage({
  material,
  lots,
}: {
  material: Material
  lots: StoneBlock[]
}) {
  const { addToSelection, selection } = useCatalog()
  const isSelected = selection.some((m) => m.id === material.id)

  return (
    <div className="min-h-screen bg-background py-24 px-5 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/catalog"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-4" />
          Вернуться к каталогу камня
        </Link>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-secondary">
              <Image
                src={material.image}
                alt={material.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-square rounded-xl border border-border bg-muted overflow-hidden relative group cursor-pointer">
                  <Image src={material.image} alt="Detail view" fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" unoptimized />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-primary bg-[var(--primary-soft)]">
                  {material.type}
                </Badge>
                <span className="text-xs text-muted-foreground">• {material.updated}</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
                {material.name}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Премиальный слэб с исключительной текстурой и однородностью цвета.
                Идеально подходит для столешниц, облицовки каминов и акцентных стен.
              </p>
              <StoneInventoryLinks material={material} lots={lots} className="mt-5" />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 p-6 rounded-2xl bg-secondary/30 border border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mountain className="size-4" />
                  Месторождение
                </div>
                <p className="font-semibold text-foreground">{material.quarry}, {material.country}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Layers className="size-4" />
                  Толщина
                </div>
                <p className="font-semibold text-foreground">{material.thickness}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  Склад
                </div>
                <p className="font-semibold text-foreground">{material.location}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  Наличие
                </div>
                <p className="font-semibold text-foreground">{material.slabs} слэбов</p>
              </div>
            </div>

            <div className="mb-10 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Поставщик</h3>
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card">
                <div className="size-12 rounded-full bg-[var(--primary-soft)] flex items-center justify-center text-primary font-bold">
                  {material.supplier[0]}
                </div>
                <div>
                  <p className="font-bold text-foreground">{material.supplier}</p>
                  <p className="text-sm text-muted-foreground">Верифицированный партнер</p>
                </div>
              </div>
            </div>

            <div className="mt-auto flex gap-3">
              <Button
                className="flex-1 h-12 text-lg"
                onClick={() => addToSelection(material)}
                disabled={isSelected}
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
              <Button variant="outline" className="h-12 px-6">
                Запросить цену
              </Button>
            </div>

            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm border border-blue-100 dark:border-blue-900/50">
              <Info className="size-5 shrink-0" />
              <p>
                Данные обновляются в реальном времени. В связи с высокой востребованностью материала,
                рекомендуем подтвердить наличие перед выездом на склад.
              </p>
            </div>

            {material.blockSlug && (
              <div className="mt-3 p-5 rounded-2xl border border-border bg-secondary/30 flex items-center gap-4">
                <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary shrink-0">
                  <Box className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">
                    Есть блок этого сорта
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Смотрите параметры, вес и наличие в каталоге блоков.
                  </p>
                </div>
                <Button asChild variant="outline" className="h-9 gap-1.5 shrink-0">
                  <Link href={`/catalog/blocks/${material.blockSlug}`} aria-label="Перейти к блоку этого сорта">
                    К блоку
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
