"use client"

import { useMemo, useState } from "react"
import { RotateCcw, SlidersHorizontal } from "lucide-react"
import type { Product, ProductCategory } from "@/lib/mock-data"
import {
  FILTER_DEFS,
  FILTER_STATE_KEY,
  PRODUCT_CATEGORY_META,
  PRODUCT_SORT_OPTIONS,
  countActiveFilters,
  getCatalogFilterKeys,
  type ProductFilterState,
  type ProductSortId,
} from "@/lib/product-catalog"
import {
  CUSTOM_GROUP_ALL,
  getProductTypeOptionGroups,
  getProductTypeOptions,
  uniqueFilterValues,
  type ProductFilterKey,
} from "@/lib/custom-catalog"
import { FilterCombobox } from "@/components/products/filter-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export function ProductFilters({
  category,
  products,
  filters,
  onChange,
  sort,
  onSortChange,
  customGroup = "all",
  onReset,
  canReset,
}: {
  category: ProductCategory
  products: Product[]
  filters: ProductFilterState
  onChange: (patch: Partial<ProductFilterState>) => void
  sort: ProductSortId
  onSortChange: (sort: ProductSortId) => void
  customGroup?: string
  onReset: () => void
  canReset: boolean
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const meta = PRODUCT_CATEGORY_META[category]
  const keys = useMemo(
    () => getCatalogFilterKeys(category, customGroup, filters.productType),
    [category, customGroup, filters.productType],
  )
  const activeCount = countActiveFilters(filters, keys)

  const optionProducts = useMemo(
    () =>
      category === "custom" && filters.productType !== "all"
        ? products.filter((product) => product.productType === filters.productType)
        : products,
    [category, filters.productType, products],
  )

  const optionMap = useMemo(() => {
    const map = {} as Record<ProductFilterKey, string[]>
    for (const key of keys) {
      if (key === "productType") {
        map[key] = getProductTypeOptions(products, customGroup)
        continue
      }
      if (key === "status") {
        const values = uniqueFilterValues(optionProducts, key)
        const ordered = ["В наличии", "Под заказ"].filter((item) => values.includes(item))
        map[key] = ordered.length > 0 ? ordered : values
        continue
      }
      map[key] = uniqueFilterValues(optionProducts, key)
    }
    return map
  }, [keys, products, optionProducts, customGroup])

  const visibleKeys = keys.filter((key) => (optionMap[key] ?? []).length > 0)

  const filterControls = (
    <div
      className={cn(
        "relative grid items-end gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        keys.length <= 3 && "xl:grid-cols-3",
      )}
    >
      {visibleKeys.map((key) => {
        const def = FILTER_DEFS[key]
        const stateKey = FILTER_STATE_KEY[key]
        const options = optionMap[key] ?? []
        if (options.length === 0) return null
        const typeGroups =
          key === "productType" && customGroup === CUSTOM_GROUP_ALL
            ? getProductTypeOptionGroups(products, customGroup)
            : undefined
        return (
          <FilterCombobox
            key={key}
            label={def.label}
            value={filters[stateKey]}
            onValueChange={(value) => onChange({ [stateKey]: value })}
            allLabel={def.allLabel}
            options={options}
            groups={typeGroups}
          />
        )
      })}
    </div>
  )

  return (
    <div className="mb-10 space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <div className="space-y-2">
          <label
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            htmlFor="products-search"
          >
            Поиск
          </label>
          <Input
            id="products-search"
            placeholder={meta.searchPlaceholder}
            className="h-11 bg-background"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Сортировка
            </span>
            <Select value={sort} onValueChange={(value) => onSortChange(value as ProductSortId)}>
              <SelectTrigger className="h-11 bg-background">
                <span className="truncate text-foreground">
                  {PRODUCT_SORT_OPTIONS.find((option) => option.id === sort)?.label ?? "По релевантности"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 text-muted-foreground"
            onClick={onReset}
            disabled={!canReset}
            aria-label="Сбросить фильтры"
            title="Сбросить фильтры"
          >
            <RotateCcw className="size-[18px]" />
          </Button>
        </div>
      </div>

      {visibleKeys.length > 0 && (
        <>
          <div className="lg:hidden">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full min-h-11 gap-2"
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
            >
              <SlidersHorizontal className="size-4" />
              Фильтры
              {activeCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </Button>
          </div>

          <div className={cn("relative", !mobileOpen && "hidden lg:block")}>
            <div className="absolute inset-0 rounded-2xl border bg-secondary/30 backdrop-blur-sm" aria-hidden="true" />
            {filterControls}
          </div>
        </>
      )}
    </div>
  )
}
