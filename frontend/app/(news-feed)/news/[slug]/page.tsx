"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { FeedLikeButton } from "@/components/news/feed-like-button"
import { newsApi } from "@/lib/feed/api-client"
import { formatFeedDate } from "@/lib/feed/format"
import { isNotFound } from "@/lib/content-request"
import type { IndustryNews } from "@/lib/types"

export default function NewsDetailPage() {
  const params = useParams<{ slug: string }>()
  const [item, setItem] = useState<IndustryNews | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!params.slug) return
    void newsApi
      .get(params.slug)
      .then(setItem)
      .catch((error: unknown) => {
        if (isNotFound(error)) setMissing(true)
      })
  }, [params.slug])

  if (missing) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-xl text-muted-foreground">Новость не найдена</p>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-24 lg:px-8">
      <Link href="/news" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft className="size-4" />
        Назад к новостям
      </Link>
      <article className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              Новость индустрии
            </Badge>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              {formatFeedDate(item.publishedAt ?? item.createdAt)}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{item.title}</h1>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <p className="text-lg leading-relaxed text-muted-foreground">{item.excerpt}</p>
            <FeedLikeButton slug={item.slug} kind="news" liked={item.liked} count={item.likesCount} className="gap-2" />
          </div>
        </div>
        <div className="whitespace-pre-wrap text-lg leading-relaxed text-foreground">{item.content}</div>
      </article>
    </div>
  )
}
