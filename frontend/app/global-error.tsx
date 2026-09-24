"use client"

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ru">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "4rem 1.25rem",
            fontFamily: "sans-serif",
          }}
        >
          <h1>Не удалось загрузить страницу</h1>
          <p>Попробуйте ещё раз. Если ошибка повторяется, обновите страницу позже.</p>
          <button type="button" onClick={() => reset()}>
            Попробовать ещё раз
          </button>
        </main>
      </body>
    </html>
  )
}
