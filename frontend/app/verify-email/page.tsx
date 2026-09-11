import { Suspense } from "react"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel"

export const metadata = {
  title: "Подтверждение email — StoneTrail",
  description: "Подтвердите email, чтобы активировать аккаунт StoneTrail.",
}

function VerifyEmailContent() {
  return (
    <AuthPageShell>
      <VerifyEmailPanel />
    </AuthPageShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  )
}
