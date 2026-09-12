"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"

export type AuthModalView = "login" | "register"

type OpenOptions = {
  next?: string | null
}

type AuthModalContextType = {
  view: AuthModalView | null
  next: string | null
  openLogin: (options?: OpenOptions) => void
  openRegister: (options?: OpenOptions) => void
  close: () => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [view, setView] = useState<AuthModalView | null>(null)
  const [next, setNext] = useState<string | null>(null)

  const close = useCallback(() => {
    setView(null)
  }, [])

  const openLogin = useCallback(
    (options?: OpenOptions) => {
      setNext(options?.next ?? pathname)
      setView("login")
    },
    [pathname],
  )

  const openRegister = useCallback(
    (options?: OpenOptions) => {
      setNext(options?.next ?? pathname)
      setView("register")
    },
    [pathname],
  )

  useEffect(() => {
    close()
  }, [close, pathname])

  const value = useMemo(
    () => ({
      view,
      next,
      openLogin,
      openRegister,
      close,
    }),
    [close, next, openLogin, openRegister, view],
  )

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (context === undefined) {
    throw new Error("useAuthModal must be used within an AuthModalProvider")
  }
  return context
}
