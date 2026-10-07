import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"
import type { PublicUser } from "@/lib/auth/types"
import { ContentRequestError } from "@/lib/content-request"
import { addInquiryLine, productInquiryLine, readInquiryDraft } from "@/lib/inquiry-draft"

const openLogin = vi.fn()
const sendInquiry = vi.fn()
const authState: { isReady: boolean; user: PublicUser | null } = {
  isReady: true,
  user: null,
}

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => authState,
}))

vi.mock("@/lib/auth-modal-context", () => ({
  useAuthModal: () => ({ openLogin }),
}))

vi.mock("@/lib/inquiry-api", () => ({
  sendInquiry: (...args: unknown[]) => sendInquiry(...args),
}))

import { InquiryForm } from "@/components/contacts/inquiry-form"

const tile = productInquiryLine(
  { slug: "tile-carrara", name: "Плита Carrara Bianco" },
  {
    label: "300×300",
    size: "300 × 300 мм",
    thickness: "20 мм",
    finish: "Полированная",
    status: "В наличии",
    price: "4 233 ₽/м²",
  },
)

function user(): PublicUser {
  return {
    id: "user-1",
    email: "ivan@company.ru",
    nickname: "StoneMaster",
    name: "StoneMaster",
    firstName: "",
    lastName: "",
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
  }
}

describe("InquiryForm", () => {
  beforeEach(() => {
    window.localStorage.clear()
    openLogin.mockReset()
    sendInquiry.mockReset()
    authState.user = user()
    authState.isReady = true
  })

  test("показывает позицию, даёт править ник и держит email только для чтения", async () => {
    addInquiryLine("user-1", tile)
    render(<InquiryForm />)

    expect(screen.getByText("Плита Carrara Bianco")).toBeInTheDocument()
    expect(screen.getByText("300 × 300 мм · 20 мм · Полированная · В наличии · 4 233 ₽/м²")).toBeInTheDocument()

    const name = screen.getByLabelText("Имя")
    expect(name).toHaveValue("StoneMaster")
    await userEvent.setup().clear(name)
    await userEvent.setup().type(name, "Студия Lux")
    expect(name).toHaveValue("Студия Lux")
    expect(readInquiryDraft("user-1").name).toBe("Студия Lux")

    const email = screen.getByLabelText("Email")
    expect(email).toHaveValue("ivan@company.ru")
    expect(email).toHaveAttribute("readonly")
  })

  test("сброс возвращает ник и очищает список", async () => {
    addInquiryLine("user-1", tile)
    render(<InquiryForm />)
    await userEvent.setup().click(screen.getByRole("button", { name: "Сбросить" }))
    expect(screen.queryByText("Плита Carrara Bianco")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Имя")).toHaveValue("StoneMaster")
    expect(readInquiryDraft("user-1").lines).toEqual([])
  })

  test("успешная отправка очищает черновик", async () => {
    addInquiryLine("user-1", tile)
    sendInquiry.mockResolvedValue(undefined)
    render(<InquiryForm />)
    await userEvent.setup().click(screen.getByRole("button", { name: "Отправить" }))
    expect(sendInquiry).toHaveBeenCalledWith({
      name: "StoneMaster",
      message: "",
      lines: [tile],
    })
    expect(await screen.findByRole("status")).toHaveTextContent("Заявка отправлена.")
    expect(readInquiryDraft("user-1").lines).toEqual([])
    expect(screen.queryByText("Плита Carrara Bianco")).not.toBeInTheDocument()
  })

  test("ошибка почты оставляет позиции в форме", async () => {
    addInquiryLine("user-1", tile)
    sendInquiry.mockRejectedValue(new ContentRequestError(503, "unavailable", "Сервис временно недоступен. Попробуйте позже."))
    render(<InquiryForm />)
    await userEvent.setup().click(screen.getByRole("button", { name: "Отправить" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Сервис временно недоступен")
    expect(screen.getByText("Плита Carrara Bianco")).toBeInTheDocument()
    expect(readInquiryDraft("user-1").lines).toEqual([tile])
  })

  test("гость по кнопке отправить открывает вход", async () => {
    authState.user = null
    render(<InquiryForm />)
    await userEvent.setup().click(screen.getByRole("button", { name: "Отправить" }))
    expect(openLogin).toHaveBeenCalledWith({ next: "/contacts" })
    expect(sendInquiry).not.toHaveBeenCalled()
  })
})
