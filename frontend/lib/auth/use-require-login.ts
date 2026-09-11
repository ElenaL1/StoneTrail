"use client"

import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { loginPath } from "@/lib/auth/paths"

export function useRequireLogin() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  return (options?: { requireVerified?: boolean }) => {
    if (!user) {
      router.push(loginPath(pathname))
      return false
    }
    if (options?.requireVerified && !user.emailVerified) {
      router.push("/verify-email")
      return false
    }
    return true
  }
}
