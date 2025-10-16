import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Web3Provider } from '@/components/Web3Provider'
import Navigation from '@/components/nav'
import AnimatedBackground from '@/components/background/animated-background'
import Footer from '@/components/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Momentum - AI-Powered Portfolio Management',
  description: 'AI-driven automatic rebalancing on Base blockchain',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if Clerk environment variables are configured
  const isClerkConfigured = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY;

  if (!isClerkConfigured) {
    console.warn('Clerk environment variables are not configured. Authentication features will be disabled.');
  }

  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en">
        <body className={inter.className}>
          <Web3Provider>
            {/* <Navigation /> */}
            <AnimatedBackground />
            {children}
            <Footer />
          </Web3Provider>
        </body>
      </html>
    </ClerkProvider>
  )
}
