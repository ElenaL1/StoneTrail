export type Material = {
  id: string
  name: string
  type: string
  finish: string
  thickness: string
  image: string
  supplier: string
  location: string
  quarry: string
  country: string
  status: "В наличии" | "Мало" | "Продано"
  slabs: number
  tiles: number
  updated: string
  /** Slug of a matching lot in the blocks catalog, if this stone exists as raw blocks. */
  blockSlug?: string
}

export type BlockStatus = "В наличии" | "Зарезервирован" | "Под заказ"

export type IndividualBlock = {
  label: string
  dimensions: string
  weight: string
  status: BlockStatus
  image?: string
}

export type StoneBlock = {
  id: string
  slug: string
  stoneName: string
  stoneType: string
  quarry: string
  country: string
  blocks: IndividualBlock[]
  image: string
  description: string
  expertNote: string
  blockStoneId?: string
}

export type ProductCategory = "slabs" | "blanks" | "tiles" | "paving" | "custom"

export type ProductPriceType = "on_request" | "fixed"

export type CatalogAvailability = "В наличии" | "Под заказ"

export type FinishedProductStatus = CatalogAvailability | "Выполнено" | "В работе"

export type Product = {
  id: string
  slug: string
  category: ProductCategory
  name: string
  stoneName: string
  stoneType: string
  description: string
  image: string
  productType?: string
  customGroup?: string
  origin?: string
  quarry?: string
  purpose?: string
  price?: string
  priceType?: ProductPriceType
  images?: string[]
  characteristics?: Record<string, string>
  applications?: string[]
  height?: string
  diameter?: string
  format?: string
  color?: string
  thickness?: string
  finish?: string
  size?: string
  availability?: string
  status?: FinishedProductStatus
  stoneImage?: string
  expertNote?: string
  dimensions?: string
  slabs?: IndividualSlab[]
  blanks?: IndividualBlank[]
  tiles?: IndividualTile[]
  paving?: IndividualPaving[]
}

export type IndividualSlab = {
  label: string
  size: string
  thickness: string
  finish: string
  status: BlockStatus
  image?: string
  note?: string
}

export type IndividualTile = {
  label: string
  size: string
  thickness: string
  finish: string
  status: BlockStatus
  image?: string
}

export type IndividualBlank = {
  label: string
  size: string
  thickness: string
  finish: string
  status: BlockStatus
  image?: string
  note?: string
}

export type IndividualPaving = {
  label: string
  size: string
  thickness: string
  finish: string
  status: BlockStatus
  image?: string
}

export type FinishedProduct = Product & {
  category: "custom"
  productType: string
  customGroup: string
  status: FinishedProductStatus
  finish: string
}

export type Promotion = {
  id: string
  title: string
  description: string
  content: string
  expiryDate: string
  createdAt: string
  isEnabled: boolean
  link: string
  likes: string[]
}

export type IndustryNews = {
  id: string
  title: string
  excerpt: string
  content: string
  date: string
  status: "Скоро" | "В подготовке" | "Опубликовано"
  likes: string[]
}

export type ForumPost = {
  id: string
  slug: string
  title: string
  author: string
  authorId: string
  category: string
  categoryId: string
  date: string
  createdAt?: string
  editedAt?: string
  excerpt: string
  content: string
  commentCount: number
  viewCount: number
  likesCount: number
  liked: boolean
  comments: Comment[]
}

export type Comment = {
  id: string
  postId?: string
  author: string
  authorId: string
  text: string
  date: string
  editedAt?: string
  parentId?: string
  likesCount: number
  liked: boolean
}

export type ContentCategory = {
  id: string
  code: string
  label: string
}

export type ArticleStatus =
  | "draft"
  | "pending_review"
  | "needs_revision"
  | "rejected"
  | "published"
  | "archived"

export type Article = {
  id: string
  slug: string
  title: string
  category: string
  categoryId: string
  date: string
  excerpt: string
  content: string
  imageUrl: string
  readTime: string
  likesCount: number
  liked: boolean
  author: string
  authorId: string | null
  publicationStatus: ArticleStatus
  moderationNote: string
  commentCount: number
  comments: ArticleComment[]
}

export type ArticleComment = {
  id: string
  articleId?: string
  author: string
  text: string
  date: string
  parentId?: string
}

export type NotificationType = "community" | "catalog" | "article" | "supplier" | "system"

export type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  time: string
  isRead: boolean
}
