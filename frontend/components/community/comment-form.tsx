"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { Send } from "lucide-react"
import { loginPath } from "@/lib/auth/paths"

interface CommentFormProps {
  postId: string
  onCommentAdded: () => void
}

export function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [text, setText] = useState("")
  const canComment = Boolean(user?.emailVerified)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canComment || !text.trim()) return

    console.log(`Adding comment to ${postId}:`, {
      author: user?.name || "Guest",
      text: text,
    })

    setText("")
    onCommentAdded()
    alert("Комментарий добавлен (имитация)!")
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
            disabled={!canComment || !text.trim()}
            className="size-8"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
      {!user ? (
        <p className="text-sm text-muted-foreground">
          <Link href={loginPath(pathname)} className="font-medium text-primary underline-offset-4 hover:underline">
            Войдите
          </Link>
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
