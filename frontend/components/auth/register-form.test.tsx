import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { AUTH_MESSAGES } from "@/lib/auth/constants"

const register = vi.fn()
const push = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ register }),
}))

vi.mock("@/lib/auth/password", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/password")>("@/lib/auth/password")
  return {
    ...actual,
    generatePassword: () => "GeneratedPass12",
    offerStorePassword: vi.fn().mockResolvedValue(undefined),
  }
})

import { RegisterForm } from "@/components/auth/register-form"

describe("RegisterForm", () => {
  beforeEach(() => {
    register.mockReset()
    push.mockReset()
  })

  test("кнопка Сгенерировать заполняет редактируемое поле пароля", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    expect(screen.queryByText("Основные данные")).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^Имя/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Подтверждение пароля/)).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Сгенерировать" }))

    const password = screen.getByPlaceholderText("Введите пароль") as HTMLInputElement
    expect(password.value).toBe("GeneratedPass12")
    expect(password).not.toHaveAttribute("readonly")
    expect(password).toHaveAttribute("autocomplete", "new-password")
    expect(password).toHaveAttribute("type", "text")
  })

  test("не отправляет форму без согласия", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)

    await user.type(screen.getByLabelText(/Ник на сайте/), "StoneMaster")
    await user.type(screen.getByLabelText(/Email/), "ivan@company.ru")
    await user.type(screen.getByPlaceholderText("Введите пароль"), "StoneTrail1")
    await user.click(screen.getByRole("button", { name: "Создать аккаунт" }))

    expect(screen.getByText(AUTH_MESSAGES.termsRequired)).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })
})
