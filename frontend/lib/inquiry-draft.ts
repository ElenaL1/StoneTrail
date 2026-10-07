import { displayMeasure } from "@/lib/block-utils"

export type InquiryLine = {
  id: string
  title: string
  summary: string
}

export type InquiryDraft = {
  name: string | null
  message: string
  lines: InquiryLine[]
}

const DRAFT_PREFIX = "stonetrail-inquiry-draft:"
const PENDING_KEY = "stonetrail-inquiry-pending"

export const EMPTY_INQUIRY_DRAFT: InquiryDraft = {
  name: null,
  message: "",
  lines: [],
}

function draftKey(userId: string): string {
  return `${DRAFT_PREFIX}${userId}`
}

function readJson(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function writeJson(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or a full quota leaves the in-memory form as the source of truth.
  }
}

function isLine(value: unknown): value is InquiryLine {
  if (!value || typeof value !== "object") return false
  const line = value as InquiryLine
  return (
    typeof line.id === "string" &&
    line.id.trim().length > 0 &&
    typeof line.title === "string" &&
    typeof line.summary === "string"
  )
}

function parseDraft(value: unknown): InquiryDraft {
  if (!value || typeof value !== "object") return EMPTY_INQUIRY_DRAFT
  const draft = value as Partial<InquiryDraft>
  const name = typeof draft.name === "string" ? draft.name : null
  const message = typeof draft.message === "string" ? draft.message : ""
  const lines = Array.isArray(draft.lines) ? draft.lines.filter(isLine) : []
  return { name, message, lines }
}

function summary(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0)
    .join(" · ")
}

export function productInquiryLine(
  product: { slug: string; name: string },
  item: {
    label: string
    size?: string
    thickness?: string
    finish?: string
    status?: string
    price?: string
  },
): InquiryLine {
  return {
    id: `product:${product.slug}:${item.label}`,
    title: product.name.trim(),
    summary: summary([item.size, item.thickness, item.finish, item.status, item.price]),
  }
}

export function blockInquiryLine(
  block: { slug: string; stoneName: string },
  item: {
    label: string
    dimensions?: string
    weight?: string
    status?: string
    price?: string
  },
): InquiryLine {
  return {
    id: `block:${block.slug}:${item.label}`,
    title: block.stoneName.trim(),
    summary: summary([
      item.label,
      displayMeasure(item.dimensions),
      displayMeasure(item.weight),
      item.status,
      item.price,
    ]),
  }
}

export function readInquiryDraft(userId: string): InquiryDraft {
  if (typeof window === "undefined") return EMPTY_INQUIRY_DRAFT
  return parseDraft(readJson(window.localStorage, draftKey(userId)))
}

export function writeInquiryDraft(userId: string, draft: InquiryDraft): void {
  if (typeof window === "undefined") return
  writeJson(window.localStorage, draftKey(userId), draft)
}

export function addInquiryLine(userId: string, line: InquiryLine): InquiryDraft {
  const current = readInquiryDraft(userId)
  if (current.lines.some((item) => item.id === line.id)) return current
  const next = { ...current, lines: [...current.lines, line] }
  writeInquiryDraft(userId, next)
  return next
}

export function removeInquiryLine(userId: string, lineId: string): InquiryDraft {
  const current = readInquiryDraft(userId)
  const next = { ...current, lines: current.lines.filter((item) => item.id !== lineId) }
  writeInquiryDraft(userId, next)
  return next
}

export function resetInquiryDraft(userId: string): InquiryDraft {
  writeInquiryDraft(userId, EMPTY_INQUIRY_DRAFT)
  return EMPTY_INQUIRY_DRAFT
}

export function readPendingInquiry(): InquiryLine | null {
  if (typeof window === "undefined") return null
  const value = readJson(window.sessionStorage, PENDING_KEY)
  return isLine(value) ? value : null
}

export function writePendingInquiry(line: InquiryLine): void {
  if (typeof window === "undefined") return
  writeJson(window.sessionStorage, PENDING_KEY, line)
}

export function clearPendingInquiry(): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // Ignore storage failures; the next login simply has nothing to attach.
  }
}

export function takePendingInquiry(): InquiryLine | null {
  const pending = readPendingInquiry()
  if (pending) clearPendingInquiry()
  return pending
}
