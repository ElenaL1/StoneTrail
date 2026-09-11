"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Promotion, IndustryNews } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import { Heart, Calendar } from "lucide-react"
import { useNews } from "@/lib/news-context"
import { useAuth } from "@/lib/auth-context"
import { useRequireLogin } from "@/lib/auth/use-require-login"

interface NewsListItemProps {
  item: {
    type: 'promotion' | 'news',
    data: Promotion | IndustryNews,
    date: string
  }
}

export function NewsListItem({ item }: NewsListItemProps) {
  const isPromo = item.type === 'promotion'
  const data = isPromo ? (item.data as Promotion) : (item.data as IndustryNews)
  
  const { toggleNewsLike, togglePromoLike } = useNews()
  const { user } = useAuth()
  const requireLogin = useRequireLogin()
  
  const likes = isPromo ? (data as Promotion).likes : (data as IndustryNews).likes
  const isLiked = user && likes.includes(user.id)

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!requireLogin()) return
    if (isPromo) {
      togglePromoLike((data as Promotion).id, user!.id)
    } else {
      toggleNewsLike((data as IndustryNews).id, user!.id)
    }
  }

  return (
    <div className="group flex items-center justify-between gap-4 p-4 border-b border-border bg-transparent transition-colors hover:bg-muted/50">
      <div className="flex min-w-0 flex-1 items-center gap-6 overflow-hidden">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
          <Calendar className="size-3" />
          {item.date}
        </span>

        {isPromo && (
          <Badge
            variant="outline"
            className="text-primary border-primary/30 bg-primary/5"
          >
            Спецпредложение
          </Badge>
        )}
        
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-baseline gap-2">
            <Link 
              href={isPromo ? `/promotions/${(data as Promotion).id}` : `/news/${(data as IndustryNews).id}`} 
              className="min-w-0 truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors"
            >
              {data.title}
            </Link>
            {isPromo && (
              <span className="shrink-0 text-xs font-medium italic text-muted-foreground/60 whitespace-nowrap">
                Действительно до {(data as Promotion).expiryDate}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {isPromo ? (data as Promotion).description : (data as IndustryNews).excerpt}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 shrink-0">
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
          {likes.length}
        </Button>

        {isPromo ? (
          <Button size="sm" asChild variant="outline" className="h-8 px-3">
            <Link href={`/promotions/${(data as Promotion).id}`}>Детали</Link>
          </Button>
        ) : (
          <Button size="sm" asChild variant="ghost" className="h-8 px-3">
            <Link href={`/news/${(data as IndustryNews).id}`}>Читать</Link>
          </Button>
        )}
      </div>
    </div>
  )
}