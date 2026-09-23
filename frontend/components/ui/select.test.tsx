import { useState } from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, test } from "vitest"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function CategorySelect() {
  const [value, setValue] = useState("39871c3d-72c2-4951-81ad-e0b436567d68")
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger>
        <SelectValue placeholder="Выберите категорию" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="39871c3d-72c2-4951-81ad-e0b436567d68">Советы</SelectItem>
        <SelectItem value="other-id">Технологии</SelectItem>
      </SelectContent>
    </Select>
  )
}

describe("Select", () => {
  test("в триггере показывает название пункта, а не UUID", () => {
    render(<CategorySelect />)
    expect(screen.getByRole("button")).toHaveTextContent("Советы")
    expect(screen.getByRole("button")).not.toHaveTextContent("39871c3d")
  })
})
