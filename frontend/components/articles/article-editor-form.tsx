"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MarkdownEditor } from "@/components/articles/markdown-editor"
import { articlesApi } from "@/lib/articles/api-client"
import { ContentRequestError } from "@/lib/content-request"
import { useAuth } from "@/lib/auth-context"
import { isStaff } from "@/lib/content-utils"
import type { Article, ContentCategory } from "@/lib/types"

type ArticleEditorFormProps = {
  article?: Article
}

export function ArticleEditorForm({ article }: ArticleEditorFormProps) {
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [title, setTitle] = useState(article?.title ?? "")
  const [excerpt, setExcerpt] = useState(article?.excerpt ?? "")
  const [categoryId, setCategoryId] = useState(article?.categoryId ?? "")
  const [coverUrl, setCoverUrl] = useState(article?.imageUrl ?? "")
  const [content, setContent] = useState(article?.content ?? "")
  const [slug, setSlug] = useState(article?.slug ?? "")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState<"save" | "submit" | "publish" | null>(null)
  const canPublishDirectly = Boolean(user?.canPublishArticles || isStaff(user?.role))

  useEffect(() => {
    void articlesApi.listCategories().then((rows) => {
      setCategories(rows)
      setCategoryId((current) => current || rows[0]?.id || "")
    })
  }, [])

  const payload = () => ({
    title,
    excerpt,
    content,
    categoryId,
    coverUrl: coverUrl.trim(),
  })

  const persist = async () => {
    if (slug) {
      return articlesApi.update(slug, payload())
    }
    const created = await articlesApi.create(payload())
    setSlug(created.slug)
    return created
  }

  const run = async (mode: "save" | "submit" | "publish") => {
    setBusy(mode)
    setError("")
    try {
      const saved = await persist()
      let next = saved
      if (mode === "submit") next = await articlesApi.submit(saved.slug)
      if (mode === "publish") next = await articlesApi.publish(saved.slug)
      await refreshUser()
      if (mode === "save") {
        router.replace(`/articles/${next.slug}/edit`)
        return
      }
      router.push(mode === "publish" ? `/articles/${next.slug}` : "/articles/studio")
    } catch (err) {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось сохранить статью.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <RequireAuth requireVerified>
      <div className="mx-auto max-w-6xl px-5 py-24 lg:px-8">
        <div className="mb-10 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            {article ? "Редактирование статьи" : "Новая статья"}
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            {canPublishDirectly
              ? "Вы можете публиковать материалы сразу в ленту или сохранить черновик."
              : "Первая статья проходит модерацию. После одобрения следующие можно публиковать сразу."}
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Заголовок</label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Подзаголовок</label>
            <Textarea
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              className="min-h-[80px]"
              placeholder="Кратко, о чём материал"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Категория</label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Обложка (URL)</label>
              <Input
                value={coverUrl}
                onChange={(event) => setCoverUrl(event.target.value)}
                placeholder="https://"
              />
            </div>
          </div>
          <MarkdownEditor value={content} onChange={setContent} />
          {article?.moderationNote ? (
            <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
              Комментарий модератора: {article.moderationNote}
            </p>
          ) : null}
          {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" disabled={Boolean(busy)} onClick={() => void run("save")}>
              {busy === "save" ? "Сохранение…" : "Сохранить черновик"}
            </Button>
            <Button type="button" disabled={Boolean(busy)} onClick={() => void run("submit")}>
              {busy === "submit"
                ? "Отправка…"
                : canPublishDirectly
                  ? "Отправить / опубликовать"
                  : "Отправить на модерацию"}
            </Button>
            {canPublishDirectly ? (
              <Button type="button" disabled={Boolean(busy)} onClick={() => void run("publish")}>
                {busy === "publish" ? "Публикация…" : "Опубликовать"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </RequireAuth>
  )
}
