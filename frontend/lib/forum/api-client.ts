import { formatRuDate, formatRuDateTime } from "@/lib/content-utils"
import { contentRequest, isNotFound } from "@/lib/content-request"
import type { Comment, ContentCategory, ForumPost } from "@/lib/types"

type CategoryDto = {
  id: string
  code: string
  label: string
}

type CommentDto = {
  id: string
  author: string
  authorId: string
  body: string
  createdAt: string
  editedAt?: string | null
  parentId?: string | null
  likesCount: number
  liked: boolean
}

type LikeDto = {
  liked: boolean
  likesCount: number
}

type PostDto = {
  id: string
  slug: string
  title: string
  author: string
  category: string
  categoryId: string
  excerpt: string
  content: string
  createdAt: string
  editedAt?: string | null
  authorId: string
  commentCount: number
  viewCount: number
  likesCount: number
  liked: boolean
  comments?: CommentDto[]
}

function mapComment(dto: CommentDto, postId?: string): Comment {
  return {
    id: dto.id,
    postId,
    author: dto.author,
    authorId: dto.authorId,
    text: dto.body,
    date: formatRuDateTime(dto.createdAt),
    editedAt: dto.editedAt ? formatRuDateTime(dto.editedAt) : undefined,
    parentId: dto.parentId ?? undefined,
    likesCount: dto.likesCount,
    liked: dto.liked,
  }
}

function mapPost(dto: PostDto): ForumPost {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    author: dto.author,
    authorId: dto.authorId,
    category: dto.category,
    categoryId: dto.categoryId,
    excerpt: dto.excerpt,
    content: dto.content,
    date: formatRuDate(dto.createdAt),
    editedAt: dto.editedAt ? formatRuDateTime(dto.editedAt) : undefined,
    commentCount: dto.commentCount,
    viewCount: dto.viewCount,
    likesCount: dto.likesCount,
    liked: dto.liked,
    comments: (dto.comments ?? []).map((comment) => mapComment(comment, dto.id)),
  }
}

export const forumApi = {
  listCategories(): Promise<ContentCategory[]> {
    return contentRequest<CategoryDto[]>("/api/forum/categories")
  },

  async listPosts(category?: string): Promise<ForumPost[]> {
    const search = category && category !== "all" ? `?category=${encodeURIComponent(category)}` : ""
    const rows = await contentRequest<PostDto[]>(`/api/forum/posts${search}`)
    return rows.map(mapPost)
  },

  async getPost(slug: string): Promise<ForumPost | null> {
    try {
      return mapPost(await contentRequest<PostDto>(`/api/forum/posts/${encodeURIComponent(slug)}`))
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  },

  async createPost(input: { title: string; categoryId: string; content: string }): Promise<ForumPost> {
    return mapPost(
      await contentRequest<PostDto>("/api/forum/posts", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    )
  },

  async updatePost(
    slug: string,
    input: { title: string; categoryId: string; content: string },
  ): Promise<ForumPost> {
    return mapPost(
      await contentRequest<PostDto>(`/api/forum/posts/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    )
  },

  async addComment(slug: string, body: string, parentId?: string): Promise<Comment> {
    return mapComment(
      await contentRequest<CommentDto>(`/api/forum/posts/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        body: JSON.stringify({ body, parentId }),
      }),
    )
  },

  togglePostLike(slug: string): Promise<LikeDto> {
    return contentRequest<LikeDto>(`/api/forum/posts/${encodeURIComponent(slug)}/like`, {
      method: "POST",
    })
  },

  async updateComment(slug: string, commentId: string, body: string): Promise<Comment> {
    return mapComment(
      await contentRequest<CommentDto>(
        `/api/forum/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}`,
        { method: "PATCH", body: JSON.stringify({ body }) },
      ),
    )
  },

  toggleCommentLike(slug: string, commentId: string): Promise<LikeDto> {
    return contentRequest<LikeDto>(
      `/api/forum/posts/${encodeURIComponent(slug)}/comments/${encodeURIComponent(commentId)}/like`,
      { method: "POST" },
    )
  },
}
