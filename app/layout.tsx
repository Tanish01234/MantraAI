import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/contexts/UserContext'
import { LanguageProvider } from '@/lib/language'
import AnimatedBackground from '@/components/AnimatedBackground'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MentraAI - Personal AI Mentor for Students',
  description: 'Your personal AI mentor for exams and career guidance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen relative">
          <AnimatedBackground />
          <div className="relative z-10">
            <LanguageProvider>
              <UserProvider>{children}</UserProvider>
            </LanguageProvider>
          </div>
        </div>
      </body>
    </html>
  )
}
