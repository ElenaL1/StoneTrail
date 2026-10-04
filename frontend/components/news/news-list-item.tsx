"use client"

import Link from "next/link"
import { Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FeedLikeButton } from "@/components/news/feed-like-button"
import { formatFeedDate } from "@/lib/feed/format"
import type { IndustryNews, Promotion } from "@/lib/types"

export function NewsListItem({
  item,
}: {
  item:
    | { type: "promotion"; data: Promotion; date: string }
    | { type: "news"; data: IndustryNews; date: string }
}) {
  const isPromo = item.type === "promotion"
  const slug = item.data.slug
  const summary = isPromo ? item.data.description : item.data.excerpt
  return (
    <div className="group flex items-center justify-between gap-4 border-b border-border bg-transparent p-4 transition-colors hover:bg-muted/50">
      <div className="flex min-w-0 flex-1 items-center gap-6 overflow-hidden">
        <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-muted-foreground">
          <Calendar className="size-3" />
          {item.date}
        </span>
        {isPromo ? (
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
            Спецпредложение
          </Badge>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-baseline gap-2">
            <Link
              href={isPromo ? `/promotions/${slug}` : `/news/${slug}`}
              className="min-w-0 truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary"
            >
              {item.data.title}
            </Link>
            {isPromo ? (
              <span className="shrink-0 whitespace-nowrap text-xs font-medium italic text-muted-foreground/60">
                Действительно до {formatFeedDate(item.data.expiresAt)}
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">{summary}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <FeedLikeButton
          slug={slug}
          kind={isPromo ? "promotion" : "news"}
          liked={item.data.liked}
          count={item.data.likesCount}
        />
        <Button size="sm" asChild variant={isPromo ? "outline" : "ghost"} className="h-8 px-3">
          <Link href={isPromo ? `/promotions/${slug}` : `/news/${slug}`}>{isPromo ? "Детали" : "Читать"}</Link>
        </Button>
      </div>
    </div>
  )
}
