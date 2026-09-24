"use client"

import { useState } from "react"
import { Heart, User, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Comment } from "@/lib/types"

type CommentNode = Comment & { replies: CommentNode[] }

export function commentTree(comments: Comment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>()
  for (const comment of comments) {
    nodes.set(comment.id, { ...comment, replies: [] })
  }
  const roots: CommentNode[] = []
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined
    if (parent) parent.replies.push(node)
    else roots.push(node)
  }
  return roots
}

type CommentThreadProps = {
  comments: Comment[]
  canInteract: boolean
  onReply: (parentId: string, body: string) => Promise<void>
  onLike: (commentId: string) => void
}

export function CommentThread({ comments, canInteract, onReply, onLike }: CommentThreadProps) {
  const [replyTo, setReplyTo] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {commentTree(comments).map((comment) => (
        <CommentNodeView
          key={comment.id}
          comment={comment}
          canInteract={canInteract}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          onReply={onReply}
          onLike={onLike}
        />
      ))}
    </div>
  )
}

function CommentNodeView({
  comment,
  canInteract,
  replyTo,
  setReplyTo,
  onReply,
  onLike,
}: {
  comment: CommentNode
  canInteract: boolean
  replyTo: string | null
  setReplyTo: (id: string | null) => void
  onReply: (parentId: string, body: string) => Promise<void>
  onLike: (commentId: string) => void
}) {
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    try {
      await onReply(comment.id, text.trim())
      setText("")
      setReplyTo(null)
    } finally {
      setSending(false)
    }
  }

  return (
    <div data-testid={`comment-${comment.id}`} className="space-y-3">
      <div className="flex gap-4 rounded-lg border border-border/50 bg-secondary/30 p-4">
        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="size-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{comment.author}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              {comment.date}
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{comment.text}</p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-muted-foreground"
              onClick={() => {
                if (canInteract) onLike(comment.id)
              }}
            >
              <Heart className={cn("size-4", comment.liked && "fill-primary text-primary")} />
              {comment.likesCount}
            </button>
            {canInteract ? (
              <button
                type="button"
                className="text-sm font-medium text-primary"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              >
                Ответить
              </button>
            ) : null}
          </div>
          {replyTo === comment.id ? (
            <div className="mt-3 space-y-2">
              <Textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Напишите ответ..."
                className="min-h-[80px]"
              />
              <Button type="button" size="sm" disabled={sending || !text.trim()} onClick={() => void send()}>
                {sending ? "Отправка…" : "Отправить"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      {comment.replies.length > 0 ? (
        <div className="ml-8 space-y-3 border-l border-border pl-4">
          {comment.replies.map((reply) => (
            <CommentNodeView
              key={reply.id}
              comment={reply}
              canInteract={canInteract}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              onReply={onReply}
              onLike={onLike}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
