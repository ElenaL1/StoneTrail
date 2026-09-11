"use client"

import React, { useState } from "react"
import { mockForumPosts, forumCategories, mockForumComments } from "@/lib/mock-data"
import { TopicCard } from "@/components/community/topic-card"
import { CreateTopicModal } from "@/components/community/create-topic-modal"
import { Button } from "@/components/ui/button"
import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { arePromotionsEnabled } from "@/lib/promo-utils"

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState("Все")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filteredPosts = activeCategory === "Все" 
    ? mockForumPosts 
    : mockForumPosts.filter(p => p.category === activeCategory)

  const getCommentCount = (postId: string) => 
    mockForumComments.filter(c => c.postId === postId).length

  return (
    <div className={cn("min-h-screen py-24 px-5 lg:px-8", !arePromotionsEnabled() ? "bg-muted/30" : "bg-background")}>
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
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
          <CreateTopicModal />
        </div>

        {/* Controls Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory("Все")}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                activeCategory === "Все" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              Все
            </button>
            {forumCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                  activeCategory === cat 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {cat}
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

        {/* Topics Grid/List */}
        {filteredPosts.length > 0 ? (
          <div className={cn(
            "grid gap-5",
            viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          )}>
            {filteredPosts.map(post => (
              <TopicCard 
                key={post.id} 
                post={post} 
                commentCount={getCommentCount(post.id)} 
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
              <CreateTopicModal />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
