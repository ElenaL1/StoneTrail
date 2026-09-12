import { describe, expect, test } from "vitest"
import { formatPhone } from "@/lib/utils"

describe("formatPhone", () => {
  test("нормализует российский номер, начинающийся с 8", () => {
    expect(formatPhone("89001234567")).toBe("+7 (900) 123-45-67")
  })

  test("форматирует номер, начинающийся с 7", () => {
    expect(formatPhone("79001234567")).toBe("+7 (900) 123-45-67")
  })

  test("возвращает пустую строку для пустого значения", () => {
    expect(formatPhone("")).toBe("")
  })
})
