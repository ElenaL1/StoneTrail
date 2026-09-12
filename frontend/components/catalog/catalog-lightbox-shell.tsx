"use client"

import { useEffect, type ReactNode } from "react"
import { ArrowLeft, ArrowRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function CatalogLightboxShell({
  ariaLabel,
  index,
  total,
  onClose,
  onNavigate,
  prevAriaLabel,
  nextAriaLabel,
  children,
}: {
  ariaLabel: string
  index: number
  total: number
  onClose: () => void
  onNavigate: (next: number) => void
  prevAriaLabel: string
  nextAriaLabel: string
  children: ReactNode
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowLeft" && index > 0) {
        onNavigate(index - 1)
      } else if (e.key === "ArrowRight" && index < total - 1) {
        onNavigate(index + 1)
      }
    }
    window.addEventListener("keydown", handleKey)

    return () => {
      window.removeEventListener("keydown", handleKey)
      document.body.style.overflow = previousOverflow
    }
  }, [index, total, onClose, onNavigate])

  const canPrev = total > 1 && index > 0
  const canNext = total > 1 && index < total - 1

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-20 rounded-full bg-background/90 p-2 text-foreground backdrop-blur-sm transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Закрыть"
        >
          <X className="size-5" />
        </button>

        <div className="flex-1 overflow-y-auto">{children}</div>

        {total > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-background/60 px-4 py-3">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => onNavigate(index - 1)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors",
                "hover:border-primary/50 hover:text-primary",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground",
              )}
              aria-label={prevAriaLabel}
            >
              <ArrowLeft className="size-4" />
              Предыдущий
            </button>

            <span className="text-xs text-muted-foreground">
              {index + 1} / {total}
            </span>

            <button
              type="button"
              disabled={!canNext}
              onClick={() => onNavigate(index + 1)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors",
                "hover:border-primary/50 hover:text-primary",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-foreground",
              )}
              aria-label={nextAriaLabel}
            >
              Следующий
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
