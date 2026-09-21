"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { RequireAuth } from "@/components/auth/require-auth"
import { Button } from "@/components/ui/button"
import { articlesApi } from "@/lib/articles/api-client"
import { ARTICLE_STATUS_LABELS } from "@/lib/content-utils"
import type { Article } from "@/lib/types"

export default function ArticlesStudioPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    void articlesApi.listMine()
      .then(setArticles)
      .catch(() => setError("Не удалось загрузить мастерскую."))
  }, [])

  return (
    <RequireAuth requireVerified>
      <div className="mx-auto max-w-5xl px-5 py-24 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Мастерская</h1>
            <p className="max-w-2xl text-muted-foreground">
              Черновики, материалы на модерации и опубликованные статьи.
            </p>
          </div>
          <Button asChild>
            <Link href="/articles/new">Новая статья</Link>
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <p className="text-muted-foreground">Пока нет материалов. Напишите первую статью.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((article) => (
              <div
                key={article.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-foreground">{article.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {ARTICLE_STATUS_LABELS[article.publicationStatus]} · {article.date}
                  </p>
                  {article.moderationNote ? (
                    <p className="mt-2 text-sm text-muted-foreground">{article.moderationNote}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {article.publicationStatus === "published" ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/articles/${article.slug}`}>Открыть</Link>
                    </Button>
                  ) : null}
                  <Button asChild size="sm">
                    <Link href={`/articles/${article.slug}/edit`}>Редактировать</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  )
}
