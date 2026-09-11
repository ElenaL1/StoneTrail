import { Suspense } from "react"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata = {
  title: "Новый пароль — StoneTrail",
  description: "Задайте новый пароль для аккаунта StoneTrail.",
}

function ResetPasswordContent() {
  return (
    <AuthPageShell>
      <ResetPasswordForm />
    </AuthPageShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
