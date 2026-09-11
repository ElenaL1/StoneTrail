import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"
import { services } from "@/lib/services-data"
import { stats } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { arePromotionsEnabled } from "@/lib/promo-utils"

export const metadata = {
  title: "Услуги StoneTrail — подбор, консультации, логистика, раскрой",
  description:
    "Полный цикл работы с натуральным камнем: подбор слэба, технические консультации, безопасная доставка и промышленный раскрой.",
}

const highlights = [
  "Работа с закрытым фондом редких слэбов",
  "Письменные сметы и заключение — без устных догадок",
  "Страхование каждой партии в пути",
  "Понятный контроль сроков на каждом шаге",
]

export default function ServicesHomePage() {
  return (
    <>
      <section className={cn("relative overflow-hidden", !arePromotionsEnabled() && "bg-muted/30")}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_0%,var(--primary-soft),transparent)]"
        />
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-12 py-24 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                Полный цикл работы с камнем
              </span>
              <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Услуги StoneTrail. <span className="text-primary">От слэба до объекта.</span>
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                Четыре направления, закрывающие весь путь материала — от подбора и экспертной консультации на ранней
                стадии проекта до промышленного раскроя и бережной доставки на объект.
              </p>
              <dl className="mt-10 grid max-w-xl grid-cols-2 gap-x-8 gap-y-6 border-t border-border pt-6">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dt className="font-display text-2xl font-bold text-foreground">{s.value}</dt>
                    <dd className="text-sm text-muted-foreground">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-2xl border border-border bg-card p-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Почему выбирают нас
              </p>
              <ul className="mt-4 space-y-3.5">
                {highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-primary">
                      <Check className="size-3" />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-border pt-5">
                <Link href="/contacts" className="group flex items-center gap-2 text-sm font-semibold text-primary">
                  Обсудить проект
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <header className="py-24 lg:pb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Направления</p>
            <h2 className="mt-3 max-w-2xl text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Четыре сервиса, которые складываются в одну команду.
            </h2>
          </header>

          <div className="grid gap-5 pb-24 md:grid-cols-2 lg:grid-cols-4">
            {services.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-7 transition-all hover:border-primary/40 hover:shadow-[0_16px_40px_-24px_rgba(35,72,58,0.4)]"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-6 font-display text-xl font-bold leading-snug text-foreground">{s.shortName}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{s.shortDescription}</p>
                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Подробнее
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="flex flex-col gap-10 rounded-2xl border border-border bg-card p-8 md:flex-row md:items-center md:justify-between md:p-12">
            <div>
              <h2 className="text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Не уверены, какой сервис вам нужен?
              </h2>
              <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
                Оставьте проект на экспертизу — определим, где именно начинается экономия и где начинается риск.
                Первая консультация — без обязательств.
              </p>
            </div>
            <Link href="/contacts" className="w-fit">
              <Button className="h-11 gap-2 px-6 text-sm">
                Написать эксперту
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
