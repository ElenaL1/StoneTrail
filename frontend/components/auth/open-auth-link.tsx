"use client"

import { usePathname } from "next/navigation"
import { useAuthModal } from "@/lib/auth-modal-context"
import { cn } from "@/lib/utils"

type OpenAuthLinkProps = {
  view?: "login" | "register"
  next?: string | null
  className?: string
  children: React.ReactNode
}

export function OpenAuthLink({ view = "login", next, className, children }: OpenAuthLinkProps) {
  const pathname = usePathname()
  const { openLogin, openRegister } = useAuthModal()

  return (
    <button
      type="button"
      className={cn("font-medium text-primary underline-offset-4 hover:underline", className)}
      onClick={() => {
        const options = { next: next ?? pathname }
        if (view === "login") openLogin(options)
        else openRegister(options)
      }}
    >
      {children}
    </button>
  )
}
