"use client"

import { useEffect, useState } from "react"
import { PromoBanner } from "@/components/promo-banner"
import { expiryNote } from "@/lib/feed/format"
import { useActivePromotions } from "@/lib/promotions/presence"
import { cn } from "@/lib/utils"

export function PromotionBanner() {
  const enabledPromotions = useActivePromotions()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (enabledPromotions.length <= 1 || isPaused) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % enabledPromotions.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [enabledPromotions.length, isPaused])

  useEffect(() => {
    setCurrentIndex(0)
  }, [enabledPromotions.length])

  if (enabledPromotions.length === 0) return null

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative" aria-live="polite">
        {enabledPromotions.map((promotion, index) => (
          <div
            key={promotion.slug}
            className={cn(
              "transition-all duration-500 ease-in-out",
              index === currentIndex
                ? "relative translate-x-0 opacity-100"
                : "pointer-events-none absolute inset-0 translate-x-4 opacity-0",
            )}
          >
            <PromoBanner
              instanceId={promotion.slug}
              template={promotion.template}
              title={promotion.title}
              description={promotion.description}
              note={expiryNote(promotion.expiresAt)}
              buttonLabel={promotion.buttonLabel}
              href={`/promotions/${promotion.slug}`}
            />
          </div>
        ))}
      </div>
      {enabledPromotions.length > 1 ? (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {enabledPromotions.map((promotion, index) => (
            <button
              key={promotion.slug}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex ? "w-5 bg-primary" : "w-2 bg-border hover:bg-primary/50",
              )}
              aria-label={`Перейти к предложению ${index + 1}`}
              aria-current={index === currentIndex ? "true" : undefined}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
