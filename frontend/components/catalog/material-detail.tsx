"use client"

import React from "react"
import type { Material, StoneBlock } from "@/lib/types"
import { useCatalog } from "@/lib/catalog-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StoneGallery } from "@/components/catalog/stone-gallery"
import { StoneInventoryLinks } from "@/components/catalog/stone-inventory-links"
import { ArrowLeft, Clock, MapPin, Layers, Mountain, CheckCircle2, Box, ArrowUpRight } from "lucide-react"
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
          <StoneGallery name={material.name} image={material.image} textures={material.textures} />

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
              {material.description ? (
                <p className="text-lg text-muted-foreground leading-relaxed">{material.description}</p>
              ) : null}
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
