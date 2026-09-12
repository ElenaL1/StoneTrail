import { ArticleProvider } from "@/lib/article-context"

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return <ArticleProvider>{children}</ArticleProvider>
}
