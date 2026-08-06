import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NTG Project Hub',
  description: 'Internal project management for Nevada Tile & Granite',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
