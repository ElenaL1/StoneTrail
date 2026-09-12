import Link from 'next/link'
import { ArrowRight, Hammer, Store, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { onPrimaryCtaClass } from '@/lib/on-primary-cta'
import { arePromotionsEnabled } from '@/lib/promo-utils'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'О себе — StoneTrail',
  description:
    'В камне я работаю больше 25 лет. StoneTrail — профессиональная витрина материалов и площадка для общения людей, которым интересен камень.',
}

export default function AboutPage() {
  const even = arePromotionsEnabled() ? 'bg-background' : 'bg-muted/30'
  const odd = arePromotionsEnabled() ? 'bg-muted/30' : 'bg-background'

  return (
    <div className="text-foreground">
      {/* 1. HERO — градиент + бейдж */}
      <section className={cn('relative overflow-hidden pt-16 lg:pt-20', even)}>
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[var(--primary-soft)] opacity-70 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl items-start gap-10 px-5 pb-16 lg:grid-cols-[55fr_45fr] lg:items-stretch lg:gap-16 lg:px-8 lg:pb-20">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">
              Более 25 лет в каменной отрасли
            </p>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">О себе</h1>
            <p className="mt-10 font-display text-2xl font-medium leading-snug tracking-tight sm:text-[2rem]">
              В камне я работаю больше 25 лет.
            </p>
            <p className="mt-8 max-w-[38rem] text-lg leading-[1.8] text-foreground/80 lg:text-xl lg:leading-[1.8]">
              За это время отрасль изменилась до неузнаваемости: появились новые технологии, оборудование, материалы и
              подходы к обработке. Но главное осталось неизменным — ценность профессионального опыта и понимания
              камня, которое приходит только с годами работы.
            </p>
          </div>

          <figure className="flex min-w-0 flex-col lg:h-full">
            <div className="relative overflow-hidden lg:flex-1">
              <img
                src="/about/polygonal-masonry-peru.jpg"
                alt="Полигональная кладка, Перу"
                className="aspect-video size-full object-cover lg:aspect-auto"
              />
            </div>
            <figcaption className="mt-3 text-[13px] tracking-wide text-muted-foreground">
              Полигональная кладка, Перу
            </figcaption>
          </figure>
        </div>
      </section>

      {/* 2. ТИМELAЙН — с тегами */}
      <section className={cn('border-t border-border/70', odd)}>
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Профессиональный путь</p>

          <ol className="mt-12 space-y-16 lg:space-y-20">
            <li className="grid gap-6 border-t border-border/70 pt-10 lg:grid-cols-[14rem_minmax(0,38rem)] lg:gap-16 lg:pt-12">
              <div>
                <p className="font-display text-3xl font-semibold leading-none tracking-tight lg:text-4xl">1999</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-medium text-primary">
                    Управление филиалами
                  </span>
                  <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-medium text-primary">
                    Камнеобработка
                  </span>
                </div>
              </div>
              <div>
                <h2 className="font-display text-2xl font-medium tracking-tight lg:text-3xl">
                  Начало пути — «Гранул»
                </h2>
                <p className="mt-5 text-lg leading-[1.8] text-foreground/80 lg:text-xl">
                  Мой профессиональный путь начался в 1999 году в компании «Гранул». Это была хорошая школа и важный
                  этап в моей карьере. За несколько лет я прошёл путь до координатора филиалов, получил опыт управления
                  людьми и производственными процессами и, главное, глубоко погрузился в специфику камнеобработки.
                </p>
              </div>
            </li>

            <li className="grid gap-6 border-t border-border/70 pt-10 lg:grid-cols-[14rem_minmax(0,38rem)] lg:gap-16 lg:pt-12">
              <div>
                <p className="font-display text-3xl font-semibold leading-none tracking-tight lg:text-4xl">
                  <span className="block">2002</span>
                  <span className="mt-3 block text-lg font-medium tracking-normal text-muted-foreground lg:text-xl">
                    — настоящее время
                  </span>
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-medium text-primary">
                    Интересные объекты
                  </span>
                  <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-medium text-primary">
                    Работа с карьерами
                  </span>
                </div>
              </div>
              <div>
                <h2 className="font-display text-2xl font-medium tracking-tight lg:text-3xl">
                  Работа в крупной камнеобрабатывающей компании
                </h2>
                <p className="mt-5 text-lg leading-[1.8] text-foreground/80 lg:text-xl">
                  С 2002 года я работаю в одной из крупнейших российских компаний камнеобрабатывающей отрасли, где
                  продолжаю заниматься камнем, его обработкой и всем тем, что связано с профессиональной работой с
                  натуральными материалами.
                </p>
                <p className="mt-6 text-lg leading-[1.8] text-foreground/80 lg:text-xl">
                  За годы работы пришлось увидеть практически все стороны нашей отрасли — от выбора материала и оценки
                  его свойств до обработки, производства и решения сложных технических задач. Я хорошо знаю, насколько
                  сильно конечный результат зависит не только от самого камня, но и от правильного оборудования,
                  технологии, опыта специалиста и понимания особенностей конкретного материала.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* 3. ЗАЧЕМ — 3 рубрики */}
      <section className={cn('border-t border-border/70', even)}>
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Площадка</p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Зачем появился
              <br />
              StoneTrail
            </h2>
          </div>

          <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-3 lg:gap-10">
            {/* Витрина */}
            <article>
              <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-[var(--primary-soft)]">
                <Store className="size-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-display text-xl font-medium tracking-tight">Витрина</h3>
              <p className="mt-4 text-base leading-[1.8] text-foreground/80">
                Изначально идея была простой — создать профессиональную витрину материалов, которые я знаю, которыми
                занимаюсь и которые считаю достойными внимания. Каждый образец подобран и описан с опорой на многолетний
                опыт работы с камнем.
              </p>
            </article>

            {/* Сообщество */}
            <article>
              <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-[var(--primary-soft)]">
                <Users className="size-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-display text-xl font-medium tracking-tight">Сообщество</h3>
              <p className="mt-4 text-base leading-[1.8] text-foreground/80">
                Со временем стало понятно, что одной витрины недостаточно. В отрасли огромное количество знаний
                передаётся от специалиста к специалисту: какие-то вещи нигде не написаны, технологии осваиваются на
                собственных ошибках. StoneTrail — место, где можно обсудить обработку, оборудование, особенности пород
                и практические вопросы.
              </p>
            </article>

            {/* Практика */}
            <article>
              <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-[var(--primary-soft)]">
                <Hammer className="size-6 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-display text-xl font-medium tracking-tight">Практика</h3>
              <p className="mt-4 text-base leading-[1.8] text-foreground/80">
                Площадка для людей, действительно работающих с камнем: обмениваться опытом, задавать вопросы, делиться
                решениями. Без лишнего пафоса и теории ради теории. С опорой на практический опыт. Я по-прежнему каждый
                день работаю с камнем и продолжаю учиться.
              </p>
            </article>
          </div>

          <p className="mt-12 max-w-2xl font-display text-2xl font-medium leading-snug tracking-tight text-foreground lg:mt-16 lg:text-[1.7rem]">
            Если у вас есть опыт, которым стоит поделиться, технический вопрос или просто желание поговорить о камне с
            людьми из отрасли — добро пожаловать.
          </p>
        </div>
      </section>

      {/* 5. CTA — двухколоночный с фото */}
      <section className="border-t border-border bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl items-stretch lg:grid-cols-2">
          <div className="flex flex-col justify-center px-5 py-16 lg:px-8 lg:py-20">
            <h2 className="font-display text-3xl font-medium tracking-tight lg:text-4xl">
              Если вы работаете с камнем — присоединяйтесь.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-[1.8] text-primary-foreground/75">
              Обсуждайте технологии, делитесь опытом, задавайте вопросы и находите профессиональные контакты.
            </p>
            <div className="mt-9">
              <Button asChild className={cn(onPrimaryCtaClass, "h-11 gap-2 px-5 text-sm")}>
                <Link href="/community">
                  Перейти на форум
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
          {/* Слот под фото: пока зелёный фон секции */}
          <div className="min-h-48 lg:min-h-0" aria-hidden="true" />
        </div>
      </section>
    </div>
  )
}