import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import StarryBackground from '@/components/StarryBackground'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EcoNexus | Carbon Credit Marketplace',
  description: 'AI-powered carbon credit marketplace with blockchain settlement',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StarryBackground />
        {/* Purple gradient orbs for depth */}
        <div className="purple-orb w-[600px] h-[600px] bg-purple-500/30 top-[-300px] right-[-300px]" />
        <div className="purple-orb w-[500px] h-[500px] bg-purple-600/20 bottom-[-250px] left-[-250px]" />
        <div className="relative z-10">
          {children}
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 15, 25, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}

