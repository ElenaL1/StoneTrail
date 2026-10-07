import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import { MarkdownContent } from "@/lib/markdown"

const comparison = `
### Итоговая таблица сравнения

| Свойство | Гранит | Кварцит |
|---|---|---|
| Твердость | Очень высокая | Очень высокая |
| Пористость | Низкая | Очень низкая |
| Цена | Средняя/Высокая | Высокая |
| Эстетика | Зернистая | Жильная |
`

describe("MarkdownContent", () => {
  test("рендерит markdown-таблицу без служебных символов", () => {
    render(<MarkdownContent value={comparison} />)

    expect(screen.getByRole("heading", { name: "Итоговая таблица сравнения" })).toBeInTheDocument()
    const table = screen.getByRole("table")
    expect(table).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Свойство" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Кварцит" })).toBeInTheDocument()
    expect(screen.getByRole("cell", { name: "Зернистая" })).toBeInTheDocument()
    expect(screen.getByRole("cell", { name: "Средняя/Высокая" })).toBeInTheDocument()
    expect(table).not.toHaveTextContent("|")
    expect(table).not.toHaveTextContent("---")
  })

  test("оставляет строку с вертикальной чертой абзацем, если нет разделителя", () => {
    render(<MarkdownContent value="| не таблица |" />)

    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.getByText("| не таблица |")).toBeInTheDocument()
  })

  test("сохраняет разметку внутри ячеек и соседние блоки", () => {
    render(
      <MarkdownContent
        value={"## Заголовок\n\n- пункт\n\n| A | B |\n| :--- | ---: |\n| **да** | нет |"}
      />,
    )

    expect(screen.getByRole("heading", { name: "Заголовок" })).toBeInTheDocument()
    expect(screen.getByRole("listitem")).toHaveTextContent("пункт")
    expect(screen.getByText("да").tagName).toBe("STRONG")
    expect(screen.getByRole("cell", { name: "нет" })).toHaveClass("text-right")
    expect(screen.getByRole("columnheader", { name: "A" })).toHaveClass("text-left")
  })
})
