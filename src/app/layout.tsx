import localFont from 'next/font/local'
import './globals.css'
import { TransitionProvider } from '@/context/transition-context'
import PageTransition from '@/components/shared/page-transition'

const clashDisplay = localFont({
  src: '../../public/fonts/clash-display-variable.woff2',
  variable: '--font-clash',
  display: 'swap',
})

const satoshi = localFont({
  src: '../../public/fonts/satoshi-variable.woff2',
  variable: '--font-satoshi',
  display: 'swap',
})

export const metadata = {
  title: 'Bamiboy Portfolio',
  description: 'Crafting intuitive, fun, and delightful experiences.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${clashDisplay.variable} ${satoshi.variable}`}>
      <body className="font-sans antialiased">
        {/*
          TransitionProvider wraps everything so any page can call navigate().
          PageTransition lives here — outside the page tree — so it is never
          unmounted during route changes. It persists across all navigation.
        */}
        <TransitionProvider>
          {children}
          <PageTransition />
        </TransitionProvider>
      </body>
    </html>
  )
}
