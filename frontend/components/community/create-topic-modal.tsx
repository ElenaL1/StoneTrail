"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { forumApi } from "@/lib/forum/api-client"
import { ContentRequestError } from "@/lib/content-request"
import { mediaApi } from "@/lib/media/api"
import { uploadToPresignedUrl } from "@/lib/media/upload"
import type { ContentCategory, ForumAttachment, ForumPost } from "@/lib/types"
import { Pencil, PlusCircle } from "lucide-react"

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const VIDEO_TYPES = ["video/mp4", "video/webm"]
const MAX_IMAGES = 4

type Draft = {
  key: string
  id: string
  kind: ForumAttachment["kind"]
  name: string
  publicUrl: string
  progress: number
  error: string
}

function readyIds(drafts: Draft[]): string[] {
  return drafts.filter((item) => item.publicUrl && !item.error).map((item) => item.id)
}

type CreateTopicModalProps = {
  post?: ForumPost
  categoryCode?: string
  onCreated?: () => void
  onUpdated?: (post: ForumPost) => void
}

function categoryIdForCode(rows: ContentCategory[], code?: string): string {
  if (!code) return ""
  return rows.find((row) => row.code === code)?.id ?? ""
}

export function CreateTopicModal({ post, categoryCode, onCreated, onUpdated }: CreateTopicModalProps) {
  const { isReady, user } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [title, setTitle] = useState(post?.title ?? "")
  const [categoryId, setCategoryId] = useState(post?.categoryId ?? "")
  const [content, setContent] = useState(post?.content ?? "")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [videoMode, setVideoMode] = useState<"file" | "rutube">("file")
  const [rutubeUrl, setRutubeUrl] = useState("")

  useEffect(() => {
    if (!user?.emailVerified) return
    let cancelled = false
    void forumApi
      .listCategories()
      .then((rows) => {
        if (cancelled) return
        setCategories(rows)
        if (rows.length === 0) {
          setError("Не удалось загрузить категории. Попробуйте обновить страницу.")
        }
      })
      .catch(() => {
        if (cancelled) return
        setError("Не удалось загрузить категории. Попробуйте обновить страницу.")
      })
    return () => {
      cancelled = true
    }
  }, [post?.categoryId, user?.emailVerified])

  useEffect(() => {
    if (!open) return
    if (post) {
      setDrafts(
        (post.attachments ?? []).map((item) => ({
          key: item.id,
          id: item.id,
          kind: item.kind,
          name: item.alt || (item.kind === "image" ? "Изображение" : "Видео"),
          publicUrl: item.publicUrl,
          progress: 100,
          error: "",
        })),
      )
      setVideoMode(post.attachments?.some((item) => item.kind === "external_video") ? "rutube" : "file")
      setRutubeUrl("")
      return
    }
    setTitle("")
    setContent("")
    setError("")
    setDrafts([])
    setVideoMode("file")
    setRutubeUrl("")
  }, [open, post])

  useEffect(() => {
    if (!open) return
    if (post) {
      setTitle(post.title)
      setCategoryId(post.categoryId)
      setContent(post.content)
      return
    }
    setCategoryId(categoryIdForCode(categories, categoryCode))
  }, [open, post, categoryCode, categories])

  const imageCount = drafts.filter((item) => item.kind === "image" && !item.error).length
  const videoDraft = drafts.find((item) => item.kind !== "image" && !item.error)
  const uploading = drafts.some((item) => !item.publicUrl && !item.error)

  const patchDraft = (key: string, patch: Partial<Draft>) => {
    setDrafts((current) => current.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  }

  const uploadFile = async (file: File, purpose: "forum_image" | "forum_video") => {
    const key = crypto.randomUUID()
    const kind = purpose === "forum_image" ? "image" : "video"
    setDrafts((current) => [
      ...current.filter((item) => purpose === "forum_image" || item.kind === "image"),
      { key, id: key, kind, name: file.name, publicUrl: "", progress: 0, error: "" },
    ])
    try {
      const presign = await mediaApi.init(purpose, file.type, file.size)
      await uploadToPresignedUrl(presign.uploadUrl, file, presign.headers, (progress) => {
        patchDraft(key, { progress })
      })
      const saved = await mediaApi.complete(presign.id)
      patchDraft(key, {
        id: saved.id,
        publicUrl: saved.publicUrl,
        progress: 100,
        error: "",
        kind: saved.kind as Draft["kind"],
      })
    } catch (err) {
      patchDraft(key, {
        error: err instanceof ContentRequestError ? err.message : "Не удалось загрузить файл.",
        progress: 0,
      })
    }
  }

  const addImages = (files: File[]) => {
    const room = MAX_IMAGES - imageCount
    files.slice(0, Math.max(room, 0)).forEach((file) => {
      if (!IMAGE_TYPES.includes(file.type)) {
        setError("Допустимы изображения JPEG, PNG и WebP.")
        return
      }
      void uploadFile(file, "forum_image")
    })
  }

  const addVideo = (file: File | undefined) => {
    if (!file) return
    if (!VIDEO_TYPES.includes(file.type)) {
      setError("Допустимы видео MP4 и WebM.")
      return
    }
    setRutubeUrl("")
    void uploadFile(file, "forum_video")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.emailVerified) return
    if (!categoryId) {
      setError(
        categories.length === 0
          ? "Не удалось загрузить категории. Попробуйте обновить страницу."
          : "Выберите категорию.",
      )
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const attachmentIds = [...readyIds(drafts)]
      const hasVideo = drafts.some((item) => item.kind !== "image" && item.publicUrl && !item.error)
      if (videoMode === "rutube" && rutubeUrl.trim() && !hasVideo) {
        const external = await mediaApi.external(rutubeUrl.trim())
        attachmentIds.push(external.id)
      }
      if (post) {
        const updated = await forumApi.updatePost(post.slug, {
          title,
          categoryId,
          content,
          attachmentIds,
        })
        setOpen(false)
        onUpdated?.(updated)
        onCreated?.()
        return
      }
      const created = await forumApi.createPost({ title, categoryId, content, attachmentIds })
      setOpen(false)
      setTitle("")
      setContent("")
      onCreated?.()
      router.push(`/community/${created.slug}`)
    } catch (err) {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось создать тему.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isReady || !user) {
    return null
  }

  if (!user.emailVerified) {
    return (
      <Button asChild className="gap-2">
        <Link href="/verify-email">
          <PlusCircle className="size-4" />
          Подтвердите email, чтобы создать тему
        </Link>
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" variant={post ? "outline" : "default"}>
          {post ? <Pencil className="size-4" /> : <PlusCircle className="size-4" />}
          {post ? "Редактировать" : "Создать тему"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{post ? "Редактировать тему" : "Создать новую тему"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Заголовок</label>
            <Input
              placeholder="Введите название темы..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Категория</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Выбрать категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Изображения</label>
            <Input
              type="file"
              accept={IMAGE_TYPES.join(",")}
              multiple
              disabled={imageCount >= MAX_IMAGES}
              onChange={(event) => {
                addImages(Array.from(event.target.files ?? []))
                event.target.value = ""
              }}
            />
            <p className="text-xs text-muted-foreground">До 4 изображений, каждое до 10 МБ.</p>
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">Видео</legend>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="video-mode"
                  checked={videoMode === "file"}
                  onChange={() => {
                    setVideoMode("file")
                    setRutubeUrl("")
                    setDrafts((current) => current.filter((item) => item.kind !== "external_video"))
                  }}
                />
                Загрузить файл
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="video-mode"
                  checked={videoMode === "rutube"}
                  onChange={() => {
                    setVideoMode("rutube")
                    setDrafts((current) =>
                      current.filter(
                        (item) => item.kind === "image" || item.kind === "external_video",
                      ),
                    )
                  }}
                />
                Ссылка Rutube
              </label>
            </div>
            {videoMode === "file" ? (
              <Input
                type="file"
                accept={VIDEO_TYPES.join(",")}
                disabled={Boolean(videoDraft)}
                onChange={(event) => {
                  addVideo(event.target.files?.[0])
                  event.target.value = ""
                }}
              />
            ) : (
              <Input
                placeholder="https://rutube.ru/video/..."
                value={rutubeUrl}
                onChange={(event) => setRutubeUrl(event.target.value)}
              />
            )}
            <p className="text-xs text-muted-foreground">Одно видео: MP4 или WebM до 100 МБ, либо ссылка Rutube.</p>
          </fieldset>
          {drafts.length > 0 ? (
            <ul className="space-y-2">
              {drafts.map((item) => (
                <li key={item.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    {item.name}
                    {item.publicUrl ? "" : item.error ? "" : ` · ${item.progress}%`}
                    {item.error ? ` · ${item.error}` : ""}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8"
                    onClick={() => setDrafts((current) => current.filter((row) => row.key !== item.key))}
                  >
                    Убрать
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Сообщение</label>
            <Textarea
              placeholder="Опишите ваш вопрос или поделитесь опытом..."
              className="min-h-[150px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          ) : null}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Отменить
            </Button>
            <Button type="submit" disabled={submitting || uploading || !categoryId}>
              {submitting ? "Сохранение…" : post ? "Сохранить" : "Опубликовать"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
