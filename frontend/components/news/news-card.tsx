"use client"

import Link from "next/link"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeedLikeButton } from "@/components/news/feed-like-button"
import { formatFeedDate } from "@/lib/feed/format"
import type { IndustryNews } from "@/lib/types"

export function NewsCard({ news }: { news: IndustryNews }) {
  const date = formatFeedDate(news.publishedAt ?? news.createdAt)
  return (
    <div className="group flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Calendar className="size-3" />
        {date}
      </span>
      <h3 className="text-xl font-semibold transition-colors group-hover:text-primary">{news.title}</h3>
      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{news.excerpt}</p>
      <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4">
        <FeedLikeButton slug={news.slug} kind="news" liked={news.liked} count={news.likesCount} />
        <Button asChild variant="ghost" size="sm">
          <Link href={`/news/${news.slug}`}>Читать далее</Link>
        </Button>
      </div>
    </div>
  )
}
