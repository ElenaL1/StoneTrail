import Link from "next/link"
import { Logo } from "@/components/logo"

const columns = [
  {
    title: "Платформа",
    links: [
      { label: "Новости", href: "/news" },
      { label: "Каталог камня", href: "/catalog" },
      { label: "Блоки", href: "/catalog/blocks" },
      { label: "Изделия из камня", href: "/catalog/products" },
      { label: "Форум", href: "/community" },
      { label: "Статьи", href: "/articles" },
    ],
  },
  {
    title: "Услуги",
    links: [
      { label: "Подбор камня", href: "/services/selection" },
      { label: "Консультации", href: "/services/consultations" },
      { label: "Логистика", href: "/services/logistics" },
      { label: "Раскрой", href: "/services/cutting" },
    ],
  },
  {
    title: "StoneTrail",
    links: [
      { label: "О себе", href: "/about" },
      { label: "Контакты", href: "/contacts" },
      { label: "FAQ", href: "/faq" },
      { label: "Войти", href: "/login" },
      { label: "Создать аккаунт", href: "/register" },
    ],
  },
  {
    title: "Правовая информация",
    links: [
      { label: "Конфиденциальность", href: "/legal/privacy" },
      { label: "Условия", href: "/legal/terms" },
      { label: "Cookies", href: "/legal/cookies" },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Link href="/" aria-label="Главная StoneTrail">
              <Logo />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Экспертный подход к натуральному камню с 25-летним опытом. <br />
              Эксклюзивный фонд, профессиональный подбор и безупречное качество.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} StoneTrail. Все права защищены.</p>
          <p>Сохраняя традиции мастерства в каждом слэбе.</p>
        </div>
      </div>
    </footer>
  )
}
