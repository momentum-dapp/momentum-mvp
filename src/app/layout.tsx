import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Web3Provider } from '@/components/Web3Provider'
import { WalletAuthProvider } from '@/contexts/WalletAuthContext'
import ConditionalNavigation from '@/components/ConditionalNavigation'
import AnimatedBackground from '@/components/background/animated-background'
import Footer from '@/components/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Momentum - AI-Powered Portfolio Management',
  description: 'AI-driven automatic rebalancing on Base blockchain',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          <WalletAuthProvider>
            <ConditionalNavigation />
            <AnimatedBackground />
            {children}  
            <Footer />
          </WalletAuthProvider>
        </Web3Provider>
      </body>
    </html>
  )
}
