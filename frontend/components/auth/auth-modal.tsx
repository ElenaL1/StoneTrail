"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterFooter, RegisterForm } from "@/components/auth/register-form"
import { Button } from "@/components/ui/button"
import { useAuthModal } from "@/lib/auth-modal-context"
import { cn } from "@/lib/utils"

export function AuthModal() {
  const { view, next, close, openLogin, openRegister } = useAuthModal()
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = "auth-modal-title"

  useEffect(() => {
    if (!view) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    panelRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    window.addEventListener("keydown", onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [close, view])

  if (!view) return null

  const isRegister = view === "register"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={close}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_12px_40px_-28px_rgba(35,72,58,0.45)] outline-none",
          isRegister ? "max-w-xl" : "max-w-md",
        )}
      >
        <div className="h-1 shrink-0 bg-primary" aria-hidden="true" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-3 top-4 rounded-full"
          aria-label="Закрыть"
          onClick={close}
        >
          <X className="size-5" />
        </Button>
        <div key={view} className="overflow-y-auto px-5 py-8 sm:px-8 sm:py-10">
          <div className="mb-8 space-y-3 pr-8">
            <h2 id={titleId} className="font-display text-3xl font-bold tracking-tight text-foreground">
              {isRegister ? "Создать аккаунт" : "Войти в аккаунт"}
            </h2>
            {isRegister ? (
              <>
                <p className="text-base font-medium leading-relaxed text-foreground/85">
                  Присоединитесь к профессиональному сообществу StoneTrail
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Получите доступ к профессиональным обсуждениям, экспертным материалам и возможностям
                  взаимодействия с участниками каменной индустрии.
                </p>
              </>
            ) : null}
          </div>
          {isRegister ? (
            <>
              <RegisterForm next={next} autoFocus onSignIn={() => openLogin({ next })} />
              <div className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
                <RegisterFooter next={next} onSignIn={() => openLogin({ next })} />
              </div>
            </>
          ) : (
            <LoginForm
              next={next}
              autoFocus
              onCreateAccount={() => openRegister({ next })}
              onSuccess={close}
            />
          )}
        </div>
      </div>
    </div>
  )
}
