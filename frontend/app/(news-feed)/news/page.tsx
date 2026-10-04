"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { List, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ContentEnter } from "@/components/content-enter"
import { NewsCard } from "@/components/news/news-card"
import { NewsListItem } from "@/components/news/news-list-item"
import { PromotionCard } from "@/components/news/promotion-card"
import { newsApi, promotionsApi } from "@/lib/feed/api-client"
import { formatFeedDate, isPromotionCurrent } from "@/lib/feed/format"
import { useHasBanner } from "@/lib/promotions/presence"
import { cn } from "@/lib/utils"
import type { IndustryNews, Promotion } from "@/lib/types"

type FilterType = "all" | "active-promotion" | "news"
type ViewMode = "grid" | "list"
type FeedItem =
  | { type: "promotion"; data: Promotion; date: string; sortDate: number }
  | { type: "news"; data: IndustryNews; date: string; sortDate: number }

export default function NewsPage() {
  const hasBanner = useHasBanner()
  const [news, setNews] = useState<IndustryNews[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [error, setError] = useState("")

  useEffect(() => {
    void Promise.all([newsApi.listPublished(), promotionsApi.listPublic()])
      .then(([nextNews, nextPromotions]) => {
        setNews(nextNews)
        setPromotions(nextPromotions)
      })
      .catch(() => setError("Не удалось загрузить ленту."))
  }, [])

  const feed = useMemo<FeedItem[]>(() => {
    const combined: FeedItem[] = [
      ...promotions.map((item) => ({
        type: "promotion" as const,
        data: item,
        date: formatFeedDate(item.createdAt),
        sortDate: new Date(item.createdAt).getTime(),
      })),
      ...news.map((item) => ({
        type: "news" as const,
        data: item,
        date: formatFeedDate(item.publishedAt ?? item.createdAt),
        sortDate: new Date(item.publishedAt ?? item.createdAt).getTime(),
      })),
    ]
    return combined.sort((a, b) => b.sortDate - a.sortDate)
  }, [news, promotions])

  const filteredFeed = useMemo(() => {
    if (activeFilter === "news") return feed.filter((item) => item.type === "news")
    if (activeFilter === "active-promotion") {
      return feed.filter((item) => item.type === "promotion" && isPromotionCurrent(item.data.expiresAt))
    }
    return feed
  }, [activeFilter, feed])

  return (
    <div className={cn("min-h-screen px-5 py-24 lg:px-8", !hasBanner ? "bg-muted/30" : "bg-background")}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-left">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Новости и предложения</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Актуальные акции нашего фонда и аналитика рынка. Взгляд сквозь призму 25-летнего опыта в индустрии натурального камня.
          </p>
        </div>
        {error ? <p className="mb-6 text-sm text-destructive">{error}</p> : null}
        <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "Все"],
                ["active-promotion", "Актуальные спецпредложения"],
                ["news", "Новости"],
              ] as const
            ).map(([id, label]) => (
              <Button
                key={id}
                variant={activeFilter === id ? "default" : "outline"}
                onClick={() => setActiveFilter(id)}
                className="rounded-full px-5"
              >
                {label}
              </Button>
            ))}
          </div>
          <div className="flex w-fit items-center gap-1 rounded-lg bg-secondary p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={cn("size-8 rounded-md", viewMode === "grid" && "bg-background text-foreground shadow-sm")}
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={cn("size-8 rounded-md", viewMode === "list" && "bg-background text-foreground shadow-sm")}
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
        <ContentEnter swapKey={`${activeFilter}-${viewMode}`}>
          {filteredFeed.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFeed.map((item) =>
                  item.type === "promotion" ? (
                    <PromotionCard key={item.data.id} promotion={item.data} />
                  ) : (
                    <NewsCard key={item.data.id} news={item.data} />
                  ),
                )}
              </div>
            ) : (
              <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
                {filteredFeed.map((item) => (
                  <NewsListItem key={item.data.id} item={item} />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-secondary/10 py-24 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <List className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Ничего не найдено</h3>
              <p className="mx-auto mt-2 max-w-xs text-muted-foreground">
                В этой категории пока нет записей. Попробуйте сменить фильтр.
              </p>
            </div>
          )}
        </ContentEnter>
        <div className="mt-24 flex justify-center sm:justify-start">
          <Button variant="ghost" asChild>
            <Link href="/">Вернуться на главную</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
