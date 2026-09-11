import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { arePromotionsEnabled } from "@/lib/promo-utils"

export type LegalItem =
  | { type: "paragraph"; content: ReactNode }
  | { type: "list"; ordered?: boolean; items: ReactNode[] }

export type LegalSection = {
  id: string
  heading: string
  items: LegalItem[]
}

export type LegalPageProps = {
  tag: string
  title: string
  summary: string
  updated: string
  related: { name: string; href: string }[]
  sections: LegalSection[]
}

function Inline({ content }: { content: ReactNode }) {
  return <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{content}</div>
}

export function LegalPage({ tag, title, summary, updated, related, sections }: LegalPageProps) {
  return (
    <>
      <section className={cn("relative overflow-hidden", !arePromotionsEnabled() && "bg-muted/30")}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_85%_0%,var(--primary-soft),transparent)]"
        />
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                {tag}
              </span>
              <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                {summary}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Дата редакции</dt>
                  <dd className="font-semibold text-foreground">{updated}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Субъект</dt>
                  <dd className="text-right font-semibold text-foreground">StoneTrail, ИР</dd>
                </div>
              </dl>
              <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                Настоящий документ опубликован на русском языке. Вопросы по тексту вы можете направить через страницу «Контакты».
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl gap-10 px-5 py-24 lg:grid lg:grid-cols-[240px_1fr] lg:px-8">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Навигация по разделам</p>
              <nav className="mt-4 flex flex-col gap-1">
                {sections.map((s, idx) => (
                  <a key={s.id} href={`#${s.id}`} className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    <span className="mr-2 font-mono text-xs text-foreground/60">{idx + 1}</span>
                    {s.heading}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-balance font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.items.map((item, i) => (
                    <div key={i}>
                      {item.type === "paragraph" && <Inline content={item.content} />}
                      {item.type === "list" && (
                        item.ordered ? (
                          <ol className="ml-5 list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground/70">
                            {item.items.map((li, j) => (
                              <li key={j}>{li}</li>
                            ))}
                          </ol>
                        ) : (
                          <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground/70">
                            {item.items.map((li, j) => (
                              <li key={j}>{li}</li>
                            ))}
                          </ul>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="flex flex-col gap-10 rounded-2xl border border-border bg-card p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-accent">Другие правовые документы</p>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">
                Полная правовая информация компании
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Ознакомьтесь со связанными документами, затрагивающими использование данных и пользовательских соглашений StoneTrail.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {related.map((r) => (
                <Link key={r.href} href={r.href} className="w-fit">
                  <Button variant="outline" className="h-10 text-sm">
                    {r.name}
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
