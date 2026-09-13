# StoneTrail

Профессиональная платформа камнеобрабатывающего бизнеса с опытом более 25 лет.

Коммерческая часть показывает и помогает вести **собственный** инвентарь камня: блоки, слэбы, заготовки, плитка, брусчатка и готовые изделия. Это не маркетплейс и не витрина нескольких продавцов — фонд принадлежит владельцу.

Сообщество — отраслевой хаб: форум, экспертные статьи, новости и услуги (подбор, раскрой, логистика и консультации). Интерфейс на русском.

Данные на фронтенде пока моковые: каталог и контент живут в `frontend/lib/mock-data.ts`, авторизация — в `frontend/lib/auth/mock-auth-service.ts` (localStorage). Отдельного backend-сервиса в репозитории пока нет.

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

Сборка образа фронтенда:

```bash
docker build -t stonetrail-frontend ./frontend
docker run --rm -p 3000:3000 stonetrail-frontend
```

Прод-схема в `infra/docker-compose.yaml`: контейнер фронтенда за nginx на порту **8080**. Compose рассчитан на уже опубликованный образ `${DOCKER_USERNAME}/stonetrail-frontend:latest` (так его поднимает CI/CD). Для локальной проверки после `docker build`:

```bash
docker tag stonetrail-frontend "$DOCKER_USERNAME/stonetrail-frontend:latest"
cd infra
docker compose up
```

Сайт будет доступен на [http://localhost:8080](http://localhost:8080).
