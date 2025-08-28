import './globals.css'
import { Inter } from 'next/font/google'
import { NextAuthProvider } from './providers'
import { Toaster } from 'sonner'
import ErrorBoundary from '@/components/error-boundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Cal.com Clone',
  description: 'A modern scheduling platform built with Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <NextAuthProvider>
            {children}
            <Toaster />
          </NextAuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
