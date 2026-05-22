import type { Metadata } from 'next'
import { Geist, Geist_Mono, Fraunces, Crimson_Pro } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthSessionShell } from '@/components/auth-session-shell'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// Forest display font — rustic, hand-carved, organic
export const cinzel = Fraunces({
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  variable: "--font-cinzel",
  display: "swap",
})

// Forest body font — warm, literary, reads like a nature journal
export const lora = Crimson_Pro({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-lora",
  display: "swap",
})

export const metadata: Metadata = {
  title: 'Lumen - Academic Planner for Berea College',
  description: 'Plan your 4-year academic journey at Berea College with Lumen. Organize your courses, track prerequisites, and map out your complete degree path.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/lumen-bear-favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/lumen-bear-favicon.svg',
  },
  openGraph: {
    title: 'Lumen - Academic Planner for Berea College',
    description: 'Plan your 4-year academic journey at Berea College with Lumen. Organize your courses, track prerequisites, and map out your complete degree path.',
    type: 'website',
    url: 'https://lumen.berea.edu',
    siteName: 'Lumen',
    images: [
      {
        url: '/lumen-bear-favicon.svg',
        width: 200,
        height: 308,
        alt: 'Lumen Bear - Academic Planner Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Lumen - Academic Planner for Berea College',
    description: 'Plan your academic journey at Berea College with Lumen',
    images: ['/lumen-bear-favicon.svg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${cinzel.variable} ${lora.variable}`}>
      <body className="font-sans antialiased">
        <AuthSessionShell>{children}</AuthSessionShell>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
