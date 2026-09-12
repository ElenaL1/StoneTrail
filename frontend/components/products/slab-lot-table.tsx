"use client"

import { Layers } from "lucide-react"
import { LotTable } from "@/components/products/lot-table"
import type { IndividualSlab, Product } from "@/lib/mock-data"
import { getSlabContactsHref, getSlabLotSectionTitle } from "@/lib/slab-utils"

export function SlabLotTable({
  product,
  slabs,
}: {
  product: Product
  slabs: IndividualSlab[]
}) {
  return (
    <LotTable
      product={product}
      items={slabs}
      icon={Layers}
      contactsHref={getSlabContactsHref}
      copy={{
        headingId: "slabs-list-heading",
        title: getSlabLotSectionTitle(product.stoneType, product.stoneName),
        description:
          "Каждый слэб может отличаться по рисунку, размеру и статусу — выбирайте конкретную плиту под раскрой.",
        entityLabel: "Слэб",
        emptyTitle: "Нет слэбов с выбранными параметрами",
      }}
    />
  )
}
