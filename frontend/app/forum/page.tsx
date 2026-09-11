"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Search, 
  PlusCircle 
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { arePromotionsEnabled } from "@/lib/promo-utils"

export default function ForumPage() {
  const isBannerEnabled = arePromotionsEnabled();

  const categories = [
    { name: "Технологии обработки", topics: 124, active: true },
    { name: "Рынок натурального камня", topics: 89, active: false },
    { name: "Инструменты и оборудование", topics: 67, active: true },
    { name: "Дизайн и архитектура", topics: 45, active: false },
  ]

  const trendingTopics = [
    { title: "Сравнение новых абразивов для полировки", replies: 24, author: "MasterStone" },
    { title: "Тренды в использовании кварцита 2025", replies: 18, author: "DesignExpert" },
    { title: "Проблемы с логистикой из Италии", replies: 42, author: "LogisticsPro" },
  ]

  return (
    <div className={cn("min-h-screen py-24 px-5 lg:px-8", !isBannerEnabled ? "bg-muted/30" : "bg-background")}>
      <div className="mx-auto max-w-7xl">
      <div className="mb-12 text-left">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Форум
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Профессиональное сообщество камнерезов, архитекторов и поставщиков. 
          Обмен опытом, обсуждение технологий и анализ индустрии.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-12">
          {/* Topics Section */}
          <section>
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="text-primary" size={24} />
                <h2 className="text-2xl font-bold tracking-tight">Последние обсуждения</h2>
              </div>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/contact">
                  <PlusCircle size={18} /> Создать тему
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {trendingTopics.map((topic, idx) => (
                <div 
                  key={idx} 
                  className="group flex items-center justify-between rounded-2xl border border-border p-5 transition-colors hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors cursor-pointer">
                      {topic.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Автор: {topic.author}</span>
                      <span>{topic.replies} ответов</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="#">Перейти</Link>
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Categories Section */}
          <section>
            <div className="mb-8 flex items-center gap-3">
              <Users className="text-primary" size={24} />
              <h2 className="text-2xl font-bold tracking-tight">Категории</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {categories.map((cat, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between rounded-2xl border border-border p-5 bg-card"
                >
                  <div className="flex items-center gap-3">
                    {cat.active && <div className="h-2 w-2 rounded-full bg-green-500" />}
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{cat.topics} тем</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Search Widget */}
          <div className="rounded-3xl border border-border bg-secondary/30 p-6">
            <h3 className="mb-4 font-semibold flex items-center gap-2">
              <Search size={18} /> Поиск по форуму
            </h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Поиск темы..." 
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Button size="sm">Найти</Button>
            </div>
          </div>

          {/* Trending Widget */}
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center gap-2 font-semibold">
              <TrendingUp size={18} className="text-primary" /> Популярное
            </div>
            <ul className="space-y-4">
              {[
                "Особенности работы с кварцитом",
                "Сравнение брендов алмазного инструмента",
                "Нормы безопасности в цеху"
              ].map((item, idx) => (
                <li key={idx} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors flex items-start gap-2">
                  <span className="text-primary font-bold">{idx + 1}.</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
