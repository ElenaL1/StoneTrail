import type { FinishedProduct } from "@/lib/mock-data"
import { ProductCard } from "@/components/products/product-card"

export function FinishedProductCard({ product }: { product: FinishedProduct }) {
  return <ProductCard product={product} />
}
