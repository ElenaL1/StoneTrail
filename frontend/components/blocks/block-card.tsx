import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, Box, MapPin, Package, Scale } from "lucide-react"
import type { StoneBlock } from "@/lib/mock-data"
import {
  getBlockCount,
  getDimensionsRange,
  getLotStatus,
  getWeightRange,
  pluralBlocks,
} from "@/lib/block-utils"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./status-badge"

export function BlockCard({ block }: { block: StoneBlock }) {
  const blockCount = getBlockCount(block.blocks)
  const plural = pluralBlocks(blockCount)
  const lotStatus = getLotStatus(block.blocks)
  const dimensionsRange = getDimensionsRange(block.blocks)
  const weightRange = getWeightRange(block.blocks)

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-[0_16px_40px_-24px_rgba(35,72,58,0.4)]"
      aria-label={`Лот: ${block.stoneName}, ${block.stoneType}, ${lotStatus}`}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-secondary">
        <Image
          src={block.image}
          alt={`Лот: ${block.stoneName} из ${block.stoneType.toLowerCase()}, ${block.country}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          unoptimized
        />
        <div className="absolute left-3 top-3">
          <StatusBadge status={lotStatus} />
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-foreground backdrop-blur-sm">
            <MapPin className="size-3" />
            {block.quarry}, {block.country}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="inline-flex w-fit items-center rounded-full border border-border bg-secondary/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {block.stoneType} · {blockCount} {plural}
        </span>
        <h3 className="mt-3 font-display text-lg font-bold leading-tight text-foreground">
          {block.stoneName}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {block.stoneType} · {block.quarry}, {block.country}
        </p>

        <dl className="mt-4 grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-start gap-2 text-muted-foreground">
            <Box className="mt-0.5 size-3.5 shrink-0" />
            <div>
              <dt className="sr-only">Габариты</dt>
              <dd>{dimensionsRange}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2 text-muted-foreground">
            <Scale className="mt-0.5 size-3.5 shrink-0" />
            <div>
              <dt className="sr-only">Вес</dt>
              <dd>{weightRange}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2 text-muted-foreground">
            <Package className="mt-0.5 size-3.5 shrink-0" />
            <div>
              <dt className="sr-only">Количество</dt>
              <dd>{blockCount} {plural} в лоте</dd>
            </div>
          </div>
        </dl>

        <p className="mt-4 text-xs text-muted-foreground">Цена по запросу</p>

        <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
          <Link href={`/catalog/blocks/${block.slug}`} className="flex-1">
            <Button variant="outline" className="w-full h-9 text-sm">
              Подробнее
            </Button>
          </Link>
          <Button
            asChild
            aria-label={`Запросить наличие: ${block.stoneName}`}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link
              href="/contacts"
              className="inline-flex h-9 items-center gap-1.5 px-3 text-sm"
            >
              Запросить
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
