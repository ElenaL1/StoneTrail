import { notFound } from "next/navigation"
import { catalogApi } from "@/lib/catalog/api-client"
import { FinishedProductDetailPage } from "./product-detail"

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [product, products] = await Promise.all([
    catalogApi.getProduct(slug),
    catalogApi.listProducts(),
  ])
  if (!product) notFound()
  return <FinishedProductDetailPage product={product} products={products} />
}
