/**
 * Parses the first number in a thickness string like "20 мм" or "2,5 см".
 */
export function parseThickness(value: string): number | null {
  const match = value.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return null
  const n = Number(match[1].replace(",", "."))
  return Number.isNaN(n) ? null : n
}

/**
 * Sort key for formats like "300 × 600": larger area comes later.
 */
export function parseSizeSortKey(value: string): number {
  const match = value.match(/(\d[\d\s]*)\s*×\s*(\d[\d\s]*)/)
  if (!match) return 0
  const width = Number(match[1].replace(/\s/g, ""))
  const height = Number(match[2].replace(/\s/g, ""))
  if (Number.isNaN(width) || Number.isNaN(height)) return 0
  return width * height
}

/**
 * Russian plural: 1 слэб, 2 слэба, 5 слэбов (including 11–14 / 21).
 */
export function pluralRu(count: number, forms: [string, string, string]): string {
  const abs = Math.abs(count) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (last > 1 && last < 5) return forms[1]
  if (last === 1) return forms[0]
  return forms[2]
}

export function thicknessRange(items: { thickness: string }[]): string {
  const parsed = items
    .map((item) => ({ item, value: parseThickness(item.thickness) }))
    .filter((entry): entry is { item: { thickness: string }; value: number } => entry.value !== null)

  if (parsed.length === 0) return items[0]?.thickness ?? ""
  const values = parsed.map((entry) => entry.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return parsed[0].item.thickness
  return `${min}–${max} мм`
}

export function sizeSummary(items: { size: string }[]): string {
  const unique = Array.from(new Set(items.map((item) => item.size).filter(Boolean)))
  unique.sort((a, b) => parseSizeSortKey(a) - parseSizeSortKey(b) || a.localeCompare(b, "ru"))
  return unique.join(" / ")
}

export function finishSummary(items: { finish: string }[], order?: readonly string[]): string {
  const unique = Array.from(new Set(items.map((item) => item.finish).filter(Boolean)))
  if (!order) return unique.join(" / ")
  const ordered = order.filter((value) => unique.includes(value))
  const rest = unique.filter((value) => !order.includes(value))
  return [...ordered, ...rest].join(" / ")
}

export function getLotItemContactsHref(
  product: { slug: string },
  item: { label: string },
): string {
  return `/contacts?product=${encodeURIComponent(product.slug)}&ref=${encodeURIComponent(item.label)}`
}
