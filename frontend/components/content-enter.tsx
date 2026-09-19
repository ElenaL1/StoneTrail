import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function ContentEnter({
  swapKey,
  className,
  children,
}: {
  swapKey: string
  className?: string
  children: ReactNode
}) {
  return (
    <div key={swapKey} className={cn("content-enter", className)}>
      {children}
    </div>
  )
}
