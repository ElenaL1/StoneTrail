import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Manrope } from 'next/font/google'
import { AuthModal } from '@/components/auth/auth-modal'
import { AuthModalProvider } from '@/lib/auth-modal-context'
import { AuthProvider } from '@/lib/auth-context'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PromotionBanner } from '@/components/promotion-banner'
import './globals.css'

// Apply the saved (or system) theme class to <html> before first paint
// to avoid a flash of the wrong theme on load.
const themeInitScript = `(function(){try{var t=localStorage.getItem('stonetrail-theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.classList.toggle('light',!d);}catch(e){}})();`

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'StoneTrail — опыт и традиции камнеобработки',
  description:
    'StoneTrail — воплощение традиций и многолетнего опыта в камнеобработке. Доступ к широкому ассортименту натурального камня (блоки, слэбы, изделия) и базе профессиональных знаний, присоединяйтесь к профессиональному сообществу.',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',

}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#23483A',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${manrope.variable} bg-background`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <AuthProvider>
          <AuthModalProvider>
            <div className="flex min-h-screen flex-col bg-background">
              <SiteHeader />
              <main className="flex-1">
                <div className="pt-16">
                  <PromotionBanner />
                  {children}
                </div>
              </main>
              <SiteFooter />
            </div>
            <AuthModal />
          </AuthModalProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}