import Link from "next/link"

const sections = [
  { href: "/admin/catalog", title: "Каталог", text: "Камни, партии блоков и изделия." },
  { href: "/admin/media", title: "Медиатека", text: "Загрузка изображений и привязка к каталогу." },
  { href: "/admin/articles", title: "Статьи", text: "Очередь модерации, публикация и удаление." },
  { href: "/admin/news", title: "Новости", text: "Черновики, публикация и архив новостей." },
  { href: "/admin/promotions", title: "Акции", text: "Баннер в шапке, срок и шаблон оформления." },
  { href: "/admin/pages", title: "Страницы", text: "Тексты сайта, черновики и юридические документы." },
]

export default function AdminHomePage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((section) => (
        <Link
          key={section.href}
          href={section.href}
          className="rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
        >
          <h2 className="font-display text-xl font-semibold">{section.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{section.text}</p>
        </Link>
      ))}
    </div>
  )
}
