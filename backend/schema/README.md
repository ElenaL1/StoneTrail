# Схема БД StoneTrail (шаг 1)

PostgreSQL-схема витрины **собственного** фонда камня и отраслевого сообщества. Это не маркетплейс: продавцов кроме владельца нет.

Артефакт шага 1 — DDL в [`001_initial.sql`](001_initial.sql). **Новые изменения схемы идут только через Alembic** (`backend/alembic/`). Этот файл не правим.

## Домен

**Материал ≠ склад.** «Мрамор Calacatta» — сорт в `stones`. Конкретные блоки, слэбы, плитка — партии и единицы. Наличие на карточке камня считается из статусов единиц, не хранится на материале.

**Акторы.** Гость без строки в `users`. У аккаунта одна роль-лестница (выше включает права ниже):

`user` < `professional` < `moderator` < `editor` < `admin`

Регистрация всегда создаёт `user`. Повышает только admin. `activity_type` (архитектор, дизайнер, …) — профессия, не роль.

**Не в схеме v1:** FAQ, услуги, legal, подбор каталога, RBAC-таблицы, компании как сущность, `audit_log`, универсальные комментарии, ERP количеств.

## Сущности и таблицы

| Домен | Таблицы |
| --- | --- |
| Пользователь, сессия, токен | `users`, `sessions`, `auth_tokens` |
| Справочники | `stone_types`, `finishes`, `applications`, `forum_categories`, `article_categories` |
| Материал | `stones` |
| Блоки | `block_lots`, `block_items` |
| Каталог (слэбы, заготовки, плитка, брусчатка, изделия) | `products`, `product_items`, `product_applications` |
| Медиа (S3) | `media`, `media_links` |
| Форум | `forum_posts`, `forum_comments` |
| Статьи | `articles`, `article_comments` |
| Новости, акции | `industry_news`, `promotions` |
| Лайки | `article_likes`, `news_likes`, `promotion_likes` |
| Уведомления, заявки | `notifications`, `contact_inquiries` |

Кардинальность:

- камень 1 — N партий блоков, 1 — N продуктов;
- партия 1 — N блоков; продукт 1 — 0..N единиц (у `custom` часто 0);
- пользователь 1 — N постов, комментариев, уведомлений;
- статья 1 — N комментариев; комментарий 0..1 родитель;
- лайки M:N;
- заявка 0..1 пользователь / камень / продукт / партия блоков;
- media 1 — N связей; не больше одного `is_primary` на владельца.

## SEO

Отдельной таблицы нет. Одинаковый набор колонок на публичных сущностях: `stones`, `block_lots`, `products`, `articles`, `industry_news`, `promotions`, `forum_posts`.

| Колонка | Смысл |
| --- | --- |
| `slug` | латиница `[a-z0-9-]+`, unique среди живых строк этой таблицы |
| `seo_title` | `<title>` / og:title, до 70 символов; NULL → `name`/`title` |
| `seo_description` | meta description, до 320; NULL → excerpt/description |
| `canonical_path` | путь без домена (`/catalog/calacatta-gold`); NULL → текущий маршрут |
| `robots_noindex` | запрет индексации **опубликованной** страницы |

Неопубликованное (черновик, выключенная акция, soft-delete) всегда noindex в HTML. `og:image` — cover из `media_links`. Столкновение slug между таблицами допустимо: маршруты разные.

Маршруты: `/catalog/{slug}`, `/catalog/blocks/{slug}`, `/catalog/products/{slug}`, `/articles/{slug}`, `/news/{slug}`, `/promotions/{slug}`, `/community/{slug}`.

## Enum vs справочники

**PostgreSQL enum** — закрытые статусы, завязанные на код: роли, статусы лота/заявки/публикации, категории продукта как в текущем UI, единицы цены.

`user_role` объявлен **по возрастанию прав**, чтобы работало `'editor'::user_role > 'moderator'::user_role`.

`activity_type` в БД — английские коды; API маппит на русские литералы формы (`Архитектор`, …).

**Lookup-таблицы** (`code` + русский `label`): типы камня, обработки, назначения, категории форума и статей. Админ пополняет строки; `is_active = false` скрывает из фильтров, старые FK остаются. В `001_initial.sql` есть стартовый словарь, не мок-каталог.

## Media

Файлы в S3-compatible storage. В Postgres: `storage_key`, `public_url`, mime, размер, габариты, alt. Связь полиморфная: `media_links (owner_type, owner_id)`. Аватар — `owner_type = user_avatar`.

## Материал vs склад vs цена

На `stones` нет `availability`, `finish`, `thickness`, `location`, `supplier`, счётчиков. Толщина, обработка, статус — на `block_items` / `product_items` (мм, кг, `finish_id`). Строка «3000×1500×20» собирается в API.

Цена на `products`: `price_type` (`on_request` / `fixed`), `amount`, `currency` (`RUB`), `price_unit`. При `on_request` сумма NULL.

Виды продукции v1 — discriminator `products.category` (как на фронте). Слэбы/заготовки/плитка/брусчатка делят `product_items`; блоки — отдельный агрегат; изделия — те же `products` без набора единиц и с custom-полями.

## Soft delete и аудит

`deleted_at` на пользователях, материалах, лотах, продуктах, контенте, заявках. **Нет** на сессиях, токенах, лайках, уведомлениях, media, единицах склада (продажа = `status`; снятие партии = soft родителя).

Живые UNIQUE (email, nickname, slug) — partial `WHERE deleted_at IS NULL`.

Аудит минимальный: `created_at`, `updated_at`, `updated_by` на таблицах, которые правит персонал. Журнала изменений нет.

## Совместимость с фронтом

| Фронт | БД / API позже |
| --- | --- |
| `PublicUser.name` | не храним, зеркало `nickname` |
| `RegisterInput` / профиль | те же поля; роль форма не шлёт |
| `Material` | `stones` + COUNT единиц + cover media + SEO |
| `Product.image` / `images` | `media_links` |
| статусы «В наличии» | enum → русские литералы в DTO |
| `author: string` | `users.nickname` |
| форма контактов | `contact_inquiries` (+ `stone_id`, `source` из query) |
| `company` | строка на `users`, не таблица компаний |

## Применение DDL

Предпочтительно:

```bash
cd backend
alembic upgrade head
```

Разовый эталон шага 1 (пустая БД, без Alembic):

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/schema/001_initial.sql
```

Не применяйте оба способа к одной базе: повторный прогон DDL упадёт, Alembic не увидит ревизию.
