import { Suspense } from "react"
import { catalogApi } from "@/lib/catalog/api-client"
import { ProductCatalog } from "@/components/products/product-catalog"
import { cn } from "@/lib/utils"
import { arePromotionsEnabled } from "@/lib/promo-utils"

export const metadata = {
  title: "Изделия из камня — StoneTrail",
  description:
    "Камень для интерьеров, архитектуры и благоустройства. Слэбы, заготовки, плита, брусчатка и изделия под заказ.",
}

function ProductCatalogFallback() {
  return (
    <div
      className={cn(
        "min-h-screen py-24 px-5 lg:px-8",
        !arePromotionsEnabled() ? "bg-muted/30" : "bg-background",
      )}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Изделия из камня
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Камень для интерьеров, архитектуры и благоустройства.
          </p>
        </div>
      </div>
    </div>
  )
}

export default async function ProductsCatalogPage() {
  const products = await catalogApi.listProducts()
  return (
    <Suspense fallback={<ProductCatalogFallback />}>
      <ProductCatalog products={products} />
    </Suspense>
  )
}
