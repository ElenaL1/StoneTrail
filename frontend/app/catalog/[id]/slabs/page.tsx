import { notFound } from "next/navigation"
import { StoneSlabsView } from "@/components/catalog/stone-slabs-view"
import { catalogApi } from "@/lib/catalog/api-client"

export default async function StoneSlabsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const material = await catalogApi.getStone(id)
  if (!material) notFound()
  return <StoneSlabsView material={material} />
}
