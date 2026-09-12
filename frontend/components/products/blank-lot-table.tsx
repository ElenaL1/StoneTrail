"use client"

import { Box } from "lucide-react"
import { LotTable } from "@/components/products/lot-table"
import type { IndividualBlank, Product } from "@/lib/mock-data"
import {
  getBlankContactsHref,
  getBlankLotSectionTitle,
  getBlankPageTitle,
} from "@/lib/blank-utils"

export function BlankLotTable({
  product,
  blanks,
}: {
  product: Product
  blanks: IndividualBlank[]
}) {
  return (
    <LotTable
      product={product}
      items={blanks}
      icon={Box}
      contactsHref={getBlankContactsHref}
      copy={{
        headingId: "blanks-list-heading",
        title: getBlankLotSectionTitle(product.stoneType, product.stoneName),
        description:
          "Каждая заготовка — полуслэб со своим рисунком, размером и статусом. Выбирайте конкретный кусок под раскрой.",
        entityLabel: "Заготовка",
        emptyTitle: "Нет заготовок с выбранными параметрами",
        pageTitle: getBlankPageTitle(product.stoneName),
        requestLabel: "Запросить заготовку",
        hint: "Подбор по конкретной заготовке: фото рисунка и карта раскроя — перед отгрузкой.",
        itemNoun: "заготовка",
      }}
    />
  )
}
