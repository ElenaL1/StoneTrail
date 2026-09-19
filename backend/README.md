# StoneTrail backend

Каркас FastAPI по слоям из `frontend/AI_RULES.md`. Источник схемы — SQLAlchemy-модели и Alembic. Ручной DDL шага 1 (`schema/001_initial.sql`) — эталон, его больше не меняем.

Локально фронтенд ходит в FastAPI напрямую (`NEXT_PUBLIC_API_URL=http://localhost:8000`). В Docker браузер бьёт в same-origin `/auth` и `/catalog` через nginx; RSC использует server-only `API_URL=http://backend:8000`. Cookie `st_session` нужна только для auth.

## Требования

- Python 3.11+
- Docker (локальный PostgreSQL 16)

## Запуск

```bash
cd backend
cp .env.example .env
docker compose up -d
python -m venv .venv
# Windows: .venv\Scripts\activate
# Unix: source .venv/bin/activate
pip install -e ".[dev]"
alembic upgrade head
uvicorn api.main:app --reload
```

Проверка: [http://localhost:8000/health](http://localhost:8000/health) → `{"status":"ok"}`.

Каталог (read-only, без cookie):

```bash
python scripts/seed_catalog.py
```

Снимок мока — `seeds/catalog.json` (не runtime source of truth). Повторный прогон идемпотентен.

| Метод | Путь |
| --- | --- |
| GET | `/catalog/stones` и `/catalog/stones/{slug}` |
| GET | `/catalog/blocks` и `/catalog/blocks/{slug}` |
| GET | `/catalog/products` (`?category=` `?group=` optional, unknown → `[]`) и `/catalog/products/{slug}` |

Публичный `id` в JSON — slug, не UUID. Soft-delete неотличим от 404 `not_found`.

## Auth

Сессия — cookie `st_session` (`HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=604800`). `Secure` включается через `COOKIE_SECURE=true`.

| Метод | Путь | Cookie |
| --- | --- | --- |
| POST | `/auth/register` | Set-Cookie |
| POST | `/auth/login` | Set-Cookie |
| POST | `/auth/logout` | delete, идемпотентный 200 |
| GET | `/auth/me` | нужна живая сессия |
| PATCH | `/auth/profile` | без изменений |
| POST | `/auth/verify-email` | Set-Cookie, если не было сессии этого пользователя |
| POST | `/auth/resend-verification` | без изменений |
| POST | `/auth/change-email` | сессии не revoke |
| POST | `/auth/forgot-password` | тело всегда `{ "submitted": true }`; при `AUTH_DEBUG_LINKS` ещё `demoResetPath` |
| POST | `/auth/reset-password` | revoke всех сессий + delete cookie |

При `AUTH_DEBUG_LINKS=true` register / resend / change-email / forgot возвращают `demoVerificationPath` или `demoResetPath` (ссылка также пишется в лог). Флаг не зависит от SMTP: если почта не ушла, debug-ссылка сама не появится. В проде выключить. Для несуществующего email forgot отдаёт `/reset-password?token=invalid`.

SMTP (Selectel): `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURITY` (`starttls` или `tls`), `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_FROM_NAME`. Письмо отправляется после commit пользователя/токена; ошибка SMTP логируется и не откатывает регистрацию. Пароль SMTP в логи и ответы не пишется. Selectel принимает SMTP только со своих серверов — локально поля можно оставить пустыми.

Ошибки — единый JSON: `{ message, code, fieldErrors, retryAfterSeconds }`, без FastAPI `detail`.

Rate limit process-local (in-memory): сбрасывается при рестарте процесса и **не** шарится между uvicorn workers.

## Команды

```bash
ruff check .
black --check .
pytest
python scripts/seed_catalog.py
alembic upgrade head
alembic downgrade -1
```

Новые изменения схемы — только новой миграцией Alembic, не правкой `schema/001_initial.sql`.

## Docker (infra)

Образ — `backend/Dockerfile` (один uvicorn process, `alembic upgrade` на старте). Прод поднимается из `infra/`, не из этого compose.

После первого `docker compose up` в `infra/` каталог сидируется вручную (не на каждый deploy):

```bash
cd ../infra
docker compose exec backend python scripts/seed_catalog.py
```
