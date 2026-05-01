// @ts-nocheck
'use client'
import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Leaf, Search, Bell, ChevronDown, LogIn, Coins } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { useAuth } from "@/context/AuthContext"
import AuthModal from "@/components/AuthModal"

interface HeaderProps {
  onMenuClick: () => void
  totalEarnings: number
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function avatarColor(initials: string) {
  const shades = ["#15803d", "#16a34a", "#166534", "#14532d", "#4ade80"]
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % shades.length
  return shades[idx]
}

export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
  const { user, logout, loading } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login")
  const [notifications, setNotifications] = useState<any[]>([])
  const [balance, setBalance] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!user) { setNotifications([]); setBalance(0); return }
  }, [user])

  useEffect(() => {
    const handler = (e: CustomEvent) => setBalance(e.detail)
    window.addEventListener("balanceUpdated", handler as EventListener)
    return () => window.removeEventListener("balanceUpdated", handler as EventListener)
  }, [])

  const openLogin  = () => { setAuthModalMode("login");  setAuthModalOpen(true) }
  const openSignup = () => { setAuthModalMode("signup"); setAuthModalOpen(true) }

  const initials = user ? getInitials(user.name) : ""
  const bgColor  = user ? avatarColor(initials) : "#16a34a"

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-3">
        <nav
          className="max-w-screen-2xl mx-auto px-5 rounded-2xl transition-all duration-300"
          style={{
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            backgroundColor: scrolled ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.38)',
            border: '1px solid rgba(255,255,255,0.4)',
            boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.10)' : '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center justify-between h-[62px]">

            {/* Left: hamburger + logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={onMenuClick}
                className="p-2 rounded-lg text-gray-500 hover:text-green-700 hover:bg-green-50/60 transition-all duration-200"
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Link href="/" className="flex items-center gap-1.5 group">
                <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center shadow-sm group-hover:bg-green-700 transition-colors duration-200">
                  <Leaf className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-gray-800 tracking-tight text-base hidden sm:block">
                  GreenKidSA
                </span>
              </Link>
            </div>

            {/* Centre: search (desktop) */}
            {!isMobile && (
              <div className="flex-1 max-w-sm mx-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-white/60 border border-gray-200/80 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 placeholder:text-gray-400 transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {/* Right: actions */}
            <div className="flex items-center gap-1">
              {isMobile && (
                <button className="p-2 rounded-lg text-gray-500 hover:text-green-700 hover:bg-green-50/60 transition-all duration-200">
                  <Search className="h-5 w-5" />
                </button>
              )}

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-lg text-gray-500 hover:text-green-700 hover:bg-green-50/60 transition-all duration-200">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-xl border border-gray-100 shadow-xl">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <DropdownMenuItem key={n.id}>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{n.type}</span>
                          <span className="text-xs text-gray-500">{n.message}</span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled className="text-sm text-gray-400">
                      No new notifications
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Auth */}
              {loading ? (
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
              ) : !user ? (
                <div className="flex items-center gap-2 ml-1">
                  <button
                    onClick={openLogin}
                    className="hidden md:block text-sm text-gray-600 hover:text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50/60 transition-all duration-200 font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={openSignup}
                    className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 shadow-sm"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    {isMobile ? "Join" : "Sign Up"}
                  </button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 ml-1 p-1 rounded-full hover:bg-green-50/60 transition-all duration-200 focus:outline-none">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                        style={{ backgroundColor: bgColor }}
                        title={user.name}
                      >
                        {initials}
                      </div>
                      <ChevronDown className="h-3 w-3 text-gray-400 hidden md:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-xl border border-gray-100 shadow-xl">
                    <div className="px-3 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer text-sm">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer text-sm">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-red-500 focus:text-red-500 cursor-pointer text-sm"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </nav>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </>
  )
}