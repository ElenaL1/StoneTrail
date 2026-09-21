"use client"

import Link from "next/link"
import Image from "next/image"
import { Heart, Clock, User } from "lucide-react"
import { Article } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ArticleCardProps {
  article: Article
  isLiked?: boolean
}

export function ArticleCard({ article, isLiked }: ArticleCardProps) {
  return (
    <Link 
      href={`/articles/${article.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : null}
        <div className="absolute left-3 top-3">
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground">
            {article.category}
          </Badge>
        </div>
      </div>
      
      <div className="flex flex-col p-5">
        <h3 className="mb-2 text-xl font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
          {article.excerpt}
        </p>
        
        <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <User className="size-3" />
              {article.author}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {article.readTime}
            </span>
            <span>{article.date}</span>
          </div>
          
          <div className={cn(
            "flex items-center gap-1 font-medium",
            isLiked ? "text-primary" : "text-muted-foreground"
          )}>
            <Heart className={cn("size-3", isLiked && "fill-primary")} />
            {article.likesCount}
          </div>
        </div>
      </div>
    </Link>
  )
}
