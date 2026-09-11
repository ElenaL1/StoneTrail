import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import type { FinishedProduct, Product } from "@/lib/mock-data"
import { getProductTypeLabel } from "@/lib/product-catalog"
import {
  getCustomGroupLabel,
  getProductAvailability,
  getProductCardSpecs,
  getProductCardTitle,
  getProductPriceLabel,
} from "@/lib/custom-catalog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function StatusBadge({ value }: { value: string }) {
  const inStock = value === "В наличии"
  const madeToOrder = value === "Под заказ"
  const done = value === "Выполнено"
  const inProgress = value === "В работе"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        inStock && "bg-[var(--primary-soft)] text-primary",
        madeToOrder && "bg-muted text-muted-foreground",
        done && "bg-[var(--primary-soft)] text-primary",
        inProgress && "bg-[var(--accent-soft)] text-accent",
        !inStock && !madeToOrder && !done && !inProgress && "bg-muted text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          inStock && "bg-primary",
          madeToOrder && "bg-muted-foreground",
          done && "bg-primary",
          inProgress && "bg-accent",
          !inStock && !madeToOrder && !done && !inProgress && "bg-muted-foreground",
        )}
        aria-hidden="true"
      />
      {value}
    </span>
  )
}

export function ProductCard({ product }: { product: Product }) {
  const isStoneLot =
    product.category === "slabs" ||
    product.category === "blanks" ||
    product.category === "tiles" ||
    product.category === "paving"
  const typeLabel = getProductTypeLabel(product)
  const groupLabel = getCustomGroupLabel(product.customGroup)
  const availability = getProductAvailability(product)
  const specs = getProductCardSpecs(product)
  const priceLabel = getProductPriceLabel(product)
  const title = getProductCardTitle(product)
  const chip = isStoneLot
    ? product.stoneType
    : groupLabel
      ? `${groupLabel} · ${typeLabel}`
      : typeLabel
  const imageAlt = `${title} из ${product.stoneType.toLowerCase()} ${product.stoneName}`

  return (
    <article
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-[0_16px_40px_-24px_rgba(35,72,58,0.4)]"
      aria-label={`${title}, ${chip}, ${product.stoneName}`}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-secondary">
        <Image
          src={product.image}
          alt={imageAlt}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          unoptimized
        />
        {availability ? (
          <div className="absolute left-3 top-3">
            <StatusBadge value={availability} />
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <span className="inline-flex max-w-full truncate rounded-full border border-border bg-secondary/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {chip}
        </span>
        <h3 className="mt-3 line-clamp-2 min-h-12 font-display text-lg font-bold leading-tight text-foreground">
          {title}
        </h3>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {product.stoneType} · {product.stoneName}
        </p>

        {specs.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {specs.map((spec) => (
              <div key={spec.label} className="min-w-0">
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {spec.label}
                </dt>
                <dd className="mt-0.5 truncate font-medium text-foreground">{spec.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className="mt-auto pt-3 text-sm font-medium text-foreground">{priceLabel}</p>

        <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center">
          <Button asChild variant="outline" className="h-10 min-h-10 w-full flex-1 text-sm">
            <Link href={`/catalog/products/${product.slug}`}>Подробнее</Link>
          </Button>
          <Button
            asChild
            aria-label={`Запросить цену: ${product.name}`}
            className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Link
              href={`/contacts?product=${encodeURIComponent(product.name)}`}
              className="inline-flex h-10 min-h-10 items-center justify-center gap-1.5 px-3 text-sm"
            >
              Запросить цену
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}

export function FinishedProductCard({ product }: { product: FinishedProduct }) {
  return <ProductCard product={product} />
}
