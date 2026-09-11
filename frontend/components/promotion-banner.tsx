"use client"

import { useEffect, useState } from "react"
import { PromoBanner } from "@/components/promo-banner"
import { mockPromotions } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function PromotionBanner() {
  const enabledPromotions = mockPromotions.filter((p) => p.isEnabled)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (enabledPromotions.length <= 1 || isPaused) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % enabledPromotions.length)
    }, 6000)

    return () => clearInterval(timer)
  }, [enabledPromotions.length, isPaused])

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
            key={promotion.id}
            className={cn(
              "transition-all duration-500 ease-in-out",
              index === currentIndex
                ? "relative opacity-100 translate-x-0"
                : "absolute inset-0 opacity-0 translate-x-4 pointer-events-none",
            )}
          >
            <PromoBanner
              instanceId={promotion.id}
              title={promotion.title}
              description={promotion.description}
              note={`Предложение действительно до ${promotion.expiryDate}`}
              href={promotion.link}
            />
          </div>
        ))}
      </div>

      {enabledPromotions.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
          {enabledPromotions.map((promotion, index) => (
            <button
              key={promotion.id}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "w-5 bg-[#245547]"
                  : "w-2 bg-[#b8bcb8] hover:bg-[#245547]/50",
              )}
              aria-label={`Перейти к предложению ${index + 1}`}
              aria-current={index === currentIndex ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </section>
  )
}
