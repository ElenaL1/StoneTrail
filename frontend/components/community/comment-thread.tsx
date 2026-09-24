"use client"

import { useEffect, useRef, useState } from "react"
import { Heart, User, Calendar, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

const MAX_REPLY_INDENT = 4

type CommentBlock = { kind: "quote"; text: string } | { kind: "text"; text: string }

function commentBlocks(source: string): CommentBlock[] {
  const blocks: CommentBlock[] = []
  let quote: string[] | null = null
  let plain: string[] | null = null

  const flushQuote = () => {
    if (!quote) return
    blocks.push({ kind: "quote", text: quote.join("\n") })
    quote = null
  }
  const flushPlain = () => {
    if (!plain) return
    const text = plain.join("\n").trim()
    if (text) blocks.push({ kind: "text", text })
    plain = null
  }

  for (const rawLine of source.split("\n")) {
    const line = rawLine.replace(/\r$/, "")
    if (line.startsWith(">")) {
      flushPlain()
      const content = line.slice(1).replace(/^ /, "")
      if (quote) quote.push(content)
      else quote = [content]
    } else {
      flushQuote()
      if (plain) plain.push(line)
      else plain = [line]
    }
  }
  flushQuote()
  flushPlain()
  return blocks
}

function quoteSelection(fragment: string): string {
  return fragment
    .trim()
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n")
}

function CommentBody({ text }: { text: string }) {
  const blocks = commentBlocks(text)
  if (blocks.length === 1 && blocks[0].kind === "text") {
    return <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{blocks[0].text}</p>
  }
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {blocks.map((block, index) =>
        block.kind === "quote" ? (
          <blockquote key={index} className="flex gap-2 rounded-lg bg-muted px-3 py-2">
            <Quote className="mt-1 size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="whitespace-pre-wrap text-sm italic leading-relaxed text-muted-foreground">
              {block.text}
            </span>
          </blockquote>
        ) : (
          <p key={index} className="whitespace-pre-wrap pt-1 text-foreground">
            {block.text}
          </p>
        ),
      )}
    </div>
  )
}

type CommentThreadProps = {
  comments: Comment[]
  canInteract: boolean
  currentUserId?: string
  isStaff?: boolean
  onReply: (parentId: string, body: string) => Promise<void>
  onLike: (commentId: string) => void
  onEdit: (commentId: string, body: string) => Promise<void>
  onDelete?: (commentId: string) => Promise<void>
  onRestore?: (commentId: string) => Promise<void>
  onPermanentDelete?: (commentId: string) => Promise<void>
}

export function CommentThread({
  comments,
  canInteract,
  currentUserId,
  isStaff = false,
  onReply,
  onLike,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
}: CommentThreadProps) {
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {commentTree(comments).map((comment) => (
        <CommentNodeView
          key={comment.id}
          comment={comment}
          depth={0}
          canInteract={canInteract}
          currentUserId={currentUserId}
          isStaff={isStaff}
          onDelete={onDelete}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          replyText={replyText}
          setReplyText={setReplyText}
          editingId={editingId}
          setEditingId={setEditingId}
          onReply={onReply}
          onLike={onLike}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}

function CommentNodeView({
  comment,
  depth,
  canInteract,
  currentUserId,
  isStaff,
  onDelete,
  onRestore,
  onPermanentDelete,
  replyTo,
  setReplyTo,
  replyText,
  setReplyText,
  editingId,
  setEditingId,
  onReply,
  onLike,
  onEdit,
}: {
  comment: CommentNode
  depth: number
  canInteract: boolean
  currentUserId?: string
  isStaff: boolean
  onDelete?: (commentId: string) => Promise<void>
  onRestore?: (commentId: string) => Promise<void>
  onPermanentDelete?: (commentId: string) => Promise<void>
  replyTo: string | null
  setReplyTo: (id: string | null) => void
  replyText: string
  setReplyText: (value: string | ((current: string) => string)) => void
  editingId: string | null
  setEditingId: (id: string | null) => void
  onReply: (parentId: string, body: string) => Promise<void>
  onLike: (commentId: string) => void
  onEdit: (commentId: string, body: string) => Promise<void>
}) {
  const [draft, setDraft] = useState(comment.text)
  const editing = editingId === comment.id
  const [sending, setSending] = useState(false)
  const [quotePrompt, setQuotePrompt] = useState<{ x: number; y: number; text: string } | null>(null)
  const replyRef = useRef<HTMLTextAreaElement>(null)
  const pendingFocus = useRef(false)
  const canEdit = Boolean(currentUserId && comment.authorId === currentUserId)
  const tombstone = Boolean(comment.deleted && !isStaff)
  const canHide = Boolean(
    !comment.deleted && onDelete && (isStaff || (canEdit && comment.replies.length === 0)),
  )
  const [confirm, setConfirm] = useState<"hide" | "permanent" | null>(null)

  useEffect(() => {
    if (!pendingFocus.current || replyTo !== comment.id) return
    pendingFocus.current = false
    const field = replyRef.current
    if (!field) return
    field.focus()
    const end = field.value.length
    field.setSelectionRange(end, end)
  }, [comment.id, replyTo, replyText])

  const applyQuote = (fragment: string) => {
    const quoted = quoteSelection(fragment)
    setReplyText((current) => (current.trim() ? `${current.trim()}\n\n${quoted}\n\n` : `${quoted}\n\n`))
    pendingFocus.current = true
    setReplyTo(comment.id)
    setQuotePrompt(null)
    window.getSelection()?.removeAllRanges()
  }

  const onBodyMouseUp = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!canInteract || canEdit || comment.deleted) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setQuotePrompt(null)
      return
    }
    const fragment = selection.toString().trim()
    const range = selection.getRangeAt(0)
    if (!fragment || !event.currentTarget.contains(range.commonAncestorContainer)) {
      setQuotePrompt(null)
      return
    }
    const rect =
      typeof range.getBoundingClientRect === "function"
        ? range.getBoundingClientRect()
        : { left: 0, top: 0 }
    setQuotePrompt({ x: rect.left, y: rect.top, text: fragment })
  }

  const send = async () => {
    if (!replyText.trim()) return
    setSending(true)
    try {
      await onReply(comment.id, replyText.trim())
      setReplyText("")
      setReplyTo(null)
    } finally {
      setSending(false)
    }
  }

  return (
    <div data-testid={`comment-${comment.id}`} className="space-y-3">
      <div className="flex gap-4 rounded-lg border border-border/50 bg-secondary/30 p-4">
        <div className="flex w-10 flex-shrink-0 flex-col items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted">
            <User className="size-5 text-muted-foreground" />
          </div>
          {tombstone ? null : (
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-muted-foreground"
              onClick={() => {
                if (canInteract && !comment.deleted) onLike(comment.id)
              }}
            >
              <Heart className={cn("size-4", comment.liked && "fill-primary text-primary")} />
              {comment.likesCount}
            </button>
          )}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">{comment.author}</span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {comment.date}
              </span>
              {comment.editedAt ? <span>изменено {comment.editedAt}</span> : null}
            </span>
          </div>
          {tombstone ? (
            <p className="text-sm italic text-muted-foreground">Сообщение удалено</p>
          ) : comment.deleted ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Скрыто{comment.deletedBy ? ` · ${comment.deletedBy}` : ""}
              </p>
              <div onMouseUp={onBodyMouseUp}>
                <CommentBody text={comment.text} />
              </div>
            </div>
          ) : editing ? (
            <div className="space-y-2">
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="min-h-[80px] max-h-60 resize-y overflow-y-auto [field-sizing:content]"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={sending || !draft.trim()}
                  onClick={() => {
                    setSending(true)
                    void onEdit(comment.id, draft.trim())
                      .then(() => setEditingId(null))
                      .finally(() => setSending(false))
                  }}
                >
                  {sending ? "Сохранение…" : "Сохранить"}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>
                  Отменить
                </Button>
              </div>
            </div>
          ) : (
            <div onMouseUp={onBodyMouseUp}>
              <CommentBody text={comment.text} />
            </div>
          )}
          <div className="mt-3 flex items-center gap-3">
            {comment.deleted && isStaff ? (
              <>
                <button
                  type="button"
                  className="ml-auto text-sm font-medium text-primary"
                  onClick={() => void onRestore?.(comment.id)}
                >
                  Восстановить
                </button>
                <button
                  type="button"
                  className="text-sm font-medium text-destructive"
                  onClick={() => setConfirm("permanent")}
                >
                  Удалить навсегда
                </button>
              </>
            ) : canEdit && !editing && !comment.deleted ? (
              <button
                type="button"
                className="ml-auto text-sm font-medium text-primary"
                onClick={() => {
                  setDraft(comment.text)
                  setEditingId(comment.id)
                }}
              >
                Изменить
              </button>
            ) : canInteract && !canEdit && !comment.deleted ? (
              <button
                type="button"
                className="ml-auto text-sm font-medium text-primary"
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
              >
                Ответить
              </button>
            ) : null}
            {canHide ? (
              <button
                type="button"
                className={cn("text-sm font-medium text-muted-foreground", !canEdit && "ml-auto")}
                onClick={() => setConfirm("hide")}
              >
                Удалить
              </button>
            ) : null}
          </div>
          <Dialog open={confirm !== null} onOpenChange={(open) => { if (!open) setConfirm(null) }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {confirm === "permanent" ? "Удалить навсегда?" : "Удалить ответ?"}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {confirm === "permanent"
                  ? "Текст исчезнет без восстановления. Ответы на него останутся."
                  : "Ответ скроется. Если на него уже ответили, на месте останется пометка."}
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setConfirm(null)}>
                  Отмена
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const action = confirm
                    setConfirm(null)
                    if (action === "permanent") void onPermanentDelete?.(comment.id)
                    if (action === "hide") void onDelete?.(comment.id)
                  }}
                >
                  {confirm === "permanent" ? "Удалить навсегда" : "Удалить"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {quotePrompt ? (
            <button
              type="button"
              className="fixed z-30 -translate-y-[calc(100%+6px)] rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-sm"
              style={{ left: quotePrompt.x, top: quotePrompt.y }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => applyQuote(quotePrompt.text)}
            >
              Цитировать
            </button>
          ) : null}
          {replyTo === comment.id ? (
            <div className="mt-3 space-y-2">
              <Textarea
                ref={replyRef}
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault()
                    void send()
                  }
                }}
                placeholder="Напишите ответ..."
                className="min-h-[80px] max-h-60 resize-y overflow-y-auto [field-sizing:content]"
              />
              <p className="text-xs text-muted-foreground">
                Выделите фрагмент и нажмите «Цитировать». Enter — отправить, Shift+Enter — новая строка.
              </p>
              <Button type="button" size="sm" disabled={sending || !replyText.trim()} onClick={() => void send()}>
                {sending ? "Отправка…" : "Отправить"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      {comment.replies.length > 0 ? (
        <div
          data-testid={`replies-${comment.id}`}
          className={cn(
            "space-y-3",
            depth < MAX_REPLY_INDENT && "ml-4 border-l border-border pl-3 sm:ml-8 sm:pl-4",
          )}
        >
          {comment.replies.map((reply) => (
            <CommentNodeView
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              canInteract={canInteract}
              currentUserId={currentUserId}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              replyText={replyText}
              setReplyText={setReplyText}
              editingId={editingId}
              setEditingId={setEditingId}
              isStaff={isStaff}
              onDelete={onDelete}
              onRestore={onRestore}
              onPermanentDelete={onPermanentDelete}
              onReply={onReply}
              onLike={onLike}
              onEdit={onEdit}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
