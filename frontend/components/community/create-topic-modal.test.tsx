import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"
import type { PublicUser } from "@/lib/auth/types"
import type { ForumPost } from "@/lib/types"

const push = vi.fn()
const listCategories = vi.fn()
const authState: { isReady: boolean; user: PublicUser | null } = {
  isReady: true,
  user: null,
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
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
  useAuth: () => authState,
}))

vi.mock("@/lib/forum/api-client", () => ({
  forumApi: {
    listCategories: (...args: unknown[]) => listCategories(...args),
    createPost: vi.fn(),
    updatePost: vi.fn(),
  },
}))

import { CreateTopicModal } from "@/components/community/create-topic-modal"

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

describe("CreateTopicModal", () => {
  beforeEach(() => {
    push.mockReset()
    listCategories.mockReset()
    listCategories.mockResolvedValue([{ id: "cat-1", code: "tips", label: "Советы" }])
    authState.isReady = true
    authState.user = null
  })

  test("гостю не показывает кнопку создания темы", () => {
    render(<CreateTopicModal />)
    expect(screen.queryByRole("button", { name: /создать тему/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/войти/i)).not.toBeInTheDocument()
  })

  test("неподтверждённый email видит ссылку подтвердить почту", () => {
    authState.user = verifiedUser({ emailVerified: false })
    render(<CreateTopicModal />)
    expect(screen.getByRole("link", { name: /подтвердите email/i })).toHaveAttribute(
      "href",
      "/verify-email",
    )
    expect(screen.queryByRole("button", { name: "Создать тему" })).not.toBeInTheDocument()
  })

  test("для подтверждённого пользователя кнопка открывает форму", async () => {
    authState.user = verifiedUser()
    const events = userEvent.setup()
    render(<CreateTopicModal />)

    await events.click(screen.getByRole("button", { name: "Создать тему" }))

    expect(screen.getByRole("heading", { name: "Создать новую тему" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Опубликовать" })).toBeDisabled()
    expect(await screen.findByRole("button", { name: "Выбрать категорию" })).toBeInTheDocument()
  })

  test("категория вкладки уже выбрана", async () => {
    authState.user = verifiedUser()
    listCategories.mockResolvedValue([
      { id: "cat-1", code: "tips", label: "Советы" },
      { id: "cat-2", code: "equipment", label: "Оборудование" },
    ])
    const events = userEvent.setup()
    render(<CreateTopicModal categoryCode="equipment" />)

    await events.click(screen.getByRole("button", { name: "Создать тему" }))

    expect(await screen.findByRole("button", { name: "Оборудование" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Опубликовать" })).toBeEnabled()
  })

  test("автор открывает форму с заголовком своей темы", async () => {
    authState.user = verifiedUser({ id: "author-1" })
    const events = userEvent.setup()
    render(<CreateTopicModal post={topic()} />)

    await events.click(screen.getByRole("button", { name: "Редактировать" }))

    expect(screen.getByRole("heading", { name: "Редактировать тему" })).toBeInTheDocument()
    expect(screen.getByDisplayValue("Как выбрать диск")).toBeInTheDocument()
  })
})

function topic(): ForumPost {
  return {
    id: "post-1",
    slug: "kak-vybrat-disk",
    title: "Как выбрать диск",
    author: "StoneMaster",
    authorId: "author-1",
    category: "Советы",
    categoryId: "cat-1",
    date: "1 января 2026 г.",
    excerpt: "Коротко",
    content: "Текст темы",
    commentCount: 0,
    viewCount: 1,
    likesCount: 0,
    liked: false,
    comments: [],
  }
}
