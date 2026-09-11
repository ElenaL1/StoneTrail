import {
  Material,
  ForumPost,
  Article,
  Product,
  featuredMaterials,
  mockForumPosts,
  mockArticles,
  catalogProducts,
} from "./mock-data"
import { getProductTypeLabel } from "./product-catalog"

export type SearchCategory =
  | "All"
  | "News"
  | "StoneCatalog"
  | "Blocks"
  | "ProductsCatalog"
  | "Forum"
  | "Articles"

export type SearchResult =
  | { type: "Material"; data: Material }
  | { type: "FinishedProduct"; data: Product }
  | { type: "ForumPost"; data: ForumPost }
  | { type: "Article"; data: Article }

export const SEARCH_CATEGORIES = [
  { id: "News", label: "Новости" },
  { id: "StoneCatalog", label: "Каталог камня" },
  { id: "Blocks", label: "Блоки" },
  { id: "ProductsCatalog", label: "Изделия из камня" },
  { id: "Forum", label: "Форум" },
  { id: "Articles", label: "Статьи" },
] as const

export function filterResults(query: string, category: SearchCategory): SearchResult[] {
  const lowerQuery = query.toLowerCase().trim()

  const materials: SearchResult[] = featuredMaterials
    .filter(
      (m) =>
        m.name.toLowerCase().includes(lowerQuery) ||
        m.type.toLowerCase().includes(lowerQuery) ||
        m.supplier.toLowerCase().includes(lowerQuery) ||
        m.quarry.toLowerCase().includes(lowerQuery) ||
        m.country.toLowerCase().includes(lowerQuery),
    )
    .map((m) => ({ type: "Material", data: m }))

  const products: SearchResult[] = catalogProducts
    .filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        getProductTypeLabel(p).toLowerCase().includes(lowerQuery) ||
        p.stoneName.toLowerCase().includes(lowerQuery) ||
        p.stoneType.toLowerCase().includes(lowerQuery) ||
        p.origin?.toLowerCase().includes(lowerQuery) ||
        p.quarry?.toLowerCase().includes(lowerQuery) ||
        p.purpose?.toLowerCase().includes(lowerQuery),
    )
    .map((p) => ({ type: "FinishedProduct", data: p }))

  const posts: SearchResult[] = mockForumPosts
    .filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.excerpt.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery),
    )
    .map((p) => ({ type: "ForumPost", data: p }))

  const articles: SearchResult[] = mockArticles
    .filter(
      (a) =>
        a.title.toLowerCase().includes(lowerQuery) ||
        a.excerpt.toLowerCase().includes(lowerQuery) ||
        a.category.toLowerCase().includes(lowerQuery),
    )
    .map((a) => ({ type: "Article", data: a }))

  switch (category) {
    case "StoneCatalog":
      return materials
    case "Blocks":
      return materials
    case "ProductsCatalog":
      return products
    case "Forum":
      return posts
    case "Articles":
      return articles
    case "News":
      // Mock news is not yet in the data layer; return empty until it exists.
      return []
    case "All":
    default:
      return [...materials, ...products, ...posts, ...articles]
  }
}

export function getPopularQueries(): string[] {
  return ["Calacatta Gold", "Гранит", "Полировка", "Дизайн 2024", "Эксклюзивные слэбы"]
}
