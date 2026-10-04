"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, Menu, Search, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { OpenAuthButton } from "@/components/auth/open-auth-button"
import { SearchModal } from "@/components/search-modal"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useAdminMode } from "@/lib/admin-mode"
import { isEditor } from "@/lib/content-utils"

const PRIMARY_NAV = [
  { label: "Новости", href: "/news" },
  { label: "Каталог камня", href: "/catalog" },
  { label: "Блоки", href: "/catalog/blocks" },
  { label: "Изделия из камня", href: "/catalog/products" },
  { label: "Форум", href: "/community" },
  { label: "Статьи", href: "/articles" },
] as const

function isCurrent(pathname: string, href: string) {
  if (href === "/catalog") {
    return (
      pathname === "/catalog" ||
      (pathname.startsWith("/catalog/") &&
        !pathname.startsWith("/catalog/blocks") &&
        !pathname.startsWith("/catalog/products"))
    )
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

const itemClass =
  "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-foreground"

export function SiteHeader() {
  const { isReady, user, logout } = useAuth()
  const { enabled, toggle } = useAdminMode()
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setAccountOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!accountOpen) return

    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (accountRef.current && !accountRef.current.contains(target)) setAccountOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false)
    }

    document.addEventListener("mousedown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [accountOpen])

  const handleLogout = () => {
    void logout()
    setOpen(false)
    setAccountOpen(false)
    router.push("/")
  }

  const guestActions = (fullWidth: boolean) => (
    <>
      <OpenAuthButton view="login" variant={fullWidth ? "outline" : "ghost"} className={cn(!fullWidth && "text-foreground", fullWidth && "w-full")}>
        Войти
      </OpenAuthButton>
      <OpenAuthButton view="register" className={cn("bg-primary text-primary-foreground hover:bg-primary/90", fullWidth && "w-full")}>
        Присоединиться
      </OpenAuthButton>
    </>
  )

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/70 backdrop-blur-lg"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" aria-label="Главная StoneTrail" className="shrink-0">
            <Logo />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(itemClass, isCurrent(pathname, item.href) ? "bg-secondary text-foreground" : "text-muted-foreground")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden shrink-0 items-center gap-1 lg:flex">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Поиск"
            className="text-muted-foreground"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="size-[18px]" />
          </Button>
          <NotificationDropdown />
          <ThemeToggle />
          <div className="mx-2 h-5 w-px bg-border" aria-hidden="true" />
          {!isReady ? null : user ? (
            <div className="relative" ref={accountRef}>
              <Button
                variant="outline"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => setAccountOpen((value) => !value)}
              >
                <span className="max-w-32 truncate">{user.nickname}</span>
                <ChevronDown className={cn("size-4 transition-transform", accountOpen && "rotate-180")} />
              </Button>
              {accountOpen ? (
                <div role="menu" className="absolute right-0 top-full z-50 mt-2 min-w-52 rounded-xl border border-border bg-card p-1 shadow-xl">
                  {isEditor(user.role) ? (
                    <>
                      <Link href="/admin" role="menuitem" className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                        Админка
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-secondary"
                        onClick={toggle}
                      >
                        {enabled ? "Режим правки" : "Править на сайте"}
                      </button>
                    </>
                  ) : null}
                  <Link href="/profile" role="menuitem" className="block rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary">
                    Профиль
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-secondary"
                    onClick={handleLogout}
                  >
                    Выйти
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            guestActions(false)
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-border bg-background px-5 py-4 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2.5 text-base font-medium text-foreground hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {!isReady ? null : user ? (
              <>
                {isEditor(user.role) ? (
                  <>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/admin">Админка</Link>
                    </Button>
                    <Button variant={enabled ? "default" : "outline"} className="w-full" onClick={toggle}>
                      {enabled ? "Режим правки" : "Править на сайте"}
                    </Button>
                  </>
                ) : null}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/profile">Профиль</Link>
                </Button>
                <Button className="w-full" variant="outline" onClick={handleLogout}>
                  Выйти
                </Button>
              </>
            ) : (
              guestActions(true)
            )}
          </div>
        </div>
      ) : null}

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  )
}
