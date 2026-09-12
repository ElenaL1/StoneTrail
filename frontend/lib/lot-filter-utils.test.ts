import { describe, expect, test } from "vitest"
import { createLotFilterKit } from "@/lib/lot-filter-utils"

type Row = {
  size: string
  thickness: string
  finish: string
  status: string
}

const keys = ["size", "thickness", "finish", "status"] as const
const empty = { size: "all", thickness: "all", finish: "all", status: "all" }

const kit = createLotFilterKit<Row, (typeof keys)[number]>({
  keys,
  empty,
  finishOrder: ["Полированная", "Матовая"],
})

const rows: Row[] = [
  { size: "300 × 300", thickness: "20 мм", finish: "Матовая", status: "Под заказ" },
  { size: "600 × 300", thickness: "30 мм", finish: "Полированная", status: "В наличии" },
  { size: "600 × 300", thickness: "20 мм", finish: "Полированная", status: "В наличии" },
]

describe("createLotFilterKit", () => {
  test("фильтрует по выбранным полям", () => {
    const result = kit.filterItems(rows, { ...empty, thickness: "20 мм" })
    expect(result).toHaveLength(2)
    expect(result.every((row) => row.thickness === "20 мм")).toBe(true)
  })

  test("сортирует толщину численно, статус и поверхность — по заданному порядку", () => {
    expect(kit.uniqueFieldValues(rows, "thickness")).toEqual(["20 мм", "30 мм"])
    expect(kit.uniqueFieldValues(rows, "status")).toEqual(["В наличии", "Под заказ"])
    expect(kit.uniqueFieldValues(rows, "finish")).toEqual(["Полированная", "Матовая"])
  })

  test("сбрасывает фильтр, если значение больше не встречается", () => {
    const pruned = kit.pruneFilters(rows, {
      size: "300 × 300",
      thickness: "30 мм",
      finish: "all",
      status: "all",
    })
    expect(pruned.size).toBe("all")
    expect(pruned.thickness).toBe("30 мм")
  })

  test("hasActiveFilters отличает пустое состояние", () => {
    expect(kit.hasActiveFilters(empty)).toBe(false)
    expect(kit.hasActiveFilters({ ...empty, size: "600 × 300" })).toBe(true)
  })
})
