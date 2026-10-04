"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { articlesApi } from "@/lib/articles/api-client"
import { useAuth } from "@/lib/auth-context"
import { ARTICLE_STATUS_LABELS, isAdmin } from "@/lib/content-utils"
import { ContentRequestError } from "@/lib/content-request"
import type { Article } from "@/lib/types"

export default function AdminArticlesPage() {
  const { user } = useAuth()
  const [queue, setQueue] = useState<Article[]>([])
  const [published, setPublished] = useState<Article[]>([])
  const [deleted, setDeleted] = useState<Article[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [error, setError] = useState("")

  const load = async () => {
    const [nextQueue, nextPublished, nextDeleted] = await Promise.all([
      articlesApi.listModeration(),
      articlesApi.listManaged(false),
      articlesApi.listManaged(true),
    ])
    setQueue(nextQueue)
    setPublished(nextPublished)
    setDeleted(nextDeleted)
  }

  useEffect(() => {
    void load().catch((err: unknown) => {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось загрузить статьи.")
    })
  }, [])

  const act = async (slug: string, action: "publish" | "request_changes" | "reject") => {
    setError("")
    try {
      await articlesApi.moderate(slug, action, notes[slug] ?? "")
      await load()
    } catch (err) {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось выполнить действие.")
    }
  }

  return (
    <div className="space-y-10">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">На проверке</h2>
        {queue.length === 0 ? <p className="text-sm text-muted-foreground">Очередь пуста.</p> : null}
        {queue.map((article) => (
          <article key={article.id} className="space-y-3 rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">{ARTICLE_STATUS_LABELS[article.publicationStatus]} · {article.author}</p>
                <h3 className="font-semibold">{article.title}</h3>
              </div>
              <Button asChild variant="outline" size="sm"><Link href={`/articles/${article.slug}`}>Открыть</Link></Button>
            </div>
            <Textarea value={notes[article.slug] ?? ""} onChange={(event) => setNotes({ ...notes, [article.slug]: event.target.value })} placeholder="Комментарий автору" />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void act(article.slug, "publish")}>Опубликовать</Button>
              <Button size="sm" variant="outline" onClick={() => void act(article.slug, "request_changes")}>Вернуть</Button>
              <Button size="sm" variant="outline" onClick={() => void act(article.slug, "reject")}>Отклонить</Button>
            </div>
          </article>
        ))}
      </section>
      <ArticleList title="Опубликованные" articles={published} canDelete={isAdmin(user?.role)} onDelete={async (slug) => { await articlesApi.remove(slug); await load() }} onError={setError} />
      <ArticleList title="Удалённые" articles={deleted} canRestore={isAdmin(user?.role)} onRestore={async (slug) => { await articlesApi.restore(slug); await load() }} onError={setError} />
    </div>
  )
}

function ArticleList({
  title,
  articles,
  canDelete,
  canRestore,
  onDelete,
  onRestore,
  onError,
}: {
  title: string
  articles: Article[]
  canDelete?: boolean
  canRestore?: boolean
  onDelete?: (slug: string) => Promise<void>
  onRestore?: (slug: string) => Promise<void>
  onError: (message: string) => void
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {articles.length === 0 ? <p className="text-sm text-muted-foreground">Нет записей.</p> : null}
      {articles.map((article) => (
        <div key={article.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3">
          <div>
            <p className="font-medium">{article.title}</p>
            <p className="text-xs text-muted-foreground">{article.author}</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link href={`/articles/${article.slug}`}>Открыть</Link></Button>
            {canDelete && onDelete ? (
              <Button size="sm" variant="outline" onClick={() => void onDelete(article.slug).catch((err: unknown) => onError(err instanceof ContentRequestError ? err.message : "Не удалось удалить."))}>Удалить</Button>
            ) : null}
            {canRestore && onRestore ? (
              <Button size="sm" variant="outline" onClick={() => void onRestore(article.slug).catch((err: unknown) => onError(err instanceof ContentRequestError ? err.message : "Не удалось восстановить."))}>Восстановить</Button>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  )
}
