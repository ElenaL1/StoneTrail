import { NewsProvider } from "@/lib/news-context"

export default function NewsFeedLayout({ children }: { children: React.ReactNode }) {
  return <NewsProvider>{children}</NewsProvider>
}
