"use client"

import Link from "next/link"
import { Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FeedLikeButton } from "@/components/news/feed-like-button"
import { formatFeedDate, isPromotionCurrent } from "@/lib/feed/format"
import type { Promotion } from "@/lib/types"

export function PromotionCard({ promotion }: { promotion: Promotion }) {
  return (
    <div className="group flex h-full flex-col justify-between rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Calendar className="size-3" />
            {formatFeedDate(promotion.createdAt)}
          </span>
          <Badge variant="outline" className="border-primary/30 bg-[var(--primary-soft)] text-primary">
            Спецпредложение
          </Badge>
        </div>
        <h3 className="text-xl font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
          {promotion.title}
        </h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">{promotion.description}</p>
      </div>
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <FeedLikeButton
            slug={promotion.slug}
            kind="promotion"
            liked={promotion.liked}
            count={promotion.likesCount}
          />
          <div className="text-xs font-medium italic text-muted-foreground/60">
            {isPromotionCurrent(promotion.expiresAt)
              ? `Действительно до ${formatFeedDate(promotion.expiresAt)}`
              : "Срок истёк"}
          </div>
        </div>
        <Button asChild className="w-full gap-2">
          <Link href={`/promotions/${promotion.slug}`}>{promotion.buttonLabel}</Link>
        </Button>
      </div>
    </div>
  )
}
