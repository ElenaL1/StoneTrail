import Link from "next/link"
import { ForumPost } from "@/lib/types"
import { MessageSquare, User, Calendar, Eye, Heart } from "lucide-react"

interface TopicCardProps {
  post: ForumPost
  commentCount: number
}

export function TopicCard({ post, commentCount }: TopicCardProps) {
  return (
    <Link
      href={`/community/${post.slug}`}
      className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-sm"
    >
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {post.category}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3" />
            {post.date}
          </span>
        </div>

        <h3 className="mb-2 text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>

        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="size-4" />
          <span className="font-medium">{post.author}</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Heart className="size-4" />
            {post.likesCount}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="size-4" />
            {post.viewCount}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="size-4" />
            <span>{commentCount}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
