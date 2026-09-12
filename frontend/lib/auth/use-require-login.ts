"use client"

import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useAuthModal } from "@/lib/auth-modal-context"

export function useRequireLogin() {
  const { user } = useAuth()
  const { openLogin } = useAuthModal()
  const router = useRouter()
  const pathname = usePathname()

  return (options?: { requireVerified?: boolean }) => {
    if (!user) {
      openLogin({ next: pathname })
      return false
    }
    if (options?.requireVerified && !user.emailVerified) {
      router.push("/verify-email")
      return false
    }
    return true
  }
}
