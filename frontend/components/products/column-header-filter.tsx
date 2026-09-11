"use client"

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function ColumnHeaderFilter({
  label,
  value,
  onValueChange,
  allLabel,
  options,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  allLabel: string
  options: string[]
}) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const items = useMemo(
    () => [{ value: "all", label: allLabel }, ...options.map((option) => ({ value: option, label: option }))],
    [allLabel, options],
  )
  const active = value !== "all"
  const shown = active ? value : label

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", onDocMouseDown)
    }, 0)
    document.addEventListener("keydown", onKey)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener("mousedown", onDocMouseDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  useEffect(() => {
    setHighlight(Math.max(0, items.findIndex((item) => item.value === value)))
  }, [open, value, items])

  function selectOption(next: string) {
    onValueChange(next)
    setOpen(false)
  }

  function moveHighlight(delta: number) {
    setHighlight((current) => (current + delta + items.length) % items.length)
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (!open) setOpen(true)
      else moveHighlight(1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      if (!open) setOpen(true)
      else moveHighlight(-1)
    } else if (event.key === "Enter") {
      event.preventDefault()
      if (open) selectOption(items[highlight]?.value ?? "all")
      else setOpen(true)
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", open && "z-50")}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={active ? `${label}: ${value}` : `${label}, фильтр`}
        onClick={(event) => {
          event.stopPropagation()
          setOpen((current) => !current)
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "inline-flex max-w-full items-center gap-1 rounded-sm text-left",
          "hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          active
            ? "normal-case tracking-normal text-foreground"
            : "uppercase tracking-widest text-muted-foreground",
        )}
      >
        <span className="truncate">{shown}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
        {active ? (
          <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        ) : null}
      </button>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={label}
          className="absolute top-full left-0 z-50 mt-2 min-w-[10.5rem] overflow-y-auto rounded-md border border-border bg-card p-1 font-medium shadow-md normal-case tracking-normal"
        >
          {items.map((item, index) => (
            <div
              key={item.value}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={item.value === value}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHighlight(index)}
              onClick={(event) => {
                event.stopPropagation()
                selectOption(item.value)
              }}
              className={cn(
                "cursor-pointer rounded-sm px-2 py-1.5 text-xs font-medium tracking-normal",
                index === highlight && "bg-secondary text-secondary-foreground",
              )}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
