import { Suspense } from "react"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { GuestOnly } from "@/components/auth/guest-only"
import { LoginFormFromQuery } from "@/components/auth/login-form"

export const metadata = {
  title: "Войти в аккаунт — StoneTrail",
  description: "Войдите в аккаунт StoneTrail, чтобы участвовать в профессиональном сообществе и работать с материалами платформы.",
}

function LoginContent() {
  return (
    <GuestOnly>
      <AuthPageShell title="Войти в аккаунт">
        <LoginFormFromQuery />
      </AuthPageShell>
    </GuestOnly>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
