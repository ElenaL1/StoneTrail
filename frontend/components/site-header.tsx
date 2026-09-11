"use client"

import { useEffect, useState } from "react"
import { Menu, Search, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { SearchModal } from "@/components/search-modal"
import { NotificationDropdown } from "@/components/notification-dropdown"
import { cn } from "@/lib/utils"
import { SEARCH_CATEGORIES } from "@/lib/search-utils"
import { useAuth } from "@/lib/auth-context"

export function SiteHeader() {
  const { isReady, user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const getHref = (id: string) => {
    const hrefMap: Record<string, string> = {
      News: "/news",
      StoneCatalog: "/catalog",
      Blocks: "/catalog/blocks",
      ProductsCatalog: "/catalog/products",
      Forum: "/community",
      Articles: "/articles",
    }
    return hrefMap[id] || "#"
  }

  const handleLogout = () => {
    logout()
    setOpen(false)
    router.push("/")
  }

  const authControls = !isReady ? null : user ? (
    <>
      <Button variant="ghost" className="text-foreground" asChild>
        <Link href="/profile">Профиль</Link>
      </Button>
      <Button variant="outline" onClick={handleLogout}>
        Выйти
      </Button>
    </>
  ) : (
    <>
      <Button variant="ghost" className="text-foreground" asChild>
        <Link href="/login">Войти</Link>
      </Button>
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
        <Link href="/register">Присоединиться</Link>
      </Button>
    </>
  )

  const mobileAuthControls = !isReady ? null : user ? (
    <>
      <Button variant="outline" className="w-full" asChild>
        <Link href="/profile">Профиль</Link>
      </Button>
      <Button className="w-full" variant="outline" onClick={handleLogout}>
        Выйти
      </Button>
    </>
  ) : (
    <>
      <Button variant="outline" className="w-full" asChild>
        <Link href="/login">Войти</Link>
      </Button>
      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
        <Link href="/register">Присоединиться</Link>
      </Button>
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-10">
          <Link href="/" aria-label="Главная StoneTrail">
            <Logo />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {SEARCH_CATEGORIES.map((item) => (
              <Link
                key={item.id}
                href={getHref(item.id)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-1 lg:flex">
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
          {authControls}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background px-5 py-4 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {SEARCH_CATEGORIES.map((item) => (
              <Link
                key={item.id}
                href={getHref(item.id)}
                className="rounded-md px-3 py-2.5 text-base font-medium text-foreground hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2">{mobileAuthControls}</div>
        </div>
      )}

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  )
}
