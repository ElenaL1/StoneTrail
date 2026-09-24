# StoneTrail

Профессиональная платформа камнеобрабатывающего бизнеса с опытом более 25 лет.

Коммерческая часть показывает и помогает вести **собственный** инвентарь камня: блоки, слэбы, заготовки, плитка, брусчатка и готовые изделия. Это не маркетплейс и не витрина нескольких продавцов — фонд принадлежит владельцу.

Сообщество — отраслевой хаб: форум, экспертные статьи, новости и услуги (подбор, раскрой, логистика и консультации). Интерфейс на русском.

Каталог, авторизация, форум и статьи читаются из FastAPI. Новости пока моковые (`frontend/lib/mock-data.ts`).

## Стек

- Next.js 16 (App Router) и React 19
- TypeScript, Tailwind CSS v4, shadcn/ui (`@base-ui/react`)
- FastAPI, PostgreSQL 16, Alembic
- Docker и nginx

## Локальный запуск

Нужны Node.js 22+, pnpm, Python 3.11+ и Docker. Фронтенд и API — два процесса. Браузер ходит в API напрямую (`NEXT_PUBLIC_API_URL=http://localhost:8000`).

### Backend

```bash
cd backend
cp .env.example .env
docker compose up -d
python -m venv .venv
```

Активация окружения: Windows — `.venv\Scripts\activate`, Unix — `source .venv/bin/activate`. Дальше:

```bash
pip install -e ".[dev]"
alembic upgrade head
uvicorn api.main:app --reload
```

Проверка: [http://localhost:8000/health](http://localhost:8000/health). OpenAPI: [http://localhost:8000/docs](http://localhost:8000/docs).

Каталог после первого подъёма базы пустой. Сид идемпотентный:

```bash
python scripts/seed_catalog.py
```

В `.env` для локальной разработки оставьте `AUTH_DEBUG_LINKS=true` и пустой SMTP: ссылки подтверждения почты и сброса пароля приходят в ответе API и в логе uvicorn. Подробности эндпоинтов — в [backend/README.md](backend/README.md).

### Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

Приложение: [http://localhost:3000](http://localhost:3000).

```bash
pnpm test
pnpm lint
pnpm build
```

## Запуск на сервере

Прод — `infra/docker-compose.yaml`. Nginx в контейнере слушает **8080** и проксирует `/` на фронт, а `/auth`, `/api` и `/health` на backend. Postgres в той же сети, порт **5432 наружу не публикуется**. Браузер ходит same-origin; серверный рендер Next.js использует `API_URL=http://backend:8000`. Миграции выполняет entrypoint образа backend.

Образы публикует CI в GitHub Container Registry (`ghcr.io`, теги `:${GITHUB_SHA}` и `:latest`). Self-hosted runner копирует compose в `~/stonetrail/infra`, логинится в `ghcr.io` и поднимает SHA-теги frontend и backend.

Один раз на VPS:

```bash
cd ~/stonetrail/infra
cp .env.example .env
# задать POSTGRES_PASSWORD и при необходимости SMTP_*
```

Домен `stonetrail.ru` принимает системный nginx на 80/443 и проксирует на `127.0.0.1:8080`. Пример конфига — [infra/host-nginx-stonetrail.conf](infra/host-nginx-stonetrail.conf).

После **первого** поднятия каталог сидируется вручную (не на каждый deploy):

```bash
cd ~/stonetrail/infra
docker compose exec backend python scripts/seed_catalog.py
```

Сайт за compose: [http://localhost:8080](http://localhost:8080). На сервере — [https://stonetrail.ru](https://stonetrail.ru).
