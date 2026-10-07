import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, test, vi } from "vitest"
import { blankProducts, tileProducts } from "@/lib/mock-data"

const nav = vi.hoisted(() => ({
  pathname: "/catalog/products",
  search: "category=tiles",
  replace: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
  useRouter: () => ({ replace: nav.replace }),
}))

vi.mock("next/image", () => ({
  default: () => null,
}))

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

import { ProductCatalog } from "@/components/products/product-catalog"

const products = [...tileProducts, ...blankProducts]

function panelTitles() {
  return within(screen.getByRole("tabpanel"))
    .getAllByRole("heading", { level: 3 })
    .map((node) => node.textContent)
}

describe("ProductCatalog", () => {
  afterEach(() => {
    nav.pathname = "/catalog/products"
    nav.search = "category=tiles"
    nav.replace.mockReset()
    vi.restoreAllMocks()
  })

  test("клик по закладке не перемешивает карточки, пока адрес не сменился", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9)
    const user = userEvent.setup()
    render(<ProductCatalog products={products} />)
    const tiles = panelTitles()

    expect(tiles.length).toBeGreaterThan(1)

    await user.click(screen.getByRole("tab", { name: "Заготовки" }))

    expect(screen.getByRole("tab", { name: "Плита" })).toHaveAttribute("aria-selected", "true")
    expect(panelTitles()).toEqual(tiles)
    expect(nav.replace).toHaveBeenCalledWith("/catalog/products?category=blanks", { scroll: false })
  })

  test("новый раздел появляется сразу и при возврате сохраняет прежний порядок", () => {
    const view = render(<ProductCatalog products={products} />)
    const tiles = panelTitles()

    nav.search = "category=blanks"
    view.rerender(<ProductCatalog products={products} />)
    const blanks = panelTitles()

    expect(blanks.some((title) => title?.includes("Заготовка"))).toBe(true)
    expect(blanks).not.toEqual(tiles)

    nav.search = "category=tiles"
    view.rerender(<ProductCatalog products={products} />)

    expect(panelTitles()).toEqual(tiles)
  })

  test("поиск прошлого раздела не остаётся на новой закладке", async () => {
    const user = userEvent.setup()
    const view = render(<ProductCatalog products={products} />)

    await user.type(screen.getByLabelText("Поиск"), "нет-такого-камня")

    expect(within(screen.getByRole("tabpanel")).getByRole("heading", { level: 3 })).toHaveTextContent(
      "Ничего не найдено",
    )

    nav.search = "category=blanks"
    view.rerender(<ProductCatalog products={products} />)

    expect(screen.getByLabelText("Поиск")).toHaveValue("")
    expect(panelTitles().some((title) => title?.includes("Заготовка"))).toBe(true)
  })
})
