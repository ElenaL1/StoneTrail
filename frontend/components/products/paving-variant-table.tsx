"use client"

import { VariantTable } from "@/components/products/variant-table"
import type { IndividualPaving, Product } from "@/lib/mock-data"
import {
  EMPTY_PAVING_VARIANT_FILTERS,
  PAVING_VARIANT_FILTER_DEFS,
  filterPavingVariants,
  getPavingContactsHref,
  getPavingVariantSectionTitle,
  getVisiblePavingVariantFilterKeys,
  hasActivePavingVariantFilters,
  prunePavingVariantFilters,
  pavingVariantFilterOptions,
} from "@/lib/paving-utils"

export function PavingVariantTable({
  product,
  paving,
}: {
  product: Product
  paving: IndividualPaving[]
}) {
  return (
    <VariantTable
      product={product}
      items={paving}
      emptyFilters={EMPTY_PAVING_VARIANT_FILTERS}
      filterDefs={PAVING_VARIANT_FILTER_DEFS}
      getVisibleKeys={getVisiblePavingVariantFilterKeys}
      filterItems={filterPavingVariants}
      pruneFilters={prunePavingVariantFilters}
      filterOptions={pavingVariantFilterOptions}
      hasActiveFilters={hasActivePavingVariantFilters}
      contactsHref={getPavingContactsHref}
      copy={{
        headingId: "paving-list-heading",
        title: getPavingVariantSectionTitle(product.stoneType, product.stoneName),
        description:
          "Каждый вариант — формат модуля, толщина и обработка: колотая, пилено-колотая или термообработанная.",
        emptyTitle: "Нет брусчатки с выбранными параметрами",
        emptyHint: "Сбросьте фильтры, чтобы снова увидеть все варианты.",
        finishLabel: "Обработка",
      }}
    />
  )
}
