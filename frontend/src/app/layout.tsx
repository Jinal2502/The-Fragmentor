import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'The Fragmentor — Memory Behavior Lab',
  description:
    'Interactive operating-systems lab: memory hierarchy, contiguous allocation, placement strategies, paging, inverted page tables, thrashing, and segmentation.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} min-h-screen bg-zinc-950 antialiased`}>{children}</body>
    </html>
  )
}
