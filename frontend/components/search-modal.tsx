"use client"

import React, { useEffect, useRef, useState } from "react"
import { Search, X, Gem, MessageSquare, ArrowRight, FileText, Hammer } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { catalogApi } from "@/lib/catalog/api-client"
import { articlesApi } from "@/lib/articles/api-client"
import { forumApi } from "@/lib/forum/api-client"
import { filterResults, getPopularQueries, type SearchCategory, SEARCH_CATEGORIES } from "@/lib/search-utils"
import { ContentEnter } from "@/components/content-enter"
import type { Article, ForumPost, Material, Product } from "@/lib/types"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<SearchCategory>("All")
  const [stones, setStones] = useState<Material[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const loadedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || loadedRef.current) return
    loadedRef.current = true
    let cancelled = false
    void Promise.all([
      catalogApi.listStones(),
      catalogApi.listProducts(),
      forumApi.listPosts(),
      articlesApi.listPublished(),
    ])
      .then(([nextStones, nextProducts, nextPosts, nextArticles]) => {
        if (!cancelled) {
          setStones(nextStones)
          setProducts(nextProducts)
          setPosts(nextPosts)
          setArticles(nextArticles)
        }
      })
      .catch(() => {
        loadedRef.current = false
      })
    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  if (!isOpen) return null

  const results = filterResults(query, category, { stones, products, posts, articles })

  const categories: { id: SearchCategory; label: string }[] = [
    { id: "All", label: "Все" },
    ...SEARCH_CATEGORIES.map((c) => ({ id: c.id as SearchCategory, label: c.label })),
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case "Material": return <Gem className="size-4 text-primary" />
      case "FinishedProduct": return <Hammer className="size-4 text-primary" />
      case "ForumPost": return <MessageSquare className="size-4 text-primary" />
      case "Article": return <FileText className="size-4 text-primary" />
      default: return <Search className="size-4 text-primary" />
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6" onClick={onClose}>
      <div
        className="relative mt-12 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="size-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Поиск камня, изделий, статей…"
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
              <X className="size-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-muted/30 px-4 py-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  category === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="max-h-[400px] overflow-y-auto p-4">
            <ContentEnter swapKey={category}>
              {query.length === 0 ? (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">Популярные запросы</h3>
                  <div className="flex flex-wrap gap-2">
                    {getPopularQueries().map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuery(q)}
                        className="rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result, idx) => {
                    const name =
                      result.type === "Material"
                        ? result.data.name
                        : result.type === "FinishedProduct"
                          ? result.data.name
                          : result.data.title
                    const sub =
                      result.type === "Material"
                        ? result.data.type
                        : result.type === "FinishedProduct"
                          ? `${result.data.productType ?? result.data.stoneType} · ${result.data.stoneName}`
                          : result.data.category
                    const href =
                      result.type === "Material"
                        ? `/catalog/${result.data.id}`
                        : result.type === "FinishedProduct"
                          ? `/catalog/products/${result.data.slug}`
                          : result.type === "ForumPost"
                            ? `/community/${result.data.slug}`
                            : `/articles/${result.data.slug}`
                    return (
                      <div
                        key={`${result.type}-${idx}`}
                        onClick={() => {
                          window.location.href = href
                          onClose()
                        }}
                        className="group flex cursor-pointer items-center justify-between gap-4 rounded-xl p-3 transition-colors hover:bg-secondary"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-background">
                            {getIcon(result.type)}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{name}</div>
                            <div className="text-xs text-muted-foreground">{sub}</div>
                          </div>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                    <Search className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Ничего не найдено по вашему запросу</p>
                </div>
              )}
            </ContentEnter>
          </div>
        </div>
      </div>
    </div>
  )
}