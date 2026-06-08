import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'vietnamese'] })

export const metadata: Metadata = {
  title: 'SPARK Badminton',
  description: 'Đăng ký lịch chơi cầu lông SPARK',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <header className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-2">
            <span className="text-2xl">🏸</span>
            <a href="/" className="font-bold text-lg text-gray-900 hover:text-green-600 transition-colors">
              SPARK Badminton
            </a>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
