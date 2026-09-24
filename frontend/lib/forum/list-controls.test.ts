import { describe, expect, test } from "vitest"
import { filterForumPosts } from "@/lib/forum/list-controls"
import type { ForumPost } from "@/lib/types"

function post(overrides: Partial<ForumPost>): ForumPost {
  return {
    id: "1",
    slug: "tema",
    title: "Тема",
    author: "Анна",
    authorId: "a",
    category: "Советы",
    categoryId: "c",
    date: "1 января 2026 г.",
    excerpt: "коротко",
    content: "текст",
    commentCount: 0,
    viewCount: 0,
    likesCount: 0,
    liked: false,
    comments: [],
    ...overrides,
  }
}

describe("filterForumPosts", () => {
  const posts = [
    post({ id: "old", title: "Гранит", author: "Анна", createdAt: "2026-01-01T00:00:00.000Z", likesCount: 1, viewCount: 10, commentCount: 2 }),
    post({ id: "new", title: "Мрамор", author: "Борис", createdAt: "2026-06-01T00:00:00.000Z", likesCount: 5, viewCount: 3, commentCount: 0, excerpt: "про гранит тоже" }),
  ]

  test("поиск ищет по заголовку и началу текста", () => {
    const found = filterForumPosts(posts, { search: "гранит", author: "all", sort: "newest" })
    expect(found.map((item) => item.id)).toEqual(["new", "old"])
  })

  test("автор оставляет только его темы", () => {
    const found = filterForumPosts(posts, { search: "", author: "Анна", sort: "newest" })
    expect(found.map((item) => item.id)).toEqual(["old"])
  })

  test("сортирует по лайкам, просмотрам, ответам и дате", () => {
    expect(filterForumPosts(posts, { search: "", author: "all", sort: "likes" }).map((item) => item.id)).toEqual(["new", "old"])
    expect(filterForumPosts(posts, { search: "", author: "all", sort: "views" }).map((item) => item.id)).toEqual(["old", "new"])
    expect(filterForumPosts(posts, { search: "", author: "all", sort: "comments" }).map((item) => item.id)).toEqual(["old", "new"])
    expect(filterForumPosts(posts, { search: "", author: "all", sort: "oldest" }).map((item) => item.id)).toEqual(["old", "new"])
  })
})
