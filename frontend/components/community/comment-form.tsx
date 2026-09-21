"use client"

import React, { useState } from "react"
import Link from "next/link"
import { OpenAuthLink } from "@/components/auth/open-auth-link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { forumApi } from "@/lib/forum/api-client"
import { ContentRequestError } from "@/lib/content-request"
import { Send } from "lucide-react"

interface CommentFormProps {
  slug: string
  onCommentAdded: () => void
}

export function CommentForm({ slug, onCommentAdded }: CommentFormProps) {
  const { user } = useAuth()
  const [text, setText] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const canComment = Boolean(user?.emailVerified)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canComment || !text.trim()) return
    setSubmitting(true)
    setError("")
    try {
      await forumApi.addComment(slug, text.trim())
      setText("")
      onCommentAdded()
    } catch (err) {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось отправить комментарий.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span>Оставить ответ</span>
      </div>
      <div className="relative">
        <Textarea
          placeholder={canComment ? "Напишите ваш ответ..." : "Войдите, чтобы оставить комментарий..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!canComment}
          className="pr-12 min-h-[100px]"
        />
        <div className="absolute right-2 bottom-2">
          <Button
            size="icon"
            type="submit"
            disabled={!canComment || !text.trim() || submitting}
            className="size-8"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      {!user ? (
        <p className="text-sm text-muted-foreground">
          <OpenAuthLink>Войдите</OpenAuthLink>
          , чтобы участвовать в обсуждении.
        </p>
      ) : !user.emailVerified ? (
        <p className="text-sm text-muted-foreground">
          <Link href="/verify-email" className="font-medium text-primary underline-offset-4 hover:underline">
            Подтвердите email
          </Link>
          , чтобы отвечать в темах форума.
        </p>
      ) : null}
    </form>
  )
}
