import Link from "next/link"
import type { Material, Product, StoneBlock } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  getStoneInventory,
  stoneCategoryProduct,
  stoneMadeProductsHref,
  stoneProductHref,
  stoneSectionHref,
  type StoneInventoryKind,
} from "@/lib/stone-inventory"

const inventoryActions: { kind: StoneInventoryKind; label: string }[] = [
  { kind: "blocks", label: "Блоки" },
  { kind: "slabs", label: "Слэбы" },
  { kind: "tiles", label: "Плита" },
  { kind: "products", label: "Изделия из камня" },
]

export function StoneInventoryLinks({
  material,
  lots = [],
  products = [],
  className,
}: {
  material: Material
  lots?: StoneBlock[]
  products?: Product[]
  className?: string
}) {
  const inventory = getStoneInventory(material, lots)
  const slab = stoneCategoryProduct(material, products, "slabs")
  const tile = stoneCategoryProduct(material, products, "tiles")
  const hrefByKind: Record<StoneInventoryKind, string | null> = {
    blocks: stoneSectionHref(material.id, "blocks"),
    slabs: slab ? stoneProductHref(slab) : null,
    tiles: tile ? stoneProductHref(tile) : null,
    products: stoneMadeProductsHref(material, products),
  }

  return (
    <nav
      aria-label={`Наличие ${material.name}`}
      className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm", className)}
    >
      {inventoryActions.map((action, index) => {
        const href = hrefByKind[action.kind]
        const enabled = action.kind === "blocks" ? inventory.hasBlocks : href != null

        return (
          <span key={action.kind} className="inline-flex items-center gap-x-1.5">
            {index > 0 && (
              <span className="text-muted-foreground/50" aria-hidden="true">
                ·
              </span>
            )}
            {enabled && href ? (
              <Link href={href} className="font-medium text-primary transition-colors hover:text-primary/80">
                {action.label}
              </Link>
            ) : (
              <span className="cursor-default text-muted-foreground/40">{action.label}</span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
