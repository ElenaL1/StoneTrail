"use client"

import Link from "next/link"
import { loginPath } from "@/lib/auth/paths"

const actionClassName = "font-medium text-primary underline-offset-4 hover:underline"

export function EmailTakenError({
  next,
  onSignIn,
}: {
  next?: string | null
  onSignIn?: () => void
}) {
  return (
    <span>
      Аккаунт с этим email уже существует.{" "}
      {onSignIn ? (
        <button type="button" onClick={onSignIn} className={actionClassName}>
          Войти
        </button>
      ) : (
        <Link href={loginPath(next)} className={actionClassName}>
          Войти
        </Link>
      )}{" "}
      в аккаунт
    </span>
  )
}
