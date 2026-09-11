"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { loginPath } from "@/lib/auth/paths"

type RequireAuthProps = {
  children: React.ReactNode
  requireVerified?: boolean
}

export function RequireAuth({ children, requireVerified = false }: RequireAuthProps) {
  const { isReady, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isReady) return
    if (!user) {
      router.replace(loginPath(pathname))
      return
    }
    if (requireVerified && !user.emailVerified) {
      router.replace("/verify-email")
    }
  }, [isReady, pathname, requireVerified, router, user])

  if (!isReady || !user || (requireVerified && !user.emailVerified)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-24" aria-busy="true">
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      </div>
    )
  }

  return children
}
