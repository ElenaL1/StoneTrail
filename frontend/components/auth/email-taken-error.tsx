import Link from "next/link"
import { loginPath } from "@/lib/auth/paths"

export function EmailTakenError({ next }: { next?: string | null }) {
  return (
    <span>
      Аккаунт с этим email уже существует.{" "}
      <Link href={loginPath(next)} className="font-medium text-primary underline-offset-4 hover:underline">
        Войти
      </Link>{" "}
      в аккаунт
    </span>
  )
}
