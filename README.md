# StoneTrail

Профессиональная платформа камнеобрабатывающего бизнеса с опытом более 25 лет.

Коммерческая часть показывает и помогает вести **собственный** инвентарь камня: блоки, слэбы, заготовки, плитка, брусчатка и готовые изделия. Это не маркетплейс и не витрина нескольких продавцов — фонд принадлежит владельцу.

Сообщество — отраслевой хаб: форум, экспертные статьи, новости и услуги (подбор, раскрой, логистика и консультации). Интерфейс на русском.

Каталог камня и изделий читается из FastAPI `/api/catalog/*`. Новости, форум и статьи на фронтенде пока моковые (`frontend/lib/mock-data.ts`). Авторизация идёт в FastAPI `/auth/*` (см. `backend/`).

## Стек

- Next.js 16 (App Router) и React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui (`@base-ui/react`)
- Vitest
- Docker + nginx для деплоя

## Структура репозитория

```
frontend/     Next.js-приложение
backend/     FastAPI + PostgreSQL
infra/        docker-compose и nginx
.github/      CI/CD (тесты, сборка образа, деплой)
```

## Запуск локально

Нужны **Node.js 22+** и **pnpm**. Если pnpm ещё нет:

```bash
corepack enable
```

Затем:

```bash
cd frontend
pnpm install
pnpm dev
```

Приложение откроется на [http://localhost:3000](http://localhost:3000).

Другие команды (из каталога `frontend/`):

```bash
pnpm test         # Vitest
pnpm test:watch   # тесты в watch-режиме
pnpm lint         # ESLint
pnpm build        # production-сборка
pnpm start        # запуск собранного приложения
```

## Docker

Прод собирается в `infra/`: nginx на порту **8080** проксирует `/` на фронт и `/auth`, `/api`, `/health` на backend. Postgres в той же сети, порт **5432 наружу не публикуется**. Образы публикует CI (`:${GITHUB_SHA}` и `:latest`); на сервере compose поднимает SHA-теги.

Один раз на VPS:

```bash
cd ~/stonetrail/infra
cp .env.example .env   # или создать .env вручную
# задать DOCKER_USERNAME и POSTGRES_PASSWORD
```

CI делает `docker compose pull frontend backend && docker compose up -d` (nginx и Postgres не перекачиваются, если уже есть локально). После **первого** поднятия каталог пустой, пока не выполнить сид (не нужно на каждый последующий deploy):

```bash
cd ~/stonetrail/infra
docker compose exec backend python scripts/seed_catalog.py
```

Локальная сборка образов:

```bash
docker build -t stonetrail-frontend ./frontend
docker build -t stonetrail-backend ./backend
```

Сайт за compose: [http://localhost:8080](http://localhost:8080). Локальная разработка по-прежнему два процесса (`pnpm dev` + `uvicorn`) и `NEXT_PUBLIC_API_URL=http://localhost:8000`.
