"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { isStaff } from "@/lib/content-utils"
import { OpenAuthButton } from "@/components/auth/open-auth-button"
import { Button } from "@/components/ui/button"
import { PenLine } from "lucide-react"

export function WriteArticleButton() {
  const { isReady, user } = useAuth()

  if (!isReady) {
    return (
      <Button className="gap-2" disabled>
        <PenLine className="size-4" />
        Написать статью
      </Button>
    )
  }

  if (!user) {
    return (
      <OpenAuthButton view="login" next="/articles/new" className="gap-2">
        <PenLine className="size-4" />
        Войти, чтобы написать статью
      </OpenAuthButton>
    )
  }

  if (!user.emailVerified) {
    return (
      <Button asChild className="gap-2">
        <Link href="/verify-email">
          <PenLine className="size-4" />
          Подтвердите email, чтобы писать
        </Link>
      </Button>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild className="gap-2">
        <Link href="/articles/new">
          <PenLine className="size-4" />
          Написать статью
        </Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/articles/studio">Мастерская</Link>
      </Button>
      {isStaff(user.role) ? (
        <Button asChild variant="outline">
          <Link href="/articles/moderation">Модерация</Link>
        </Button>
      ) : null}
    </div>
  )
}
