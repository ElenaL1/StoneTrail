"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { forumApi } from "@/lib/forum/api-client"
import { CommentForm } from "@/components/community/comment-form"
import { CommentThread } from "@/components/community/comment-thread"
import { CreateTopicModal } from "@/components/community/create-topic-modal"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { isStaff } from "@/lib/content-utils"
import { cn } from "@/lib/utils"
import { ArrowLeft, User, Calendar, MessageSquare, Eye, Heart } from "lucide-react"
import Link from "next/link"
import type { Comment, ForumPost } from "@/lib/types"

export default function TopicDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const slug = String(params.slug ?? "")
  const [post, setPost] = useState<ForumPost | null | undefined>(undefined)
  const canInteract = Boolean(user?.emailVerified)
  const canEdit = Boolean(user && post && (user.id === post.authorId || isStaff(user.role)))

  const load = useCallback(() => {
    if (!slug) return
    void forumApi.getPost(slug).then(setPost)
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  if (post === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-24 px-5 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Тема не найдена</h1>
        <p className="text-muted-foreground mb-8">К сожалению, обсуждение, которое вы ищете, больше не доступно.</p>
        <Link href="/community">
          <Button>Вернуться в форум</Button>
        </Link>
      </div>
    )
  }

  const comments = post.comments

  const appendComment = (comment: Comment) => {
    setPost((current) =>
      current
        ? {
            ...current,
            comments: [...current.comments, comment],
            commentCount: current.commentCount + 1,
          }
        : current,
    )
  }

  const likePost = () => {
    if (!canInteract) return
    void forumApi.togglePostLike(post.slug).then((result) => {
      setPost((current) =>
        current ? { ...current, liked: result.liked, likesCount: result.likesCount } : current,
      )
    })
  }

  const likeComment = (commentId: string) => {
    if (!canInteract) return
    void forumApi.toggleCommentLike(post.slug, commentId).then((result) => {
      setPost((current) =>
        current
          ? {
              ...current,
              comments: current.comments.map((comment) =>
                comment.id === commentId
                  ? { ...comment, liked: result.liked, likesCount: result.likesCount }
                  : comment,
              ),
            }
          : current,
      )
    })
  }

  return (
    <div className="min-h-screen bg-background py-24 px-5 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link 
            href="/community" 
            className="group flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
            Назад к списку тем
          </Link>
        </div>

        <article className="mb-12 rounded-2xl border border-border bg-card p-6 lg:p-10 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex w-fit items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {post.category}
            </span>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                {post.date}
              </span>
              {post.editedAt ? <span>изменено {post.editedAt}</span> : null}
              <span className="flex items-center gap-1.5">
                <Eye className="size-4" />
                {post.viewCount}
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="size-4" />
                {comments.length} ответов
              </span>
            </div>
          </div>

          <h1 className="mb-6 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 mb-8 p-3 rounded-lg bg-muted/50 w-fit">
            <div className="size-10 rounded-full bg-background flex items-center justify-center border border-border">
              <User className="size-5 text-muted-foreground" />
            </div>
            <div className="text-sm">
              <p className="font-semibold text-foreground">{post.author}</p>
              <p className="text-muted-foreground">Автор темы</p>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg leading-relaxed text-foreground whitespace-pre-wrap">
              {post.content}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
              onClick={likePost}
            >
              <Heart className={cn("size-4", post.liked && "fill-primary text-primary")} />
              {post.likesCount}
            </button>
            {canEdit ? <CreateTopicModal post={post} onUpdated={setPost} /> : null}
          </div>
        </article>

        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-2xl font-bold text-foreground">
              Обсуждение
            </h2>
            <span className="text-sm text-muted-foreground">
              {comments.length} комментариев
            </span>
          </div>

          <div className="space-y-4">
            {comments.length > 0 ? (
              <CommentThread
                comments={comments}
                canInteract={canInteract}
                currentUserId={user?.id}
                onReply={async (parentId, body) => {
                  appendComment(await forumApi.addComment(post.slug, body, parentId))
                }}
                onLike={likeComment}
                onEdit={async (commentId, body) => {
                  const updated = await forumApi.updateComment(post.slug, commentId, body)
                  setPost((current) =>
                    current
                      ? {
                          ...current,
                          comments: current.comments.map((comment) =>
                            comment.id === commentId ? updated : comment,
                          ),
                        }
                      : current,
                  )
                }}
              />
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">
                  Обсуждение пока пусто. Будьте первым, кто оставит комментарий!
                </p>
              </div>
            )}
          </div>

          <CommentForm slug={post.slug} onCommentAdded={appendComment} />
        </section>
      </div>
    </div>
  )
}
