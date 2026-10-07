"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useAuthModal } from "@/lib/auth-modal-context"
import { addInquiryLine, writePendingInquiry, type InquiryLine } from "@/lib/inquiry-draft"

export function useRequestInquiry() {
  const { user } = useAuth()
  const { openLogin } = useAuthModal()
  const router = useRouter()

  return useCallback(
    (line: InquiryLine) => {
      if (!user) {
        writePendingInquiry(line)
        openLogin({ next: "/contacts" })
        return
      }
      addInquiryLine(user.id, line)
      router.push("/contacts")
    },
    [openLogin, router, user],
  )
}
