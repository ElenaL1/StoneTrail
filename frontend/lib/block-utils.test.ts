import { describe, expect, test } from "vitest"
import type { IndividualBlock } from "@/lib/types"
import {
  displayMeasure,
  getBlockCount,
  getDimensionsRange,
  getLotStatus,
  getStatusBreakdown,
  getWeightRange,
} from "@/lib/block-utils"

function item(overrides: Partial<IndividualBlock> = {}): IndividualBlock {
  return { label: "A", status: "В наличии", ...overrides }
}

describe("размеры и вес неполной партии", () => {
  test("пустой список и отсутствующие поля дают пустую строку", () => {
    expect(getDimensionsRange(undefined)).toBe("")
    expect(getDimensionsRange(null)).toBe("")
    expect(getDimensionsRange([])).toBe("")
    expect(getDimensionsRange([item(), item({ dimensions: "  " })])).toBe("")
    expect(getWeightRange(undefined)).toBe("")
    expect(getWeightRange([item({ weight: "" })])).toBe("")
  })

  test("диапазон считается только по заполненным блокам", () => {
    const blocks = [
      item(),
      item({ dimensions: "2 800 × 1 450 × 1 250 мм", weight: "" }),
      item({ dimensions: "2800 1450 1250 мм", weight: "25 т" }),
      item({ dimensions: "2400 1200 1100 мм", weight: "30 т" }),
    ]

    expect(getDimensionsRange(blocks)).toBe("2400–2800 × 1200–1450 × 1100–1250 мм")
    expect(getWeightRange(blocks)).toBe("25,0–30,0 т")
  })

  test("одна заполненная строка показывается как есть", () => {
    const blocks = [
      item(),
      item({ dimensions: "2 800 × 1 450 × 1 250 мм", weight: "~27,9 т" }),
    ]

    expect(getDimensionsRange(blocks)).toBe("2 800 × 1 450 × 1 250 мм")
    expect(getWeightRange(blocks)).toBe("~27,9 т")
  })

  test("количество и статус переживают отсутствующий список", () => {
    expect(getBlockCount(undefined)).toBe(0)
    expect(getBlockCount(null)).toBe(0)
    expect(getLotStatus(undefined)).toBe("В наличии")
    expect(getStatusBreakdown(null)).toEqual({ inStock: 0, reserved: 0, onOrder: 0 })
  })

  test("пустой замер показывается как уточнение", () => {
    expect(displayMeasure("")).toBe("Уточняется")
    expect(displayMeasure(undefined)).toBe("Уточняется")
    expect(displayMeasure("2 800 × 1 450 × 1 250 мм")).toBe("2 800 × 1 450 × 1 250 мм")
  })
})
