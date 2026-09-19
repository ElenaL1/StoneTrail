# StoneTrail — frontend

Next.js-приложение платформы StoneTrail. Описание проекта и инструкции по запуску — в [корневом README](../README.md).

Кратко из каталога `frontend/`:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Нужны **два процесса**: этот фронт и FastAPI (`uvicorn` из `backend/`). Локально cookie `st_session` ставит API на `http://localhost:8000` (`NEXT_PUBLIC_API_URL`). В production браузер ходит same-origin через nginx; RSC — в `API_URL` (server-only).

Приложение: [http://localhost:3000](http://localhost:3000). Нужны Node.js 22+ и pnpm.

```bash
pnpm test
pnpm lint
pnpm build
pnpm start
```

При `AUTH_DEBUG_LINKS=true` на бэкенде ответы register / resend / change-email / forgot содержат `demoVerificationPath` или `demoResetPath` — локальные ссылки для разработки. В production письма уходят через SMTP, флаг выключают.

## Стек

- Next.js 16 (App Router) и React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui (`@base-ui/react`)
- lucide-react
- Vitest

Авторизация — [`lib/auth/api-client.ts`](lib/auth/api-client.ts) → FastAPI `/auth/*`. Каталог — [`lib/catalog/api-client.ts`](lib/catalog/api-client.ts) → `/catalog/*`. Новости, форум и статьи пока в [`lib/mock-data.ts`](lib/mock-data.ts).

## Структура

- `app/` — маршруты App Router (каталог, сообщество, статьи, новости, услуги, юридические страницы)
- `components/` — UI приложения; примитивы shadcn лежат в `components/ui/` и не правятся напрямую
- `lib/` — утилиты, типы (`lib/types.ts`), мок-данные и клиентские контексты
- `public/` — статика и демо-фото камня

## Разработка

Иконки — только `lucide-react`. Условные классы — через `cn()` из `@/lib/utils`.
