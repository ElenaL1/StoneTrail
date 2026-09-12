import type { BlockStatus, IndividualBlock } from "./mock-data"
import { stoneTypeGenitive } from "./stone-inventory"
import { pluralRu } from "./measure-utils"

// ── Русский plural ───────────────────────────────────────────────────────────
// 1 блок, 2/3/4 блока, 5 блоков, 11–14/21–24 блока, 15/25/31 блока…
export function getBlockBreadcrumbTitle(stoneName: string): string {
  const name = stoneName.trim()
  if (name.toLocaleLowerCase("ru").includes("блок")) return name
  return `Блок ${name}`
}

export function getBlockLotSectionTitle(stoneType: string, stoneName: string): string {
  return `Блоки ${stoneTypeGenitive(stoneType)} ${stoneName.trim()}`
}

export function pluralBlocks(n: number): string {
  return pluralRu(n, ["блок", "блока", "блоков"])
}

// 1 лот, 2/3/4 лота, 5 лотов, 11–14/21–24 лота, 15/25/31 лота…
export function pluralLots(n: number): string {
  return pluralRu(n, ["лот", "лота", "лотов"])
}

// ── Раскладка блоков по статусам ─────────────────────────────────────────────
export type StatusBreakdown = {
  inStock: number
  reserved: number
  onOrder: number
}

export function getStatusBreakdown(items: { status: BlockStatus }[]): StatusBreakdown {
  const s = { inStock: 0, reserved: 0, onOrder: 0 }
  for (const item of items) {
    if (item.status === "В наличии") s.inStock++
    else if (item.status === "Зарезервирован") s.reserved++
    else if (item.status === "Под заказ") s.onOrder++
  }
  return s
}

// ── Статус лота ──────────────────────────────────────────────────────────────
// Лотовый статус шире индивидуального: выделяем «Частично в наличии»,
// когда в партии есть и резерв, и свободные блоки.
export type LotStatus =
  | "В наличии"
  | "Частично в наличии"
  | "Зарезервирован"
  | "Под заказ"

export function getLotStatus(items: { status: BlockStatus }[]): LotStatus {
  if (items.length === 0) return "В наличии"
  const { inStock, reserved, onOrder } = getStatusBreakdown(items)
  const total = items.length

  if (onOrder === total) return "Под заказ"
  if (reserved === 0) return "В наличии"
  if (inStock === 0) return "Зарезервирован"
  return "Частично в наличии"
}

export function getBlockCount(blocks: IndividualBlock[]): number {
  return blocks.length
}

// ── Диапазон габаритов ───────────────────────────────────────────────────────
// Формат исходной строки: "2 800 × 1 450 × 1 250 мм"
// Диапазон: "2 400–2 800 × 1 200–1 450 × 1 100–1 250 мм"
// Если все три измерения одинаковые по блокам — одно значение.

type Measurement = { value: number, raw: string }
type ParsedDims = [Measurement, Measurement, Measurement, string]

function parseDimensions(s: string): ParsedDims | null {
  const tokens = s
    .replace(/[,\s]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
  if (tokens.length < 3) return null

  const first = tokens[0]
  const second = tokens[1]
  const third = tokens[2]

  if (/^[0-9]+$/.test(first) !== true) return null
  if (/^[0-9]+$/.test(second) !== true) return null
  if (/^[0-9]+$/.test(third) !== true) return null

  const unit = tokens[tokens.length - 1]
  return [
    { value: Number(first), raw: first },
    { value: Number(second), raw: second },
    { value: Number(third), raw: third },
    unit,
  ]
}

function formatAxisPair(axes: Measurement[]): string {
  const min = Math.min(...axes.map((a) => a.value))
  const max = Math.max(...axes.map((a) => a.value))
  if (min === max) return axes[0].raw
  return `${axes.find((a) => a.value === min)!.raw}–${axes.find((a) => a.value === max)!.raw}`
}

export function getDimensionsRange(blocks: IndividualBlock[]): string {
  const parsed = blocks
    .map((b) => parseDimensions(b.dimensions))
    .filter((p): p is ParsedDims => p !== null)

  if (parsed.length === 0) return blocks[0]?.dimensions ?? ""
  if (parsed.length === 1) return blocks[0].dimensions

  const [d, w, h, unit] = parsed[0]
  const dimRange = formatAxisPair(parsed.map((p) => p[0]))
  const widthRange = formatAxisPair(parsed.map((p) => p[1]))
  const heightRange = formatAxisPair(parsed.map((p) => p[2]))

  const single = parsed.every(
    (p) => p[0].value === d.value && p[1].value === w.value && p[2].value === h.value,
  )
  if (single) {
    return `${d.raw} × ${w.raw} × ${h.raw} ${unit}`
  }

  return `${dimRange} × ${widthRange} × ${heightRange} ${unit}`
}

// ── Диапазон веса ────────────────────────────────────────────────────────────
// Формат исходной строки: "~27,9 т"
// Диапазон: "~25,0–27,9 т"

function parseWeight(s: string): { value: number, unit: string } | null {
  const tokens = s.replace(/[,\s]+/g, " ").trim().split(" ").filter(Boolean)
  if (tokens.length < 1) return null
  const firstToken = tokens[0].replace(/^\D+/, "")
  const value = Number(firstToken.replace(",", "."))
  if (Number.isNaN(value)) return null
  const unit = tokens.length > 1 ? tokens[tokens.length - 1] : ""
  return { value, unit }
}

function formatWeightAxis(values: number[]): string {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const fmt = (v: number) => v.toFixed(1).replace(".", ",")
  if (min === max) return fmt(min)
  return `${fmt(min)}–${fmt(max)}`
}

export function getWeightRange(blocks: IndividualBlock[]): string {
  const parsed = blocks
    .map((b) => parseWeight(b.weight))
    .filter((p): p is { value: number; unit: string } => p !== null)

  if (parsed.length === 0) return blocks[0]?.weight ?? ""
  if (parsed.length === 1) return blocks[0].weight

  const values = parsed.map((p) => p.value)
  const unit = parsed[0].unit
  const hasTilde = blocks.some((b) => b.weight.startsWith("~"))
  return `${hasTilde ? "~" : ""}${formatWeightAxis(values)} ${unit}`.trim()
}
