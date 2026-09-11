"use client"

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { ChevronDown } from "lucide-react"
import {
  SEARCHABLE_FILTER_MIN_OPTIONS,
  matchFilterOptions,
  type FilterOptionGroup,
} from "@/lib/custom-catalog"
import { cn } from "@/lib/utils"

type FilterOption = {
  value: string
  label: string
}

type ListRow =
  | { kind: "group"; label: string }
  | { kind: "option"; option: FilterOption; index: number }

export function FilterCombobox({
  label,
  value,
  onValueChange,
  allLabel,
  options,
  groups,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  allLabel: string
  options: string[]
  groups?: FilterOptionGroup[]
}) {
  const searchable = options.length >= SEARCHABLE_FILTER_MIN_OPTIONS
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const searchQuery = searchable ? query : ""

  const filteredGroups = useMemo(() => {
    if (!groups || groups.length <= 1 || searchQuery) return null
    return groups
  }, [groups, searchQuery])

  const visibleOptions = useMemo<FilterOption[]>(() => {
    const matched = filteredGroups
      ? filteredGroups.flatMap((group) => group.options)
      : matchFilterOptions(options, searchQuery)
    const items: FilterOption[] = matchFilterOptions([allLabel], searchQuery).length
      ? [{ value: "all", label: allLabel }]
      : []
    for (const option of matched) items.push({ value: option, label: option })
    return items
  }, [allLabel, filteredGroups, options, searchQuery])

  const rows = useMemo<ListRow[]>(() => {
    if (!filteredGroups) {
      return visibleOptions.map((option, index) => ({ kind: "option", option, index }))
    }

    const result: ListRow[] = []
    let index = 0
    if (visibleOptions[0]?.value === "all") {
      result.push({ kind: "option", option: visibleOptions[0], index: index++ })
    }
    for (const group of filteredGroups) {
      result.push({ kind: "group", label: group.label })
      for (const option of group.options) {
        result.push({ kind: "option", option: { value: option, label: option }, index: index++ })
      }
    }
    return result
  }, [filteredGroups, visibleOptions])

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        setQuery("")
        inputRef.current?.blur()
      }
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
    setHighlight(0)
  }, [searchQuery, open])

  useEffect(() => {
    if (!open) return
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${highlight}"]`)
    node?.scrollIntoView({ block: "nearest" })
  }, [highlight, open, rows])

  function close() {
    setOpen(false)
    setQuery("")
  }

  function selectOption(next: string) {
    onValueChange(next)
    close()
  }

  function moveHighlight(delta: number) {
    if (visibleOptions.length === 0) return
    setHighlight((current) => (current + delta + visibleOptions.length) % visibleOptions.length)
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement | HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (!open) setOpen(true)
      else moveHighlight(1)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      if (!open) setOpen(true)
      else moveHighlight(-1)
    } else if (event.key === "Home") {
      if (!open) return
      event.preventDefault()
      setHighlight(0)
    } else if (event.key === "End") {
      if (!open) return
      event.preventDefault()
      setHighlight(Math.max(0, visibleOptions.length - 1))
    } else if (event.key === "Enter") {
      event.preventDefault()
      if (open && visibleOptions[highlight]) selectOption(visibleOptions[highlight].value)
      else setOpen(true)
    }
  }

  const selectedLabel = value === "all" ? allLabel : value
  const inputValue = open ? query : value === "all" ? "" : value
  const activeId = open && visibleOptions[highlight] ? `${listboxId}-${highlight}` : undefined

  return (
    <div className="space-y-2">
      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div ref={rootRef} className={cn("relative w-full", open && "z-50")}>
        {searchable ? (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={activeId}
              aria-label={label}
              autoComplete="off"
              spellCheck={false}
              placeholder={open && value !== "all" ? selectedLabel : allLabel}
              value={inputValue}
              onChange={(event) => {
                setQuery(event.target.value)
                setOpen(true)
              }}
              onMouseDown={() => setOpen(true)}
              onFocus={() => setOpen(true)}
              onKeyDown={onKeyDown}
              className={cn(
                "flex h-10 w-full rounded-md border border-border bg-background py-2 pl-3 pr-9 text-sm",
                "ring-offset-background placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !open && value === "all" ? "text-muted-foreground" : "text-foreground",
              )}
            />
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        ) : (
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-label={label}
            onClick={() => setOpen((current) => !current)}
            onKeyDown={onKeyDown}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm",
              "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring",
            )}
          >
            <span className={cn("truncate", value === "all" ? "text-muted-foreground" : "text-foreground")}>
              {selectedLabel}
            </span>
          </button>
        )}

        {open && (
          <div
            id={listboxId}
            ref={listRef}
            role="listbox"
            aria-label={label}
            className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-card p-1 shadow-md"
          >
            {visibleOptions.length === 0 ? (
              <p className="px-2 py-2 text-sm text-muted-foreground">Ничего не найдено</p>
            ) : (
              rows.map((row) => {
                if (row.kind === "group") {
                  return (
                    <p
                      key={`group-${row.label}`}
                      className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {row.label}
                    </p>
                  )
                }

                const active = row.index === highlight
                return (
                  <div
                    key={row.option.value}
                    id={`${listboxId}-${row.index}`}
                    role="option"
                    aria-selected={row.option.value === value}
                    data-index={row.index}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setHighlight(row.index)}
                    onClick={() => selectOption(row.option.value)}
                    className={cn(
                      "relative cursor-pointer rounded-sm px-2 py-1.5 text-sm",
                      active && "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {row.option.label}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
