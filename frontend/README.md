# StoneTrail — frontend

Next.js-приложение платформы StoneTrail. Описание проекта и инструкции по запуску — в [корневом README](../README.md).

Кратко из каталога `frontend/`:

```bash
pnpm install
pnpm dev
```

Приложение: [http://localhost:3000](http://localhost:3000). Нужны Node.js 22+ и pnpm.

```bash
pnpm test
pnpm lint
pnpm build
pnpm start
```

## Стек

- Next.js 16 (App Router) и React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui (`@base-ui/react`)
- lucide-react
- Vitest

Данные пока моковые: каталог и контент в [`lib/mock-data.ts`](lib/mock-data.ts), авторизация — [`lib/auth/mock-auth-service.ts`](lib/auth/mock-auth-service.ts) (localStorage).

## Структура

- `app/` — маршруты App Router (каталог, сообщество, статьи, новости, услуги, юридические страницы)
- `components/` — UI приложения; примитивы shadcn лежат в `components/ui/` и не правятся напрямую
- `lib/` — утилиты, типы (`lib/types.ts`), мок-данные и клиентские контексты
- `public/` — статика и демо-фото камня

## Разработка

Иконки — только `lucide-react`. Условные классы — через `cn()` из `@/lib/utils`. 
