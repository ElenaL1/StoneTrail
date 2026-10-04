"use client"

import { useEffect, useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { newsApi, promotionsApi } from "@/lib/feed/api-client"
import { useRequireLogin } from "@/lib/auth/use-require-login"
import { cn } from "@/lib/utils"

export function FeedLikeButton({
  slug,
  kind,
  liked,
  count,
  className,
}: {
  slug: string
  kind: "news" | "promotion"
  liked: boolean
  count: number
  className?: string
}) {
  const requireLogin = useRequireLogin()
  const [state, setState] = useState({ liked, count })

  useEffect(() => {
    setState({ liked, count })
  }, [liked, count, slug])

  const toggle = (event: React.MouseEvent) => {
    event.preventDefault()
    if (!requireLogin()) return
    const request = kind === "news" ? newsApi.like(slug) : promotionsApi.like(slug)
    void request
      .then((next) => setState({ liked: next.liked, count: next.likesCount }))
      .catch(() => undefined)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className={cn(
        "h-8 gap-1.5 rounded-full",
        state.liked && "text-primary hover:bg-primary/10 hover:text-primary",
        className,
      )}
    >
      <Heart className={cn("size-3.5", state.liked && "fill-primary")} />
      {state.count}
    </Button>
  )
}
