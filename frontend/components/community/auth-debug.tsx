"use client"

import React from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Lock, Unlock } from "lucide-react"

export function AuthDebug() {
  const { isAuthenticated, user, loginDemo, logout } = useAuth()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-background/90 p-2 text-xs border border-border shadow-lg backdrop-blur-md">
      <span className="px-2 text-muted-foreground font-medium">
        Статус: {isAuthenticated ? user?.nickname ?? "Авторизован" : "Гость"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-full"
        aria-label={isAuthenticated ? "Выйти из демо-аккаунта" : "Войти в демо-аккаунт"}
        onClick={isAuthenticated ? logout : () => void loginDemo()}
      >
        {isAuthenticated ? <Lock className="size-3" /> : <Unlock className="size-3" />}
      </Button>
    </div>
  )
}
