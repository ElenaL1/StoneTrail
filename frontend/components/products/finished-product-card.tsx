import type { Product } from "@/lib/types"
import { ProductCard } from "@/components/products/product-card"

export function FinishedProductCard({ product }: { product: Product }) {
  return <ProductCard product={product} />
}
