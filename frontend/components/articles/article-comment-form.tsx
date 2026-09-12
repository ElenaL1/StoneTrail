"use client"

import React, { useState } from "react"
import Link from "next/link"
import { OpenAuthLink } from "@/components/auth/open-auth-link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { useArticles } from "@/lib/article-context"
import { Quote } from "lucide-react"

interface ArticleCommentFormProps {
  articleId: string
  quote?: string
  onCommentAdded: () => void
}

export function ArticleCommentForm({
  articleId,
  quote,
  onCommentAdded,
}: ArticleCommentFormProps) {
  const { user } = useAuth()
  const { addComment } = useArticles()
  const [text, setText] = useState("")
  const canComment = Boolean(user?.emailVerified)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canComment || !text.trim()) return

    const finalContent = quote
      ? `\n\n> ${quote}\n\n${text}`
      : text

    addComment({
      articleId,
      author: user!.name,
      text: finalContent,
      parentId: undefined,
    })

    setText("")
    onCommentAdded()
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        {quote && (
          <div className="relative rounded-lg bg-muted p-3 text-sm text-muted-foreground italic border-l-4 border-primary">
            <Quote className="absolute right-2 top-2 size-4 opacity-20" />
            {quote}
          </div>
        )}

        <div className="relative">
          <Textarea
            placeholder={canComment ? "Напишите ваш комментарий..." : "Войдите, чтобы оставить комментарий..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!canComment}
            className="min-h-[100px] resize-none"
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!canComment || !text.trim()}
            className="px-8"
          >
            Отправить
          </Button>
        </div>
      </form>

      {!user ? (
        <p className="text-sm text-muted-foreground">
          <OpenAuthLink>Войдите</OpenAuthLink>
          , чтобы оставить комментарий.
        </p>
      ) : !user.emailVerified ? (
        <p className="text-sm text-muted-foreground">
          <Link href="/verify-email" className="font-medium text-primary underline-offset-4 hover:underline">
            Подтвердите email
          </Link>
          , чтобы участвовать в обсуждении.
        </p>
      ) : null}
    </div>
  )
}
