import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Material } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"

export function StoneSectionHeader({
  material,
  title,
  description,
}: {
  material: Material
  title: string
  description: string
}) {
  return (
    <div className="mb-12 space-y-4">
      <Link
        href="/catalog"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Вернуться к каталогу
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{material.name}</h1>
        <Badge variant="secondary" className="text-primary bg-[var(--primary-soft)]">
          {material.type}
        </Badge>
      </div>
      <p className="max-w-2xl text-lg text-muted-foreground">{title}</p>
      <p className="max-w-2xl text-muted-foreground">{description}</p>
    </div>
  )
}
