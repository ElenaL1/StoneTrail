"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Construction,
  Hammer,
  Layers,
  Mountain,
  MoveVertical,
  Package,
  PencilRuler,
  Quote,
  Ruler,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import { arePromotionsEnabled } from "@/lib/promo-utils"
import { StatusBadge as LotStatusBadge } from "@/components/blocks/status-badge"
import { SlabLotTable } from "@/components/products/slab-lot-table"
import { BlankLotTable } from "@/components/products/blank-lot-table"
import { TileVariantTable } from "@/components/products/tile-variant-table"
import { PavingVariantTable } from "@/components/products/paving-variant-table"
import {
  getCustomGroupLabel,
  getProductAvailability,
  getProductCardTitle,
  getProductImages,
  getProductPriceLabel,
} from "@/lib/custom-catalog"
import { getLotStatus } from "@/lib/block-utils"
import {
  getProductBreadcrumbTitle,
  getProductSpecifications,
  getProductTypeLabel,
  isCustomProduct,
  PRODUCT_CATEGORY_META,
} from "@/lib/product-catalog"
import {
  getProductSlabs,
  getSlabFinishSummary,
  getSlabPageTitle,
  getSlabSizeRange,
  getSlabThicknessRange,
  pluralSlabs,
} from "@/lib/slab-utils"
import {
  getBlankFinishSummary,
  getBlankPageTitle,
  getBlankSizeRange,
  getBlankThicknessRange,
  getProductBlanks,
  pluralBlanks,
} from "@/lib/blank-utils"
import {
  getProductTiles,
  getTileFinishSummary,
  getTilePageTitle,
  getTileSizeSummary,
  getTileThicknessRange,
} from "@/lib/tile-utils"
import {
  getPavingFinishSummary,
  getPavingPageTitle,
  getPavingSizeSummary,
  getPavingThicknessRange,
  getProductPaving,
} from "@/lib/paving-utils"

function StatusBadge({ value }: { value: string }) {
  const inStock = value === "В наличии"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        inStock ? "bg-[var(--primary-soft)] text-primary" : "bg-muted text-muted-foreground",
      )}
    >
      <span className={cn("size-1.5 rounded-full", inStock ? "bg-primary" : "bg-muted-foreground")} aria-hidden="true" />
      {value}
    </span>
  )
}

export function FinishedProductDetailPage({
  product,
  products,
}: {
  product: Product
  products: Product[]
}) {
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    setActiveImage(0)
  }, [product.slug])

  const typeLabel = getProductTypeLabel(product)
  const custom = isCustomProduct(product)
  const groupLabel = getCustomGroupLabel(product.customGroup)
  const availability = getProductAvailability(product)
  const priceLabel = getProductPriceLabel(product)
  const images = getProductImages(product)
  const slabs = getProductSlabs(product)
  const blanks = getProductBlanks(product)
  const tiles = getProductTiles(product)
  const paving = getProductPaving(product)
  const isSlab = product.category === "slabs"
  const isBlank = product.category === "blanks"
  const isTile = product.category === "tiles"
  const isPaving = product.category === "paving"
  const isStoneLot = isSlab || isBlank || isTile || isPaving
  const hasSlabLot = isSlab && slabs.length > 0
  const hasBlankLot = isBlank && blanks.length > 0
  const hasTileVariants = isTile && tiles.length > 0
  const hasPavingVariants = isPaving && paving.length > 0
  const slabLotStatus = hasSlabLot ? getLotStatus(slabs) : null
  const blankLotStatus = hasBlankLot ? getLotStatus(blanks) : null
  const tileLotStatus = hasTileVariants ? getLotStatus(tiles) : null
  const pavingLotStatus = hasPavingVariants ? getLotStatus(paving) : null
  const slabSizeRange = hasSlabLot ? getSlabSizeRange(slabs) : (product.size ?? "")
  const slabThicknessRange = hasSlabLot ? getSlabThicknessRange(slabs) : (product.thickness ?? "")
  const slabFinishSummary = hasSlabLot ? getSlabFinishSummary(slabs) : (product.finish ?? "")
  const slabLotCount = hasSlabLot
    ? `${slabs.length} ${pluralSlabs(slabs.length)}`
    : ""
  const blankSizeRange = hasBlankLot ? getBlankSizeRange(blanks) : (product.size ?? "")
  const blankThicknessRange = hasBlankLot ? getBlankThicknessRange(blanks) : (product.thickness ?? "")
  const blankFinishSummary = hasBlankLot ? getBlankFinishSummary(blanks) : (product.finish ?? "")
  const blankLotCount = hasBlankLot
    ? `${blanks.length} ${pluralBlanks(blanks.length)}`
    : ""
  const tileSizeSummary = hasTileVariants ? getTileSizeSummary(tiles) : (product.size ?? "")
  const tileThicknessRange = hasTileVariants ? getTileThicknessRange(tiles) : (product.thickness ?? "")
  const tileFinishSummary = hasTileVariants ? getTileFinishSummary(tiles) : (product.finish ?? "")
  const pavingSizeSummary = hasPavingVariants ? getPavingSizeSummary(paving) : (product.size ?? "")
  const pavingThicknessRange = hasPavingVariants ? getPavingThicknessRange(paving) : (product.thickness ?? "")
  const pavingFinishSummary = hasPavingVariants ? getPavingFinishSummary(paving) : (product.finish ?? "")
  const categoryHref = `/catalog/products?category=${product.category}${
    product.customGroup ? `&group=${product.customGroup}` : ""
  }`
  const related = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .sort((a, b) => {
      const score = (x: Product) =>
        (x.customGroup === product.customGroup ? 2 : 0) +
        (x.productType === product.productType ? 2 : 0) +
        (x.stoneType === product.stoneType ? 1 : 0)
      return score(b) - score(a)
    })
    .slice(0, 3)
    .slice(0, 3)

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
            href="/catalog/products"
            className="transition-colors hover:text-foreground"
          >
            Изделия из камня
          </Link>
          <ChevronRight className="size-4" />
          <Link
            href={`/catalog/products?category=${product.category}`}
            className="transition-colors hover:text-foreground"
          >
            {PRODUCT_CATEGORY_META[product.category].label}
          </Link>
          {groupLabel && (
            <>
              <ChevronRight className="size-4" />
              <Link
                href={categoryHref}
                className="transition-colors hover:text-foreground"
              >
                {groupLabel}
              </Link>
            </>
          )}
          <ChevronRight className="size-4" />
          <span className="text-foreground" aria-current="page">
            {getProductBreadcrumbTitle(product)}
          </span>
        </nav>

        {/* Hero */}
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          {/* Visual column */}
          <div className="space-y-4">
            <div className="relative aspect-[5/6] overflow-hidden rounded-3xl border border-border bg-secondary">
              <Image
                src={images[activeImage] ?? product.image}
                alt={`${product.name} — изделие из ${product.stoneType.toLowerCase()} ${product.stoneName}`}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute left-4 top-4">
                {slabLotStatus ? (
                  <LotStatusBadge status={slabLotStatus} />
                ) : blankLotStatus ? (
                  <LotStatusBadge status={blankLotStatus} />
                ) : tileLotStatus ? (
                  <LotStatusBadge status={tileLotStatus} />
                ) : pavingLotStatus ? (
                  <LotStatusBadge status={pavingLotStatus} />
                ) : availability ? (
                  <StatusBadge value={availability} />
                ) : null}
              </div>
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {images.slice(0, 4).map((src, index) => (
                  <button
                    key={`${src}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={cn(
                      "relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted",
                      index === activeImage ? "border-primary" : "border-border",
                    )}
                  >
                    <Image
                      src={src}
                      alt={`${product.name}, фото ${index + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info column */}
          <div className="flex flex-col">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {groupLabel && (
                <Badge variant="secondary" className="bg-secondary text-muted-foreground">
                  {groupLabel}
                </Badge>
              )}
              <Badge variant="secondary" className="text-primary bg-[var(--primary-soft)]">
                {isStoneLot ? product.stoneType : typeLabel}
              </Badge>
              {product.finish && !isStoneLot && (
                <span className="text-xs text-muted-foreground">{product.finish}</span>
              )}
              {hasSlabLot && (
                <span className="text-xs text-muted-foreground">
                  Партия · {slabs.length} {pluralSlabs(slabs.length)}
                </span>
              )}
              {hasBlankLot && (
                <span className="text-xs text-muted-foreground">
                  Партия · {blanks.length} {pluralBlanks(blanks.length)}
                </span>
              )}
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {isSlab
                ? getSlabPageTitle(product.stoneName)
                : isBlank
                  ? getBlankPageTitle(product.stoneName)
                  : isTile
                    ? getTilePageTitle(product.stoneName)
                    : isPaving
                      ? getPavingPageTitle(product)
                      : product.name}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {product.description}
            </p>
            {product.origin && !isStoneLot && (
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Происхождение</span>
                {` — ${product.origin}`}
                {product.quarry && product.origin && !product.origin.includes(product.quarry)
                  ? ` · ${product.quarry}`
                  : ""}
              </p>
            )}

            {!isStoneLot && (() => {
              const raw = product.dimensions ?? product.size
              if (!raw) return null
              const parts = raw.split("×").map((s) => s.trim())
              const [w, h, d] = parts
              const fmt = (n: string | undefined) => {
                if (!n) return undefined
                const compact = n.replace(/\s/g, "").replace(/мм$/i, "")
                return `${compact} мм`
              }
              return (
                <p className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {product.category === "tiles" ? "Форматы" : "Формат"}
                  </span>
                  {custom && w && h ? ` — ${fmt(w)} × ${fmt(h)}` : ` — ${raw}`}
                  {custom && d ? `, толщина ${fmt(d)}` : ""}
                </p>
              )
            })()}

            {isStoneLot ? (
              <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-border bg-secondary/30 p-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mountain className="size-4" />
                    Вид камня
                  </div>
                  <p className="font-semibold text-foreground">{product.stoneType}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ruler className="size-4" />
                    {isTile || isPaving ? "Форматы" : "Размер (Д×Ш)"}
                  </div>
                  <p className="font-semibold text-foreground">
                    {(isTile
                      ? tileSizeSummary
                      : isPaving
                        ? pavingSizeSummary
                        : isBlank
                          ? blankSizeRange
                          : slabSizeRange) || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MoveVertical className="size-4" />
                    Толщина
                  </div>
                  <p className="font-semibold text-foreground">
                    {(isTile
                      ? tileThicknessRange
                      : isPaving
                        ? pavingThicknessRange
                        : isBlank
                          ? blankThicknessRange
                          : slabThicknessRange) || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Layers className="size-4" />
                    {isPaving ? "Обработка" : "Поверхность"}
                  </div>
                  <p className="font-semibold text-foreground">
                    {(isTile
                      ? tileFinishSummary
                      : isPaving
                        ? pavingFinishSummary
                        : isBlank
                          ? blankFinishSummary
                          : slabFinishSummary) || "—"}
                  </p>
                </div>
                {(isSlab || isBlank) && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="size-4" />
                      В партии
                    </div>
                    <p className="font-semibold text-foreground">
                      {(isBlank ? blankLotCount : slabLotCount) || "—"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-border bg-secondary/30 p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Из камня
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                    <Image
                      src={product.stoneImage ?? product.image}
                      alt={product.stoneName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold text-foreground">
                      {product.stoneName}
                    </p>
                    <p className="text-sm text-muted-foreground">{product.stoneType}</p>
                  </div>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 min-h-11 flex-1 gap-2 text-base">
                <Link href={`/contacts?product=${encodeURIComponent(product.name)}`}>
                  Запросить цену
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 min-h-11 px-6 text-base">
                <Link href="/services/consultations">Получить консультацию</Link>
              </Button>
            </div>

            <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-[var(--primary-soft)] text-primary text-sm border border-border/60">
              <Quote className="size-5 shrink-0" />
              <p className="leading-relaxed">
                {priceLabel}. Точная стоимость зависит от размеров, сложной
                геометрии, сроков и монтажа на объекте.
              </p>
            </div>
          </div>
        </div>

        {hasSlabLot && <SlabLotTable product={product} slabs={slabs} />}
        {hasBlankLot && <BlankLotTable product={product} blanks={blanks} />}
        {hasTileVariants && <TileVariantTable product={product} tiles={tiles} />}
        {hasPavingVariants && <PavingVariantTable product={product} paving={paving} />}

        {product.expertNote && (
        <section className="mt-20" aria-labelledby="expert-note">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Рекомендация эксперта
          </p>
          <h2
            id="expert-note"
            className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            {custom ? "Как мы работали с этим сортом" : "Рекомендация по материалу"}
          </h2>
          <blockquote className="mt-6 max-w-3xl border-l-2 border-primary pl-5 text-lg leading-relaxed text-foreground/90">
            {product.expertNote}
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">
            — мастер цеха StoneTrail, 25 лет практики в камне
          </p>
        </section>
        )}

        {custom && (
        <section className="mt-20" aria-labelledby="process-heading">
          <h2
            id="process-heading"
            className="mb-8 max-w-2xl font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Три этапа изготовления
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="p-6 rounded-3xl border border-border bg-card">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary">
                <PencilRuler className="size-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">01 · Замер и чертёж</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Выезд на объект, точное снятие размеров, выбор направления
                рисунка камня и детальный чертёж.
              </p>
            </div>
            <div className="p-6 rounded-3xl border border-border bg-card">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary">
                <Hammer className="size-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">02 · Раскрой и сборка</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Прямая пила по слэбу, полировка, фаска по кромкам, сварка
                армировки и сборка каркаса.
              </p>
            </div>
            <div className="p-6 rounded-3xl border border-border bg-card">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary">
                <Construction className="size-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">03 · Доставка и монтаж</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Защитная упаковка, установка на объекте, калибровка и паспорт
                изделия с гарантией.
              </p>
            </div>
          </div>
        </section>
        )}

        {!isStoneLot && (
        <section className="mt-20" aria-labelledby="char-heading">
          <h2
            id="char-heading"
            className="mb-8 max-w-2xl font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Характеристики
          </h2>
          <dl className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Вид камня", value: product.stoneType, icon: Mountain },
              { label: "Сорт", value: product.stoneName, icon: Layers },
              ...getProductSpecifications(product)
                .filter((row) => row.label !== "Вид камня" && row.label !== "Материал" && row.label !== "Сорт")
                .map((row) => ({
                  ...row,
                  icon:
                    row.label === "Размер" || row.label === "Форматы" || row.label === "Формат" || row.label === "Размеры"
                      ? Ruler
                      : Layers,
                })),
              ...Object.entries(product.characteristics ?? {}).map(([label, value]) => ({
                label,
                value,
                icon: Layers,
              })),
              { label: "Направление", value: PRODUCT_CATEGORY_META[product.category].label, icon: PencilRuler },
            ]
              .filter((row, index, rows) => row.value && rows.findIndex((item) => item.label === row.label) === index)
              .map((row) => {
                const RowIcon = row.icon
                return (
                  <div key={row.label} className="flex items-start gap-3 p-5 bg-background">
                    <RowIcon className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        {row.label}
                      </dt>
                      <dd className="mt-1 break-words font-medium text-foreground">
                        {row.value}
                      </dd>
                    </div>
                  </div>
                )
              })}
          </dl>
        </section>
        )}

        {product.applications && product.applications.length > 0 && (
          <section className="mt-20" aria-labelledby="applications-heading">
            <h2
              id="applications-heading"
              className="mb-6 max-w-2xl font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Варианты применения
            </h2>
            <ul className="flex flex-wrap gap-2">
              {product.applications.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-sm text-foreground"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-20" aria-labelledby="related-heading">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                  Похожие изделия
                </p>
                <h2
                  id="related-heading"
                  className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
                >
                  Из тех же сортов
                </h2>
              </div>
              <Button asChild variant="ghost" className="gap-1.5 text-sm text-foreground">
                <Link href={categoryHref}>
                  Весь каталог
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/catalog/products/${p.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-[0_16px_40px_-24px_rgba(35,72,58,0.4)]"
                >
                  <div className="relative aspect-[5/4] overflow-hidden bg-secondary">
                    <Image
                      src={p.image}
                      alt={`${p.name}, ${getProductTypeLabel(p)}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      unoptimized
                    />
                    <div className="absolute left-3 top-3">
                      {getProductAvailability(p) ? (
                        <StatusBadge value={getProductAvailability(p)!} />
                      ) : null}
                    </div>
                  </div>
                  <div className="p-5">
                    <span className="inline-flex w-fit items-center rounded-full border border-border bg-secondary/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {isStoneLot ? p.stoneType : getProductTypeLabel(p)}
                    </span>
                    <h3 className="mt-3 font-display text-lg font-bold leading-tight text-foreground">
                      {getProductCardTitle(p)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {p.stoneType} · {p.stoneName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
