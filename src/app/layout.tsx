"use client"
import { useState } from "react"
import { Inter } from 'next/font/google'
// @ts-ignore
import "./globals.css"
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import Footer from "@/components/Footer"
// @ts-ignore
import 'leaflet/dist/leaflet.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from "@/context/AuthContext"

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header
              onMenuClick={() => setSidebarOpen(prev => !prev)}
              totalEarnings={0}
            />
            <Sidebar
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}