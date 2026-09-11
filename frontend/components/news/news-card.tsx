"use client"

import React from "react"
import Link from "next/link"
import { Heart, Calendar } from "lucide-react"
import { IndustryNews } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useNews } from "@/lib/news-context"
import { useAuth } from "@/lib/auth-context"
import { useRequireLogin } from "@/lib/auth/use-require-login"

export function NewsCard({ news }: { news: IndustryNews }) {
  const { toggleNewsLike } = useNews()
  const { user } = useAuth()
  const requireLogin = useRequireLogin()
  const isLiked = user && news.likes.includes(user.id)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!requireLogin()) return
    toggleNewsLike(news.id, user!.id)
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-6 bg-card transition-all hover:border-primary/50 h-full group">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Calendar className="size-3" />
        {news.date}
      </span>
      
      <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
        {news.title}
      </h3>
      
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
        {news.excerpt}
      </p>
      
      <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLike}
          className={cn(
            "h-8 gap-1.5 rounded-full",
            isLiked && "text-primary hover:text-primary hover:bg-primary/10"
          )}
        >
          <Heart className={cn("size-3.5", isLiked && "fill-primary")} />
          {news.likes.length}
        </Button>
        
        <Button variant="link" size="sm" asChild className="h-8 px-2 text-primary">
          <Link href={`/news/${news.id}`}>Читать далее</Link>
        </Button>
      </div>
    </div>
  )
}