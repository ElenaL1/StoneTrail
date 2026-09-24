import type { ForumPost } from "@/lib/types"

export type ForumSort = "newest" | "oldest" | "likes" | "views" | "comments"

function dateValue(post: ForumPost): number {
  const time = post.createdAt ? Date.parse(post.createdAt) : Number.NaN
  return Number.isNaN(time) ? 0 : time
}

export function filterForumPosts(
  posts: ForumPost[],
  options: { search: string; author: string; sort: ForumSort },
): ForumPost[] {
  const query = options.search.trim().toLowerCase()
  const matched = posts.filter((post) => {
    const matchesAuthor = options.author === "all" || post.author === options.author
    const matchesSearch =
      query.length === 0 ||
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query)
    return matchesAuthor && matchesSearch
  })
  return [...matched].sort((left, right) => {
    if (options.sort === "oldest") return dateValue(left) - dateValue(right)
    if (options.sort === "likes") return right.likesCount - left.likesCount
    if (options.sort === "views") return right.viewCount - left.viewCount
    if (options.sort === "comments") return right.commentCount - left.commentCount
    return dateValue(right) - dateValue(left)
  })
}
