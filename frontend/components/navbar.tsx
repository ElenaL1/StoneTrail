"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navLinks = [
  { name: "Каталог камня", href: "/catalog" },
  { name: "Блоки", href: "/catalog/blocks" },
  { name: "Изделия из камня", href: "/catalog/products" },
  { name: "Статьи", href: "/articles" },
  { name: "Новости", href: "/news" },
  { name: "Форум", href: "/forum" },
  { name: "Контакты", href: "/contact" },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-5 h-16 flex items-center justify-between lg:px-8">
        <Link 
          href="/" 
          className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          StoneTrail
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-md",
                pathname === link.href 
                  ? "text-foreground bg-secondary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="md:hidden">
          {/* Mobile menu toggle could go here */}
          <button className="p-2 text-muted-foreground">
             {/* Simple placeholder for mobile menu */}
             <span className="text-xs">Меню</span>
          </button>
        </div>
      </div>
    </nav>
  )
}