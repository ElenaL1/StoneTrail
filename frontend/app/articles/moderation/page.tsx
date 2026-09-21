"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { articlesApi } from "@/lib/articles/api-client"
import { ContentRequestError } from "@/lib/content-request"
import { ARTICLE_STATUS_LABELS, isStaff } from "@/lib/content-utils"
import { useAuth } from "@/lib/auth-context"
import type { Article } from "@/lib/types"

export default function ArticlesModerationPage() {
  const { isReady, user, refreshUser } = useAuth()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isReady) return
    if (!user) return
    if (!isStaff(user.role)) {
      router.replace("/articles")
      return
    }
    void articlesApi.listModeration()
      .then(setArticles)
      .catch(() => setError("Не удалось загрузить очередь."))
  }, [isReady, router, user])

  const act = async (
    slug: string,
    action: "publish" | "request_changes" | "reject" | "revoke_privilege",
  ) => {
    setError("")
    try {
      const updated = await articlesApi.moderate(slug, action, notes[slug] ?? "")
      await refreshUser()
      setArticles((current) =>
        action === "revoke_privilege"
          ? current.map((item) => (item.slug === slug ? updated : item))
          : current.filter((item) => item.slug !== slug),
      )
    } catch (err) {
      setError(err instanceof ContentRequestError ? err.message : "Не удалось выполнить действие.")
    }
  }

  return (
    <RequireAuth requireVerified>
      <div className="mx-auto max-w-5xl px-5 py-24 lg:px-8">
        <div className="mb-10 space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Очередь модерации</h1>
          <p className="max-w-2xl text-muted-foreground">
            Первая статья автора появляется здесь. После публикации он сможет писать без повторного одобрения.
          </p>
        </div>
        {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
        {articles.length === 0 ? (
          <p className="text-muted-foreground">Сейчас нет материалов на проверке.</p>
        ) : (
          <div className="space-y-5">
            {articles.map((article) => (
              <article key={article.id} className="space-y-4 rounded-2xl border border-border bg-card p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {ARTICLE_STATUS_LABELS[article.publicationStatus]} · {article.author} · {article.category}
                    </p>
                    <h2 className="text-xl font-semibold">{article.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{article.excerpt}</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/articles/${article.slug}`}>Открыть</Link>
                  </Button>
                </div>
                <Textarea
                  value={notes[article.slug] ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [article.slug]: event.target.value }))}
                  placeholder="Комментарий автору при возврате или отклонении"
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void act(article.slug, "publish")}>Опубликовать</Button>
                  <Button size="sm" variant="outline" onClick={() => void act(article.slug, "request_changes")}>
                    Вернуть на правки
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => void act(article.slug, "reject")}>
                    Отклонить
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void act(article.slug, "revoke_privilege")}>
                    Снять прямую публикацию
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  )
}
