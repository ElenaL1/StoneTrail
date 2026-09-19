import { notFound } from "next/navigation"
import { catalogApi } from "@/lib/catalog/api-client"
import { BlockDetailPage } from "./block-detail"

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [block, lots] = await Promise.all([
    catalogApi.getBlock(slug),
    catalogApi.listBlocks(),
  ])
  if (!block) notFound()
  const relatedMaterial = block.blockStoneId
    ? await catalogApi.getStone(block.blockStoneId)
    : null
  return (
    <BlockDetailPage
      block={block}
      lots={lots}
      relatedMaterial={relatedMaterial}
    />
  )
}
