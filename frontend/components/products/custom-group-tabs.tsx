"use client"

import { useRef, type KeyboardEvent } from "react"
import { CUSTOM_GROUP_ALL, getVisibleCustomGroups } from "@/lib/custom-catalog"
import { cn } from "@/lib/utils"

const ALL_TAB = { id: CUSTOM_GROUP_ALL, label: "Все" }

export function CustomGroupTabs({
  value,
  onChange,
}: {
  value: string
  onChange: (groupId: string) => void
}) {
  const groups = [ALL_TAB, ...getVisibleCustomGroups()]
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  function focusTab(index: number) {
    const next = (index + groups.length) % groups.length
    tabRefs.current[next]?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault()
      focusTab(index + 1)
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault()
      focusTab(index - 1)
    } else if (event.key === "Home") {
      event.preventDefault()
      focusTab(0)
    } else if (event.key === "End") {
      event.preventDefault()
      focusTab(groups.length - 1)
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onChange(groups[index].id)
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Категории изделий"
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0"
    >
      {groups.map((group, index) => {
        const selected = value === group.id
        return (
          <button
            key={group.id}
            ref={(node) => {
              tabRefs.current[index] = node
            }}
            type="button"
            role="tab"
            id={`custom-group-${group.id}`}
            aria-selected={selected}
            aria-controls="product-catalog-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(group.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              selected
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {group.label}
          </button>
        )
      })}
    </div>
  )
}
