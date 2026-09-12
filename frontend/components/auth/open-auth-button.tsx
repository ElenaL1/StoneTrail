"use client"

import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import { useAuthModal } from "@/lib/auth-modal-context"

type OpenAuthButtonProps = ComponentProps<typeof Button> & {
  view: "login" | "register"
  next?: string | null
}

export function OpenAuthButton({ view, next, onClick, ...props }: OpenAuthButtonProps) {
  const { openLogin, openRegister } = useAuthModal()

  return (
    <Button
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (view === "login") openLogin({ next })
        else openRegister({ next })
      }}
    />
  )
}
