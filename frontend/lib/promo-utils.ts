import { mockPromotions, type Promotion } from "@/lib/mock-data";

const MONTHS: Record<string, number> = {
  января: 0,
  январь: 0,
  февраля: 1,
  февраль: 1,
  марта: 2,
  март: 2,
  апреля: 3,
  апрель: 3,
  мая: 4,
  май: 4,
  июня: 5,
  июнь: 5,
  июля: 6,
  июль: 6,
  августа: 7,
  август: 7,
  сентября: 8,
  сентябрь: 8,
  октября: 9,
  октябрь: 9,
  ноября: 10,
  ноябрь: 10,
  декабря: 11,
  декабрь: 11,
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseExpiryEnd(expiryDate: string): Date | null {
  const parts = expiryDate
    .replace(/года/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 3) {
    const day = Number.parseInt(parts[0], 10)
    const month = MONTHS[parts[1].toLowerCase()]
    const year = Number.parseInt(parts[2], 10)
    if (Number.isNaN(day) || month === undefined || Number.isNaN(year)) return null
    return new Date(year, month, day, 23, 59, 59, 999)
  }

  if (parts.length === 2) {
    const month = MONTHS[parts[0].toLowerCase()]
    const year = Number.parseInt(parts[1], 10)
    if (month === undefined || Number.isNaN(year)) return null
    return new Date(year, month + 1, 0, 23, 59, 59, 999)
  }

  return null
}

export function isPromotionActive(promotion: Promotion, now = new Date()): boolean {
  const expiryEnd = parseExpiryEnd(promotion.expiryDate)
  if (!expiryEnd) return false
  return expiryEnd.getTime() >= startOfDay(now).getTime()
}

/**
 * Checks if there are any enabled promotions in the system.
 * This is used to determine the starting color of the "zebra" 
 * background pattern across the application.
 */
export function arePromotionsEnabled(): boolean {
  return mockPromotions.some((p) => p.isEnabled);
}
