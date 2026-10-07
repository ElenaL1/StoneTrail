import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, test, vi } from "vitest"
import type { Notification } from "@/lib/types"

const auth = vi.hoisted(() => ({
  isReady: true,
  user: null as { id: string } | null,
}))

const api = vi.hoisted(() => ({
  list: vi.fn(),
  markRead: vi.fn(),
  markAllRead: vi.fn(),
}))

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => auth,
}))

vi.mock("@/lib/feed/api-client", () => ({
  notificationsApi: api,
}))

import { NotificationDropdown } from "@/components/notification-dropdown"

function note(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    type: "catalog",
    title: "Новый слэб",
    message: "В фонде появился Calacatta Gold",
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    isRead: false,
    entityType: null,
    entityId: null,
    ...overrides,
  }
}

describe("NotificationDropdown", () => {
  beforeEach(() => {
    auth.isReady = true
    auth.user = null
    api.list.mockReset()
    api.markRead.mockReset()
    api.markAllRead.mockReset()
  })

  test("гость не запрашивает уведомления", async () => {
    const events = userEvent.setup()
    render(<NotificationDropdown />)

    await events.click(screen.getByRole("button", { name: "Уведомления" }))

    expect(screen.getByText("Войдите, чтобы видеть уведомления")).toBeInTheDocument()
    expect(api.list).not.toHaveBeenCalled()
    expect(screen.queryByTestId("notification-unread")).not.toBeInTheDocument()
  })

  test("отметка прочитанного снимает бейдж", async () => {
    auth.user = { id: "user-1" }
    api.list.mockResolvedValue([
      note(),
      note({
        id: "n2",
        title: "Второе",
        isRead: true,
        createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
      }),
    ])
    api.markRead.mockResolvedValue(note({ isRead: true }))
    const events = userEvent.setup()
    render(<NotificationDropdown />)

    expect(await screen.findByTestId("notification-unread")).toBeInTheDocument()
    await events.click(screen.getByRole("button", { name: "Уведомления" }))
    expect(screen.getByText("Новый слэб")).toBeInTheDocument()
    expect(screen.getByText(/мин назад/)).toBeInTheDocument()

    await events.click(screen.getByText("Новый слэб"))

    await waitFor(() => {
      expect(screen.queryByTestId("notification-unread")).not.toBeInTheDocument()
    })
    expect(api.markRead).toHaveBeenCalledWith("n1")
  })
})
