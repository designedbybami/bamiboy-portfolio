import localFont from 'next/font/local'
import './globals.css'

// Make sure these filenames exactly match what is in your public/fonts/ folder!
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}