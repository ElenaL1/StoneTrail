import { finishedProducts } from "@/lib/custom-products-data"

export { finishedProducts }

export type {
  Article,
  ArticleComment,
  BlockStatus,
  CatalogAvailability,
  Comment,
  FinishedProduct,
  FinishedProductStatus,
  ForumPost,
  IndividualBlank,
  IndividualBlock,
  IndividualPaving,
  IndividualSlab,
  IndividualTile,
  IndustryNews,
  Material,
  Notification,
  NotificationType,
  Product,
  ProductCategory,
  ProductPriceType,
  Promotion,
  StoneBlock,
} from "./types"

export const forumCategories = [
  "Технологии",
  "Советы",
  "Дизайн",
  "Безопасность",
  "Оборудование",
  "Рынок",
]

export const articleCategories = [
  "Материалы",
  "Индустрия",
  "Технологии",
] as const

export const mockPromotions: Promotion[] = [
  {
    id: "lot-42",
    title: "Эксклюзивная серия итальянских кварцитов",
    description: "Предлагаем доступ к ограниченному количеству слэбов с уникальным рисунком жилы. Персональный отбор и техническое сопровождение включены в стоимость.",
    content: "Мы рады представить ограниченную партию кварцитов из лучших карьеров Италии. Эта серия отличается исключительной плотностью и редким 'текучим' рисунком жил, который редко встречается даже в премиальных коллекциях.\n\nДля наших клиентов мы предлагаем не просто продажу, а полное техническое сопровождение: от помощи в выборе конкретного слэба под проект до консультаций по оптимальному способу резки и полировки, чтобы максимально подчеркнуть природную красоту камня.\n\nКоличество слэбов в данной серии ограничено. Приглашаем посетить наш склад для ознакомления с материалом вживую.",
    expiryDate: "31 декабря 2024 года",
    createdAt: "10 октября 2024",
    isEnabled: false,
    link: "/promotions/lot-42",
    likes: ["user-1", "user-2"],
  },
  {
    id: "winter-sale",
    title: "Зимняя подборка: Граниты Северной Европы",
    description: "Специальные условия на партию износостойких гранитов для коммерческих объектов. Гарантированная однородность цвета всей партии.",
    content: "Подготовка к зимнему сезону требует особого подхода к выбору материалов для экстерьеров и коммерческих зон. Мы сформировали специальную подборку гранитов из Северной Европы, которые славятся своей феноменальной морозостойкостью и низким коэффициентом водопоглощения.\n\nГлавное преимущество этой партии — строгий контроль однородности цвета. Это критически важно для масштабных объектов, где использование слэбов из разных партий может привести к нежелательным цветовым пятнам.\n\nСпециальные условия действуют до конца февраля. Рекомендуем планировать закупки заранее, так как спрос на данные сорта традиционно растет к весне.",
    expiryDate: "31 декабря 2026 года",
    createdAt: "1 ноября 2024",
    isEnabled: false,
    link: "/promotions/winter-sale",
    likes: ["user-3"],
  },
  {
    id: "exclusive-marble",
    title: "Лимитированная коллекция Calacatta Gold",
    description: "Редкий мрамор с выраженным золотым рисунком. Идеально для акцентных стен и острова на кухне.",
    content: "Calacatta Gold — это эталон роскоши в мире мрамора. Мы получили несколько слэбов с особенно выраженными золотистыми прожилками на чистом белом фоне. Такой рисунок делает каждый слэб уникальным произведением искусства.\n\nЭти материалы идеально подойдут для создания центрального элемента интерьера: массивного кухонного острова или акцентной стены в гостиной. Благодаря высокой степени полировки, камень приобретает глубину, которая меняется в зависимости от освещения.\n\nДоступно всего 3 слэба. Данное предложение предназначено для тех, кто ищет бескомпромиссное качество и эксклюзивность.",
    expiryDate: "март 2027 года",
    createdAt: "15 ноября 2024",
    isEnabled: false,
    link: "/promotions/exclusive-marble",
    likes: ["user-1", "user-4", "user-5"],
  },
]

export const mockIndustryNews: IndustryNews[] = [
  {
    id: "news-1",
    title: "Обзор новых карьеров Италии 2025",
    excerpt: "Подробный разбор новых месторождений и ожидаемые тренды по текстурам мрамора.",
    content: "В начале 2025 года в Италии открывается доступ к нескольким новым участкам добычи мрамора в регионе Тоскана. Предварительный анализ показывает, что новые пласты обладают более однородной структурой и меньшим количеством природных микротрещин, что значительно облегчает обработку.\n\nОжидается, что в тренде будет 'возврат к природе': снижение интенсивности искусственной полировки в пользу сатинированных и матовых поверхностей. Это позволит подчеркнуть тактильные свойства камня. Мы уже ведем переговоры с поставщиками, чтобы обеспечить нашим клиентам приоритетный доступ к этим новым месторождениям.",
    date: "20 ноября 2024",
    status: "Опубликовано",
    likes: ["user-2"],
  },
  {
    id: "news-2",
    title: "Цифровизация раскроя: AI в деле",
    excerpt: "Как современные AI-инструменты помогают сократить отходы дорогого камня.",
    content: "Проблема отходов при раскрое дорогих слэбов кварцита или редкого мрамора всегда была болезненной для индустрии. Однако внедрение AI-алгоритмов оптимизации раскроя (nesting) позволяет сократить потери материала на 15-20%.\n\nСовременные системы анализируют рисунок жилы на слэбе и автоматически предлагают оптимальное расположение деталей заказа так, чтобы не только минимизировать отходы, но и сохранить эстетическую целостность рисунка (bookmatching). Мы начинаем внедрение этих инструментов в наши производственные процессы, что позволит предложить клиентам более гибкие цены на сложные изделия.",
    date: "1 декабря 2024",
    status: "Опубликовано",
    likes: ["user-1", "user-3"],
  },
  {
    id: "news-3",
    title: "Логистический кризис в Средиземноморье",
    excerpt: "Анализ влияния забастовок в портах на сроки поставок слэбов.",
    content: "Текущая ситуация в портах Средиземноморья приводит к увеличению сроков доставки камня из Италии и Испании в среднем на 3-4 недели. Забастовки транспортных рабочих и перегруженность терминалов создают 'бутылочное горлышко' в цепочке поставок.\n\nДля минимизации рисков мы рекомендуем клиентам переходить на стратегию заблаговременного резервирования материалов. В данный момент мы увеличиваем складские запасы наиболее востребованных позиций, чтобы обеспечить бесперебойное выполнение текущих заказов. Мы продолжаем мониторить ситуацию и искать альтернативные маршруты доставки через соседние регионы.",
    date: "15 декабря 2024",
    status: "Опубликовано",
    likes: [],
  },
]

export const featuredMaterials: Material[] = [
  {
    id: "calacatta-gold",
    name: "Calacatta Gold",
    type: "Мрамор",
    finish: "Полировка",
    thickness: "20 мм",
    image: "/stone/calacatta.png",
    supplier: "StoneTrail",
    location: "склад",
    quarry: "Каррара",
    country: "Италия",
    status: "В наличии",
    slabs: 24,
    tiles: 48,
    updated: "2 ч назад",
  },
  {
    id: "absolute-black",
    name: "Absolute Black",
    type: "Гранит",
    finish: "Полировка",
    thickness: "30 мм",
    image: "/stone/black-granite.png",
    supplier: "StoneTrail",
    location: "склад",
    quarry: "Раджастан",
    country: "Индия",
    status: "В наличии",
    slabs: 18,
    tiles: 36,
    updated: "5 ч назад",
  },
  {
    id: "white-macaubas",
    name: "White Macaúbas",
    type: "Кварцит",
    finish: "Шлифовка",
    thickness: "20 мм",
    image: "/stone/white-quartzite.png",
    supplier: "StoneTrail",
    location: "склад",
    quarry: "Баия",
    country: "Бразилия",
    status: "Мало",
    slabs: 3,
    tiles: 0,
    updated: "1 д назад",
  },
  {
    id: "verde-alpi",
    name: "Verde Alpi",
    type: "Мрамор",
    finish: "Полировка",
    thickness: "20 мм",
    image: "/stone/green-marble.png",
    supplier: "StoneTrail",
    location: "склад",
    quarry: "Alpi Apuane",
    country: "Италия",
    status: "В наличии",
    slabs: 11,
    tiles: 0,
    updated: "3 ч назад",
    blockSlug: "block-verde-alpi",
  },
  {
    id: "classic-travertine",
    name: "Classic Travertine",
    type: "Травертин",
    finish: "Шлифовка",
    thickness: "20 мм",
    image: "/stone/travertine.png",
    supplier: "StoneTrail",
    location: "склад",
    quarry: "Tivoli",
    country: "Италия",
    status: "В наличии",
    slabs: 32,
    tiles: 120,
    updated: "6 ч назад",
    blockSlug: "block-travertino-classico",
  },
  {
    id: "carbon-soapstone",
    name: "Carbon Soapstone",
    type: "Стеатит",
    finish: "Шлифовка",
    thickness: "30 мм",
    image: "/stone/soapstone.png",
    supplier: "StoneTrail",
    location: "склад",
    quarry: "Минас-Жерайс",
    country: "Бразилия",
    status: "Продано",
    slabs: 0,
    tiles: 0,
    updated: "2 д назад",
  },
]

export const slabProducts: Product[] = [
  {
    id: "slab-01",
    slug: "slab-quartzite-patagonia",
    category: "slabs",
    name: "Кварцит Patagonia",
    stoneName: "Patagonia",
    stoneType: "Кварцит",
    color: "Контрастный",
    thickness: "20 мм",
    finish: "Полированная",
    size: "3200 × 1800 мм",
    availability: "В наличии",
    image: "/stone/white-quartzite.png",
    stoneImage: "/stone/white-quartzite.png",
    description:
      "Выразительный кварцит с контрастным природным рисунком. Каждый слэб имеет индивидуальный рисунок, поэтому подбор материала рекомендуется выполнять по фотографии конкретной плиты.",
    expertNote:
      "Patagonia не «усредняется» по партии: жила и цветовые пятна гуляют от плиты к плите. Для столешницы или акцентной стены сначала фиксируем конкретный слэб, затем раскладку.",
    slabs: [
      { label: "Слэб 01", size: "3280 × 1840 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stone/white-quartzite.png" },
      { label: "Слэб 02", size: "3240 × 1810 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stone/white-quartzite.png" },
      { label: "Слэб 03", size: "3200 × 1780 мм", thickness: "30 мм", finish: "Полированная", status: "В наличии", image: "/stone/white-quartzite.png" },
      { label: "Слэб 04", size: "3160 × 1760 мм", thickness: "20 мм", finish: "Сатинированная", status: "Зарезервирован", image: "/stone/white-quartzite.png" },
      { label: "Слэб 05", size: "3100 × 1720 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stone/white-quartzite.png" },
    ],
  },
  {
    id: "slab-02",
    slug: "slab-marble-calacatta",
    category: "slabs",
    name: "Мрамор Calacatta",
    stoneName: "Calacatta Luxury",
    stoneType: "Мрамор",
    color: "Белый",
    thickness: "20 мм",
    finish: "Полированная",
    size: "3200 × 1600 мм",
    availability: "В наличии",
    image: "/stonetrail_mock_assets/slabs/calacatta-luxury-slab-01.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/calacatta-luxury.jpg",
    description:
      "Светлый мрамор с крупной графично-золотистой прожилкой. Подходит для кухонных островов, стеновых панелей и парадных зон, где рисунок камня читается с расстояния.",
    expertNote:
      "Для Calacatta важна раскладка bookmatching: жила должна продолжаться через стык. Смотрим слэбы парой, а не по одной плите.",
    slabs: [
      { label: "Слэб A", size: "3220 × 1620 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/slabs/calacatta-luxury-slab-01.jpg", note: "Пара bookmatch" },
      { label: "Слэб B", size: "3220 × 1620 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/stones/calacatta-luxury.jpg", note: "Пара bookmatch" },
      { label: "Слэб C", size: "3180 × 1580 мм", thickness: "20 мм", finish: "Полированная", status: "Зарезервирован", image: "/stonetrail_mock_assets/products/product-countertop-calacatta-luxury.jpg" },
      { label: "Слэб D", size: "3100 × 1540 мм", thickness: "30 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/slabs/calacatta-luxury-slab-01.jpg" },
    ],
  },
  {
    id: "slab-03",
    slug: "slab-marble-carrara",
    category: "slabs",
    name: "Мрамор Carrara",
    stoneName: "Bianco Carrara",
    stoneType: "Мрамор",
    color: "Белый",
    thickness: "20 мм",
    finish: "Полированная",
    size: "3000 × 1600 мм",
    availability: "В наличии",
    image: "/stonetrail_mock_assets/slabs/bianco-carrara-slab-01.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/bianco-carrara.jpg",
    description:
      "Классический каррарский мрамор с тонкой серой прожилкой на белом фоне. Спокойный рисунок хорошо работает в лестницах, столешницах и облицовке, где не нужен театральный контраст.",
    expertNote:
      "Carrara — рабочий премиальный мрамор: рисунок ровный, раскрой предсказуемый. Для пола рекомендуем сатин, для столешницы — полировку с гидрофобизацией.",
    slabs: [
      { label: "Слэб 01", size: "3040 × 1620 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/slabs/bianco-carrara-slab-01.jpg" },
      { label: "Слэб 02", size: "3000 × 1600 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/stones/bianco-carrara.jpg" },
      { label: "Слэб 03", size: "2980 × 1580 мм", thickness: "20 мм", finish: "Сатинированная", status: "В наличии", image: "/stonetrail_mock_assets/products/product-stairs-bianco-carrara.jpg" },
      { label: "Слэб 04", size: "2960 × 1560 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/slabs/bianco-carrara-slab-01.jpg" },
      { label: "Слэб 05", size: "2920 × 1540 мм", thickness: "30 мм", finish: "Полированная", status: "Зарезервирован", image: "/stonetrail_mock_assets/stones/bianco-carrara.jpg" },
      { label: "Слэб 06", size: "2880 × 1500 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/slabs/bianco-carrara-slab-01.jpg" },
    ],
  },
  {
    id: "slab-04",
    slug: "slab-granite-black-galaxy",
    category: "slabs",
    name: "Гранит Black Galaxy",
    stoneName: "Black Galaxy",
    stoneType: "Гранит",
    color: "Чёрный",
    thickness: "30 мм",
    finish: "Полированная",
    size: "3000 × 1900 мм",
    availability: "В наличии",
    image: "/stone/black-granite.png",
    stoneImage: "/stone/black-granite.png",
    description:
      "Плотный чёрный гранит с мелкими золотистыми включениями. Выдерживает интенсивную эксплуатацию: кухни, входные группы, коммерческие стойки и наружные подоконники.",
    expertNote:
      "Black Galaxy почти не «гуляет» по тону в партии. Для крупных столешниц берём 30 мм: плита стабильнее на пролёте, кромка выглядит солиднее.",
    slabs: [
      { label: "Слэб 01", size: "3040 × 1920 мм", thickness: "30 мм", finish: "Полированная", status: "В наличии", image: "/stone/black-granite.png" },
      { label: "Слэб 02", size: "3000 × 1900 мм", thickness: "30 мм", finish: "Полированная", status: "В наличии", image: "/stone/black-granite.png" },
      { label: "Слэб 03", size: "2960 × 1880 мм", thickness: "30 мм", finish: "Полированная", status: "В наличии", image: "/stone/black-granite.png" },
      { label: "Слэб 04", size: "2920 × 1840 мм", thickness: "20 мм", finish: "Полированная", status: "Зарезервирован", image: "/stone/black-granite.png" },
    ],
  },
  {
    id: "slab-05",
    slug: "slab-granite-verde",
    category: "slabs",
    name: "Гранит Verde",
    stoneName: "Verde Alpi",
    stoneType: "Гранит",
    color: "Зелёный",
    thickness: "20 мм",
    finish: "Полированная",
    size: "2800 × 1700 мм",
    availability: "Мало",
    image: "/stonetrail_mock_assets/slabs/verde-alpi-slab-01.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/verde-alpi.jpg",
    description:
      "Глубокий зелёный камень с тёмными и золотистыми вкраплениями. Используем как акцентный материал: барные стойки, порталы, отдельные стеновые панели.",
    expertNote:
      "Зелёный камень с живым рисунком лучше не резать «вслепую». Сначала смотрим грань слэба на складе и только потом утверждаем карту раскроя.",
    slabs: [
      { label: "Слэб 01", size: "2820 × 1720 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/slabs/verde-alpi-slab-01.jpg" },
      { label: "Слэб 02", size: "2760 × 1680 мм", thickness: "20 мм", finish: "Полированная", status: "Зарезервирован", image: "/stonetrail_mock_assets/stones/verde-alpi.jpg" },
    ],
  },
  {
    id: "slab-06",
    slug: "slab-onyx-ivory",
    category: "slabs",
    name: "Оникс Ivory",
    stoneName: "Onice Ivory",
    stoneType: "Оникс",
    color: "Бежевый",
    thickness: "20 мм",
    finish: "Полированная",
    size: "2600 × 1400 мм",
    availability: "Мало",
    image: "/stonetrail_mock_assets/stones/onice-honey.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/onice-honey.jpg",
    description:
      "Светопроницаемый оникс тёплого слонового тона. Раскрывается в подсвеченных панелях, барных фасадах и декоративных нишах — без подсветки камень выглядит плоским.",
    expertNote:
      "Оникс ставим только туда, где есть управляемая подсветка. Толщину 20 мм оставляем для стоек; для панелей часто уходим в 12–15 мм, чтобы усилить просвечивание.",
    slabs: [
      { label: "Слэб 01", size: "2620 × 1420 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/stones/onice-honey.jpg" },
      { label: "Слэб 02", size: "2540 × 1380 мм", thickness: "20 мм", finish: "Полированная", status: "Зарезервирован", image: "/stonetrail_mock_assets/products/product-onyx-interior-honey.jpg" },
    ],
  },
  {
    id: "slab-07",
    slug: "slab-quartzite-taj-mahal",
    category: "slabs",
    name: "Кварцит Taj Mahal",
    stoneName: "Taj Mahal",
    stoneType: "Кварцит",
    color: "Бежевый",
    thickness: "20 мм",
    finish: "Сатинированная",
    size: "3200 × 1800 мм",
    availability: "В наличии",
    image: "/stonetrail_mock_assets/slabs/taj-mahal-slab-01.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/taj-mahal.jpg",
    description:
      "Тёплый серо-бежевый кварцит с мягким «облачным» рисунком. Прочнее мрамора при сходной эстетике — удачный выбор для кухонь и стен в жилых интерьерах.",
    expertNote:
      "Taj Mahal хорошо держит кухню: меньше впитывает, чем мрамор. Сатин снимает лишний блеск и спокойнее работает при дневном свете.",
    slabs: [
      { label: "Слэб 01", size: "3240 × 1820 мм", thickness: "20 мм", finish: "Сатинированная", status: "В наличии", image: "/stonetrail_mock_assets/slabs/taj-mahal-slab-01.jpg" },
      { label: "Слэб 02", size: "3200 × 1800 мм", thickness: "20 мм", finish: "Сатинированная", status: "В наличии", image: "/stonetrail_mock_assets/stones/taj-mahal.jpg" },
      { label: "Слэб 03", size: "3160 × 1760 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/products/product-wall-cladding-taj-mahal.jpg" },
    ],
  },
  {
    id: "slab-08",
    slug: "slab-granite-colonial-white",
    category: "slabs",
    name: "Гранит Colonial White",
    stoneName: "Colonial White",
    stoneType: "Гранит",
    color: "Белый",
    thickness: "30 мм",
    finish: "Полированная",
    size: "3000 × 1800 мм",
    availability: "Под заказ",
    image: "/stonetrail_mock_assets/stones/crystal-white.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/crystal-white.jpg",
    description:
      "Светлый гранит с ровной зернистой структурой. Практичный материал для столешниц, подоконников и облицовки, где нужен светлый тон без капризного мраморного ухода.",
    expertNote:
      "Colonial White заказываем под объём объекта: партия должна быть из одного блока, иначе зерно и фон могут разойтись на соседних плоскостях.",
    slabs: [
      { label: "Слэб 01", size: "3000 × 1800 мм", thickness: "30 мм", finish: "Полированная", status: "Под заказ", image: "/stonetrail_mock_assets/stones/crystal-white.jpg" },
      { label: "Слэб 02", size: "2940 × 1760 мм", thickness: "30 мм", finish: "Полированная", status: "Под заказ", image: "/stonetrail_mock_assets/stones/crystal-white.jpg" },
    ],
  },
]

export const blankProducts: Product[] = [
  {
    id: "blank-01",
    slug: "blank-quartzite-patagonia",
    category: "blanks",
    name: "Кварцит Patagonia",
    stoneName: "Patagonia",
    stoneType: "Кварцит",
    color: "Контрастный",
    thickness: "20 мм",
    finish: "Полированная",
    size: "1800 × 1200 мм",
    availability: "В наличии",
    image: "/stone/white-quartzite.png",
    stoneImage: "/stone/white-quartzite.png",
    description:
      "Полуслэбы Patagonia — обрезки и половины плит после раскроя крупных слэбов. Рисунок жилы сохранён, формат удобен для подоконников, фартуков и небольших столешниц.",
    expertNote:
      "Заготовку из Patagonia смотрим так же, как полный слэб: жила не усредняется. Для фартука или компактной столешницы полуслэб часто выгоднее целой плиты.",
    blanks: [
      { label: "Заготовка 01", size: "1860 × 1240 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stone/white-quartzite.png", note: "Полуслэб" },
      { label: "Заготовка 02", size: "1720 × 1180 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stone/white-quartzite.png" },
      { label: "Заготовка 03", size: "1640 × 980 мм", thickness: "30 мм", finish: "Полированная", status: "В наличии", image: "/stone/white-quartzite.png", note: "Остаток после раскроя" },
      { label: "Заготовка 04", size: "1580 × 1120 мм", thickness: "20 мм", finish: "Сатинированная", status: "Зарезервирован", image: "/stone/white-quartzite.png" },
    ],
  },
  {
    id: "blank-02",
    slug: "blank-marble-calacatta",
    category: "blanks",
    name: "Мрамор Calacatta",
    stoneName: "Calacatta Luxury",
    stoneType: "Мрамор",
    color: "Белый",
    thickness: "20 мм",
    finish: "Полированная",
    size: "1600 × 1200 мм",
    availability: "В наличии",
    image: "/stonetrail_mock_assets/slabs/calacatta-luxury-slab-01.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/calacatta-luxury.jpg",
    description:
      "Полуслэбы Calacatta с крупной графично-золотистой прожилкой. Подходят, когда нужна выразительная плоскость без полного слэба: островок компактной кухни, стеновая вставка, барная стойка.",
    expertNote:
      "На заготовке Calacatta важно увидеть, куда уходит жила. Если кусок — половина bookmatch-пары, не режем его «вслепую»: сначала фиксируем ориентацию рисунка.",
    blanks: [
      { label: "Заготовка A", size: "1610 × 1220 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/slabs/calacatta-luxury-slab-01.jpg", note: "Полуслэб bookmatch" },
      { label: "Заготовка B", size: "1580 × 1180 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/stones/calacatta-luxury.jpg", note: "Полуслэб bookmatch" },
      { label: "Заготовка C", size: "1420 × 960 мм", thickness: "20 мм", finish: "Полированная", status: "Зарезервирован", image: "/stonetrail_mock_assets/products/product-countertop-calacatta-luxury.jpg" },
      { label: "Заготовка D", size: "1540 × 1100 мм", thickness: "30 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/slabs/calacatta-luxury-slab-01.jpg" },
    ],
  },
  {
    id: "blank-03",
    slug: "blank-marble-carrara",
    category: "blanks",
    name: "Мрамор Carrara",
    stoneName: "Bianco Carrara",
    stoneType: "Мрамор",
    color: "Белый",
    thickness: "20 мм",
    finish: "Полированная",
    size: "1500 × 1100 мм",
    availability: "В наличии",
    image: "/stonetrail_mock_assets/slabs/bianco-carrara-slab-01.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/bianco-carrara.jpg",
    description:
      "Полуслэбы каррарского мрамора со спокойной серой прожилкой. Рабочий формат для подоконников, ступеней, фартуков и облицовки, где полный слэб избыточен.",
    expertNote:
      "Carrara на заготовках предсказуема: тон ровный, раскрой спокойный. Для подоконников оставляем 20 мм, для ступеней смотрим 30 мм.",
    blanks: [
      { label: "Заготовка 01", size: "1540 × 1120 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/slabs/bianco-carrara-slab-01.jpg" },
      { label: "Заготовка 02", size: "1480 × 1080 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/stones/bianco-carrara.jpg" },
      { label: "Заготовка 03", size: "1620 × 920 мм", thickness: "20 мм", finish: "Сатинированная", status: "В наличии", image: "/stonetrail_mock_assets/products/product-stairs-bianco-carrara.jpg", note: "Под ступени" },
      { label: "Заготовка 04", size: "1360 × 1040 мм", thickness: "30 мм", finish: "Полированная", status: "Зарезервирован", image: "/stonetrail_mock_assets/slabs/bianco-carrara-slab-01.jpg" },
      { label: "Заготовка 05", size: "1440 × 980 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/stones/bianco-carrara.jpg" },
    ],
  },
  {
    id: "blank-04",
    slug: "blank-granite-black-galaxy",
    category: "blanks",
    name: "Гранит Black Galaxy",
    stoneName: "Black Galaxy",
    stoneType: "Гранит",
    color: "Чёрный",
    thickness: "30 мм",
    finish: "Полированная",
    size: "1600 × 1200 мм",
    availability: "В наличии",
    image: "/stone/black-granite.png",
    stoneImage: "/stone/black-granite.png",
    description:
      "Полуслэбы плотного чёрного гранита с золотистыми включениями. Подходят для кухонных вставок, подоконников и коммерческих стоек, когда нужен запас прочности без полной плиты.",
    expertNote:
      "Black Galaxy почти не гуляет по тону. На заготовке 30 мм кромка выглядит солиднее, и плита спокойнее работает на пролёте подоконника.",
    blanks: [
      { label: "Заготовка 01", size: "1680 × 1240 мм", thickness: "30 мм", finish: "Полированная", status: "В наличии", image: "/stone/black-granite.png" },
      { label: "Заготовка 02", size: "1520 × 1180 мм", thickness: "30 мм", finish: "Полированная", status: "В наличии", image: "/stone/black-granite.png" },
      { label: "Заготовка 03", size: "1460 × 960 мм", thickness: "20 мм", finish: "Полированная", status: "Зарезервирован", image: "/stone/black-granite.png" },
      { label: "Заготовка 04", size: "1380 × 1100 мм", thickness: "30 мм", finish: "Полированная", status: "В наличии", image: "/stone/black-granite.png" },
    ],
  },
  {
    id: "blank-05",
    slug: "blank-quartzite-taj-mahal",
    category: "blanks",
    name: "Кварцит Taj Mahal",
    stoneName: "Taj Mahal",
    stoneType: "Кварцит",
    color: "Бежевый",
    thickness: "20 мм",
    finish: "Сатинированная",
    size: "1700 × 1100 мм",
    availability: "В наличии",
    image: "/stonetrail_mock_assets/slabs/taj-mahal-slab-01.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/taj-mahal.jpg",
    description:
      "Полуслэбы тёплого серо-бежевого кварцита. Формат удобен для кухонных фартуков, компактных столешниц и стеновых панелей, где полный слэб не требуется.",
    expertNote:
      "Taj Mahal на заготовке работает так же надёжно, как на полном слэбе. Сатин снимает лишний блеск — для кухни это обычно лучший выбор.",
    blanks: [
      { label: "Заготовка 01", size: "1740 × 1140 мм", thickness: "20 мм", finish: "Сатинированная", status: "В наличии", image: "/stonetrail_mock_assets/slabs/taj-mahal-slab-01.jpg" },
      { label: "Заготовка 02", size: "1680 × 1080 мм", thickness: "20 мм", finish: "Сатинированная", status: "В наличии", image: "/stonetrail_mock_assets/stones/taj-mahal.jpg" },
      { label: "Заготовка 03", size: "1520 × 920 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/products/product-wall-cladding-taj-mahal.jpg", note: "Остаток после раскроя" },
    ],
  },
  {
    id: "blank-06",
    slug: "blank-marble-verde-alpi",
    category: "blanks",
    name: "Мрамор Verde Alpi",
    stoneName: "Verde Alpi",
    stoneType: "Мрамор",
    color: "Зелёный",
    thickness: "20 мм",
    finish: "Полированная",
    size: "1500 × 1000 мм",
    availability: "Мало",
    image: "/stonetrail_mock_assets/slabs/verde-alpi-slab-01.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/verde-alpi.jpg",
    description:
      "Полуслэбы глубокого зелёного камня с тёмными и золотистыми вкраплениями. Акцентный материал: барные вставки, порталы, небольшие стеновые панели.",
    expertNote:
      "Verde Alpi на заготовке ещё капризнее, чем на полном слэбе: рисунок обрывается на кромке. Сначала смотрим грань, затем карту раскроя.",
    blanks: [
      { label: "Заготовка 01", size: "1540 × 1020 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/slabs/verde-alpi-slab-01.jpg" },
      { label: "Заготовка 02", size: "1380 × 940 мм", thickness: "20 мм", finish: "Полированная", status: "Зарезервирован", image: "/stonetrail_mock_assets/stones/verde-alpi.jpg" },
    ],
  },
  {
    id: "blank-07",
    slug: "blank-onyx-ivory",
    category: "blanks",
    name: "Оникс Ivory",
    stoneName: "Onice Ivory",
    stoneType: "Оникс",
    color: "Бежевый",
    thickness: "20 мм",
    finish: "Полированная",
    size: "1400 × 900 мм",
    availability: "Мало",
    image: "/stonetrail_mock_assets/stones/onice-honey.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/onice-honey.jpg",
    description:
      "Полуслэбы светопроницаемого оникса тёплого слонового тона. Компактный формат для подсвеченных ниш, барных фасадов и декоративных вставок.",
    expertNote:
      "Оникс на заготовке удобнее полного слэба: проще вписать в нишу и подсветку. Без управляемого света камень выглядит плоским — это правило не меняется.",
    blanks: [
      { label: "Заготовка 01", size: "1420 × 920 мм", thickness: "20 мм", finish: "Полированная", status: "В наличии", image: "/stonetrail_mock_assets/stones/onice-honey.jpg" },
      { label: "Заготовка 02", size: "1280 × 860 мм", thickness: "20 мм", finish: "Полированная", status: "Зарезервирован", image: "/stonetrail_mock_assets/products/product-onyx-interior-honey.jpg" },
    ],
  },
  {
    id: "blank-08",
    slug: "blank-granite-colonial-white",
    category: "blanks",
    name: "Гранит Colonial White",
    stoneName: "Colonial White",
    stoneType: "Гранит",
    color: "Белый",
    thickness: "30 мм",
    finish: "Полированная",
    size: "1600 × 1100 мм",
    availability: "Под заказ",
    image: "/stonetrail_mock_assets/stones/crystal-white.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/crystal-white.jpg",
    description:
      "Светлые гранитные заготовки с ровной зернистой структурой. Практичный формат для подоконников, ступеней и облицовки, когда полный слэб не нужен.",
    expertNote:
      "Colonial White заказываем из одной партии: иначе зерно и фон могут разойтись на соседних плоскостях. Для заготовок это так же важно, как для слэбов.",
    blanks: [
      { label: "Заготовка 01", size: "1600 × 1100 мм", thickness: "30 мм", finish: "Полированная", status: "Под заказ", image: "/stonetrail_mock_assets/stones/crystal-white.jpg" },
      { label: "Заготовка 02", size: "1480 × 1040 мм", thickness: "30 мм", finish: "Полированная", status: "Под заказ", image: "/stonetrail_mock_assets/stones/crystal-white.jpg" },
    ],
  },
]

const TILE_FINISHES = ["Полированная", "Матовая"] as const

function parseTileFormats(size: string): string[] {
  const unitMatch = size.match(/(мм|cm|см)\s*$/i)
  const unit = unitMatch?.[1] ?? "мм"
  return size
    .replace(/(мм|cm|см)\s*$/i, "")
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (/(мм|cm|см)$/i.test(part) ? part : `${part} ${unit}`))
}

function parseTileFinishes(finish: string | readonly string[]): string[] {
  const parts = Array.isArray(finish)
    ? finish.map((part) => part.trim()).filter(Boolean)
    : finish
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)
  return parts.map((part) => {
    const lower = part.toLocaleLowerCase("ru")
    if (lower === "матовая") return "Матовая"
    if (lower === "полированная") return "Полированная"
    return part
  })
}

function tileThicknessVariants(
  size: string,
  image: string,
  finish: string | readonly string[] = TILE_FINISHES,
  status: BlockStatus = "Под заказ",
): IndividualTile[] {
  const formats = parseTileFormats(size)
  const finishes = parseTileFinishes(finish)
  const thicknesses = ["20 мм", "30 мм"] as const
  return formats.flatMap((format) =>
    thicknesses.flatMap((thickness) =>
      finishes.map((surface) => ({
        label:
          finishes.length > 1
            ? `${format} · ${thickness} · ${surface}`
            : `${format} · ${thickness}`,
        size: format,
        thickness,
        finish: surface,
        status,
        image,
      })),
    ),
  )
}

export const tileProducts: Product[] = [
  {
    id: "tile-01",
    slug: "tile-carrara-bianco",
    category: "tiles",
    name: "Плита Carrara Bianco",
    stoneName: "Bianco Carrara",
    stoneType: "Мрамор",
    thickness: "20–30 мм",
    finish: "Полированная / матовая",
    size: "300×300 / 600×300 / 600×600 мм",
    availability: "Под заказ",
    image: "/stonetrail_mock_assets/stones/bianco-carrara.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/bianco-carrara.jpg",
    description:
      "Светлый мрамор с тонкой серой прожилкой. Подходит для столешниц, стеновых панелей и декоративных элементов интерьера, а также для полов в зонах с умеренной нагрузкой.",
    expertNote:
      "Для влажных зон берём матовую поверхность: полировка красива, но скользит. Швы держим минимальными, рисунок выкладываем в одном направлении.",
    tiles: tileThicknessVariants(
      "300×300 / 600×300 / 600×600 мм",
      "/stonetrail_mock_assets/stones/bianco-carrara.jpg",
    ),
  },
  {
    id: "tile-02",
    slug: "tile-crema-marfil",
    category: "tiles",
    name: "Плита Crema Marfil",
    stoneName: "Crema Marfil",
    stoneType: "Мрамор",
    thickness: "20–30 мм",
    finish: "Полированная / матовая",
    size: "300×300 / 600×300 / 600×600 мм",
    availability: "Под заказ",
    image: "/stone/calacatta.png",
    stoneImage: "/stone/calacatta.png",
    description:
      "Тёплый кремовый мрамор с мягкой жилкой. Классический материал для холлов, ванных и стеновой облицовки, где нужен спокойный светлый фон без резкого контраста.",
    expertNote:
      "Crema Marfil чувствителен к кислотам. Перед сдачей объекта обрабатываем гидрофобизатором и отдельно проговариваем уход с эксплуатацией.",
    tiles: tileThicknessVariants(
      "300×300 / 600×300 / 600×600 мм",
      "/stone/calacatta.png",
    ),
  },
  {
    id: "tile-03",
    slug: "tile-travertino-classic",
    category: "tiles",
    name: "Плита Travertino Classic",
    stoneName: "Classic Travertine",
    stoneType: "Травертин",
    thickness: "20–30 мм",
    finish: "Полированная / матовая",
    size: "600×600 / 800×800 мм",
    availability: "Под заказ",
    image: "/stone/travertine.png",
    stoneImage: "/stonetrail_mock_assets/stones/travertino-classico.jpg",
    description:
      "Классический травертин с полосчатой структурой. Хорошо работает на полах, фасадах и в зонах у воды: пористость камня здесь не недостаток, а часть характера материала.",
    expertNote:
      "Травертин на полу чаще берём матовым: поверхность не скользит и спокойнее стареет. Полировку оставляем для стен и сухих зон.",
    tiles: tileThicknessVariants(
      "600×600 / 800×800 мм",
      "/stone/travertine.png",
    ),
  },
  {
    id: "tile-04",
    slug: "tile-black-absolute",
    category: "tiles",
    name: "Плита Black Absolute",
    stoneName: "Absolute Black",
    stoneType: "Гранит",
    thickness: "20–30 мм",
    finish: "Полированная / матовая",
    size: "300×600 / 600×600 мм",
    availability: "Под заказ",
    image: "/stonetrail_mock_assets/stones/nero-marquina.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/nero-marquina.jpg",
    description:
      "Глухой чёрный гранит без выразительной жилы. Даёт ровную плоскость для полов коммерческих зон, лестничных площадок и контрастной стеновой облицовки.",
    expertNote:
      "Absolute Black в полировке собирает отпечатки. Для пола чаще ставим мат или лёгкий сатин — тон остаётся глубоким, уход проще.",
    tiles: tileThicknessVariants(
      "300×600 / 600×600 мм",
      "/stonetrail_mock_assets/stones/nero-marquina.jpg",
    ),
  },
  {
    id: "tile-05",
    slug: "tile-pietra-grey",
    category: "tiles",
    name: "Плита Pietra Grey",
    stoneName: "Pietra Grey",
    stoneType: "Известняк",
    thickness: "20–30 мм",
    finish: "Полированная / матовая",
    size: "300×600 / 600×600 мм",
    availability: "Под заказ",
    image: "/stonetrail_mock_assets/stones/pietra-grey.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/pietra-grey.jpg",
    description:
      "Дымчато-серый известняк с тонкой белой прожилкой. Подходит для ванных, спа-зон и стеновых панелей, где нужен спокойный графитовый тон без холодного «технического» серого.",
    expertNote:
      "На пол во влажных зонах — матовая поверхность. Полировка здесь скользкая и визуально «лакирует» камень, чего этот сорт не любит.",
    tiles: tileThicknessVariants(
      "300×600 / 600×600 мм",
      "/stonetrail_mock_assets/stones/pietra-grey.jpg",
    ),
  },
  {
    id: "tile-06",
    slug: "tile-jura-beige",
    category: "tiles",
    name: "Плита Jura Beige",
    stoneName: "Jura Beige",
    stoneType: "Известняк",
    thickness: "20–30 мм",
    finish: "Полированная / матовая",
    size: "600×600 / 800×800 мм",
    availability: "Под заказ",
    image: "/stone/soapstone.png",
    stoneImage: "/stone/soapstone.png",
    description:
      "Бежевый юрский известняк с характерными органическими включениями. Материал для полов, лестниц и фасадных цоколей, где важны износостойкость и тёплая природная фактура.",
    expertNote:
      "Jura хорошо держит улицу в нашем климате при правильной толщине и уклоне. Для входных групп берём мат: полировка зимой скользкая.",
    tiles: tileThicknessVariants(
      "600×600 / 800×800 мм",
      "/stone/soapstone.png",
    ),
  },
]

function parsePavingThicknesses(thickness: string): string[] {
  const cleaned = thickness.replace(/мм/gi, "").trim()
  const parts = cleaned
    .split(/\s*[–—-]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
  return Array.from(new Set(parts)).map((part) => `${part} мм`)
}

function parsePavingFinishes(finish: string | readonly string[]): string[] {
  const parts = Array.isArray(finish)
    ? finish.map((part) => part.trim()).filter(Boolean)
    : finish
        .split("/")
        .map((part) => part.trim())
        .filter(Boolean)
  return parts.map((part) => {
    const lower = part.toLocaleLowerCase("ru")
    if (lower === "колотая") return "Колотая"
    if (lower === "пилено-колотая") return "Пилено-колотая"
    if (lower === "термообработанная") return "Термообработанная"
    if (lower === "пиленая") return "Пиленая"
    return part
  })
}

function pavingVariants(
  size: string,
  image: string,
  thickness: string,
  finish: string | readonly string[],
  status: BlockStatus = "Под заказ",
): IndividualPaving[] {
  const formats = parseTileFormats(size)
  const finishes = parsePavingFinishes(finish)
  const thicknesses = parsePavingThicknesses(thickness)
  return formats.flatMap((format) =>
    thicknesses.flatMap((itemThickness) =>
      finishes.map((surface) => ({
        label:
          finishes.length > 1
            ? `${format} · ${itemThickness} · ${surface}`
            : `${format} · ${itemThickness}`,
        size: format,
        thickness: itemThickness,
        finish: surface,
        status,
        image,
      })),
    ),
  )
}

export const pavingProducts: Product[] = [
  {
    id: "paving-01",
    slug: "paving-granite-grey",
    category: "paving",
    name: "Гранитная брусчатка Grey",
    stoneName: "Grey Granite",
    stoneType: "Гранит",
    thickness: "50–80 мм",
    finish: "Колотая",
    size: "100 × 100 / 100 × 200 мм",
    availability: "Под заказ",
    image: "/stonetrail_mock_assets/blocks/travertino-classico-block-01.jpg",
    stoneImage: "/stone/travertine.png",
    description:
      "Серая гранитная брусчатка для дорожек, террас и входных групп. Колотая фактура даёт сцепление и спокойный природный рисунок мощения.",
    expertNote:
      "Для частных дорожек достаточно 50–60 мм. На въезде и общественных проходах уходим к 80 мм и более плотному основанию.",
    paving: pavingVariants(
      "100 × 100 / 100 × 200 мм",
      "/stonetrail_mock_assets/blocks/travertino-classico-block-01.jpg",
      "50–80 мм",
      "Колотая",
    ),
  },
  {
    id: "paving-02",
    slug: "paving-granite-black",
    category: "paving",
    name: "Гранитная брусчатка Black",
    stoneName: "Black Granite",
    stoneType: "Гранит",
    thickness: "50–80 мм",
    finish: "Колотая",
    size: "100 × 100 мм",
    availability: "Под заказ",
    image: "/stonetrail_mock_assets/slabs/nero-marquina-slab-01.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/nero-marquina.jpg",
    description:
      "Тёмная гранитная брусчатка для контрастного мощения. Работает в сочетании со светлым бортом: парадные дворы, входные площадки, общественные пространства.",
    expertNote:
      "Чёрный гранит визуально «собирает» лужи и пыль. Для парадных зон лучше термообработка или колотая фактура, не полировка.",
    paving: pavingVariants(
      "100 × 100 мм",
      "/stonetrail_mock_assets/slabs/nero-marquina-slab-01.jpg",
      "50–80 мм",
      "Колотая",
    ),
  },
  {
    id: "paving-03",
    slug: "paving-granite-baltic",
    category: "paving",
    name: "Гранитная брусчатка Baltic",
    stoneName: "Baltic Grey",
    stoneType: "Гранит",
    thickness: "80–100 мм",
    finish: "Пилено-колотая",
    size: "100 × 200 мм",
    availability: "Под заказ",
    image: "/stonetrail_mock_assets/slabs/emperador-dark-slab-01.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/emperador-dark.jpg",
    description:
      "Североевропейский гранит с плотной структурой. Рассчитан на интенсивную нагрузку: проезды, площади, архитектурные объекты с регулярным движением.",
    expertNote:
      "Baltic берут, когда нужна однородность партии на большой площади. Пилено-колотая грань даёт ровный модуль при живой фактуре верха.",
    paving: pavingVariants(
      "100 × 200 мм",
      "/stonetrail_mock_assets/slabs/emperador-dark-slab-01.jpg",
      "80–100 мм",
      "Пилено-колотая",
    ),
  },
  {
    id: "paving-04",
    slug: "paving-granite-split",
    category: "paving",
    name: "Пилено-колотая гранитная брусчатка",
    stoneName: "Grey Granite",
    stoneType: "Гранит",
    thickness: "50–80 мм",
    finish: "Пилено-колотая",
    size: "100 × 100 / 100 × 200 мм",
    availability: "Под заказ",
    image: "/stonetrail_mock_assets/blocks/nero-marquina-block-01.jpg",
    stoneImage: "/stone/black-granite.png",
    description:
      "Модуль с пилеными боковыми гранями и колотой верхней плоскостью. Удобен в раскладке, держит геометрию шва и подходит для террас и аккуратных садовых дорожек.",
    expertNote:
      "Пилено-колотая брусчатка быстрее набирается в ровный ковёр, чем полноколотая. Для частных объектов это обычно оптимальный компромисс.",
    paving: pavingVariants(
      "100 × 100 / 100 × 200 мм",
      "/stonetrail_mock_assets/blocks/nero-marquina-block-01.jpg",
      "50–80 мм",
      "Пилено-колотая",
    ),
  },
  {
    id: "paving-05",
    slug: "paving-granite-flamed",
    category: "paving",
    name: "Термообработанная гранитная брусчатка",
    stoneName: "Grey Granite",
    stoneType: "Гранит",
    thickness: "50–80 мм",
    finish: "Термообработанная",
    size: "100 × 200 мм",
    availability: "Под заказ",
    image: "/stonetrail_mock_assets/slabs/blue-roma-slab-01.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/blue-roma.jpg",
    description:
      "Гранит с термообработанной поверхностью: шероховатая, не скользкая, устойчивая к осадкам. Для входных групп, пандусов и общественных пространств.",
    expertNote:
      "Термообработка обязательна там, где зимой ходят в обуви. Полированный гранит на улице — ошибка, которую потом дорого исправлять.",
    paving: pavingVariants(
      "100 × 200 мм",
      "/stonetrail_mock_assets/slabs/blue-roma-slab-01.jpg",
      "50–80 мм",
      "Термообработанная",
    ),
  },
  {
    id: "paving-06",
    slug: "paving-granite-path",
    category: "paving",
    name: "Гранитная брусчатка для дорожек",
    stoneName: "Grey Granite",
    stoneType: "Гранит",
    thickness: "50 мм",
    finish: "Колотая / термообработанная",
    size: "100 × 100 / 100 × 200 мм",
    availability: "Под заказ",
    image: "/stonetrail_mock_assets/blocks/taj-mahal-block-01.jpg",
    stoneImage: "/stonetrail_mock_assets/stones/taj-mahal.jpg",
    description:
      "Облегчённый модуль для пешеходных дорожек и садового благоустройства. Толщина 50 мм достаточна при подготовленном основании и отсутствии проезда техники.",
    expertNote:
      "На дорожках важнее основание, чем толщина камня. 50 мм работают, если песок и уплотнение сделаны правильно; иначе «поплывёт» любой гранит.",
    paving: pavingVariants(
      "100 × 100 / 100 × 200 мм",
      "/stonetrail_mock_assets/blocks/taj-mahal-block-01.jpg",
      "50 мм",
      "Колотая / термообработанная",
    ),
  },
]

export const catalogProducts: Product[] = [
  ...slabProducts,
  ...blankProducts,
  ...tileProducts,
  ...pavingProducts,
  ...finishedProducts,
]

export const stoneBlocks: StoneBlock[] = [
  {
    id: "block-calacatta-luxury",
    slug: "block-calacatta-luxury",
    stoneName: "Calacatta Luxury",
    stoneType: "Мрамор",
    quarry: "Каррара",
    country: "Италия",
    blocks: [
      { label: "Блок A", dimensions: "2 800 × 1 450 × 1 250 мм", weight: "~27,9 т", status: "В наличии" },
      { label: "Блок B", dimensions: "2 650 × 1 400 × 1 200 мм", weight: "~26,4 т", status: "В наличии" },
      { label: "Блок C", dimensions: "2 550 × 1 350 × 1 150 мм", weight: "~25,1 т", status: "Зарезервирован" },
    ],
    image: "/stonetrail_mock_assets/blocks/calacatta-luxury-block-01.jpg",
    description:
      "Классический премиальный мрамор с чистым белым фоном и крупными контрастными прожилками. Блок из верхнего пласта Каррары — однородной структуры, без сколов по кромкам, готов к резке под bookmatching.",
    expertNote:
      "Для такого блока рекомендуем вертикальный раскрой слэбов шириной 1200–1400 мм: рисунок жилы вытягивается по длинной стороне, а отход на коротком боке минимален. Из одной такой габариты мы уверенно снимаем 8–10 слэбов формата 2400×1200 с 20 мм толщиной.",
  },
  {
    id: "block-nero-marquina",
    slug: "block-nero-marquina",
    stoneName: "Nero Marquina",
    stoneType: "Известняк",
    quarry: "Марбелья",
    country: "Испания",
    blocks: [
      { label: "Блок A", dimensions: "2 600 × 1 300 × 1 150 мм", weight: "~25,4 т", status: "В наличии" },
      { label: "Блок B", dimensions: "2 450 × 1 250 × 1 100 мм", weight: "~23,5 т", status: "В наличии" },
    ],
    image: "/stonetrail_mock_assets/blocks/nero-marquina-block-01.jpg",
    description:
      "Блок тёмного известняка с резкими золотистыми и белыми прожилками. Плотная структура верхнего пласта Марбелья — стабильный рисунок на любом срезе.",
    expertNote:
      "Nero Marquina из этого блока режется только под заказ по вашему формату: жила ведёт себя непредсказуемо на поперечном срезе, поэтому мы подбираем слэбы на месте. Для фасадов рекомендуем сатин вместо полировки — он глубже читается по тону.",
  },
  {
    id: "block-taj-mahal",
    slug: "block-taj-mahal",
    stoneName: "Taj Mahal",
    stoneType: "Мрамор",
    quarry: "Антиквари",
    country: "Греция",
    blocks: [
      { label: "Блок A", dimensions: "2 900 × 1 500 × 1 300 мм", weight: "~29,6 т", status: "Зарезервирован" },
    ],
    image: "/stonetrail_mock_assets/blocks/taj-mahal-block-01.jpg",
    description:
      "Тёплый серо-бежевый мрамор с нежным «взрывным» рисунком. Блок среднего пласта: без видимых микротрещин, проверен простукиванием и просветкой УФ-фонарём.",
    expertNote:
      "Из такого блока получаются идеальные «акцентные» стены: формат 3800×2700 режется из центра пласта, где рисунок наиболее равномерный. На кромках блока мы оставили 80 мм «запасного» камня под корректировку при сборке.",
  },
  {
    id: "block-travertino-classico",
    slug: "block-travertino-classico",
    stoneName: "Classic Travertine",
    stoneType: "Травертин",
    quarry: "Tivoli",
    country: "Италия",
    blocks: [
      { label: "Блок A", dimensions: "3 100 × 1 600 × 1 400 мм", weight: "~32,1 т", status: "В наличии" },
      { label: "Блок B", dimensions: "3 000 × 1 550 × 1 350 мм", weight: "~30,2 т", status: "В наличии" },
      { label: "Блок C", dimensions: "2 850 × 1 500 × 1 300 мм", weight: "~27,9 т", status: "В наличии" },
      { label: "Блок D", dimensions: "2 700 × 1 450 × 1 200 мм", weight: "~25,0 т", status: "Зарезервирован" },
    ],
    image: "/stonetrail_mock_assets/blocks/travertino-classico-block-01.jpg",
    description:
      "Классический тёплый травертин с характерной полосой. Прямой извлечённый блок, без склейки — подходит как для мозаики бассейна, так и для крупного формата облицовки.",
    expertNote:
      "Травертин из Тиволи — один из самых стабильных по структуре в Италии. Из этого блока мы делаем и мозаику 100×100, и плиту 600×300. Рекомендую шлифовать, а не полировать: поверхность лучше держит влагу, не скользит.",
    blockStoneId: "classic-travertine",
  },
  {
    id: "block-verde-alpi",
    slug: "block-verde-alpi",
    stoneName: "Verde Alpi",
    stoneType: "Мрамор",
    quarry: "Alpi Apuane",
    country: "Италия",
    blocks: [
      { label: "Блок A", dimensions: "2 400 × 1 200 × 1 100 мм", weight: "~22,9 т", status: "В наличии" },
      { label: "Блок B", dimensions: "2 250 × 1 150 × 1 050 мм", weight: "~20,6 т", status: "В наличии" },
    ],
    image: "/stonetrail_mock_assets/blocks/verde-alpi-block-01.jpg",
    description:
      "Живой зелёный альпийский мрамор с контрастными тёмными и золотистыми вкраплениями. Каждая грань блока — уникальный рисунок, без точного совпадения.",
    expertNote:
      "Verde Alpi — один из самых «личных» сортов: для обеденного стола, барной стойки и акцентной подставки мы всегда смотрим на 3–4 грани блока, прежде чем отдать на раскрой. Рекомендую выбирать грань, где основные жилы пересекаются близко к центральной оси.",
    blockStoneId: "verde-alpi",
  },
  {
    id: "block-blue-roma",
    slug: "block-blue-roma",
    stoneName: "Blue Roma",
    stoneType: "Кварцит",
    quarry: "Sulmona",
    country: "Италия",
    blocks: [
      { label: "Блок A", dimensions: "2 700 × 1 350 × 1 200 мм", weight: "~26,5 т", status: "Под заказ" },
    ],
    image: "/stonetrail_mock_assets/blocks/blue-roma-block-01.jpg",
    description:
      "Редкий синий кварцит с тёплыми медовыми прожилками. Блок находится на этапе подготовки к отправке из карьера — ожидаем паспорт качества и фотосессию граней.",
    expertNote:
      "Blue Roma — самый редкий сорт в нашем каталоге. Для него рекомендуем тонкую нарезку 12–15 мм: синий рисунок «глубоко прорисовывается» только при свете. Подсвечённые панели из такого блока стоят отдельного разговора.",
  },
]

export const mockForumPosts = [
  {
    id: "post-1",
    title: "Лучшие методы полировки кварцита",
    author: "MasterStone_Ivan",
    category: "Технологии",
    date: "2 дня назад",
    excerpt: "Делюсь своим опытом работы с твердыми кварцитами...",
    content: "Кварциты — одни из самых сложных материалов в плане полировки из-за их высокой твердости. Я перепробовал множество алмазных инструментов, и вот к чему пришел:\n\n1. Начинайте с низких оборотов, чтобы не сжечь камень.\n2. Используйте только качественные гибкие шлифовальные круги.\n3. Обязательно контролируйте подачу воды.\n\nКто еще сталкивался с проблемой 'зализывания' поверхности на финальных этапах? Какие зерна используете для зеркального блеска?",
  },
  {
    id: "post-2",
    title: "Как проверить качество слэба перед покупкой",
    author: "StoneExpert_Elena",
    category: "Советы",
    date: "5 дней назад",
    excerpt: "Обратите внимание на трещины и внутренние напряжения камня...",
    content: "Многие новички совершают ошибку, глядя только на рисунки слэба. Но эстетика — это только часть дела.\n\nРекомендую следующее:\n- Проверка на свет: подсветите слэб мощным фонарем с обратной стороны, чтобы увидеть скрытые трещины.\n- Простукивание: по некоторым типам камня можно определить пустоты по звуку.\n- Осмотр краев: проверьте нет ли сколов, которые могут указывать на хрупкость всей плиты.\n\nПоделитесь своими секретами проверки, на что еще обращаете внимание?",
  },
  {
    id: "post-3",
    title: "Тренды в дизайне кухонь 2024",
    author: "DesignStudio_Lux",
    category: "Дизайн",
    date: "1 неделю назад",
    excerpt: "Возвращение к натуральным текстурам и матовым поверхностям...",
    content: "Наблюдаем сдвиг в предпочтениях клиентов. Если последние годы доминировал глянцевый белый мрамор, то сейчас в тренде:\n\n- Матовые поверхности (honed finish) с выраженной текстурой.\n- Темные, глубокие цвета с золотистыми прожилками.\n- Интегрированные мойки из того же камня, что и столешница.\n\nКак вы считаете, этот тренд останется с нами долго или это временная мода?",
  },
  {
    id: "post-4",
    title: "Обсуждение новых норм безопасности при резке",
    author: "SafetyFirst_Alex",
    category: "Безопасность",
    date: "2 недели назад",
    excerpt: "Важность использования систем водяного охлаждения...",
    content: "Коллеги, в некоторых регионах обновились нормы безопасности при работе с кварцевым композитом и натуральным камнем. Основной акцент теперь делается на подавление пыли.\n\nИспользование вакуумных систем в сочетании с водяным охлаждением становится обязательным. Те, кто все еще работает 'на сухую' с обычным пылесосом, подвергают себя огромному риску.\n\nКто из вас уже перешел на новые системы? Насколько это усложнило процесс работы?",
  },
]

export const mockForumComments: Comment[] = [
  {
    id: "com-1",
    postId: "post-1",
    author: "StoneCut_Pro",
    authorId: "user-1",
    text: "Согласен с Иваном. Я также заметил, что на некоторых кварцитах лучше работают диски с повышенным содержанием алмазного напыления.",
    date: "1 день назад",
    likesCount: 0,
    liked: false,
  },
  {
    id: "com-2",
    postId: "post-1",
    author: "MarbleMaster",
    authorId: "user-2",
    text: "А про зерно — я использую 3000 для финишного этапа, дает отличный результат.",
    date: "12 часов назад",
    likesCount: 0,
    liked: false,
  },
  {
    id: "com-3",
    postId: "post-2",
    author: "Ivan_Slabs",
    authorId: "user-3",
    text: "Отличный совет про фонарь! Многие об этом забывают, а потом удивляются трещинам после резки.",
    date: "4 дня назад",
    likesCount: 0,
    liked: false,
  },
  {
    id: "com-4",
    postId: "post-3",
    author: "Kitchens_ Andrey",
    authorId: "user-4",
    text: "Полностью поддержию по поводу матовых поверхностей. Они выглядят более благородно и менее маркие.",
    date: "3 дня назад",
    likesCount: 0,
    liked: false,
  },
  {
    id: "com-5",
    postId: "post-4",
    author: "WorkSafe_Corp",
    authorId: "user-5",
    text: "Мы установили системы аспирации на весь цех. Затраты окупились за счет здоровья сотрудников и отсутствия проблем с проверками.",
    date: "1 неделю назад",
    likesCount: 0,
    liked: false,
  },
]

export const mockArticles = [
  {
    id: "art-1",
    title: "Гид по выбору мрамора для ванной комнаты",
    category: "Материалы",
    date: "15 октября 2024",
    excerpt: "Разбираем, какие сорта мрамора лучше всего переносят влажность и как правильно...",
    content: "Выбор мрамора для ванной комнаты — это баланс между эстетикой и долговечностью. Ванная комната является зоной с повышенной влажностью, что делает камень уязвимым к проникновению воды и бытовой химии.\n\n### Основные критерии выбора\n1. **Пористость**: Мрамор с более плотной структурой меньше впитывает воду. Например, некоторые сорта итальянского мрамора более устойчивы, чем другие.\n2. **Цвет и прожилки**: Светлые тона визуально расширяют пространство, но могут требовать более частого ухода.\n3. **Обработка**: Для ванных комнат часто рекомендуют шлифованную или сатинированную поверхность, так как полированная может быть скользкой.\n\n### Рекомендации по уходу\n- Используйте только специализированные pH-нейтральные средства для камня.\n- Обработайте поверхность качественным гидрофобизатором раз в год.\n- Избегайте контакта с агрессивными кислотами (лимонный сок, уксус).\n\nВ этой статье мы подробно рассмотрели 5 лучших сортов мрамора для влажных зон...",
    imageUrl: "/stone/marble-bathroom.png",
    readTime: "8 мин",
    likes: ["user-1", "user-3"],
  },
  {
    id: "art-2",
    title: "Будущее цифровизации в каменной индустрии",
    category: "Индустрия",
    date: "2 ноября 2024",
    excerpt: "Как системы мониторинга складов в реальном времени меняют логистику поставок...",
    content: "Индустрия обработки камня традиционно считалась консервативной, но последние три года мы наблюдаем настоящий технологический скачок. Цифровизация затрагивает все этапы: от добычи в карьере до установки в интерьере.\n\n### Складской мониторинг в реальном времени\nГлавная проблема B2B сектора — точность остатков. Системы, позволяющие видеть актуальное наличие слэбов по всему миру в одном интерфейсе, сокращают цикл сделки с недель до часов.\n\n### AI в дизайне и раскрое\nАлгоритмы автоматического раскроя (nesting) позволяют минимизировать отходы камня, что критично для дорогих материалов типа кварцита или редких мраморов.\n\n### VR и AR в общении с клиентом\nВозможность показать клиенту будущую столешницу в его интерьере с использованием AR-очков снимает множество возражений и сокращает количество ошибок при заказе.\n\nБудущее за полной прозрачностью цепочки поставок и автоматизацией рутинных процессов...",
    imageUrl: "/stone/digitalization-stone-industry-rfid.png",
    readTime: "12 мин",
    likes: ["user-2", "user-4", "user-5"],
  },
  {
    id: "art-3",
    title: "Сравнение гранита и кварцита: что выбрать?",
    category: "Технологии",
    date: "10 ноября 2024",
    excerpt: "Подробный разбор физических свойств, прочности и эстетики двух самых популярных...",
    content: "Часто клиенты путают гранит и кварцит, так как внешне они могут быть очень похожи. Однако с технической точки зрения это совершенно разные минералы с разными свойствами.\n\n### Гранит: Классика надежности\nГранит — это магматическая горная порода. Его главные преимущества:\n- Исключительная твердость.\n- Высокая термостойкость.\n- Огромный выбор цветов и текстур.\n\n### Кварцит: Премиальная альтернатива\nКварцит — это метаморфическая порода, образовавшаяся из песчаника под воздействием высокой температуры и давления.\n\n- Внешне напоминает мрамор (с красивыми жилами), но по прочности близок к граниту.\n- Более дорогой и редкий материал.\n- Обладает уникальной глубиной цвета.\n\n### Итоговая таблица сравнения\n| Свойство | Гранит | Кварцит |\n|---|---|---|\n| Твердость | Очень высокая | Очень высокая |\n| Пористость | Низкая | Очень низкая |\n| Цена | Средняя/Высокая | Высокая |\n| Эстетика | Зернистая | Жильная |\n\nВыбор зависит от ваших целей: если нужна максимальная практичность за разумные деньги — выбирайте гранит. Если хочется эстетики мрамора, с прочностью камня — ваш выбор кварцит.",
    imageUrl: "/stone/quartzite-vs-granite.png",
    readTime: "10 мин",
    likes: ["user-1", "user-2"],
  },
]

export const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "community",
    title: "Новый ответ в теме",
    message: "Пользователь MasterStone_Ivan ответил в теме «Лучшие методы полировки кварцита»",
    time: "5 мин назад",
    isRead: false,
  },
  {
    id: "n2",
    type: "catalog",
    title: "Обновление каталога",
    message: "В нашем эксклюзивном фонде появились новые слэбы Calacatta Gold",
    time: "2 ч назад",
    isRead: false,
  },
  {
    id: "n3",
    type: "system",
    title: "Безопасность",
    message: "Ваш профиль был успешно верифицирован администратором",
    time: "1 д назад",
    isRead: true,
  },
  {
    id: "n4",
    type: "community",
    title: "Упоминание",
    message: "StoneExpert_Elena упомянула вас в обсуждении качества слэбов",
    time: "3 д назад",
    isRead: false,
  },
  {
    id: "n5",
    type: "article",
    title: "Рекомендуемая статья",
    message: "Опубликован новый гид по выбору мрамора для ванных комнат",
    time: "5 д назад",
    isRead: false,
  },
  {
    id: "n6",
    type: "article",
    title: "Рекомендуемая статья",
    message: "Опубликован новый гид по выбору мрамора для ванных комнат",
    time: "5 д назад",
    isRead: false,
  },
]

export const pillars = [
  {
    tag: "Сообщество",
    verb: "Учиться",
    title: "Профессиональное сообщество, где делятся настоящим мастерством.",
    description:
      "Обсуждения, руководства и ценные знания от мастеров, монтажников и экспертов по материалам со всей отрасли.",
  },
  {
    tag: "Каталог",
    verb: "Знать",
    title: "Эксклюзивный фонд редких материалов.",
    description:
      "Лично отобранные слэбы высшего качества из лучших карьеров мира — доступ к коллекциям, которые сложно найти на рынке.",
  },
  {
    tag: "Экспертиза",
    verb: "Доверять",
    title: "25 лет опыта в индустрии камня.",
    description:
      "Профессиональный консалтинг по подбору материала, расчеты и технический надзор на основе более чем 25 лет практики.",
  },
]

export const stats = [
  { value: "25+", label: "Лет опыта в отрасли" },
  { value: "1 200+", label: "Эксклюзивных слэбов" },
  { value: "15", label: "Страно-кварцитов" },
  { value: "6 800", label: "Профессионалов сообщества" },
]