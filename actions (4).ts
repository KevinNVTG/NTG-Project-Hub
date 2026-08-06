import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NTG Project Hub',
  description: 'Nevada Tile & Granite project management platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
