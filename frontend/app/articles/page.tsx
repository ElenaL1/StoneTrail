"use client"

import React, { useState } from "react"
import { articleCategories } from "@/lib/mock-data"
import { useArticles } from "@/lib/article-context"
import { useAuth } from "@/lib/auth-context"
import { OpenAuthButton } from "@/components/auth/open-auth-button"
import { ArticleCard } from "@/components/articles/article-card"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { arePromotionsEnabled } from "@/lib/promo-utils"
import { ContentEnter } from "@/components/content-enter"

type SortOption = "newest" | "popular" | "favorites"
type CategoryFilter = "all" | (typeof articleCategories)[number]

export default function ArticlesPage() {
  const { articles } = useArticles()
  const { user } = useAuth()
  const [sort, setSort] = useState<SortOption>("newest")
  const [category, setCategory] = useState<CategoryFilter>("all")
  const isBannerEnabled = arePromotionsEnabled();

  const sortedArticles = [...articles].sort((a, b) => {
    if (sort === "popular") {
      return b.likes.length - a.likes.length
    }
    if (sort === "newest") {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
    return 0
  })

  const filteredArticles = sortedArticles.filter((art) => {
    if (sort === "favorites" && !(user && art.likes.includes(user.id))) {
      return false
    }
    if (category !== "all" && art.category !== category) {
      return false
    }
    return true
  })

  const emptyMessage = () => {
    if (sort === "favorites") {
      return "Вы еще не отметили ни одну статью как избранную"
    }
    if (category !== "all") {
      return "В этой категории пока нет статей"
    }
    return "Статьи временно недоступны"
  }

  return (
    <div className={cn("min-h-screen py-24 px-5 lg:px-8", !isBannerEnabled ? "bg-muted/30" : "bg-background")}>
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 text-left">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Статьи
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Глубокие разборы технологий обработки камня, аналитика рынка и гиды по выбору материалов от ведущих экспертов отрасли.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-start gap-2">
          {[
            { id: "newest", label: "Новые" },
            { id: "popular", label: "Популярные" },
            { id: "favorites", label: "Избранные" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={sort === tab.id ? "default" : "outline"}
              onClick={() => setSort(tab.id as SortOption)}
              className={cn(
                "rounded-full px-6",
                sort === tab.id && "bg-primary text-primary-foreground"
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2">
          <Button
            variant={category === "all" ? "default" : "outline"}
            onClick={() => setCategory("all")}
            className={cn(
              "rounded-full px-6",
              category === "all" && "bg-primary text-primary-foreground"
            )}
          >
            Все
          </Button>
          {articleCategories.map((tag) => (
            <Button
              key={tag}
              variant={category === tag ? "default" : "outline"}
              onClick={() => setCategory(tag)}
              className={cn(
                "rounded-full px-6",
                category === tag && "bg-primary text-primary-foreground"
              )}
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      <ContentEnter swapKey={`${sort}-${category}`}>
        {filteredArticles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-xl text-muted-foreground">
              {emptyMessage()}
            </p>
            {sort === "favorites" && !user && (
              <OpenAuthButton
                variant="link"
                view="login"
                next="/articles"
                className="mt-2 text-primary"
              >
                Войдите, чтобы собирать избранное
              </OpenAuthButton>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              isLiked={Boolean(user && article.likes.includes(user.id))}
            />
          ))}
        </div>
      </ContentEnter>
    </div>
    </div>
  )
}
