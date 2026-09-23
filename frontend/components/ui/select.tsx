"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectContextType {
  value: string
  onValueChange: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  labels: Record<string, string>
  registerLabel: (value: string, label: string) => void
  unregisterLabel: (value: string) => void
}

const SelectContext = React.createContext<SelectContextType | null>(null)

function useSelectContext() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("Select components must be wrapped in a <Select>")
  }
  return context
}

function labelFromChildren(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children)
  }
  if (Array.isArray(children)) {
    return children.map(labelFromChildren).join("")
  }
  if (React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return labelFromChildren(children.props.children)
  }
  return ""
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [labels, setLabels] = React.useState<Record<string, string>>({})
  const rootRef = React.useRef<HTMLDivElement>(null)

  const registerLabel = React.useCallback((itemValue: string, label: string) => {
    setLabels((prev) => (prev[itemValue] === label ? prev : { ...prev, [itemValue]: label }))
  }, [])

  const unregisterLabel = React.useCallback((itemValue: string) => {
    setLabels((prev) => {
      if (!(itemValue in prev)) return prev
      const next = { ...prev }
      delete next[itemValue]
      return next
    })
  }, [])

  React.useEffect(() => {
    if (!isOpen) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("mousedown", onDocMouseDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [isOpen])

  return (
    <SelectContext.Provider
      value={{ value, onValueChange, isOpen, setIsOpen, labels, registerLabel, unregisterLabel }}
    >
      <div ref={rootRef} className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ children, className }: { children: React.ReactNode, className?: string }) {
  const { setIsOpen, isOpen } = useSelectContext()
  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring",
        className
      )}
    >
      {children}
    </button>
  )
}

export function SelectValue({ placeholder }: { placeholder: string }) {
  const { value, labels } = useSelectContext()
  const displayValue = value ? labels[value] : undefined
  return (
    <span className={cn("truncate", displayValue ? "text-foreground" : "text-muted-foreground")}>
      {displayValue || placeholder}
    </span>
  )
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSelectContext()
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 w-full rounded-md border border-border bg-card p-1 shadow-md",
        !isOpen && "hidden",
      )}
      role="listbox"
      hidden={!isOpen}
    >
      {children}
    </div>
  )
}

export function SelectItem({ value, children }: { value: string, children: React.ReactNode }) {
  const { onValueChange, setIsOpen, registerLabel, unregisterLabel } = useSelectContext()
  const label = labelFromChildren(children)

  React.useLayoutEffect(() => {
    registerLabel(value, label)
    return () => unregisterLabel(value)
  }, [value, label, registerLabel, unregisterLabel])

  return (
    <div
      role="option"
      onClick={() => {
        onValueChange(value)
        setIsOpen(false)
      }}
      className="relative cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-secondary hover:text-secondary-foreground"
    >
      {children}
    </div>
  )
}
