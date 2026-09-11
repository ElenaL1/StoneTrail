"use client"

import React, { useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Heart, MessageSquare, Clock, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useArticles } from "@/lib/article-context"
import { useAuth } from "@/lib/auth-context"
import { ArticleCommentForm } from "@/components/articles/article-comment-form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRequireLogin } from "@/lib/auth/use-require-login"

export default function ArticleDetailPage() {
  const { id } = useParams()
  const { articles, comments, toggleLike } = useArticles()
  const { user } = useAuth()
  const requireLogin = useRequireLogin()
  const [replyTo, setReplyTo] = useState<string | null>(null)

  const article = articles.find((a) => a.id === id)
  const articleComments = comments.filter((c) => c.articleId === id)

  if (!article) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-xl text-muted-foreground">Статья не найдена</p>
      </div>
    )
  }

  const isLiked = user && article.likes.includes(user.id)

  const handleLike = () => {
    if (!requireLogin()) return
    toggleLike(article.id, user!.id)
  }

  const activeComment = comments.find((c) => c.id === replyTo)

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 lg:px-8">
      <Link 
        href="/articles" 
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="size-4" />
        Назад к статьям
      </Link>

      <article className="space-y-8">
        <div className="relative aspect-video w-full overflow-hidden rounded-3xl border border-border">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="flex flex-col gap-4">
          <Badge variant="secondary" className="w-fit px-3 py-1 text-sm">
            {article.category}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            {article.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
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
                onClick={handleLike}
                className={cn(
                  "gap-2 rounded-full",
                  isLiked && "text-primary hover:text-primary hover:bg-primary/10"
                )}
              >
                <Heart className={cn("size-4", isLiked && "fill-primary")} />
                {article.likes.length}
              </Button>
            </div>
          </div>
        </div>

        <div className="prose prose-stone max-w-none text-lg leading-relaxed text-muted-foreground space-y-6">
          {article.content.split('\\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </article>

      <div className="mt-20 space-y-12 border-t border-border pt-12">
        <div className="flex items-center gap-3">
          <MessageSquare className="size-6 text-primary" />
          <h2 className="text-2xl font-bold">Обсуждение</h2>
          <Badge variant="outline" className="ml-2">
            {articleComments.length}
          </Badge>
        </div>

        <div className="space-y-8">
          <ArticleCommentForm 
            articleId={article.id} 
            quote={activeComment ? activeComment.text : undefined}
            onCommentAdded={() => setReplyTo(null)}
          />

          <div className="space-y-6">
            {articleComments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Будьте первым, кто оставит комментарий к этой статье
              </p>
            ) : (
              articleComments.map((comment) => (
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
                      onClick={() => {
                        setReplyTo(comment.id)
                        window.scrollTo({ top: 0, behavior: 'smooth' }) // Or jump to form
                      }}
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
