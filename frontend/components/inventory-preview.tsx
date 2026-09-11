import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { featuredMaterials } from "@/lib/mock-data"
import { MaterialCard } from "@/components/material-card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { arePromotionsEnabled } from "@/lib/promo-utils"

export function InventoryPreview() {
  const isBannerEnabled = arePromotionsEnabled();

  return (
    <section className={cn("border-t border-border", !isBannerEnabled && "bg-muted/30")}>
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Коллекционный фонд</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Редкие материалы, отобранные по высшему стандарту.
            </h2>
          </div>
          <Link href="/catalog">
            <Button variant="outline" className="h-10 gap-2 px-4 text-sm">
              Посмотреть весь фонд
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredMaterials.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      </div>
    </section>
  )
}
