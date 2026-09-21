"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Heart, MessageSquare, Clock, Calendar, ArrowLeft, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { ArticleCommentForm } from "@/components/articles/article-comment-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRequireLogin } from "@/lib/auth/use-require-login"
import { articlesApi } from "@/lib/articles/api-client"
import { MarkdownContent } from "@/lib/markdown"
import { ARTICLE_STATUS_LABELS } from "@/lib/content-utils"
import type { Article } from "@/lib/types"

export default function ArticleDetailPage() {
  const params = useParams()
  const slug = String(params.slug ?? "")
  const { user } = useAuth()
  const requireLogin = useRequireLogin()
  const [article, setArticle] = useState<Article | null | undefined>(undefined)
  const [replyTo, setReplyTo] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!slug) return
    void articlesApi.get(slug).then(setArticle)
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  if (article === undefined) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-xl text-muted-foreground">Статья не найдена</p>
      </div>
    )
  }

  const handleLike = async () => {
    if (!requireLogin({ requireVerified: true })) return
    const result = await articlesApi.toggleLike(article.slug)
    setArticle((current) =>
      current ? { ...current, liked: result.liked, likesCount: result.likesCount } : current,
    )
  }

  const comments = article.comments
  const activeComment = comments.find((comment) => comment.id === replyTo)

  return (
    <div className="mx-auto max-w-4xl px-5 py-24 lg:px-8">
      <Link 
        href="/articles" 
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="size-4" />
        Назад к статьям
      </Link>

      {article.publicationStatus !== "published" ? (
        <p className="mb-6 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
          {ARTICLE_STATUS_LABELS[article.publicationStatus]}
          {user && (user.id === article.authorId || user.role === "moderator" || user.role === "editor" || user.role === "admin") ? (
            <>
              {" · "}
              <Link href={`/articles/${article.slug}/edit`} className="text-primary underline-offset-4 hover:underline">
                Редактировать
              </Link>
            </>
          ) : null}
        </p>
      ) : null}

      <article className="space-y-8">
        {article.imageUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit px-3 py-1 text-sm">
            {article.category}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            {article.title}
          </h1>
          {article.excerpt ? (
            <p className="text-lg text-muted-foreground">{article.excerpt}</p>
          ) : null}
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <User className="size-4" />
              {article.author}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="size-4" />
              {article.date}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="size-4" />
              {article.readTime} чтение
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => void handleLike()}
                className={cn(
                  "gap-2 rounded-full",
                  article.liked && "text-primary hover:text-primary hover:bg-primary/10"
                )}
              >
                <Heart className={cn("size-4", article.liked && "fill-primary")} />
                {article.likesCount}
              </Button>
            </div>
          </div>
        </div>

        <MarkdownContent value={article.content} />
      </article>

      <div className="mt-20 space-y-12 border-t border-border pt-12">
        <div className="flex items-center gap-3">
          <MessageSquare className="size-6 text-primary" />
          <h2 className="text-2xl font-bold">Обсуждение</h2>
          <Badge variant="outline" className="ml-2">
            {comments.length}
          </Badge>
        </div>

        <div className="space-y-8">
          <ArticleCommentForm 
            slug={article.slug}
            quote={activeComment ? activeComment.text : undefined}
            onCommentAdded={() => {
              setReplyTo(null)
              load()
            }}
          />

          <div className="space-y-6">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Будьте первым, кто оставит комментарий к этой статье
              </p>
            ) : (
              comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={cn(
                    "group relative rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30",
                    replyTo === comment.id && "ring-2 ring-primary border-transparent"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-foreground">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">{comment.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                    {comment.text}
                  </p>
                  <div className="flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => setReplyTo(comment.id)}
                    >
                      Ответить
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
