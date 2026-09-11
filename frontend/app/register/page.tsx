import { Suspense } from "react"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { GuestOnly } from "@/components/auth/guest-only"
import { RegisterFooter, RegisterForm } from "@/components/auth/register-form"

export const metadata = {
  title: "Создать аккаунт — StoneTrail",
  description:
    "Присоединитесь к профессиональному сообществу StoneTrail: обсуждения, экспертные материалы и взаимодействие специалистов каменной индустрии.",
}

function RegisterContent() {
  return (
    <GuestOnly>
      <AuthPageShell
        wide
        title="Создать аккаунт"
        subtitle="Присоединитесь к профессиональному сообществу StoneTrail"
        description="Получите доступ к профессиональным обсуждениям, экспертным материалам и возможностям взаимодействия с участниками каменной индустрии."
        footer={<RegisterFooter />}
      >
        <RegisterForm />
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
