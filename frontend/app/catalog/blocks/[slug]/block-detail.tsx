"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  ChevronRight,
  MapPin,
  Mountain,
  Package,
  Quote,
  Ruler,
  Scale,
  Send,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Material, StoneBlock } from "@/lib/types"
import {
  getBlockCount,
  getBlockBreadcrumbTitle,
  getBlockLotSectionTitle,
  getDimensionsRange,
  getLotStatus,
  getStatusBreakdown,
  getWeightRange,
  pluralBlocks,
} from "@/lib/block-utils"
import { cn } from "@/lib/utils"
import { arePromotionsEnabled } from "@/lib/promo-utils"
import { StatusBadge } from "@/components/blocks/status-badge"
import { BlockLightboxDialog } from "@/components/blocks/block-lightbox-dialog"

export function BlockDetailPage({
  block,
  lots,
  relatedMaterial,
}: {
  block: StoneBlock
  lots: StoneBlock[]
  relatedMaterial: Material | null
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const related = useMemo(() => {
    return lots
      .filter((b) => b.id !== block.id)
      .sort((a, b) => {
        const score = (x: StoneBlock) =>
          (x.stoneType === block.stoneType ? 2 : 0) +
          (x.country === block.country ? 1 : 0)
        return score(b) - score(a)
      })
      .slice(0, 3)
  }, [block, lots])

  const blockCount = getBlockCount(block.blocks)
  const plural = pluralBlocks(blockCount)
  const lotStatus = getLotStatus(block.blocks)
  const breakdown = getStatusBreakdown(block.blocks)
  const dimensionsRange = getDimensionsRange(block.blocks)
  const weightRange = getWeightRange(block.blocks)

  const breakdownParts: string[] = []
  if (breakdown.inStock > 0) {
    breakdownParts.push(
      `${breakdown.inStock} ${pluralBlocks(breakdown.inStock)} в наличии`,
    )
  }
  if (breakdown.reserved > 0) {
    breakdownParts.push(
      `${breakdown.reserved} ${pluralBlocks(breakdown.reserved)} в резерве`,
    )
  }
  if (breakdown.onOrder > 0) {
    breakdownParts.push(
      `${breakdown.onOrder} ${pluralBlocks(breakdown.onOrder)} под заказ`,
    )
  }
  const breakdownText = breakdownParts.join(" · ")

  const closeLightbox = () => setActiveIndex(null)
  const openLightboxAt = (i: number) => setActiveIndex(i)

  const contactsHref = (index: number) => {
    const ib = block.blocks[index]
    return `/contacts?block=${encodeURIComponent(
      block.slug,
    )}&ref=${encodeURIComponent(ib.label)}`
  }

  return (
    <div
      className={cn(
        "min-h-screen py-24 px-5 lg:px-8",
        !arePromotionsEnabled() ? "bg-muted/30" : "bg-background",
      )}
    >
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumbs */}
        <nav
          aria-label="Хлебные крошки"
          className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link
            href="/catalog"
            className="transition-colors hover:text-foreground"
          >
            Каталог камня
          </Link>
          <ChevronRight className="size-4" />
          <Link
            href="/catalog/blocks"
            className="transition-colors hover:text-foreground"
          >
            Блоки
          </Link>
          <ChevronRight className="size-4" />
          <span className="text-foreground" aria-current="page">
            {getBlockBreadcrumbTitle(block.stoneName)}
          </span>
        </nav>

        {/* Hero */}
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          {/* Visual column */}
          <div className="space-y-4">
            <div className="relative h-[60vw] max-h-[520px] min-h-[240px] overflow-hidden rounded-3xl border border-border bg-secondary sm:h-[45vw] lg:h-[420px] xl:h-[480px]">
              <Image
                src={block.image}
                alt={`Блок: ${block.stoneName}, ${block.stoneType}, ${block.quarry}, ${block.country}`}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute left-4 top-4">
                <StatusBadge status={lotStatus} />
              </div>
              <div className="absolute bottom-4 left-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold text-foreground backdrop-blur-sm">
                  <MapPin className="size-3.5" />
                  {block.quarry}, {block.country}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                <Image
                  src={block.image}
                  alt={`Фас A: ${block.stoneName}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute bottom-2 left-2 rounded bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                  Фас A
                </span>
              </div>
              <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                <Image
                  src={block.image}
                  alt={`Фас B: ${block.stoneName}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute bottom-2 left-2 rounded bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                  Фас B
                </span>
              </div>
              <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                <Image
                  src={block.image}
                  alt={`Кромка: ${block.stoneName}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute bottom-2 left-2 rounded bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-foreground">
                  Кромка
                </span>
              </div>
            </div>
          </div>

          {/* Info column */}
          <div className="flex flex-col">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-primary bg-[var(--primary-soft)]">
                {block.stoneType}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Лот · {blockCount} {plural}
              </span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {getBlockBreadcrumbTitle(block.stoneName)}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {block.description}
            </p>

            {/* Quick params */}
            <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-secondary/30 p-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mountain className="size-4" />
                  Вид камня
                </div>
                <p className="font-semibold text-foreground">{block.stoneType}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Ruler className="size-4" />
                  Габариты (Д×Ш×В)
                </div>
                <p className="font-semibold text-foreground">{dimensionsRange}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Scale className="size-4" />
                  Вес
                </div>
                <p className="font-semibold text-foreground">{weightRange}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  Карьера
                </div>
                <p className="font-semibold text-foreground">
                  {block.quarry}, {block.country}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="size-4" />
                  В лоте
                </div>
                <p className="font-semibold text-foreground">
                  {blockCount} {plural}
                </p>
              </div>
            </div>

            {block.blocks.length > 1 && (
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-secondary/20 p-4 text-sm">
                <Box className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-foreground/90 leading-relaxed">
                  <span className="font-semibold text-foreground">Состав партии:</span>{" "}
                  {breakdownText}.
                </p>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 text-base flex-1 gap-2">
                <Link href="/contacts">
                  Запросить блок
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 px-6 text-base"
              >
                <Link href="/contacts">Обсудить раскрой</Link>
              </Button>
            </div>

            <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-[var(--primary-soft)] text-primary text-sm border border-border/60">
              <Quote className="size-5 shrink-0" />
              <p className="leading-relaxed">
                Цена по запросу. Зависит от веса, маршрута доставки и условий
                складирования. Паспорт качества и фото граней — перед отгрузкой.
              </p>
            </div>
          </div>
        </div>

        {/* Individual blocks — table (desktop) / cards (mobile) */}
        <section className="mt-20" aria-labelledby="blocks-list-heading">
          <div className="mb-8">
            <h2
              id="blocks-list-heading"
              className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              {getBlockLotSectionTitle(block.stoneType, block.stoneName)}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Каждый блок в партии может отличаться по габаритам и статусу —
              выберите нужный под вашу задачу.
            </p>
          </div>

          {/* Desktop: real table */}
          <div className="hidden overflow-hidden rounded-2xl border border-border bg-card md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <th scope="col" className="px-5 py-4" aria-label="№">
                    №
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Блок
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Фото
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Габариты
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Вес
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Статус
                  </th>
                  <th scope="col" className="px-5 py-4 text-right">
                    <span className="sr-only">Действие</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {block.blocks.map((ib, i) => (
                  <tr
                    key={ib.label}
                    onClick={() => openLightboxAt(i)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        openLightboxAt(i)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Показать блок ${ib.label}`}
                    className="cursor-pointer border-b border-border/60 last:border-b-0 transition-colors hover:bg-secondary/40 focus:bg-secondary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  >
                    <td className="px-5 py-4 align-middle text-sm text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <span className="inline-flex items-center gap-2 font-display text-base font-bold text-foreground">
                        <Box className="size-4 text-primary" />
                        {ib.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="relative h-14 w-20 overflow-hidden rounded-lg border border-border bg-muted">
                        <Image
                          src={ib.image ?? block.image}
                          alt={`Миниатюра: ${block.stoneName} — ${ib.label}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle font-medium text-foreground">
                      {ib.dimensions}
                    </td>
                    <td className="px-5 py-4 align-middle font-medium text-foreground">
                      {ib.weight}
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <StatusBadge status={ib.status} />
                    </td>
                    <td className="px-5 py-4 align-middle text-right">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation()
                          openLightboxAt(i)
                        }}
                      >
                        <Link href={contactsHref(i)}>
                          <Send className="size-3.5" />
                          Запросить
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <ul className="space-y-4 md:hidden">
            {block.blocks.map((ib, i) => (
              <li
                key={ib.label}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => openLightboxAt(i)}
                    className="flex min-w-0 items-center gap-3"
                    aria-label={`Показать блок ${ib.label}`}
                  >
                    <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      <Image
                        src={ib.image ?? block.image}
                        alt={`Миниатюра: ${block.stoneName} — ${ib.label}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </span>
                    <span className="flex min-w-0 flex-col items-start gap-1">
                      <span className="inline-flex items-center gap-1.5 font-display text-base font-bold text-foreground">
                        <Box className="size-4 text-primary" />
                        {ib.label}
                      </span>
                      <StatusBadge status={ib.status} />
                    </span>
                  </button>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                      Габариты
                    </dt>
                    <dd className="mt-0.5 font-semibold text-foreground">
                      {ib.dimensions}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                      Вес
                    </dt>
                    <dd className="mt-0.5 font-semibold text-foreground">
                      {ib.weight}
                    </dd>
                  </div>
                </dl>
                <Button
                  asChild
                  size="sm"
                  className="mt-3 w-full gap-1.5"
                >
                  <Link href={contactsHref(i)}>
                    <Send className="size-3.5" />
                    Запросить
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>

        {/* Expert note */}
        <section className="mt-20" aria-labelledby="expert-note">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Рекомендация эксперта
          </p>
          <h2
            id="expert-note"
            className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Как раскрывать эти блоки
          </h2>
          <blockquote className="mt-6 max-w-3xl border-l-2 border-primary pl-5 text-lg leading-relaxed text-foreground/90">
            {block.expertNote}
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">
            — мастер цеха StoneTrail, 25 лет практики в камне
          </p>
        </section>

        {/* Related material */}
        {relatedMaterial && (
          <section className="mt-20" aria-labelledby="related-material-heading">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">
              Сопутствующий продукт
            </p>
            <h2
              id="related-material-heading"
              className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Из этих блоков режутся слэбы
            </h2>
            <Link
              href={`/catalog/${relatedMaterial.id}`}
              className="mt-6 grid gap-6 overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-[0_16px_40px_-24px_rgba(35,72,58,0.35)] md:grid-cols-[220px_1fr]"
            >
              <div className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-border bg-secondary md:aspect-auto">
                <Image
                  src={relatedMaterial.image}
                  alt={`Слэб ${relatedMaterial.name}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex flex-col justify-center gap-3 md:pl-4">
                <Badge className="w-fit text-primary bg-[var(--primary-soft)]">
                  {relatedMaterial.type} · Слэб
                </Badge>
                <h3 className="font-display text-2xl font-bold text-foreground">
                  {relatedMaterial.name}
                </h3>
                <p className="text-muted-foreground">
                  {relatedMaterial.finish} · {relatedMaterial.thickness} ·{" "}
                  {relatedMaterial.status.toLowerCase()}
                </p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Перейти к слэбу
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          </section>
        )}

        {/* Related blocks */}
        {related.length > 0 && (
          <section className="mt-20" aria-labelledby="related-heading">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                  Похожие блоки
                </p>
                <h2
                  id="related-heading"
                  className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                >
                  Из тех же видов камня
                </h2>
              </div>
              <Button
                asChild
                variant="ghost"
                className="gap-1.5 text-sm text-foreground"
              >
                <Link href="/catalog/blocks">
                  Весь каталог блоков
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((b) => {
                const plural2 = pluralBlocks(getBlockCount(b.blocks))
                return (
                  <Link
                    key={b.id}
                    href={`/catalog/blocks/${b.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-[0_16px_40px_-24px_rgba(35,72,58,0.4)]"
                  >
                    <div className="relative aspect-[5/4] overflow-hidden bg-secondary">
                      <Image
                        src={b.image}
                        alt={`Блок: ${b.stoneName}, ${b.quarry}, ${b.country}`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        unoptimized
                      />
                      <div className="absolute left-3 top-3">
                        <StatusBadge status={getLotStatus(b.blocks)} />
                      </div>
                    </div>
                    <div className="p-5">
                      <span className="inline-flex w-fit items-center rounded-full border border-border bg-secondary/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {b.stoneType} · Блок
                      </span>
                      <h3 className="mt-3 font-display text-lg font-bold leading-tight text-foreground">
                        {b.stoneName}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {b.quarry}, {b.country} · {getDimensionsRange(b.blocks)}{" "}
                        · {getBlockCount(b.blocks)} {plural2}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Breadcrumb back */}
        <div className="mt-16 flex items-center gap-3">
          <Button asChild variant="outline" className="h-10 gap-2">
            <Link href="/catalog/blocks">
              <ArrowLeft className="size-4" />
              Все блоки
            </Link>
          </Button>
        </div>
      </div>

      {/* Lightbox dialog (overlay) */}
      {activeIndex !== null && (
        <BlockLightboxDialog
          block={block}
          index={activeIndex}
          total={block.blocks.length}
          onClose={closeLightbox}
          onNavigate={(n) => setActiveIndex(Math.max(0, Math.min(n, block.blocks.length - 1)))}
        />
      )}
    </div>
  )
}
