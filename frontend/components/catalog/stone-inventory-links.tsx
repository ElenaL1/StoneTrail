import Link from "next/link"
import type { Material } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { getStoneInventory, stoneSectionHref, type StoneInventoryKind } from "@/lib/stone-inventory"

const inventoryActions: {
  kind: StoneInventoryKind
  label: string
  availabilityKey: "hasBlocks" | "hasSlabs" | "hasTiles" | "hasProducts"
}[] = [
  { kind: "blocks", label: "Блоки", availabilityKey: "hasBlocks" },
  { kind: "slabs", label: "Слэбы", availabilityKey: "hasSlabs" },
  { kind: "tiles", label: "Плитка", availabilityKey: "hasTiles" },
  { kind: "products", label: "Изделия из камня", availabilityKey: "hasProducts" },
]

export function StoneInventoryLinks({
  material,
  className,
}: {
  material: Material
  className?: string
}) {
  const inventory = getStoneInventory(material)

  return (
    <nav
      aria-label={`Наличие ${material.name}`}
      className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm", className)}
    >
      {inventoryActions.map((action, index) => {
        const enabled = inventory[action.availabilityKey]
        const href = stoneSectionHref(material.id, action.kind)

        return (
          <span key={action.kind} className="inline-flex items-center gap-x-1.5">
            {index > 0 && (
              <span className="text-muted-foreground/50" aria-hidden="true">
                ·
              </span>
            )}
            {enabled ? (
              <Link href={href} className="text-muted-foreground transition-colors hover:text-primary">
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
