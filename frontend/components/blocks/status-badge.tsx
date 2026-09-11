import type { BlockStatus } from "@/lib/mock-data"
import type { LotStatus } from "@/lib/block-utils"
import { cn } from "@/lib/utils"

type AnyStatus = BlockStatus | LotStatus

const styles: Record<LotStatus, string> = {
  "В наличии": "bg-[var(--primary-soft)] text-primary",
  "Частично в наличии": "bg-[var(--primary-soft)] text-primary",
  Зарезервирован: "bg-[var(--accent-soft)] text-accent",
  "Под заказ": "bg-muted text-muted-foreground",
}
const dot: Record<LotStatus, string> = {
  "В наличии": "bg-primary",
  "Частично в наличии": "bg-primary",
  Зарезервирован: "bg-accent",
  "Под заказ": "bg-muted-foreground",
}

export function StatusBadge({ status }: { status: AnyStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[status],
      )}
    >
      <span className={cn("size-1.5 rounded-full", dot[status])} aria-hidden="true" />
      {status}
    </span>
  )
}
