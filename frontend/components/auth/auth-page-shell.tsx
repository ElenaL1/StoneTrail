import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type AuthPageShellProps = {
  title?: string
  subtitle?: string
  description?: string
  children: ReactNode
  wide?: boolean
  footer?: ReactNode
}

export function AuthPageShell({
  title,
  subtitle,
  description,
  children,
  wide = false,
  footer,
}: AuthPageShellProps) {
  return (
    <section className="bg-muted/30">
      <div className="mx-auto px-5 py-24 lg:px-8">
        <div
          className={cn(
            "mx-auto w-full rounded-xl border border-border bg-card shadow-[0_12px_40px_-28px_rgba(35,72,58,0.45)]",
            wide ? "max-w-xl" : "max-w-md",
          )}
        >
          <div className="h-1 rounded-t-xl bg-primary" aria-hidden="true" />
          <div className="px-5 py-8 sm:px-8 sm:py-10">
            {title ? (
              <div className="mb-8 space-y-3">
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                {subtitle ? (
                  <p className="text-base font-medium leading-relaxed text-foreground/85">{subtitle}</p>
                ) : null}
                {description ? (
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                ) : null}
              </div>
            ) : null}
            {children}
            {footer ? <div className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">{footer}</div> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
