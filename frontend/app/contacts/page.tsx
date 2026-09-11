import { ArrowUpRight, Building, Clock, Mail, MapPin, Phone, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { onPrimaryCtaClass } from "@/lib/on-primary-cta"
import { arePromotionsEnabled } from "@/lib/promo-utils"
import { cn } from "@/lib/utils"

const channels = [
  {
    icon: Mail,
    label: "Email",
    title: "info@stonetrail.ru",
    description: "Для коммерческих вопросов, заказов и запросов сметы.",
  },
  {
    icon: Phone,
    label: "Телефон",
    title: "+7 (495) 780-12-00",
    description: "Пн–Пт, 9:00–18:00 по МСК. Для срочных вопросов по текущим заказам.",
  },
  {
    icon: Building,
    label: "Офис и склад",
    title: "г. Москва, ул. Каменная, 12",
    description: "Шоурум и склад закрытого фонда. Посещение по записи.",
  },
  {
    icon: Clock,
    label: "Часы работы",
    title: "Пн–Пт 9:00–18:00",
    description: "Посещения производства — по предварительной договренности.",
  },
]

const departments = [
  { title: "Продажи и подбор", description: "Запросы по слэбам, блокам, изделиям. Запросы под проект." },
  { title: "Производство и раскрой", description: "Раскрой, полировка, фаска, нестандартные формы." },
  { title: "Логистика", description: "Сроки поставки, упаковка, страховка, доставка «под ключ»." },
  { title: "Поддержка", description: "Вопросы по текущим заказам, документы, гарантия на изделия." },
]

export const metadata = {
  title: "Контакты — StoneTrail",
  description:
    "Свяжитесь с командой StoneTrail: email, телефон, адрес офиса и склада. Приём заявок на подбор, раскрой и логистику.",
}

export default function ContactsPage() {
  return (
    <>
      <section className={cn("relative overflow-hidden", !arePromotionsEnabled() && "bg-muted/30")}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_0%,var(--primary-soft),transparent)]"
        />
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-12 py-24 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                Контакты
              </span>
              <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Давайте обсудим <span className="text-primary">ваш проект.</span>
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Напишите — и вы получите ответ в течение одного рабочего дня. Для срочных запросов используйте
                прямой контакт отдела.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="mailto:info@stonetrail.ru">
                  <Button className="h-11 gap-2 px-5 text-sm">
                    Написать письмо
                    <ArrowUpRight className="size-4" />
                  </Button>
                </a>
                <a href="tel:+74957801200">
                  <Button variant="outline" className="h-11 px-5 text-sm">
                    Позвонить
                  </Button>
                </a>
              </div>
            </div>

            <form className="rounded-2xl border border-border bg-card p-7" action="#" method="post">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Быстрая заявка
              </p>
              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="contacts-name">
                    Имя и компания
                  </label>
                  <Input id="contacts-name" type="text" placeholder="Иванова Иванна · Studio Lux" className="h-11" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="contacts-email">
                    Email
                  </label>
                  <Input id="contacts-email" type="email" placeholder="you@company.ru" className="h-11" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="contacts-message">
                    Опишите задачу
                  </label>
                  <Textarea id="contacts-message" rows={4} placeholder="Проект, материал, сроки…" />
                </div>
                <Button type="submit" className="h-11 w-full gap-2 text-sm">
                  Отправить
                  <Send className="size-4" />
                </Button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Нажимая «Отправить», вы соглашаетесь с обработкой данных согласно{" "}
                  <a href="/legal/privacy" className="text-primary hover:underline">
                    Политике конфиденциальности
                  </a>
                  .
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <header className="py-24 lg:pb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Каналы связи</p>
            <h2 className="mt-3 max-w-2xl text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Выберите удобный канал.
            </h2>
          </header>
          <div className="grid gap-5 pb-24 sm:grid-cols-2 lg:grid-cols-4">
            {channels.map((c) => {
              const CIcon = c.icon
              return (
                <article key={c.label} className="flex flex-col rounded-2xl border border-border bg-card p-6">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary">
                    <CIcon className="size-5" />
                  </span>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {c.label}
                  </p>
                  <h3 className="mt-1.5 font-display text-lg font-bold leading-snug text-foreground">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Офис и склад</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
                Адрес и правила приёма
              </h2>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <dd className="leading-relaxed text-muted-foreground">
                    г. Москва, ул. Каменная, 12, стр. 1 · шоурум и склад StoneTrail.
                  </dd>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                  <dd className="leading-relaxed text-muted-foreground">
                    Приём клиентов: Пн–Пт 9:00–19:00, Сб 10:00–16:00. Вск и праздники — выходной.
                  </dd>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="mt-0.5 size-4 shrink-0 text-primary" />
                  <dd className="leading-relaxed text-muted-foreground">
                    Посещение склада закрытого фонда — по предварительной записи и для профильных специалистов.
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Отделы</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
                Кем будет занят ваш запрос
              </h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {departments.map((d) => (
                  <li key={d.title} className="rounded-xl border border-border bg-card p-4">
                    <h3 className="font-display text-base font-bold leading-snug text-foreground">{d.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-balance font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Нужна консультация по камню?
              </h2>
              <p className="mt-4 max-w-xl text-pretty leading-relaxed text-primary-foreground/80">
                Забронируйте 30 минут с экспертом StoneTrail. Мы разберём ваш проект на материалах, сроках и
                рисках — и дадим письменное заключение.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <a href="mailto:consult@stonetrail.ru">
                <Button className={cn(onPrimaryCtaClass, "h-11 gap-2 px-5 text-sm")}>
                  consult@stonetrail.ru
                  <ArrowUpRight className="size-4" />
                </Button>
              </a>
              <a href="tel:+74957801200">
                <Button
                  variant="outline"
                  className="h-11 border-primary-foreground/30 bg-transparent px-5 text-sm text-primary-foreground hover:bg-black/10 hover:text-primary-foreground"
                >
                  +7 (495) 780-12-00
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
