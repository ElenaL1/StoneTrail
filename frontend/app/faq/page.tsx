import Link from "next/link"
import { ArrowUpRight, BookOpen, HelpCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FaqAccordions } from "@/components/faq/faq-accordion"
import { faqGroups } from "@/lib/faq-data"
import { cn } from "@/lib/utils"
import { arePromotionsEnabled } from "@/lib/promo-utils"

const popular = [
  {
    question: "Как проверить качество слэба перед покупкой?",
    answer:
      "Показ, осмотр на свет, простукивание. По запросу — фотосъёмка и заключение экспертов. На редкие позиции мы всегда проводим дополнительный контроль перед отгрузкой.",
  },
  {
    question: "Доставляете ли вы по всей России?",
    answer:
      "Да — в пределах РФ и СНГ, с фиксацией этапов, страхованием груза и фотофиксацией при приёмке. Сроки расчитываем после согласования эскиза.",
  },
  {
    question: "Работаете ли с НДС?",
    answer:
      "Да, по запросу. Указываем НДС отдельно в счёте, как требует бухгалтерия заказчика.",
  },
]

export const metadata = {
  title: "FAQ — StoneTrail",
  description:
    "Частые вопросы о материалах, заказе, раскрое, доставке, уходе за камнем и работах с проектами StoneTrail.",
}

export default function FaqPage() {
  const searchGroups: { name: string; description: string }[] = faqGroups.map((g) => ({
    name: g.group,
    description: `${g.items.length} вопросов`,
  }))

  return (
    <>
      <section className={cn("relative overflow-hidden", !arePromotionsEnabled() && "bg-muted/30")}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_0%,var(--primary-soft),transparent)]"
        />
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-12 py-24 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                Частые вопросы
              </span>
              <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Ответы, которые <span className="text-primary">экономят время.</span>
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Собрали здесь вопросы, которые чаще всего приходят нам — от подбора камня до ухода за изделием. Не нашли
                ответ? Напишите — отвечаем в течение рабочего дня.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/contacts" className="w-full sm:w-auto">
                  <Button className="h-11 gap-2 px-5 text-sm">
                    Задать вопрос
                    <ArrowUpRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/about" className="w-full sm:w-auto">
                  <Button variant="outline" className="h-11 px-5 text-sm">
                    О компании
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Популярные вопросы
              </p>
              <ul className="mt-4 divide-y divide-border">
                {popular.map((p) => (
                  <li key={p.question} className="py-4 first:pt-0 last:pb-0">
                    <p className="text-sm font-semibold leading-snug text-foreground">{p.question}</p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.answer}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl gap-10 px-5 lg:grid lg:grid-cols-[240px_1fr] lg:px-8">
          <aside className="pb-4 lg:sticky lg:top-24 lg:self-start">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Разделы</p>
            <nav className="mt-4 flex flex-col gap-1">
              {searchGroups.map((g, i) => (
                <a
                  key={g.name}
                  href={`#group-${i}`}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <span className="mr-2 font-mono text-xs text-foreground/60">{i + 1}</span>
                  {g.name}
                  <span className="ml-2 text-xs text-muted-foreground">({g.description})</span>
                </a>
              ))}
            </nav>
          </aside>

          <div className="space-y-10 pb-24">
            {faqGroups.map((group, gIdx) => (
              <div key={group.group} id={`group-${gIdx}`} className="scroll-mt-24">
                <header className="pb-3">
                  <p className="text-sm font-semibold uppercase tracking-widest text-accent">
                    {String(gIdx + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {group.group}
                  </h2>
                </header>
                <FaqAccordions items={group.items} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <article className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <BookOpen className="size-5 text-primary" />
              <h3 className="mt-4 font-display text-lg font-bold leading-snug text-foreground">
                Статьи-гиды
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Подробнее о выборе и уходе за камнем — в наших экспертных разборах на сайте.
              </p>
              <Link href="/articles" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                Читать статьи
                <ArrowUpRight className="size-4" />
              </Link>
            </article>
            <article className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <Mail className="size-5 text-primary" />
              <h3 className="mt-4 font-display text-lg font-bold leading-snug text-foreground">
                Напишите нам напрямую
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Ответим на нестандартные вопросы и поможем составить смету.
              </p>
              <Link href="/contacts" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                Контакты
                <ArrowUpRight className="size-4" />
              </Link>
            </article>
            <article className="flex flex-col rounded-2xl border border-border bg-card p-6">
              <HelpCircle className="size-5 text-primary" />
              <h3 className="mt-4 font-display text-lg font-bold leading-snug text-foreground">
                Обсудить на форуме
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Задать вопрос коллеге из сообщества StoneTrail.
              </p>
              <Link href="/community" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                В сообщество
                <ArrowUpRight className="size-4" />
              </Link>
            </article>
          </div>
        </div>
      </section>
    </>
  )
}
