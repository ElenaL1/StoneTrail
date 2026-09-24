import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, test, vi } from "vitest"
import { CommentThread } from "@/components/community/comment-thread"
import type { Comment } from "@/lib/types"

function comment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: "root",
    author: "Автор",
    authorId: "user-1",
    text: "Корневой ответ",
    date: "сегодня",
    likesCount: 0,
    liked: false,
    ...overrides,
  }
}

describe("CommentThread", () => {
  test("ответ с parentId рисуется внутри родителя", () => {
    render(
      <CommentThread
        comments={[
          comment(),
          comment({ id: "child", parentId: "root", text: "Вложенный ответ", author: "Читатель" }),
        ]}
        canInteract={false}
        onReply={vi.fn()}
        onLike={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    const root = screen.getByTestId("comment-root")
    expect(root).toHaveTextContent("Корневой ответ")
    expect(root).toHaveTextContent("Вложенный ответ")
  })

  test("автор видит правку своего ответа", async () => {
    const events = userEvent.setup()
    render(
      <CommentThread
        comments={[comment({ authorId: "me" })]}
        canInteract
        currentUserId="me"
        onReply={vi.fn()}
        onLike={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    expect(screen.getByRole("button", { name: "Ответить" }).className).toContain("ml-auto")
    expect(screen.queryByText(/изменено/)).not.toBeInTheDocument()
    await events.click(screen.getByRole("button", { name: "Изменить" }))
    expect(screen.getByDisplayValue("Корневой ответ")).toBeInTheDocument()
  })

  test("после четвёртого уровня ответы больше не сдвигаются", () => {
    const chain = ["a", "b", "c", "d", "e", "f"].map((id, index, ids) =>
      comment({
        id,
        parentId: index === 0 ? undefined : ids[index - 1],
        text: id,
      }),
    )
    render(
      <CommentThread
        comments={chain}
        canInteract={false}
        onReply={vi.fn()}
        onLike={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    expect(screen.getByTestId("replies-d").className).toContain("ml-4")
    expect(screen.getByTestId("replies-e").className).not.toContain("ml-4")
  })

  test("у правленного ответа видна пометка со временем", () => {
    render(
      <CommentThread
        comments={[comment({ editedAt: "24 сентября 2026 г., 11:55" })]}
        canInteract={false}
        onReply={vi.fn()}
        onLike={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    expect(screen.getByText("изменено 24 сентября 2026 г., 11:55")).toBeInTheDocument()
  })

  test("сохранённая цитата рисуется отдельно от своего текста", () => {
    render(
      <CommentThread
        comments={[
          comment({
            text: "> кусок исходного ответа\n\nСогласен",
          }),
        ]}
        canInteract={false}
        onReply={vi.fn()}
        onLike={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    const quote = screen.getByText("кусок исходного ответа")
    expect(quote.closest("blockquote")?.className).toContain("rounded-lg")
    expect(screen.getByText("Согласен")).toBeInTheDocument()
    expect(screen.queryByText("> кусок исходного ответа")).not.toBeInTheDocument()
  })

  test("выделенный фрагмент вставляется в ответ как цитата", async () => {
    const events = userEvent.setup()
    render(
      <CommentThread
        comments={[comment()]}
        canInteract
        onReply={vi.fn()}
        onLike={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    const paragraph = screen.getByText("Корневой ответ")
    const node = paragraph.firstChild
    if (!(node instanceof Text)) throw new Error("нет текстового узла")
    const range = document.createRange()
    range.setStart(node, 0)
    range.setEnd(node, "Корневой".length)
    const selection = window.getSelection()
    if (!selection) throw new Error("нет выделения")
    selection.removeAllRanges()
    selection.addRange(range)
    fireEvent.mouseUp(paragraph)

    await events.click(screen.getByRole("button", { name: "Цитировать" }))
    expect(screen.getByPlaceholderText("Напишите ответ...")).toHaveValue("> Корневой\n\n")
  })

  test("Enter отправляет ответ, Shift+Enter оставляет перенос строки", async () => {
    const events = userEvent.setup()
    const onReply = vi.fn().mockResolvedValue(undefined)
    render(
      <CommentThread
        comments={[comment()]}
        canInteract
        onReply={onReply}
        onLike={vi.fn()}
        onEdit={vi.fn()}
      />,
    )

    await events.click(screen.getByRole("button", { name: "Ответить" }))
    const field = screen.getByPlaceholderText("Напишите ответ...")
    await events.type(field, "первая")
    await events.keyboard("{Shift>}{Enter}{/Shift}вторая")
    expect(field).toHaveValue("первая\nвторая")
    expect(onReply).not.toHaveBeenCalled()
    await events.keyboard("{Enter}")
    expect(onReply).toHaveBeenCalledWith("root", "первая\nвторая")
  })
})
