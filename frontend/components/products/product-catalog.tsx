"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Construction, Gem, PencilRuler, Truck } from "lucide-react"
import type { Product, ProductCategory } from "@/lib/mock-data"
import {
  CUSTOM_GROUP_ALL,
  getCustomGroup,
  parseCustomGroup,
} from "@/lib/custom-catalog"
import {
  EMPTY_PRODUCT_FILTERS,
  PRODUCT_CATEGORY_META,
  PRODUCT_PAGE_SIZE,
  filterCatalogProducts,
  formatProductCount,
  hasActiveProductFilters,
  parseProductCategory,
  sortCatalogProducts,
  type ProductSortId,
} from "@/lib/product-catalog"
import { ProductCategoryTabs } from "@/components/products/product-category-tabs"
import { CustomGroupTabs } from "@/components/products/custom-group-tabs"
import { ProductFilters } from "@/components/products/product-filters"
import { ProductCard } from "@/components/products/product-card"
import { ContentEnter } from "@/components/content-enter"
import { Button } from "@/components/ui/button"
import { onPrimaryCtaClass } from "@/lib/on-primary-cta"
import { arePromotionsEnabled } from "@/lib/promo-utils"
import { cn } from "@/lib/utils"

export function ProductCatalog({ products }: { products: Product[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const category = parseProductCategory(searchParams.get("category"))
  const customGroup = category === "custom" ? parseCustomGroup(searchParams.get("group")) : CUSTOM_GROUP_ALL
  const [filters, setFilters] = useState(EMPTY_PRODUCT_FILTERS)
  const [sort, setSort] = useState<ProductSortId>("relevance")
  const [visibleCount, setVisibleCount] = useState(PRODUCT_PAGE_SIZE)
  const categoryMeta = PRODUCT_CATEGORY_META[category]
  const groupMeta = customGroup === CUSTOM_GROUP_ALL ? null : getCustomGroup(customGroup)

  useEffect(() => {
    setFilters(EMPTY_PRODUCT_FILTERS)
    setSort("relevance")
  }, [category])

  const selectionKey = [
    category,
    customGroup,
    sort,
    filters.search,
    filters.productType,
    filters.stoneType,
    filters.origin,
    filters.availability,
    filters.color,
    filters.thickness,
    filters.finish,
    filters.size,
    filters.purpose,
    filters.height,
    filters.diameter,
    filters.format,
    filters.dimensions,
  ].join("|")

  useEffect(() => {
    setVisibleCount(PRODUCT_PAGE_SIZE)
  }, [selectionKey])

  const categoryProducts = useMemo(
    () =>
      products.filter((product) => {
        if (product.category !== category) return false
        if (category === "custom" && customGroup !== CUSTOM_GROUP_ALL && product.customGroup !== customGroup) {
          return false
        }
        return true
      }),
    [products, category, customGroup],
  )

  const filtered = useMemo(
    () =>
      sortCatalogProducts(
        filterCatalogProducts(categoryProducts, category, filters, customGroup),
        sort,
        filters.search,
      ),
    [categoryProducts, category, filters, customGroup, sort],
  )

  const visible = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  function selectCategory(next: ProductCategory) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("category", next)
    params.delete("group")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function selectGroup(next: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("category", "custom")
    if (next === CUSTOM_GROUP_ALL) params.delete("group")
    else params.set("group", next)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    setFilters((current) => ({
      ...EMPTY_PRODUCT_FILTERS,
      search: current.search,
      stoneType: current.stoneType,
      origin: current.origin,
      availability: current.availability,
    }))
  }

  function resetFilters() {
    setFilters(EMPTY_PRODUCT_FILTERS)
    setSort("relevance")
    if (category === "custom" && customGroup !== CUSTOM_GROUP_ALL) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("group")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }

  const summaryParts = [
    groupMeta?.label,
    filters.productType !== "all" ? filters.productType.toLowerCase() : null,
    filters.stoneType !== "all" ? filters.stoneType.toLowerCase() : null,
    filters.origin !== "all" ? filters.origin : null,
    filters.availability !== "all" ? filters.availability.toLowerCase() : null,
  ].filter(Boolean)

  return (
    <div className={cn("min-h-screen overflow-x-hidden py-24 px-5 lg:px-8", !arePromotionsEnabled() ? "bg-muted/30" : "bg-background")}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 space-y-4">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Вернуться к каталогу камня
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Изделия из камня
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Камень для интерьеров, архитектуры и благоустройства. Выбирайте готовый материал
              или закажите изготовление по индивидуальным параметрам.
            </p>
          </div>
        </div>

        <div className="mb-8 space-y-5">
          <ProductCategoryTabs value={category} onChange={selectCategory} />
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {groupMeta?.description ?? categoryMeta.description}
          </p>
          {category === "custom" && (
            <>
              <CustomGroupTabs value={customGroup} onChange={selectGroup} />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Демонстрационный каталог: позиции приведены для навигации по типам изделий
                и не подтверждают наличие на складе.
              </p>
            </>
          )}
        </div>

        <ProductFilters
          category={category}
          products={categoryProducts}
          filters={filters}
          onChange={(patch) =>
            setFilters((current) => {
              const next = { ...current, ...patch }
              const changed = (Object.keys(patch) as (keyof typeof current)[]).some(
                (key) => current[key] !== next[key],
              )
              return changed ? next : current
            })
          }
          sort={sort}
          onSortChange={setSort}
          customGroup={customGroup}
          onReset={resetFilters}
          canReset={hasActiveProductFilters(filters) || sort !== "relevance"}
        />

        <div id="product-catalog-panel" role="tabpanel" aria-labelledby={`product-category-${category}`}>
          <ContentEnter swapKey={`${category}-${customGroup}`}>
            {filtered.length > 0 ? (
              <>
                <p className="mb-5 text-sm text-muted-foreground">
                  {formatProductCount(filtered.length, category)}
                  {summaryParts.length > 0 && <> · {summaryParts.join(" · ")}</>}
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {visible.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-10 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 min-h-11 px-6"
                      onClick={() => setVisibleCount((count) => count + PRODUCT_PAGE_SIZE)}
                    >
                      Показать ещё
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-secondary/10 px-5 py-24 text-center">
                <div className="mb-4 rounded-full bg-muted p-4">
                  <PencilRuler className="size-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {hasActiveProductFilters(filters) || customGroup !== CUSTOM_GROUP_ALL
                    ? "Ничего не найдено"
                    : categoryMeta.emptyTitle}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-muted-foreground">
                  {categoryMeta.emptyDescription}
                </p>
                {(hasActiveProductFilters(filters) || customGroup !== CUSTOM_GROUP_ALL) && (
                  <Button type="button" variant="outline" className="mt-6 h-11 min-h-11" onClick={resetFilters}>
                    Сбросить фильтры
                  </Button>
                )}
              </div>
            )}
          </ContentEnter>
        </div>

        <section className="mt-20" aria-labelledby="how-we-work-heading">
          <h2
            id="how-we-work-heading"
            className="mb-8 max-w-2xl font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Как мы работаем с камнем
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-4 rounded-3xl border bg-secondary/30 p-7 backdrop-blur-sm">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-primary">
                <Gem className="size-6" />
              </div>
              <h3 className="text-lg font-bold">Подбор материала</h3>
              <p className="leading-relaxed text-muted-foreground">
                Поможем выбрать породу, цвет, рисунок и подходящий формат камня под задачу проекта.
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-3xl border bg-secondary/30 p-7 backdrop-blur-sm">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-primary">
                <Construction className="size-6" />
              </div>
              <h3 className="text-lg font-bold">Раскрой и обработка</h3>
              <p className="leading-relaxed text-muted-foreground">
                Изготавливаем детали по размерам проекта с необходимой обработкой поверхности.
              </p>
            </div>
            <div className="flex flex-col gap-4 rounded-3xl border bg-secondary/30 p-7 backdrop-blur-sm">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-primary">
                <Truck className="size-6" />
              </div>
              <h3 className="text-lg font-bold">Доставка и монтаж</h3>
              <p className="leading-relaxed text-muted-foreground">
                Организуем доставку и при необходимости выполняем монтаж на объекте.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-primary text-primary-foreground">
          <div className="grid gap-10 px-7 py-14 sm:grid-cols-[1.4fr_1fr] sm:items-center lg:px-12">
            <div>
              <h2 className="text-balance font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                Не нашли подходящий вариант?
              </h2>
              <p className="mt-3 max-w-xl text-pretty leading-relaxed text-primary-foreground/85">
                Расскажите о задаче — поможем подобрать камень и оптимальное решение.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                asChild
                className={cn(onPrimaryCtaClass, "h-11 min-h-11 gap-2 px-5 text-sm")}
              >
                <Link href="/contacts">
                  Описать задачу
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 min-h-11 border-primary-foreground/30 bg-transparent px-5 text-sm text-primary-foreground hover:bg-black/10 hover:text-primary-foreground"
              >
                <Link href="/services/consultations">Получить консультацию</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
