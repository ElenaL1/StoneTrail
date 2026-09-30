# Мониторинг

Приложение работает на своём VPS: Docker Compose, системный nginx, сайт `https://stonetrail.ru`. У такого хостинга нет встроенного uptime и почтовых алертов. Docker `HEALTHCHECK` нужен деплою (`docker compose up --wait`) и `depends_on`, но не присылает письмо и не видит падение самой машины или порта 443.

Снаружи состояние смотрит UptimeRobot. Аккаунт создаётся вручную, ключи в репозиторий не кладутся. Pingdom для этого объёма не нужен.

```text
UptimeRobot
    |
    +-- https://stonetrail.ru/              HTTP, метод HEAD
    +-- https://stonetrail.ru/health/ready  Keyword, метод GET
                |
                v
              nginx  -->  FastAPI
                            |
                            +-- PostgreSQL   критично, сбой = HTTP 503
                            +-- SMTP         необязательно
                            +-- Yandex OAuth необязательно
```

API и сайт на одном домене. Отдельный health-роут Next.js не нужен: главная страница и проверка контейнера frontend (`http://127.0.0.1:3000/`) уже покрывают фронтенд.

## Endpoints

| Endpoint | Назначение | База | Успех |
| --- | --- | --- | --- |
| `GET /health/live` | Процесс запущен | нет | 200 `{"status":"ok"}` |
| `GET /health` | Процесс и `SELECT 1`. Его вызывают Docker и проверка после деплоя | да | 200 `{"status":"ok"}` |
| `GET /health/ready` | Готовность обслуживать запросы | да | 200 или 503 |

`/health` не проверяет SMTP и Яндекс: Docker ходит сюда каждые 10 секунд. Healthcheck контейнера остаётся на `/health`, а не на `/health/live`. Иначе `depends_on: service_healthy` пропустил бы деплой при недоступной базе.

`/health/ready` отвечает так:

```json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "smtp": "skipped",
    "yandex": "skipped"
  }
}
```

- `database` — `SELECT 1` через текущую сессию SQLAlchemy, таймаут 2 секунды. Запрос ничего не меняет. Сбой даёт `status: "down"` и HTTP 503.
- `smtp` — если почта включена (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`), открывается соединение и сразу закрывается, без письма, таймаут 3 секунды. Иначе `skipped`.
- `yandex` — если заданы `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET` и `YANDEX_REDIRECT_URI`, короткий HTTPS к `https://oauth.yandex.ru` без обмена code. Иначе `skipped`.
- Сбой SMTP или Яндекса даёт `status: "degraded"` и HTTP 200. Сайт открывается, письма или вход через Яндекс могут не работать.

В ответе нет хостов, паролей, строки подключения и текста ошибки. Сбой пишется одним warning: `health_check_failed component=database error=OperationalError`. Успешные `/health`, `/health/live` и `/health/ready` не попадают в access-лог.

## UptimeRobot

Бесплатный план. Интервал 5 минут. Алерт после 3 неудач подряд, письмо и при падении, и когда проверка снова успешна. Контакт — email аккаунта. Смена метода HEAD на GET в HTTP-мониторе платная, поэтому её нет.

1. Главная `https://stonetrail.ru/` — тип HTTP. Бесплатный монитор шлёт HEAD и ждёт ответ без ошибки.
2. `https://stonetrail.ru/health/ready` — тип Keyword, не HTTP. Такой монитор сам шлёт GET. Keyword: `"status":"ok"`. Условие: keyword not exists. База даёт не-200. SMTP или Яндекс дают 200 без этой строки, и монитор тоже срабатывает.
3. `https://stonetrail.ru/health/live` в UptimeRobot не используется. Endpoint в приложении есть и отвечает на GET, но HTTP-монитор бьёт HEAD и получает 405.

Один короткий обрыв до монитора письмо не отправляет.

## Что означает сбой

| Что случилось | Главная | `/health/ready` | Сайт | Письмо |
| --- | --- | --- | --- | --- |
| Всё работает | ответ без ошибки | в теле есть `"status":"ok"` | открывается | нет |
| База недоступна | может открываться | 503, `down` | API отвечает ошибкой | да, монитор ready |
| SMTP или Яндекс недоступны | открывается | 200, `degraded`, строки `"status":"ok"` нет | открывается, почта или вход Яндекса могут не работать | да, монитор ready |
| Процесс API остановлен | может открываться | нет успешного ответа | данные API не приходят | да, монитор ready |
| VPS, DNS или TLS недоступны | нет ответа | нет ответа | не открывается | да, монитор главной |

Долю 5xx по обычным маршрутам этот uptime не считает. Её смотрят в JSON-логах контейнера backend и в `scripts/summarize_logs.py`.

## Если что-то упало

- База: `docker compose ps` в `~/stonetrail/infra`, затем `docker compose logs --tail=120 db backend`. Проверка с сервера: `curl -sf http://127.0.0.1:8080/health/ready`.
- Backend: `docker compose logs --tail=120 backend`. Если контейнер вышел, `docker compose ps -a`.
- Frontend или nginx: монитор главной красный, а `/health/ready` ещё отвечает. Смотреть `docker compose logs --tail=120 frontend nginx` и системный nginx на 443.
- SMTP или Яндекс: `/health/ready` с `"status":"degraded"`. В логе backend строка `health_check_failed` и имя компонента. Секреты и адрес SMTP туда не пишутся.
- Медленный конкретный запрос ищется по `requestId` в логах, как в [error-handling.md](error-handling.md).

## Локально

```bash
curl http://localhost:8000/health/live
curl http://localhost:8000/health
curl http://localhost:8000/health/ready
```

На сервере те же пути через nginx: `http://127.0.0.1:8080/health/live` и `http://127.0.0.1:8080/health/ready`.
