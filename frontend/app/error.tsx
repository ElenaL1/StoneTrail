"use client"

import { Button } from "@/components/ui/button"

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-5 py-24 text-center">
      <h1 className="text-2xl font-bold text-foreground">Не удалось загрузить страницу</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Попробуйте ещё раз. Если ошибка повторяется, обновите страницу позже.
      </p>
      <Button className="mt-8" type="button" onClick={() => reset()}>
        Попробовать ещё раз
      </Button>
    </div>
  )
}
