"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Promotion } from "@/lib/mock-data"
import { Heart, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useNews } from "@/lib/news-context"
import { useAuth } from "@/lib/auth-context"
import { useRequireLogin } from "@/lib/auth/use-require-login"

export function PromotionCard({ promotion }: { promotion: Promotion }) {
  const { togglePromoLike } = useNews()
  const { user } = useAuth()
  const requireLogin = useRequireLogin()
  const isLiked = user && promotion.likes.includes(user.id)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!requireLogin()) return
    togglePromoLike(promotion.id, user!.id)
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-border p-6 bg-card transition-all hover:border-primary/50 h-full group">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Calendar className="size-3" />
            {promotion.createdAt}
          </span>
          <Badge variant="outline" className="text-primary border-primary/30 bg-[var(--primary-soft)]">
            Спецпредложение
          </Badge>
        </div>
        
        <h3 className="text-xl font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
          {promotion.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {promotion.description}
        </p>
      </div>
      
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
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
            {promotion.likes.length}
          </Button>
          <div className="text-xs font-medium text-muted-foreground/60 italic">
            Действительно до {promotion.expiryDate}
          </div>
        </div>
        <Button asChild className="w-full gap-2">
          <Link href={`/promotions/${promotion.id}`}>
            Узнать детали
          </Link>
        </Button>
      </div>
    </div>
  )
}