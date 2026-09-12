"use client"

import React from "react"
import { useParams } from "next/navigation"
import { Heart, Calendar, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"
import { useNews } from "@/lib/news-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRequireLogin } from "@/lib/auth/use-require-login"

export default function PromotionDetailPage() {
  const { id } = useParams()
  const { promotions, togglePromoLike } = useNews()
  const { user } = useAuth()
  const requireLogin = useRequireLogin()

  const item = promotions.find((p) => p.id === id)

  if (!item) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-xl text-muted-foreground">Предложение не найдено</p>
      </div>
    )
  }

  const isLiked = user && item.likes.includes(user.id)

  const handleLike = () => {
    if (!requireLogin()) return
    togglePromoLike(item.id, user!.id)
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-24 lg:px-8">
      <Link 
        href="/news" 
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="size-4" />
        Назад к новостям
      </Link>

      <article className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 text-sm text-primary border-primary/30 bg-[var(--primary-soft)]">
              Специальное предложение
            </Badge>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              {item.createdAt}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            {item.title}
          </h1>
          
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {item.description}
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLike}
              className={cn(
                "gap-2 rounded-full",
                isLiked && "text-primary hover:text-primary hover:bg-primary/10"
              )}
            >
              <Heart className={cn("size-4", isLiked && "fill-primary")} />
              {item.likes.length}
            </Button>
          </div>
        </div>

        <div className="relative rounded-3xl border border-border bg-card p-8 space-y-6 shadow-sm">
          <div className="absolute -top-3 left-8 flex items-center gap-2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
            <Sparkles className="size-3" />
            ДЕТАЛИ ПРЕДЛОЖЕНИЯ
          </div>
          
          <div className="prose prose-stone max-w-none text-lg leading-relaxed text-foreground space-y-6 whitespace-pre-wrap">
            {item.content}
          </div>
          
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground italic">
              Срок действия: до {item.expiryDate}
            </p>
            <Button className="px-8 gap-2">
              Узнать больше
            </Button>
          </div>
        </div>
      </article>
    </div>
  )
}
