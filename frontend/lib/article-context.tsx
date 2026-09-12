"use client"

import React, { createContext, useContext, useState } from "react"
import { Article, ArticleComment, mockArticles } from "@/lib/mock-data"

type ArticleContextType = {
  articles: Article[]
  comments: ArticleComment[]
  toggleLike: (articleId: string, userId: string) => void
  addComment: (comment: Omit<ArticleComment, "id" | "date">) => void
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined)

export function ArticleProvider({ children }: { children: React.ReactNode }) {
  const [articles, setArticles] = useState<Article[]>(mockArticles)
  const [comments, setComments] = useState<ArticleComment[]>([])

  const toggleLike = (articleId: string, userId: string) => {
    setArticles((prev) =>
      prev.map((art) => {
        if (art.id !== articleId) return art
        const likes = art.likes.includes(userId)
          ? art.likes.filter((id) => id !== userId)
          : [...art.likes, userId]
        return { ...art, likes }
      })
    )
  }

  const addComment = (commentData: Omit<ArticleComment, "id" | "date">) => {
    const newComment: ArticleComment = {
      ...commentData,
      id: `com-art-${Date.now()}`,
      date: "только что",
    }
    setComments((prev) => [...prev, newComment])
  }

  return (
    <ArticleContext.Provider value={{ articles, comments, toggleLike, addComment }}>
      {children}
    </ArticleContext.Provider>
  )
}

export function useArticles() {
  const context = useContext(ArticleContext)
  if (context === undefined) {
    throw new Error("useArticles must be used within an ArticleProvider")
  }
  return context
}
