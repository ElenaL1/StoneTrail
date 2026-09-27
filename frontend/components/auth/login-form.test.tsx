import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { AUTH_MESSAGES } from "@/lib/auth/constants"
import type { AuthResult, PublicUser } from "@/lib/auth/types"

const login = vi.fn()
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
  useAuth: () => ({ login }),
}))

import { LoginForm } from "@/components/auth/login-form"

function verifiedUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: "user-1",
    email: "ivan@company.ru",
    nickname: "StoneMaster",
    name: "StoneMaster",
    firstName: "Иван",
    lastName: "Петров",
    company: "",
    position: "",
    activityType: "",
    avatar: "",
    country: "",
    city: "",
    bio: "",
    website: "",
    phone: "",
    emailVerified: true,
    canPublishArticles: false,
    role: "user",
    marketingConsent: false,
    yandexLinked: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: null,
    ...overrides,
  }
}

async function submitLogin(email = "ivan@company.ru", password = "StoneTrail1") {
  const user = userEvent.setup()
  await user.type(screen.getByRole("textbox", { name: /email/i }), email)
  await user.type(screen.getByPlaceholderText("Введите пароль"), password)
  await user.click(screen.getByRole("button", { name: "Войти" }))
}

describe("LoginForm", () => {
  beforeEach(() => {
    login.mockReset()
    push.mockReset()
  })

  test("после успешного входа вызывает onSuccess", async () => {
    const onSuccess = vi.fn()
    login.mockResolvedValue({ ok: true, data: verifiedUser() } satisfies AuthResult)
    render(<LoginForm onSuccess={onSuccess} />)

    await submitLogin()

    expect(onSuccess).toHaveBeenCalledOnce()
    expect(push).not.toHaveBeenCalled()
  })

  test("после успешного входа без onSuccess переходит на безопасный next", async () => {
    login.mockResolvedValue({ ok: true, data: verifiedUser() } satisfies AuthResult)
    render(<LoginForm next="/catalog" />)

    await submitLogin()

    expect(push).toHaveBeenCalledWith("/catalog")
  })

  test("показывает ошибки, если email и пароль пустые", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)

    await user.click(screen.getByRole("button", { name: "Войти" }))

    expect(screen.getByText(AUTH_MESSAGES.emailRequired)).toBeInTheDocument()
    expect(screen.getByText(AUTH_MESSAGES.passwordRequired)).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  test("показывает ошибку сети из ответа login", async () => {
    login.mockResolvedValue({
      ok: false,
      code: "network",
      message: AUTH_MESSAGES.network,
    } satisfies AuthResult)
    render(<LoginForm />)

    await submitLogin()

    expect(screen.getByRole("alert")).toHaveTextContent(AUTH_MESSAGES.network)
  })

  test("направляет неподтверждённый аккаунт на /verify-email", async () => {
    login.mockResolvedValue({
      ok: true,
      data: verifiedUser({ emailVerified: false }),
    } satisfies AuthResult)
    render(<LoginForm onSuccess={vi.fn()} />)

    await submitLogin()

    expect(push).toHaveBeenCalledWith("/verify-email")
  })

  test("показывает вход через Яндекс и почту уже существующего аккаунта", () => {
    render(<LoginForm yandexCode="link_required" yandexEmail="anna@yandex.ru" />)

    expect(screen.getByRole("link", { name: "Войти через Яндекс" })).toHaveAttribute("href", "/auth/yandex")
    expect(screen.getByRole("button", { name: "Войти и подключить Яндекс" })).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent(
      AUTH_MESSAGES.yandexLinkRequired("anna@yandex.ru"),
    )
    expect(screen.getByRole("textbox", { name: /email/i })).toHaveValue("anna@yandex.ru")
  })

  test("без адреса Яндекса не подставляет почту в форму", () => {
    render(<LoginForm yandexCode="link_required" yandexEmail="<script>" />)

    expect(screen.getByRole("alert")).toHaveTextContent(AUTH_MESSAGES.yandexLinkRequiredUnknown)
    expect(screen.getByRole("alert")).not.toHaveTextContent("<script>")
    expect(screen.getByRole("textbox", { name: /email/i })).toHaveValue("")
  })

  test("после пароля на экране существующего аккаунта открывает привязку Яндекса", async () => {
    const onSuccess = vi.fn()
    const assign = vi.fn()
    const user = userEvent.setup()
    vi.stubGlobal("location", { ...window.location, assign })
    login.mockResolvedValue({ ok: true, data: verifiedUser() } satisfies AuthResult)
    render(<LoginForm yandexCode="link_required" next="/catalog" onSuccess={onSuccess} />)

    await user.type(screen.getByRole("textbox", { name: /email/i }), "ivan@company.ru")
    await user.type(screen.getByPlaceholderText("Введите пароль"), "StoneTrail1")
    await user.click(screen.getByRole("button", { name: "Войти и подключить Яндекс" }))

    expect(assign).toHaveBeenCalledWith("/auth/yandex?intent=link&next=%2Fprofile")
    expect(onSuccess).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })
})
