"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { RequireAuth } from "@/components/auth/require-auth"
import { useAuth } from "@/lib/auth-context"
import { isAdmin, isEditor } from "@/lib/content-utils"
import { cn } from "@/lib/utils"

const links = [
  { href: "/admin/catalog", label: "Каталог" },
  { href: "/admin/media", label: "Медиатека" },
  { href: "/admin/articles", label: "Статьи" },
  { href: "/admin/news", label: "Новости" },
  { href: "/admin/promotions", label: "Акции" },
  { href: "/admin/pages", label: "Страницы" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isReady, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isReady || !user) return
    if (!isEditor(user.role)) {
      router.replace(user.role === "moderator" ? "/articles/moderation" : "/")
    }
  }, [isReady, router, user])

  const items = isAdmin(user?.role)
    ? [...links, { href: "/admin/users", label: "Пользователи" }, { href: "/admin/audit", label: "Журнал" }]
    : links

  return (
    <RequireAuth requireVerified>
      {user && isEditor(user.role) ? (
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">StoneTrail</p>
              <h1 className="mt-2 font-display text-3xl font-bold">Админка</h1>
            </div>
          </div>
          <nav aria-label="Разделы админки" className="mb-8 flex flex-wrap gap-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm",
                  pathname.startsWith(item.href)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {children}
        </div>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Загрузка…</p>
        </div>
      )}
    </RequireAuth>
  )
}
