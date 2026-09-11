import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <img
        src="/logo.svg"
        alt=""
        className="size-8 rounded-md"
        aria-hidden="true"
      />
      <span className="font-display text-lg font-bold leading-none tracking-tight text-foreground">
        Stone<span className="text-primary">Trail</span>
      </span>
    </span>
  )
}