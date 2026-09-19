import { notFound } from "next/navigation"
import { MaterialDetailPage } from "@/components/catalog/material-detail"
import { catalogApi } from "@/lib/catalog/api-client"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [material, lots] = await Promise.all([
    catalogApi.getStone(id),
    catalogApi.listBlocks(),
  ])
  if (!material) notFound()
  return <MaterialDetailPage material={material} lots={lots} />
}
