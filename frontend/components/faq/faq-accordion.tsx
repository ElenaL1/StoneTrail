"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import type { FaqItem } from "@/lib/faq-data"
import { cn } from "@/lib/utils"

export function FaqAccordions({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <div className="divide-y divide-border rounded-2xl border border-border bg-card">
      {items.map((item, idx) => {
        const active = open === idx
        return (
          <div key={idx}>
            <button
              type="button"
              onClick={() => setOpen(active ? null : idx)}
              aria-expanded={active}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:text-primary"
            >
              <span className={active ? "text-base font-semibold text-foreground" : "text-base font-medium text-foreground"}>
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                  active && "rotate-180 text-primary",
                )}
              />
            </button>
            {active && (
              <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
