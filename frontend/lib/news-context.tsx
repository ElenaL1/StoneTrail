"use client"

import React, { createContext, useContext, useState } from "react"
import { IndustryNews, Promotion, mockIndustryNews, mockPromotions } from "@/lib/mock-data"

type NewsContextType = {
  news: IndustryNews[]
  promotions: Promotion[]
  toggleNewsLike: (newsId: string, userId: string) => void
  togglePromoLike: (promoId: string, userId: string) => void
}

const NewsContext = createContext<NewsContextType | undefined>(undefined)

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [news, setNews] = useState<IndustryNews[]>(mockIndustryNews)
  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions)

  const toggleNewsLike = (newsId: string, userId: string) => {
    setNews((prev) =>
      prev.map((n) => {
        if (n.id !== newsId) return n
        const likes = n.likes.includes(userId)
          ? n.likes.filter((id) => id !== userId)
          : [...n.likes, userId]
        return { ...n, likes }
      })
    )
  }

  const togglePromoLike = (promoId: string, userId: string) => {
    setPromotions((prev) =>
      prev.map((p) => {
        if (p.id !== promoId) return p
        const likes = p.likes.includes(userId)
          ? p.likes.filter((id) => id !== userId)
          : [...p.likes, userId]
        return { ...p, likes }
      })
    )
  }

  return (
    <NewsContext.Provider value={{ news, promotions, toggleNewsLike, togglePromoLike }}>
      {children}
    </NewsContext.Provider>
  )
}

export function useNews() {
  const context = useContext(NewsContext)
  if (context === undefined) {
    throw new Error("useNews must be used within a NewsProvider")
  }
  return context
}