# Интеграции и эксплуатация

Документ описывает то, что есть в репозитории и конфигах. Секреты сюда не входят.

## CI/CD

Платформа — GitHub Actions, файл [.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml). Пайплайн запускается при пуше в `main`.

1. Frontend: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`.
2. Backend: установка пакета с dev-зависимостями, `ruff check .`, `black --check .`, миграции Alembic, `pytest`.
3. Сборка образов frontend и backend и публикация в `ghcr.io` с тегами `:latest` и `:${GITHUB_SHA}`.
4. Деплой на self-hosted runner: compose из `infra/` поднимает новые образы на VPS. Сайт отдаёт системный nginx с `https://stonetrail.ru` на контейнерный порт 8080.

Job деплоя зависит от сборки, сборка зависит от обоих тестовых job. Если lint или тесты падают, образы не публикуются и выкладка не начинается.

Каркас workflow собирался с помощью AI и затем сверен с этим файлом. Проверки `pnpm lint`, `ruff` и `black` добавлены в уже существующие jobs.

## Яндекс ID

Провайдер один: Яндекс ID. Приложение регистрируется в консоли Яндекса. В git секрета нет: в [backend/.env.example](backend/.env.example) поля `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET` и `YANDEX_REDIRECT_URI` пустые и закомментированы. На сервере их задают в `infra/.env`. Redirect URI должен совпадать с значением в консоли. Пока три значения не заданы, `yandex_enabled` ложен и старт входа отвечает ошибкой, а не уходит к Яндексу.

Вход с сайта: кнопка ведёт на `GET /auth/yandex` (`frontend/lib/auth/yandex.ts`). Backend кладёт состояние в HttpOnly-cookie и перенаправляет на `https://oauth.yandex.ru/authorize`. Колбэк `GET /auth/yandex/callback` сверяет state, обменивает code на профиль и либо ставит сессию, либо отправляет на `/register/yandex`, если аккаунт ещё нужно дозаполнить. Ошибки возвращаются на страницу входа или профиля параметром `yandex` (`frontend/lib/auth/paths.ts`). Привязка уже существующего пользователя идёт с `intent=link` из профиля.

## Яндекс.Метрика

Счётчик `113104485` подключён в [frontend/components/yandex-metrika.tsx](frontend/components/yandex-metrika.tsx). В production компонент ставит `tag.js` и при каждой смене пути или query вызывает `ym(..., "hit", url)`. В development счётчик не грузится. Отдельных целей вроде «вошёл» или «зарегистрировался» в коде нет.

## Мониторинг

Endpoint'ы описаны в [docs/monitoring.md](docs/monitoring.md). Снаружи их смотрит бесплатный UptimeRobot, аккаунт в репозитории не создаётся.

- `https://stonetrail.ru/` — монитор HTTP. На бесплатном плане он шлёт HEAD.
- `https://stonetrail.ru/health/ready` — монитор Keyword. Он сам шлёт GET и ищет строку `"status":"ok"`. Алерт, если строки нет (`keyword not exists`).
- `https://stonetrail.ru/health/live` в UptimeRobot не включён: HTTP-монитор шлёт HEAD, а маршрут принимает только GET и отвечает 405. Переключение метода на GET в HTTP-мониторе платное.

Docker по-прежнему проверяет `GET /health` (процесс и `SELECT 1`). Этот URL для UptimeRobot не используется.

## Логи

Backend пишет JSON в stdout. Уровень задаёт `LOG_LEVEL`: `debug`, `info`, `warning`, `error`. Пароли, cookie и ключи в лог не попадают. Подробности — в [docs/error-handling.md](docs/error-handling.md).

Сводка для разбора, без сырых строк:

```bash
docker logs backend | python scripts/summarize_logs.py
```

Скрипт печатает число разобранных строк, число 5xx, сбои базы, отказы доступа и маршруты с 5xx. В модель отдают только этот JSON.

Промпт:

```text
Ниже сводка логов StoneTrail из scripts/summarize_logs.py. Сырых логов нет и не будет.
Поля: parsed, serverErrors, databaseFailures, authFailures, byStatus, byErrorCode, failingRoutes.
Обычная активность: parsed растёт, serverErrors и databaseFailures равны 0, authFailures малы относительно parsed.
5xx: serverErrors > 0 или в failingRoutes есть маршруты со статусом 500–599.
Отказ доступа: растёт authFailures или в byErrorCode есть invalid_credentials, forbidden, unverified.
Напиши, есть ли сбой базы, всплеск 5xx или только обычные отказы входа. Не выдумывай маршруты и числа, которых нет в сводке.
```

Пример обычной сводки: `serverErrors` 0, `databaseFailures` 0, `authFailures` небольшой, `failingRoutes` пустой. Пример сбоя: `databaseFailures` больше 0 и в `byErrorCode` есть `unavailable`. Пример 5xx: `serverErrors` больше 0 и `failingRoutes` содержит маршрут со статусом 500. Пример отказов доступа: `authFailures` заметно больше нуля при нулевых `serverErrors` и `databaseFailures`.

AI использовался, чтобы сформулировать этот промпт по полям `scripts/summarize_logs.py`. На боевых логах он в рамках этой задачи не запускался.

## Где использовался AI

- Каркас GitHub Actions и последующее добавление lint в существующие jobs.
- Разбор вывода `pnpm audit`: какие advisory относятся к runtime `next`, а какие только к CLI `shadcn` и dev-зависимостям. Итог записан в [security_audit.md](security_audit.md) после повторного запуска команды.
- Текст промпта для сводки логов выше. Факты о полях взяты из `scripts/summarize_logs.py`.
