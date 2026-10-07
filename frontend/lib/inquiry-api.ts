import { contentRequest } from "@/lib/content-request"
import type { InquiryLine } from "@/lib/inquiry-draft"

export type InquiryPayload = {
  name: string
  message: string
  lines: InquiryLine[]
}

export function sendInquiry(input: InquiryPayload): Promise<void> {
  return contentRequest<void>("/api/inquiries", {
    method: "POST",
    body: JSON.stringify(input),
  })
}
