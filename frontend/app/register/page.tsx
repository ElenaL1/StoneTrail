import { Suspense } from "react"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { GuestOnly } from "@/components/auth/guest-only"
import { RegisterFooterFromQuery, RegisterFormFromQuery } from "@/components/auth/register-form"

export const metadata = {
  title: "Создать аккаунт — StoneTrail",
  description: "Создайте аккаунт StoneTrail, чтобы участвовать в обсуждениях и пользоваться материалами сообщества.",
}

function RegisterContent() {
  return (
    <GuestOnly>
      <AuthPageShell title="Создать аккаунт" footer={<RegisterFooterFromQuery />}>
        <RegisterFormFromQuery />
      </AuthPageShell>
    </GuestOnly>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  )
}
