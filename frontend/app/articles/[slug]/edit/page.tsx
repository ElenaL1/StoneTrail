"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArticleEditorForm } from "@/components/articles/article-editor-form"
import { articlesApi } from "@/lib/articles/api-client"
import type { Article } from "@/lib/types"

export default function EditArticlePage() {
  const params = useParams()
  const slug = String(params.slug ?? "")
  const [article, setArticle] = useState<Article | null | undefined>(undefined)

  useEffect(() => {
    if (!slug) return
    void articlesApi.get(slug).then(setArticle)
  }, [slug])

  if (article === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-24">
        <p className="text-muted-foreground">Статья не найдена</p>
      </div>
    )
  }

  return <ArticleEditorForm article={article} />
}
