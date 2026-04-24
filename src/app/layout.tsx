"use client"
import { useState, useEffect } from "react"
import { Inter } from 'next/font/google'
// @ts-ignore: side-effect import of globals CSS without type declarations
import "./globals.css"
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
// @ts-ignore: side-effect import of Leaflet CSS without type declarations
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
            <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} totalEarnings={0} />
            <div className="flex flex-1">
              <Sidebar open={sidebarOpen} />
              <main className="flex-1 p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300">
                {children}
              </main>
            </div>
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}