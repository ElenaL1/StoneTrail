"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { addInquiryLine, takePendingInquiry } from "@/lib/inquiry-draft"

export function InquiryDraftSync() {
  const { user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!user?.emailVerified) return
    const pending = takePendingInquiry()
    if (!pending) return
    addInquiryLine(user.id, pending)
    if (pathname !== "/contacts") router.push("/contacts")
  }, [pathname, router, user])

  return null
}
