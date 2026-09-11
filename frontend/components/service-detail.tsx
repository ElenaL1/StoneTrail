import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { onPrimaryCtaClass } from "@/lib/on-primary-cta"
import { arePromotionsEnabled } from "@/lib/promo-utils"
import { cn } from "@/lib/utils"

export type ServiceFeature = {
  title: string
  description: string
  icon: LucideIcon
}

export type ServiceProcessStep = {
  step: number
  title: string
  description: string
}

export type ServiceFact = {
  label: string
  value: string
}

export type ServiceRelated = {
  name: string
  href: string
  description: string
}

export type ServiceDetailProps = {
  icon: LucideIcon
  tag: string
  title: string
  intro: string
  features: ServiceFeature[]
  process: ServiceProcessStep[]
  facts: ServiceFact[]
  related: ServiceRelated[]
}

export function ServiceDetailPage(props: ServiceDetailProps) {
  const { tag, title, intro, features, process, facts, related } = props
  return (
    <>
      <section className={cn("relative overflow-hidden", !arePromotionsEnabled() && "bg-muted/30")}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_0%,var(--primary-soft),transparent)]"
        />
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 py-24 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                {tag}
              </span>
              <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                {intro}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/contacts" className="flex-1 sm:flex-none">
                  <Button className="h-11 gap-2 px-5 text-sm">
                    Запросить расчёт
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/about" className="flex-1 sm:flex-none">
                  <Button variant="outline" className="h-11 px-5 text-sm">
                    О компании
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Параметры услуги
              </p>
              <dl className="mt-4 space-y-3.5">
                {facts.map((f) => (
                  <div key={f.label} className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-3 last:border-none last:pb-0">
                    <dt className="text-sm text-muted-foreground">{f.label}</dt>
                    <dd className="text-right text-sm font-semibold text-foreground">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <header className="py-24 lg:pb-10 lg:pt-24">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Что входит</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Профессиональный подход в каждой детали.
            </h2>
          </header>
          <div className="grid gap-5 pb-24 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const FeatureIcon = f.icon
              return (
                <article
                  key={f.title}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-7 transition-all hover:border-primary/40 hover:shadow-[0_16px_40px_-24px_rgba(35,72,58,0.4)]"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-primary">
                    <FeatureIcon className="size-5" />
                  </span>
                  <h3 className="mt-6 font-display text-lg font-bold leading-snug text-foreground">{f.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className={cn("border-t border-border", !arePromotionsEnabled() ? "bg-background" : "bg-muted/40")}>
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-accent">Как мы работаем</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Прозрачный процесс без сюрпризов в смете.
            </h2>
          </div>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step) => (
              <li key={step.step} className="relative flex flex-col rounded-2xl border border-border bg-card p-6">
                <span className="font-display text-3xl font-bold text-primary">{String(step.step).padStart(2, "0")}</span>
                <h3 className="mt-4 font-display text-base font-bold leading-snug text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Связанные услуги</p>
              <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Полный цикл работы с камнем.
              </h2>
            </div>
            <Link href="/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Все услуги
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-[0_16px_40px_-24px_rgba(35,72,58,0.4)]"
              >
                <p className="flex items-center justify-between gap-2 font-display text-lg font-bold text-foreground">
                  {r.name}
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-balance font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Готовы обсудить проект?
              </h2>
              <p className="mt-4 max-w-xl text-pretty leading-relaxed text-primary-foreground/80">
                Мы поможем подобрать оптимальное решение под задачу, бюджет и сроки. Свяжитесь с экспертом — ответим в течение рабочего дня.
              </p>
            </div>
            <Link href="/contacts" className="w-full sm:w-auto">
              <Button className={cn(onPrimaryCtaClass, "h-11 gap-2 px-6 text-sm")}>
                Написать
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
