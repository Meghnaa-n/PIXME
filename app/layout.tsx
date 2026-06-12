import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PIXME — Memory Mosaic Studio',
  description: 'Turn your photos into living mosaics made from memories',
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%239d8ff8'/><text y='24' x='4' font-size='22' font-weight='900' fill='white' font-family='sans-serif'>P</text></svg>" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>{children}</body>
    </html>
  )
}
