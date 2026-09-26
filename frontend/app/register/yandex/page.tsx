import { Suspense } from "react"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { GuestOnly } from "@/components/auth/guest-only"
import { YandexRegisterForm } from "@/components/auth/yandex-register-form"

export const metadata = {
  title: "Регистрация через Яндекс — StoneTrail",
  description: "Завершите регистрацию StoneTrail после входа через Яндекс ID.",
}

function YandexRegisterContent() {
  return (
    <GuestOnly>
      <AuthPageShell
        title="Завершить регистрацию"
        description="Яндекс подтвердил почту. Осталось выбрать ник и принять условия."
      >
        <YandexRegisterForm />
      </AuthPageShell>
    </GuestOnly>
  )
}

export default function YandexRegisterPage() {
  return (
    <Suspense>
      <YandexRegisterContent />
    </Suspense>
  )
}
