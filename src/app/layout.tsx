import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'Nexa AI — Document Intelligence',
  description: 'A bilingual, document-grounded AI assistant workspace.',
}
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
