from io import BytesIO

import pytest
from openpyxl import Workbook

from services.offer_sheet import (
    OfferReadError,
    normalize_stone_name,
    parse_group_title,
    parse_offer_rows,
    parse_offer_sheet,
)


def test_tile_sheet_groups_sizes_and_keeps_note() -> None:
    rows = [
        ["ОСТАТКИ ТМЦ", None, None, None, None, None, None],
        [
            "Наименование",
            "Длина",
            "Ширина",
            "Толщина",
            "Фактура",
            "Кв метр",
            "Цена руб./м2",
        ],
        ["гр. Дымовский полированный 30 мм", None, None, None, None, None, None],
        [
            "гр. Дымовский полированный 30 мм",
            600,
            300,
            30,
            "полированный",
            "20,52",
            "2 897",
        ],
        ["гр. Дымовский полированный 30 мм", 300, 300, 30, "полированный", 10, 4233],
        ["Цены действуют на количество от 1 ящика."],
    ]
    parsed = parse_offer_rows(rows)
    assert len(parsed.lines) == 2
    assert parsed.lines[0].kind == "tile"
    assert parsed.lines[0].stone_name == "Дымовский"
    assert parsed.lines[0].finish == "полированный"
    assert parsed.lines[0].thickness_mm == 30
    assert parsed.lines[0].label == "600×300"
    assert parsed.lines[0].price_unit == "m2"
    assert str(parsed.lines[0].price_amount) == "2897"
    assert parsed.lines[1].label == "300×300"
    assert "ящика" in parsed.offer_note
    assert parsed.lines[0].unresolved is False


def test_block_sheet_uses_height_and_weight() -> None:
    rows = [
        ["Наименование", "Длина", "Ширина", "Высота", "Вес", "Цена за тонну"],
        ["гр. Габбро", None, None, None, None, None],
        ["Блок 1", 2500, 1500, 1200, "12,5", 18000],
    ]
    parsed = parse_offer_rows(rows)
    assert len(parsed.lines) == 1
    line = parsed.lines[0]
    assert line.kind == "block"
    assert line.stone_name == "Габбро"
    assert line.label == "Блок 1"
    assert line.height_mm == 1200
    assert line.price_unit == "ton"
    assert line.unresolved is False


def test_slab_sheet_prices_per_slab() -> None:
    rows = [
        ["Наименование", "Длина", "Ширина", "Толщина", "Фактура", "Цена за слэб"],
        ["гр. Дымовский", None, None, None, None, None],
        ["SL-1", 2800, 1600, 30, "полированный", 45000],
    ]
    parsed = parse_offer_rows(rows)
    assert len(parsed.lines) == 1
    line = parsed.lines[0]
    assert line.kind == "slab"
    assert line.stone_name == "Дымовский"
    assert line.label == "SL-1"
    assert line.price_unit == "slab"
    assert line.length_mm == 2800


def test_price_subtitle_is_skipped() -> None:
    rows = [
        [
            "Наименование",
            "Длина",
            "Ширина",
            "Толщина",
            "Фактура",
            "Кв метр",
            "Цена",
        ],
        [None, None, None, None, None, None, "руб./м2 в т.ч. НДС 22%"],
        ["гр. Дымовский полированный 30 мм", None, None, None, None, None, None],
        [
            "гр. Дымовский полированный 30 мм",
            600,
            300,
            30,
            "полированный",
            "20,52",
            "2 897",
        ],
    ]
    parsed = parse_offer_rows(rows)
    assert len(parsed.lines) == 1
    assert parsed.lines[0].price_unit == "m2"
    assert str(parsed.lines[0].price_amount) == "2897"
    assert parsed.lines[0].unresolved is False


def test_xlsx_bytes_are_read_even_with_xls_name() -> None:
    book = Workbook()
    sheet = book.active
    assert sheet is not None
    sheet.append(
        ["Наименование", "Длина", "Ширина", "Толщина", "Фактура", "Кв метр", "Цена"]
    )
    sheet.append(["гр. Куртинский термо 20 мм", 600, 300, 20, "термо", 18.36, 4468])
    buffer = BytesIO()
    book.save(buffer)
    parsed = parse_offer_sheet(buffer.getvalue(), "offer.xls")
    assert parsed.lines[0].stone_name == "Куртинский"
    assert parsed.lines[0].kind == "tile"


def test_unreadable_workbook_raises() -> None:
    with pytest.raises(OfferReadError):
        parse_offer_sheet(b"this is not a workbook", "offer.xlsx")


def test_xlsx_bytes_round_trip() -> None:
    book = Workbook()
    sheet = book.active
    assert sheet is not None
    sheet.append(
        [
            "Наименование",
            "Длина",
            "Ширина",
            "Толщина",
            "Фактура",
            "Кв метр",
            "Цена",
        ]
    )
    sheet.append(["гр. Куртинский термо 20 мм", None, None, None, None, None, None])
    sheet.append(["гр. Куртинский термо 20 мм", 600, 300, 20, "термо", 18.36, 4468])
    buffer = BytesIO()
    book.save(buffer)
    parsed = parse_offer_sheet(buffer.getvalue(), "offer.xlsx")
    assert parsed.lines[0].kind == "tile"
    assert parsed.lines[0].stone_name == "Куртинский"
    assert parsed.lines[0].finish == "термо"


def test_stone_names_ignore_prefix_punctuation_and_yo() -> None:
    assert normalize_stone_name("гр. Ладожский Розовый") == normalize_stone_name(
        "Ладожский Розовый"
    )
    assert normalize_stone_name("гр.Мансуровский") == normalize_stone_name(
        "Мансуровский"
    )
    assert normalize_stone_name("Берёзовский.") == normalize_stone_name("Березовский")
    assert normalize_stone_name("Ладожский-Розовый") == normalize_stone_name(
        "Ладожский Розовый"
    )
    assert normalize_stone_name("гранитный") == "гранитный"
    assert parse_group_title("гр.Мансуровский термо 20 мм")[0] == "Мансуровский"
