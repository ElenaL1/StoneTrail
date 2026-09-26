import { Button } from "@/components/ui/button"
import { yandexStartPath } from "@/lib/auth/yandex"

type YandexAuthButtonProps = {
  next?: string | null
  intent?: "link"
  label: string
}

export function YandexAuthButton({ next = null, intent, label }: YandexAuthButtonProps) {
  return (
    <Button variant="outline" className="h-11 w-full" asChild>
      <a href={yandexStartPath(next, intent)}>{label}</a>
    </Button>
  )
}
