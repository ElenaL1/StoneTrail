import { Suspense } from "react"
import Link from "next/link"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { GuestOnly } from "@/components/auth/guest-only"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata = {
  title: "Восстановление пароля — StoneTrail",
  description: "Восстановите доступ к аккаунту StoneTrail по email, указанному при регистрации.",
}

function ForgotPasswordContent() {
  return (
    <GuestOnly>
      <AuthPageShell
        title="Восстановление пароля"
        description="Введите email, указанный при регистрации. Мы отправим инструкции для восстановления доступа."
        footer={
          <p className="text-center">
            Вспомнили пароль?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Войти
            </Link>
          </p>
        }
      >
        <ForgotPasswordForm />
      </AuthPageShell>
    </GuestOnly>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  )
}
