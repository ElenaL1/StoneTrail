"use client"

import React, { useEffect, useMemo, useState } from "react"
import { forumApi } from "@/lib/forum/api-client"
import { filterForumPosts, type ForumSort } from "@/lib/forum/list-controls"
import { TopicCard } from "@/components/community/topic-card"
import { CreateTopicModal } from "@/components/community/create-topic-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LayoutGrid, List, RotateCcw, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { arePromotionsEnabled } from "@/lib/promo-utils"
import { ContentEnter } from "@/components/content-enter"
import type { ContentCategory, ForumPost } from "@/lib/types"

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [categories, setCategories] = useState<ContentCategory[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [author, setAuthor] = useState("all")
  const [sort, setSort] = useState<ForumSort>("newest")

  const load = () => {
    setLoading(true)
    setError("")
    const category = activeCategory === "all" ? undefined : activeCategory
    void Promise.all([forumApi.listCategories(), forumApi.listPosts(category)])
      .then(([nextCategories, nextPosts]) => {
        setCategories(nextCategories)
        setPosts(nextPosts)
      })
      .catch(() => {
        setError("Не удалось загрузить форум. Попробуйте обновить страницу.")
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory])

  const authors = useMemo(
    () => Array.from(new Set(posts.map((post) => post.author))).sort((left, right) => left.localeCompare(right, "ru")),
    [posts],
  )

  useEffect(() => {
    if (author !== "all" && !authors.includes(author)) setAuthor("all")
  }, [author, authors])

  const visiblePosts = useMemo(
    () => filterForumPosts(posts, { search, author, sort }),
    [posts, search, author, sort],
  )
  const filtersActive = search.trim().length > 0 || author !== "all" || sort !== "newest"
  const resetFilters = () => {
    setSearch("")
    setAuthor("all")
    setSort("newest")
  }

  return (
    <div className={cn("min-h-screen py-24 px-5 lg:px-8", !arePromotionsEnabled() ? "bg-muted/30" : "bg-background")}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Форум
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Профессиональное пространство для обмена опытом, обсуждения технологий 
              и поиска решений в индустрии натурального камня.
            </p>
          </div>
          <CreateTopicModal onCreated={load} />
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                activeCategory === "all" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Все
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.code)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                  activeCategory === cat.code 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-secondary p-1 w-fit">
            <button 
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "grid" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-all",
                viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="forum-search">
              Поиск
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="forum-search"
                placeholder="Заголовок или текст…"
                className="bg-background pl-10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Автор</span>
            <Select value={author} onValueChange={setAuthor}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Все авторы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все авторы</SelectItem>
                {authors.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Сортировка</span>
              <Select value={sort} onValueChange={(value) => setSort(value as ForumSort)}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Сначала новые" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Сначала новые</SelectItem>
                  <SelectItem value="oldest">Сначала старые</SelectItem>
                  <SelectItem value="likes">По лайкам</SelectItem>
                  <SelectItem value="views">По просмотрам</SelectItem>
                  <SelectItem value="comments">По числу ответов</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 shrink-0 text-muted-foreground"
              onClick={resetFilters}
              disabled={!filtersActive}
              aria-label="Сбросить фильтры"
              title="Сбросить фильтры"
            >
              <RotateCcw className="size-[18px]" />
            </Button>
          </div>
          <p className="self-end text-sm text-muted-foreground">
            {visiblePosts.length} из {posts.length}
          </p>
        </div>

        <ContentEnter swapKey={`${activeCategory}-${viewMode}-${loading}`}>
          {error ? (
            <p className="py-20 text-center text-muted-foreground">{error}</p>
          ) : loading ? (
            <p className="py-20 text-center text-sm text-muted-foreground">Загрузка…</p>
          ) : posts.length > 0 && visiblePosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <h3 className="text-lg font-semibold text-foreground">Ничего не найдено</h3>
              <p className="text-muted-foreground">Попробуйте изменить поиск, автора или сортировку.</p>
              <Button type="button" variant="outline" className="mt-6" onClick={resetFilters}>
                <RotateCcw data-icon="inline-start" />
                Сбросить фильтры
              </Button>
            </div>
          ) : posts.length > 0 ? (
            <div className={cn(
              "grid gap-5",
              viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}>
              {visiblePosts.map((post) => (
                <TopicCard 
                  key={post.id} 
                  post={post} 
                  commentCount={post.commentCount} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-border rounded-2xl">
              <div className="mb-4 rounded-full bg-muted p-4">
                <LayoutGrid className="size-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">В этой категории пока нет тем</h3>
              <p className="text-muted-foreground">Станьте первым, кто начнет обсуждение!</p>
              <div className="mt-6">
                <CreateTopicModal
                  onCreated={load}
                  categoryCode={activeCategory === "all" ? undefined : activeCategory}
                />
              </div>
            </div>
          )}
        </ContentEnter>
      </div>
    </div>
  )
}
