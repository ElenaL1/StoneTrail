import { render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import ErrorPage from "@/app/error"

describe("ErrorPage", () => {
  test("показывает понятное сообщение без stack и digest", () => {
    const reset = vi.fn()
    render(
      <ErrorPage
        error={Object.assign(new Error("SELECT password FROM users"), { digest: "secret-digest" })}
        reset={reset}
      />,
    )

    expect(screen.getByRole("heading", { name: "Не удалось загрузить страницу" })).toBeInTheDocument()
    expect(screen.queryByText(/SELECT/)).not.toBeInTheDocument()
    expect(screen.queryByText(/secret-digest/)).not.toBeInTheDocument()
    expect(screen.queryByText(/password/)).not.toBeInTheDocument()
  })
})
