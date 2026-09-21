import { formatReadTime, formatRuDate } from "@/lib/content-utils"
import { contentRequest, isNotFound } from "@/lib/content-request"
import type { Article, ArticleComment, ArticleStatus, ContentCategory } from "@/lib/types"

type CategoryDto = {
  id: string
  code: string
  label: string
}

type CommentDto = {
  id: string
  author: string
  body: string
  createdAt: string
  parentId?: string | null
}

type ArticleDto = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  categoryId: string
  author: string
  authorId: string | null
  coverUrl: string
  readTimeMinutes: number
  publicationStatus: ArticleStatus
  moderationNote: string
  publishedAt: string | null
  createdAt: string
  likesCount: number
  liked: boolean
  commentCount: number
  comments?: CommentDto[]
}

function mapComment(dto: CommentDto, articleId?: string): ArticleComment {
  return {
    id: dto.id,
    articleId,
    author: dto.author,
    text: dto.body,
    date: formatRuDate(dto.createdAt),
    parentId: dto.parentId ?? undefined,
  }
}

function mapArticle(dto: ArticleDto): Article {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    excerpt: dto.excerpt,
    content: dto.content,
    category: dto.category,
    categoryId: dto.categoryId,
    author: dto.author,
    authorId: dto.authorId,
    imageUrl: dto.coverUrl,
    readTime: formatReadTime(dto.readTimeMinutes),
    publicationStatus: dto.publicationStatus,
    moderationNote: dto.moderationNote,
    date: formatRuDate(dto.publishedAt ?? dto.createdAt),
    likesCount: dto.likesCount,
    liked: dto.liked,
    commentCount: dto.commentCount,
    comments: (dto.comments ?? []).map((comment) => mapComment(comment, dto.id)),
  }
}

export type ArticleWriteInput = {
  title: string
  excerpt: string
  content: string
  categoryId: string
  coverUrl?: string | null
}

export const articlesApi = {
  listCategories(): Promise<ContentCategory[]> {
    return contentRequest<CategoryDto[]>("/api/articles/categories")
  },

  async listPublished(params?: {
    category?: string
    sort?: "newest" | "popular"
    favorites?: boolean
  }): Promise<Article[]> {
    const search = new URLSearchParams()
    if (params?.category && params.category !== "all") search.set("category", params.category)
    if (params?.sort) search.set("sort", params.sort)
    if (params?.favorites) search.set("favorites", "true")
    const query = search.toString()
    const rows = await contentRequest<ArticleDto[]>(`/api/articles${query ? `?${query}` : ""}`)
    return rows.map(mapArticle)
  },

  async listMine(): Promise<Article[]> {
    const rows = await contentRequest<ArticleDto[]>("/api/articles/mine")
    return rows.map(mapArticle)
  },

  async listModeration(): Promise<Article[]> {
    const rows = await contentRequest<ArticleDto[]>("/api/articles/moderation")
    return rows.map(mapArticle)
  },

  async get(slug: string): Promise<Article | null> {
    try {
      return mapArticle(await contentRequest<ArticleDto>(`/api/articles/${encodeURIComponent(slug)}`))
    } catch (error) {
      if (isNotFound(error)) return null
      throw error
    }
  },

  async create(input: ArticleWriteInput): Promise<Article> {
    return mapArticle(
      await contentRequest<ArticleDto>("/api/articles", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    )
  },

  async update(slug: string, input: Partial<ArticleWriteInput>): Promise<Article> {
    return mapArticle(
      await contentRequest<ArticleDto>(`/api/articles/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    )
  },

  async submit(slug: string): Promise<Article> {
    return mapArticle(
      await contentRequest<ArticleDto>(`/api/articles/${encodeURIComponent(slug)}/submit`, {
        method: "POST",
      }),
    )
  },

  async publish(slug: string): Promise<Article> {
    return mapArticle(
      await contentRequest<ArticleDto>(`/api/articles/${encodeURIComponent(slug)}/publish`, {
        method: "POST",
      }),
    )
  },

  async moderate(
    slug: string,
    action: "publish" | "request_changes" | "reject" | "revoke_privilege",
    note = "",
  ): Promise<Article> {
    return mapArticle(
      await contentRequest<ArticleDto>(`/api/articles/${encodeURIComponent(slug)}/moderate`, {
        method: "POST",
        body: JSON.stringify({ action, note }),
      }),
    )
  },

  async addComment(slug: string, body: string, parentId?: string): Promise<ArticleComment> {
    return mapComment(
      await contentRequest<CommentDto>(`/api/articles/${encodeURIComponent(slug)}/comments`, {
        method: "POST",
        body: JSON.stringify({ body, parentId }),
      }),
    )
  },

  async toggleLike(slug: string): Promise<{ liked: boolean; likesCount: number }> {
    return contentRequest<{ liked: boolean; likesCount: number }>(
      `/api/articles/${encodeURIComponent(slug)}/likes`,
      { method: "POST" },
    )
  },
}
