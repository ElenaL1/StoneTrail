import { render, screen } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import { CommentThread } from "@/components/community/comment-thread"
import type { Comment } from "@/lib/types"

function comment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: "root",
    author: "Автор",
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
      />,
    )

    const root = screen.getByTestId("comment-root")
    expect(root).toHaveTextContent("Корневой ответ")
    expect(root).toHaveTextContent("Вложенный ответ")
  })
})
