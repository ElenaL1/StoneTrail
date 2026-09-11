"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getSafeNext } from "@/lib/auth/paths"

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isReady, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isReady || !user) return
    if (!user.emailVerified) {
      router.replace("/verify-email")
      return
    }
    router.replace(getSafeNext(searchParams.get("next")))
  }, [isReady, router, searchParams, user])

  if (!isReady || user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-24" aria-busy="true">
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      </div>
    )
  }

  return children
}
