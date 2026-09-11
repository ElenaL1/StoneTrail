import Link from "next/link"
import type { Material } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StoneInventoryLinks } from "@/components/catalog/stone-inventory-links"
import { stoneOrigin } from "@/lib/stone-inventory"

export function MaterialCard({ material }: { material: Material }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-[0_16px_40px_-24px_rgba(35,72,58,0.4)]">
      <div className="relative aspect-[5/4] overflow-hidden bg-secondary">
        <img
          src={material.image || "/placeholder.svg"}
          alt={`${material.name}, ${material.type}`}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-display text-lg font-bold leading-tight text-foreground">{material.name}</h3>
          <Badge variant="secondary" className="shrink-0 text-primary bg-[var(--primary-soft)]">
            {material.type}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{stoneOrigin(material)}</p>

        <StoneInventoryLinks material={material} className="mt-4" />

        <div className="mt-5 border-t border-border pt-4">
          <Button asChild variant="outline" className="h-9 w-full text-sm">
            <Link href={`/catalog/${material.id}`}>Подробнее</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}

