import { Comment } from "@/lib/mock-data"
import { User, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

interface CommentItemProps {
  comment: Comment
}

export function CommentItem({ comment }: CommentItemProps) {
  return (
    <div className="flex gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
      <div className="flex-shrink-0 size-10 rounded-full bg-muted flex items-center justify-center">
        <User className="size-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-foreground">{comment.author}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3" />
            {comment.date}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {comment.text}
        </p>
      </div>
    </div>
  )
}
