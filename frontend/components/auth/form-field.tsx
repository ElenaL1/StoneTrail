import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type FormFieldProps = {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
  action?: ReactNode
  children: ReactNode
}

export function FormField({ id, label, hint, error, required, action, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium text-foreground">
          {label}
          {required ? (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {action}
      </div>
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-xs leading-relaxed text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs leading-relaxed text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function fieldControlClassName(error?: string, className?: string) {
  return cn(
    "flex h-11 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    error
      ? "border-destructive aria-invalid:border-destructive focus-visible:ring-destructive/30"
      : "border-border",
    className,
  )
}
