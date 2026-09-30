# Отчёт по безопасности

Дата проверки: 30 сентября 2026. Гипотеза без подтверждения командой, конфигом или кодом в этот отчёт не вносилась.

## Что проверялось

- Frontend: `pnpm audit` в каталоге `frontend`.
- Backend: `pip-audit` в окружении `backend`. Пакет в `backend/pyproject.toml` не добавлялся. Локальный пакет `stonetrail-backend` инструмент пропустил: его нет на PyPI, это имя самого проекта, а не сторонняя зависимость.
- Код: запросы к базе, cookie сессии, ответы `/health`, обработка ошибок, разметка Markdown, скрипт темы.

AI разбирал вывод `pnpm audit` и сопоставлял пути пакетов с `package.json`, Dockerfile и импортами. Источник находки ниже — команда или файл, не вывод модели.

## Проверки по коду

- Запросы к PostgreSQL идут через SQLAlchemy. Единственный сырой SQL в рабочем пути health-check — литерал `SELECT 1` в `backend/repositories/health.py`. Пользовательский ввод в этот запрос не подставляется.
- Сессия и состояние OAuth ставятся cookie с `httponly=True` и `samesite="lax"`. Флаг `secure` берётся из `COOKIE_SECURE` (`backend/core/cookies.py`). В проде compose задаёт `COOKIE_SECURE=true`.
- `GET /health/ready` не возвращает хост, пароль и текст исключения. Сбой пишется как имя компонента и тип ошибки (`backend/services/health.py`).
- Необработанные ошибки API отдают общий JSON без SQL и stack trace (`backend/api/error_handlers.py`, `docs/error-handling.md`).
- Markdown рендерится узлами React, не через `innerHTML`. Ссылки и картинки принимаются только с `https?://` (`frontend/lib/markdown.tsx`).
- `dangerouslySetInnerHTML` есть только у константного скрипта темы в `frontend/app/layout.tsx`. В строку не попадают данные пользователя.

## Подтверждённые находки

### Next.js 16.3.0, critical, runtime

Источник: `pnpm audit`. Пакет `next`, путь `.>next`.

Три advisory на версии `>=16.0.0` ниже патча:

- GHSA-p293-qw3h-jr36, исправлено в `>=16.3.3`
- GHSA-2xp9-vwfh-vxw4, исправлено в `>=16.3.3`
- GHSA-vcvr-r3jv-pc5j, исправлено в `>=16.3.6`

В `frontend/package.json` стояло `next` `16.3.0`. Это зависимость работающего сервера Next.js, она попадает в образ.

Исправление: `next` обновлён до `16.3.7`. Это последний патч 16.3, который на момент проверки уже проходил ограничение `minimumReleaseAge` в `frontend/pnpm-workspace.yaml`. `16.3.8` вышел в тот же день и установщик его отклонил. Повторный `pnpm audit` этих трёх advisory больше не показывает.

## Что оставлено

После обновления `pnpm audit` сообщает 18 записей: 3 low, 9 moderate, 6 high. Все пути идут через пакет `shadcn` (CLI) и его зависимости `undici`, `fast-uri`, `ip-address`, `brace-expansion`, либо через dev-зависимость `eslint-config-next` (`brace-expansion`).

`shadcn` указан в `dependencies`, но исходники приложения его не импортируют. Боевой образ копирует `.next/standalone`, а не весь `node_modules` (`frontend/Dockerfile`). Эти пакеты не являются runtime сайта. Обновление дерева CLI ради них меняет инструмент генерации компонентов и не закрывает дыру в работающем приложении, поэтому версии не трогались.

`pip-audit` известных уязвимостей в зависимостях backend не нашёл.

Лимит попыток входа хранится в памяти одного процесса (`backend/core/rate_limit.py`) и сбрасывается при рестарте. В `backend/docker-entrypoint.sh` uvicorn запускается без нескольких worker-процессов. Вынос лимита в общее хранилище потребовал бы новый сервис, это вне текущей задачи.

## Рекомендации

- Когда `next@16.3.8` или новее пройдёт `minimumReleaseAge`, обновить патч ещё раз и снова запустить `pnpm audit`.
- Не переносить `shadcn` в runtime-импорты приложения.
- Повторять `pnpm audit` и `pip-audit` при обновлении зависимостей.
