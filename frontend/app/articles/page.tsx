"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { OpenAuthButton } from "@/components/auth/open-auth-button"
import { ArticleCard } from "@/components/articles/article-card"
import { WriteArticleButton } from "@/components/articles/write-article-button"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { arePromotionsEnabled } from "@/lib/promo-utils"
import { ContentEnter } from "@/components/content-enter"
import { articlesApi } from "@/lib/articles/api-client"
import type { Article, ContentCategory } from "@/lib/types"

type SortOption = "newest" | "popular" | "favorites"

export default function ArticlesPage() {
  const { user } = useAuth()
  const [sort, setSort] = useState<SortOption>("newest")
  const [category, setCategory] = useState("all")
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const isBannerEnabled = arePromotionsEnabled()

  useEffect(() => {
    void articlesApi.listCategories().then(setCategories)
  }, [])

  useEffect(() => {
    setLoading(true)
    void articlesApi.listPublished({
      category,
      sort: sort === "favorites" ? "newest" : sort,
      favorites: sort === "favorites",
    })
      .then(setArticles)
      .finally(() => setLoading(false))
  }, [category, sort])

  const emptyMessage = () => {
    if (sort === "favorites") {
      return "Вы еще не отметили ни одну статью как избранную"
    }
    if (category !== "all") {
      return "В этой категории пока нет статей"
    }
    return "Пока нет опубликованных статей. Станьте первым автором."
  }

  return (
    <div className={cn("min-h-screen py-24 px-5 lg:px-8", !isBannerEnabled ? "bg-muted/30" : "bg-background")}>
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="text-left">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Статьи
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Практический опыт камнеобработки: технологии, оборудование, производство и бизнес.
          </p>
        </div>
        <WriteArticleButton />
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
          {categories.map((tag) => (
            <Button
              key={tag.id}
              variant={category === tag.code ? "default" : "outline"}
              onClick={() => setCategory(tag.code)}
              className={cn(
                "rounded-full px-6",
                category === tag.code && "bg-primary text-primary-foreground"
              )}
            >
              {tag.label}
            </Button>
          ))}
        </div>
      </div>

      <ContentEnter swapKey={`${sort}-${category}-${loading}`}>
        {loading ? (
          <p className="py-20 text-center text-sm text-muted-foreground">Загрузка…</p>
        ) : articles.length === 0 ? (
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
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isLiked={article.liked}
              />
            ))}
          </div>
        )}
      </ContentEnter>
    </div>
    </div>
  )
}
