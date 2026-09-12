"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { Promotion, IndustryNews } from "@/lib/mock-data"
import { PromotionCard } from "@/components/news/promotion-card"
import { NewsCard } from "@/components/news/news-card"
import { NewsListItem } from "@/components/news/news-list-item"
import { arePromotionsEnabled, isPromotionActive } from "@/lib/promo-utils"
import { useNews } from "@/lib/news-context"

type FilterType = "all" | "active-promotion" | "news"
type ViewMode = "grid" | "list"

function parseRussianDate(dateStr: string): Date {
  const months: Record<string, number> = {
    "января": 0, "февраля": 1, "марта": 2, "апреля": 3, "мая": 4, "июня": 5,
    "июля": 6, "августа": 7, "сентября": 8, "октября": 9, "ноября": 10, "декабря": 11
  };
  
  const parts = dateStr.split(' ');
  if (parts.length < 3) return new Date(0);
  
  const day = parseInt(parts[0]);
  const month = months[parts[1].toLowerCase()];
  const year = parseInt(parts[2]);
  
  return new Date(year, month, day);
}

export default function NewsPage() {
  const { news, promotions } = useNews()
  const [activeFilter, setActiveFilter] = useState<FilterType>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const isBannerEnabled = arePromotionsEnabled()

  const feed = useMemo(() => {
    const combined = [
      ...promotions.map(p => ({
        type: 'promotion' as const,
        data: p,
        date: p.createdAt,
        sortDate: parseRussianDate(p.createdAt)
      })),
      ...news.map(n => ({
        type: 'news' as const,
        data: n,
        date: n.date,
        sortDate: parseRussianDate(n.date)
      }))
    ]

    return combined.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
  }, [news, promotions])

  const filteredFeed = useMemo(() => {
    if (activeFilter === "all") return feed
    if (activeFilter === "active-promotion") {
      return feed.filter(
        (i) => i.type === "promotion" && isPromotionActive(i.data as Promotion)
      )
    }
    return feed.filter(i => i.type === 'news')
  }, [feed, activeFilter])

  return (
    <div className={cn("min-h-screen py-24 px-5 lg:px-8", !isBannerEnabled ? "bg-muted/30" : "bg-background")}>
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 text-left">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Новости и предложения
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Актуальные акции нашего фонда и аналитика рынка. 
          Взгляд сквозь призму 25-летнего опыта в индустрии натурального камня.
        </p>
      </div>

      <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={activeFilter === "all" ? "default" : "outline"} 
            onClick={() => setActiveFilter("all")}
            className="rounded-full px-5"
          >
            Все
          </Button>
          <Button 
            variant={activeFilter === "active-promotion" ? "default" : "outline"} 
            onClick={() => setActiveFilter("active-promotion")}
            className="rounded-full px-5"
          >
            Актуальные спецпредложения
          </Button>
          <Button 
            variant={activeFilter === "news" ? "default" : "outline"} 
            onClick={() => setActiveFilter("news")}
            className="rounded-full px-5"
          >
            Новости
          </Button>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-secondary p-1 w-fit">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode("grid")}
            className={cn("size-8 rounded-md transition-all", viewMode === "grid" && "bg-background text-foreground shadow-sm")}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setViewMode("list")}
            className={cn("size-8 rounded-md transition-all", viewMode === "list" && "bg-background text-foreground shadow-sm")}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {filteredFeed.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFeed.map((item) => (
              item.type === 'promotion' 
                ? <PromotionCard key={item.data.id} promotion={item.data as Promotion} />
                : <NewsCard key={item.data.id} news={item.data as IndustryNews} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col border border-border rounded-2xl bg-card overflow-hidden">
            {filteredFeed.map((item) => (
              <NewsListItem key={item.data.id} item={item as any} />
            ))}
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-3xl bg-secondary/10">
          <div className="mb-4 rounded-full bg-muted p-4">
            <List className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Ничего не найдено</h3>
          <p className="text-muted-foreground max-w-xs mx-auto mt-2">
            В этой категории пока нет записей. Попробуйте сменить фильтр.
          </p>
        </div>
      )}

      <div className="mt-24 flex justify-center sm:justify-start">
        <Button variant="ghost" asChild>
          <Link href="/">Вернуться на главную</Link>
        </Button>
      </div>
    </div>
    </div>
  )
}
