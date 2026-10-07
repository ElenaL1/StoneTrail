import { beforeEach, describe, expect, test } from "vitest"
import {
  addInquiryLine,
  blockInquiryLine,
  productInquiryLine,
  readInquiryDraft,
  readPendingInquiry,
  resetInquiryDraft,
  takePendingInquiry,
  writeInquiryDraft,
  writePendingInquiry,
} from "@/lib/inquiry-draft"

const tile = productInquiryLine(
  { slug: "tile-carrara", name: "Плита Carrara Bianco" },
  {
    label: "300×300 мм · 20 мм · Полированная",
    size: "300 × 300 мм",
    thickness: "20 мм",
    finish: "Полированная",
    status: "В наличии",
    price: "4 233 ₽/м²",
  },
)

const other = productInquiryLine(
  { slug: "tile-carrara", name: "Плита Carrara Bianco" },
  {
    label: "600×600 мм · 30 мм · Матовая",
    size: "600 × 600 мм",
    thickness: "30 мм",
    finish: "Матовая",
    status: "Под заказ",
  },
)

describe("inquiry draft", () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  test("фиксирует характеристики позиции в строке", () => {
    expect(tile).toEqual({
      id: "product:tile-carrara:300×300 мм · 20 мм · Полированная",
      title: "Плита Carrara Bianco",
      summary: "300 × 300 мм · 20 мм · Полированная · В наличии · 4 233 ₽/м²",
    })
  })

  test("дописывает новую позицию и не дублирует ту же", () => {
    addInquiryLine("user-1", tile)
    const again = addInquiryLine("user-1", { ...tile, summary: "другая цена" })
    expect(again.lines).toEqual([tile])

    const both = addInquiryLine("user-1", other)
    expect(both.lines.map((line) => line.id)).toEqual([tile.id, other.id])
  })

  test("хранит черновики разных пользователей отдельно", () => {
    addInquiryLine("user-1", tile)
    addInquiryLine("user-2", other)
    expect(readInquiryDraft("user-1").lines).toEqual([tile])
    expect(readInquiryDraft("user-2").lines).toEqual([other])
  })

  test("сброс очищает позиции, имя и текст", () => {
    addInquiryLine("user-1", tile)
    writeInquiryDraft("user-1", { name: "Студия", message: "Нужен раскрой", lines: [tile] })
    expect(resetInquiryDraft("user-1")).toEqual({ name: null, message: "", lines: [] })
    expect(readInquiryDraft("user-1").lines).toEqual([])
  })

  test("отложенная позиция живёт до входа и забирается один раз", () => {
    const block = blockInquiryLine(
      { slug: "nero", stoneName: "Nero Assoluto" },
      { label: "Блок 01", dimensions: "250×130×110 см", weight: "12 т", status: "В наличии" },
    )
    writePendingInquiry(block)
    expect(readPendingInquiry()).toEqual(block)
    expect(takePendingInquiry()).toEqual(block)
    expect(readPendingInquiry()).toBeNull()
  })
})
