"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { fieldControlClassName } from "@/components/auth/form-field"
import { cn } from "@/lib/utils"

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  error?: string
  visible?: boolean
  onVisibleChange?: (visible: boolean) => void
}

export function PasswordInput({
  error,
  className,
  id,
  visible: visibleProp,
  onVisibleChange,
  ...props
}: PasswordInputProps) {
  const [uncontrolledVisible, setUncontrolledVisible] = useState(false)
  const isControlled = visibleProp !== undefined
  const visible = isControlled ? visibleProp : uncontrolledVisible
  const label = visible ? "Скрыть пароль" : "Показать пароль"

  const toggleVisible = () => {
    const next = !visible
    if (!isControlled) setUncontrolledVisible(next)
    onVisibleChange?.(next)
  }

  return (
    <div className="relative">
      <input
        {...props}
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={props.autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : props["aria-describedby"]}
        className={fieldControlClassName(error, cn("pr-11", className))}
      />
      <button
        type="button"
        onClick={toggleVisible}
        className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={label}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
