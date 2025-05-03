import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { migrateToClinicKeys } from '@/lib/redis'

// Initialize fonts
const inter = Inter({ subsets: ['latin'] })

// Migrate any legacy Redis data
migrateToClinicKeys().catch(error => {
  console.error('Error during Redis data migration:', error)
})

export const metadata: Metadata = {
  title: 'MediPortal - Healthcare Management',
  description: 'A comprehensive portal for healthcare practices',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
