"use client"

import { RequireAuth } from "@/components/auth/require-auth"
import { ProfileForm } from "@/components/auth/profile-form"
import { useAuth } from "@/lib/auth-context"

export function ProfilePageClient() {
  const { user } = useAuth()

  return (
    <RequireAuth>
      <section className="bg-muted/30">
        <div className="mx-auto max-w-2xl px-5 py-24 lg:px-8">
          <div className="rounded-xl border border-border bg-card shadow-[0_12px_40px_-28px_rgba(35,72,58,0.45)]">
            <div className="h-1 rounded-t-xl bg-primary" aria-hidden="true" />
            <div className="px-5 py-8 sm:px-8 sm:py-10">
              <div className="mb-8 space-y-2">
                <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Профиль</h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {user?.email}
                </p>
              </div>
              <ProfileForm />
            </div>
          </div>
        </div>
      </section>
    </RequireAuth>
  )
}
