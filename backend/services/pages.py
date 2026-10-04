from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core import messages
from core.errors import ApiError, AuthError
from core.roles import is_admin
from models.enums import PageBlockKind, PageBlockStatus
from models.media import Media
from models.pages import PageBlock
from models.user import User
from schemas.user import CamelModel
from services.audit import record_audit


@dataclass(frozen=True)
class BlockDef:
    key: str
    kind: PageBlockKind
    label: str
    fallback: str


@dataclass(frozen=True)
class PageDef:
    key: str
    title: str
    legal: bool
    blocks: tuple[BlockDef, ...]


def _text(key: str, label: str, fallback: str) -> BlockDef:
    return BlockDef(key, PageBlockKind.TEXT, label, fallback)


def _markdown(key: str, label: str) -> BlockDef:
    return BlockDef(key, PageBlockKind.MARKDOWN, label, "")


def _image(key: str, label: str, fallback: str) -> BlockDef:
    return BlockDef(key, PageBlockKind.IMAGE, label, fallback)


PAGES: dict[str, PageDef] = {
    "home": PageDef(
        "home",
        "Главная",
        False,
        (
            _text("hero.kicker", "Бейдж", "Наследие мастерства и эксклюзивный фонд"),
            _text("hero.title", "Заголовок", "Искусство видеть камень."),
            _text("hero.titleAccent", "Акцент заголовка", "До каждого слэба."),
            _text(
                "hero.lead",
                "Лид",
                "Синтез более чем 25-летнего опыта в индустрии и коллекции редчайших материалов со всего мира. Мы создали пространство для тех, кто ценит техническое совершенство и подлинную эстетику натурального камня.",
            ),
            _text("pillars.kicker", "Принципы, бейдж", "Принципы мастерства"),
            _text(
                "pillars.title",
                "Принципы, заголовок",
                "Фундамент, построенный на десятилетиях практики.",
            ),
            _text(
                "cta.title",
                "Призыв, заголовок",
                "Станьте частью закрытого профессионального сообщества.",
            ),
            _text(
                "cta.lead",
                "Призыв, текст",
                "Получите доступ к знаниям, которые накапливались десятилетиями, и к фонду материалов, недоступных на открытом рынке. Мы объединяем тех, кто видит в камне не просто материал, а искусство.",
            ),
        ),
    ),
    "about": PageDef(
        "about",
        "О себе",
        False,
        (
            _text("hero.kicker", "Бейдж", "Более 25 лет в каменной отрасли"),
            _text("hero.title", "Заголовок", "О себе"),
            _text("hero.lead", "Лид", "В камне я работаю больше 25 лет."),
            _text(
                "hero.body",
                "Текст",
                "За это время отрасль изменилась до неузнаваемости: появились новые технологии, оборудование, материалы и подходы к обработке. Но главное осталось неизменным — ценность профессионального опыта и понимания камня, которое приходит только с годами работы.",
            ),
            _image("hero.image", "Фото", "/about/polygonal-masonry-peru.jpg"),
            _text("hero.caption", "Подпись к фото", "Полигональная кладка, Перу"),
            _text("timeline.kicker", "Путь, бейдж", "Профессиональный путь"),
            _text("timeline.1999.title", "1999, заголовок", "Начало пути — «Гранул»"),
            _text(
                "timeline.1999.body",
                "1999, текст",
                "Мой профессиональный путь начался в 1999 году в компании «Гранул». Это была хорошая школа и важный этап в моей карьере. За несколько лет я прошёл путь до координатора филиалов, получил опыт управления людьми и производственными процессами и, главное, глубоко погрузился в специфику камнеобработки.",
            ),
            _text(
                "timeline.2002.title",
                "2002, заголовок",
                "Работа в крупной камнеобрабатывающей компании",
            ),
            _text(
                "timeline.2002.body",
                "2002, текст",
                "С 2002 года я работаю в одной из крупнейших российских компаний камнеобрабатывающей отрасли, где продолжаю заниматься камнем, его обработкой и всем тем, что связано с профессиональной работой с натуральными материалами.",
            ),
            _text(
                "timeline.2002.body2",
                "2002, продолжение",
                "За годы работы пришлось увидеть практически все стороны нашей отрасли — от выбора материала и оценки его свойств до обработки, производства и решения сложных технических задач. Я хорошо знаю, насколько сильно конечный результат зависит не только от самого камня, но и от правильного оборудования, технологии, опыта специалиста и понимания особенностей конкретного материала.",
            ),
            _text("why.kicker", "Площадка, бейдж", "Площадка"),
            _text("why.title", "Площадка, заголовок", "Зачем появился StoneTrail"),
            _text("why.showcase.title", "Витрина, заголовок", "Витрина"),
            _text(
                "why.showcase.body",
                "Витрина, текст",
                "Изначально идея была простой — создать профессиональную витрину материалов, которые я знаю, которыми занимаюсь и которые считаю достойными внимания. Каждый образец подобран и описан с опорой на многолетний опыт работы с камнем.",
            ),
            _text("why.community.title", "Сообщество, заголовок", "Сообщество"),
            _text(
                "why.community.body",
                "Сообщество, текст",
                "Со временем стало понятно, что одной витрины недостаточно. В отрасли огромное количество знаний передаётся от специалиста к специалисту: какие-то вещи нигде не написаны, технологии осваиваются на собственных ошибках. StoneTrail — место, где можно обсудить обработку, оборудование, особенности пород и практические вопросы.",
            ),
            _text("why.practice.title", "Практика, заголовок", "Практика"),
            _text(
                "why.practice.body",
                "Практика, текст",
                "Площадка для людей, действительно работающих с камнем: обмениваться опытом, задавать вопросы, делиться решениями. Без лишнего пафоса и теории ради теории. С опорой на практический опыт. Я по-прежнему каждый день работаю с камнем и продолжаю учиться.",
            ),
            _text(
                "why.closing",
                "Заключение",
                "Если у вас есть опыт, которым стоит поделиться, технический вопрос или просто желание поговорить о камне с людьми из отрасли — добро пожаловать.",
            ),
            _text(
                "cta.title",
                "Призыв, заголовок",
                "Если вы работаете с камнем — присоединяйтесь.",
            ),
            _text(
                "cta.lead",
                "Призыв, текст",
                "Обсуждайте технологии, делитесь опытом, задавайте вопросы и находите профессиональные контакты.",
            ),
        ),
    ),
    "services": PageDef(
        "services",
        "Услуги",
        False,
        (
            _text("hero.kicker", "Бейдж", "Полный цикл работы с камнем"),
            _text("hero.title", "Заголовок", "Услуги StoneTrail."),
            _text("hero.titleAccent", "Акцент", "От слэба до объекта."),
            _text(
                "hero.lead",
                "Лид",
                "Четыре направления, закрывающие весь путь материала — от подбора и экспертной консультации на ранней стадии проекта до промышленного раскроя и бережной доставки на объект.",
            ),
        ),
    ),
    "services/selection": PageDef(
        "services/selection",
        "Подбор камня",
        False,
        (
            _text("tag", "Бейдж", "Подбор"),
            _text("title", "Заголовок", "Подбор камня"),
            _text(
                "intro",
                "Лид",
                "Экспертный подбор слэба под проект: анализ ТЗ, шорт-лист из закрытого фонда, проверка качества и коммерческое предложение.",
            ),
        ),
    ),
    "services/consultations": PageDef(
        "services/consultations",
        "Консультации",
        False,
        (
            _text("tag", "Бейдж", "Консультации"),
            _text("title", "Заголовок", "Технические консультации"),
            _text(
                "intro",
                "Лид",
                "Разбор проекта, альтернативы и письменное заключение по камню.",
            ),
        ),
    ),
    "services/logistics": PageDef(
        "services/logistics",
        "Логистика",
        False,
        (
            _text("tag", "Бейдж", "Логистика"),
            _text("title", "Заголовок", "Логистика и доставка"),
            _text("intro", "Лид", "Упаковка, страхование и доставка камня на объект."),
        ),
    ),
    "services/cutting": PageDef(
        "services/cutting",
        "Раскрой",
        False,
        (
            _text("tag", "Бейдж", "Раскрой"),
            _text("title", "Заголовок", "Промышленный раскрой"),
            _text("intro", "Лид", "Раскрой слэбов под эскиз и контроль кромки."),
        ),
    ),
    "faq": PageDef(
        "faq",
        "FAQ",
        False,
        (
            _text("hero.kicker", "Бейдж", "Частые вопросы"),
            _text("hero.title", "Заголовок", "Ответы, которые"),
            _text("hero.titleAccent", "Акцент", "экономят время."),
            _text(
                "hero.lead",
                "Лид",
                "Собрали здесь вопросы, которые чаще всего приходят нам — от подбора камня до ухода за изделием. Не нашли ответ? Напишите — отвечаем в течение рабочего дня.",
            ),
        ),
    ),
    "contacts": PageDef(
        "contacts",
        "Контакты",
        False,
        (
            _text("hero.kicker", "Бейдж", "Контакты"),
            _text("hero.title", "Заголовок", "Давайте обсудим"),
            _text("hero.titleAccent", "Акцент", "ваш проект."),
            _text(
                "hero.lead",
                "Лид",
                "Напишите — и вы получите ответ в течение одного рабочего дня. Для срочных запросов используйте прямой контакт отдела.",
            ),
            _text("email.title", "Email", "info@stonetrail.ru"),
            _text(
                "email.description",
                "Email, пояснение",
                "Для коммерческих вопросов, заказов и запросов сметы.",
            ),
            _text("phone.title", "Телефон", "+7 (495) 780-12-00"),
            _text(
                "phone.description",
                "Телефон, пояснение",
                "Пн–Пт, 9:00–18:00 по МСК. Для срочных вопросов по текущим заказам.",
            ),
            _text("address.title", "Адрес", "г. Москва, ул. Каменная, 12"),
            _text(
                "address.description",
                "Адрес, пояснение",
                "Шоурум и склад закрытого фонда. Посещение по записи.",
            ),
            _text("hours.title", "Часы", "Пн–Пт 9:00–18:00"),
            _text(
                "hours.description",
                "Часы, пояснение",
                "Посещения производства — по предварительной договорённости.",
            ),
        ),
    ),
    "legal/privacy": PageDef(
        "legal/privacy",
        "Политика конфиденциальности",
        True,
        (
            _text("title", "Заголовок", "Политика конфиденциальности"),
            _text(
                "summary",
                "Кратко",
                "Это политика, описывающая, какие данные мы собираем, зачем, как храним, передаём и защищаем. Применяется к использованию сайта stonetrail.ru.",
            ),
            _markdown("body", "Текст документа"),
        ),
    ),
    "legal/terms": PageDef(
        "legal/terms",
        "Условия использования",
        True,
        (
            _text("title", "Заголовок", "Условия использования"),
            _text("summary", "Кратко", "Правила использования сайта StoneTrail."),
            _markdown("body", "Текст документа"),
        ),
    ),
    "legal/cookies": PageDef(
        "legal/cookies",
        "Cookies",
        True,
        (
            _text("title", "Заголовок", "Политика cookies"),
            _text("summary", "Кратко", "Какие cookies использует сайт StoneTrail."),
            _markdown("body", "Текст документа"),
        ),
    ),
}


class PageSummaryOut(CamelModel):
    page_key: str
    title: str
    legal: bool


class BlockAdminOut(CamelModel):
    block_key: str
    kind: PageBlockKind
    label: str
    fallback: str
    draft_value: str
    published_value: str
    status: PageBlockStatus
    effective_from: date | None = None


class PageAdminOut(CamelModel):
    page_key: str
    title: str
    legal: bool
    effective_from: date | None = None
    blocks: list[BlockAdminOut]


class BlockDraftIn(CamelModel):
    block_key: str
    value: str


class PageDraftIn(CamelModel):
    blocks: list[BlockDraftIn]


class PagePublishIn(CamelModel):
    effective_from: date | None = None


class PublicBlockOut(CamelModel):
    block_key: str
    kind: PageBlockKind
    value: str


class PublicPageOut(CamelModel):
    page_key: str
    effective_from: date | None = None
    blocks: list[PublicBlockOut]


class PageContentService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def list_pages(self) -> list[PageSummaryOut]:
        return [
            PageSummaryOut(page_key=page.key, title=page.title, legal=page.legal)
            for page in PAGES.values()
        ]

    async def admin_page(self, page_key: str) -> PageAdminOut:
        page = self._page(page_key)
        rows = await self._rows(page.key)
        by_key = {row.block_key: row for row in rows}
        effective = next(
            (row.effective_from for row in rows if row.effective_from is not None),
            None,
        )
        return PageAdminOut(
            page_key=page.key,
            title=page.title,
            legal=page.legal,
            effective_from=effective,
            blocks=[
                _admin_block(block, by_key.get(block.key)) for block in page.blocks
            ],
        )

    async def save_draft(
        self, page_key: str, payload: PageDraftIn, actor: User
    ) -> PageAdminOut:
        page = self._page(page_key)
        allowed = {block.key: block for block in page.blocks}
        rows = {row.block_key: row for row in await self._rows(page.key)}
        for item in payload.blocks:
            block = allowed.get(item.block_key)
            if block is None:
                raise AuthError.validation(
                    messages.BLOCK_UNKNOWN, {"blockKey": messages.BLOCK_UNKNOWN}
                )
            value = item.value.strip()
            media_id = None
            if (
                block.kind == PageBlockKind.IMAGE
                and value
                and not (value.startswith("/") or value.startswith("http"))
            ):
                media = await self._session.get(Media, _uuid(value))
                if media is None:
                    raise AuthError.validation(
                        messages.MEDIA_MISSING, {"value": messages.MEDIA_MISSING}
                    )
                media_id = media.id
                value = str(media.id)
            row = rows.get(block.key)
            if row is None:
                row = PageBlock(
                    page_key=page.key,
                    block_key=block.key,
                    kind=block.kind,
                    draft_value=value,
                    media_id=media_id,
                    updated_by=actor.id,
                )
                self._session.add(row)
            else:
                row.draft_value = value
                row.kind = block.kind
                if block.kind == PageBlockKind.IMAGE:
                    row.media_id = media_id
                row.updated_by = actor.id
                row.updated_at = datetime.now(UTC)
        await self._session.commit()
        return await self.admin_page(page.key)

    async def publish(
        self, page_key: str, payload: PagePublishIn, actor: User
    ) -> PageAdminOut:
        page = self._page(page_key)
        if page.legal and not is_admin(actor.role):
            raise AuthError.forbidden()
        if page.legal and payload.effective_from is None:
            raise AuthError.validation(
                messages.LEGAL_EFFECTIVE_REQUIRED,
                {"effectiveFrom": messages.LEGAL_EFFECTIVE_REQUIRED},
            )
        rows = await self._rows(page.key)
        by_key = {row.block_key: row for row in rows}
        for block in page.blocks:
            row = by_key.get(block.key)
            if row is None:
                continue
            published = row.draft_value
            if block.kind == PageBlockKind.IMAGE and row.media_id is not None:
                media = await self._session.get(Media, row.media_id)
                published = media.public_url if media is not None else ""
            row.published_value = published
            row.status = PageBlockStatus.PUBLISHED
            row.effective_from = payload.effective_from if page.legal else None
            row.updated_by = actor.id
            row.updated_at = datetime.now(UTC)
        if page.legal:
            await record_audit(
                self._session,
                actor_id=actor.id,
                action="legal_publish",
                entity_type="page",
                entity_id=page.key,
                detail={"effectiveFrom": payload.effective_from.isoformat()},
            )
        await self._session.commit()
        return await self.admin_page(page.key)

    async def public_page(self, page_key: str) -> PublicPageOut:
        page = self._page(page_key)
        rows = await self._rows(page.key)
        published = [
            PublicBlockOut(
                block_key=row.block_key,
                kind=row.kind,
                value=row.published_value,
            )
            for row in rows
            if row.status == PageBlockStatus.PUBLISHED and row.published_value
        ]
        effective = next(
            (
                row.effective_from
                for row in rows
                if row.status == PageBlockStatus.PUBLISHED and row.effective_from
            ),
            None,
        )
        return PublicPageOut(
            page_key=page.key, effective_from=effective, blocks=published
        )

    async def _rows(self, page_key: str) -> list[PageBlock]:
        result = await self._session.scalars(
            select(PageBlock).where(PageBlock.page_key == page_key)
        )
        return list(result.all())

    def _page(self, page_key: str) -> PageDef:
        page = PAGES.get(page_key)
        if page is None:
            raise ApiError.not_found()
        return page


def _admin_block(block: BlockDef, row: PageBlock | None) -> BlockAdminOut:
    if row is None:
        return BlockAdminOut(
            block_key=block.key,
            kind=block.kind,
            label=block.label,
            fallback=block.fallback,
            draft_value="",
            published_value="",
            status=PageBlockStatus.DRAFT,
        )
    return BlockAdminOut(
        block_key=block.key,
        kind=block.kind,
        label=block.label,
        fallback=block.fallback,
        draft_value=row.draft_value,
        published_value=row.published_value,
        status=row.status,
        effective_from=row.effective_from,
    )


def _uuid(value: str):
    import uuid

    try:
        return uuid.UUID(value)
    except ValueError as exc:
        raise AuthError.validation(
            messages.MEDIA_MISSING, {"value": messages.MEDIA_MISSING}
        ) from exc
