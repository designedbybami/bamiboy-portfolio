import './globals.css'

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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
