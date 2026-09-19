"use client"

import React, { useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  Box,
  Factory,
  Globe,
  Mountain,
  Package,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { StoneBlock } from "@/lib/types"
import { getBlockCount, pluralBlocks, pluralLots } from "@/lib/block-utils"
import { BlockCard } from "@/components/blocks/block-card"
import { onPrimaryCtaClass } from "@/lib/on-primary-cta"
import { arePromotionsEnabled } from "@/lib/promo-utils"
import { cn } from "@/lib/utils"

export function BlocksIndex({ lots }: { lots: StoneBlock[] }) {
  const [search, setSearch] = useState("")
  const [stoneType, setStoneType] = useState("all")
  const isBannerEnabled = arePromotionsEnabled()

  const allStoneTypes = useMemo(
    () => Array.from(new Set(lots.map((b) => b.stoneType))),
    [lots],
  )

  const totalBlocksInCatalog = useMemo(
    () => lots.reduce((s, b) => s + getBlockCount(b.blocks), 0),
    [lots],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return lots.filter((b) => {
      const matchesType = stoneType === "all" || b.stoneType === stoneType
      const matchesSearch =
        q.length === 0 ||
        b.stoneName.toLowerCase().includes(q) ||
        b.stoneType.toLowerCase().includes(q) ||
        b.quarry.toLowerCase().includes(q) ||
        b.country.toLowerCase().includes(q)
      return matchesType && matchesSearch
    })
  }, [lots, search, stoneType])

  const filteredBlockCount = useMemo(
    () => filtered.reduce((s, b) => s + getBlockCount(b.blocks), 0),
    [filtered],
  )

  return (
    <div
      className={cn(
        "min-h-screen py-24 px-5 lg:px-8",
        !isBannerEnabled ? "bg-muted/30" : "bg-background",
      )}
    >
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-12 space-y-4">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Вернуться к каталогу камня
          </Link>
          <div className="flex flex-col gap-2">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-primary">
              <Box className="size-3.5" />
              Сырьё · Блоки под раскрой
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Блоки
            </h1>
          </div>
          <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Прямые поставки блоков из проверенных карьеров Италии, Испании и
            Греции. Продаём под раскрой крупным объёмом: проверенная структура,
            однородная кромка, паспорт качества и фото каждого блока.
          </p>
        </div>

        {/* Filters */}
        <div className="relative mb-12">
          <div
            className="absolute inset-0 rounded-2xl border bg-secondary/30 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div className="relative grid gap-4 items-end p-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-1">
              <label
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                htmlFor="blocks-search"
              >
                Поиск
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="blocks-search"
                  placeholder="Сорт, страна или карьера…"
                  className="pl-10 bg-background"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Вид камня
              </span>
              <Select value={stoneType} onValueChange={setStoneType}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Все виды" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все виды</SelectItem>
                  {allStoneTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mountain className="size-4" />
              <span>
                {filteredBlockCount} {pluralBlocks(filteredBlockCount)} в{" "}
                {filtered.length} {pluralLots(filtered.length)}
                {filtered.length !== lots.length
                  ? ` (из ${totalBlocksInCatalog} в каталоге)`
                  : " в каталоге"}
              </span>
            </div>
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((block) => (
              <BlockCard key={block.id} block={block} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-3xl bg-secondary/10">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Package className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Ничего не найдено</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
              Попробуйте изменить фильтры или запросить блок на прямой поставке у
              эксперта StoneTrail.
            </p>
          </div>
        )}

        {/* How we work */}
        <section className="mt-20" aria-labelledby="how-we-work-heading">
          <h2
            id="how-we-work-heading"
            className="mb-8 max-w-2xl font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Как мы работаем с блоками
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-6 rounded-2xl border border-border bg-card">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary">
                <Globe className="size-5" />
              </div>
              <h3 className="text-lg font-bold">География поставок</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Италия, Бразилия, Испания и Индия. Работаем только с проверенными
                карьерами.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="text-lg font-bold">Гарантия качества</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Жёсткий отбор по отсутствию скрытых трещин и однородности цвета.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary">
                <Truck className="size-5" />
              </div>
              <h3 className="text-lg font-bold">Логистика</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Организация безопасной транспортировки сверхтяжёлых грузов из
                любой точки мира.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary">
                <Factory className="size-5" />
              </div>
              <h3 className="text-lg font-bold">Технический надзор</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Консультации по оптимальному раскрою блоков под конкретные задачи.
              </p>
            </div>
          </div>
        </section>

        {/* End CTA */}
        <section className="mt-16 rounded-3xl bg-primary text-primary-foreground">
          <div className="grid gap-10 px-7 py-14 sm:grid-cols-[1.4fr_1fr] sm:items-center lg:px-12">
            <div>
              <h2 className="text-balance font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                Запросить актуальные блоки
              </h2>
              <p className="mt-3 max-w-xl text-pretty leading-relaxed text-primary-foreground/85">
                Список блоков обновляется ежедневно. Оставьте запрос — пришлём
                паспорт качества, фото граней и точную спецификацию по вашему сорту.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                asChild
                className={cn(onPrimaryCtaClass, "h-11 gap-2 px-5 text-sm")}
              >
                <Link href="/contacts">
                  Связаться с экспертом
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 border-primary-foreground/30 bg-transparent px-5 text-sm text-primary-foreground hover:bg-black/10 hover:text-primary-foreground"
              >
                <Link href="/catalog">
                  Открыть каталог камня
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
