from core.slug import slugify


def test_slugify_transliterates_russian() -> None:
    assert slugify("Как выбрать диск") == "kak-vybrat-disk"


def test_slugify_fallback() -> None:
    assert slugify("***") == "post"
