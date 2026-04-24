// @ts-nocheck
'use client'
import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, Coins, Leaf, Search, Bell, ChevronDown, LogIn } from "lucide-react"
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
  onMenuClick: () => void;
  totalEarnings: number;
}

/** Returns up to 2 uppercase initials from a display name */
function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Deterministic green shade from initials so avatar colour is consistent */
function avatarColor(initials: string) {
  const shades = ["#15803d", "#16a34a", "#166534", "#14532d", "#4ade80"];
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % shades.length;
  return shades[idx];
}

export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
  const { user, logout, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Fetch notifications when user logs in
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setBalance(0);
      return;
    }
    // Replace with your MongoDB notification fetch
    // getUnreadNotifications(user.id).then(setNotifications)
    // getUserBalance(user.id).then(setBalance)
  }, [user]);

  // Listen for balance update events from elsewhere in the app
  useEffect(() => {
    const handler = (e: CustomEvent) => setBalance(e.detail);
    window.addEventListener("balanceUpdated", handler as EventListener);
    return () => window.removeEventListener("balanceUpdated", handler as EventListener);
  }, []);

  const openLogin = () => { setAuthModalMode("login"); setAuthModalOpen(true); };
  const openSignup = () => { setAuthModalMode("signup"); setAuthModalOpen(true); };

  const initials = user ? getInitials(user.name) : "";
  const bgColor = user ? avatarColor(initials) : "#16a34a";

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-2">

          {/* Left: hamburger + logo */}
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="mr-2 md:mr-4" onClick={onMenuClick}>
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/" className="flex items-center">
              <Leaf className="h-6 w-6 md:h-8 md:w-8 text-green-500 mr-1 md:mr-2" />
              <div className="flex flex-col">
                <span className="font-bold text-base md:text-lg text-gray-800">GreenKidSA</span>
              </div>
            </Link>
          </div>

          {/* Centre: search bar (desktop only) */}
          {!isMobile && (
            <div className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          )}

          {/* Right: actions */}
          <div className="flex items-center gap-1">
            {isMobile && (
              <Button variant="ghost" size="icon">
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Notifications bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5">
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <DropdownMenuItem key={n.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{n.type}</span>
                        <span className="text-sm text-gray-500">{n.message}</span>
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/*
            {user && (
              <div className="flex items-center bg-gray-100 rounded-full px-2 md:px-3 py-1 mx-1">
                <Coins className="h-4 w-4 md:h-5 md:w-5 mr-1 text-green-500" />
                <span className="font-semibold text-sm md:text-base text-gray-800">
                  {balance.toFixed(2)}
                </span>
              </div>
            )}*/}

            {/* Auth section */}
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            ) : !user ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={openLogin}
                  variant="ghost"
                  className="text-sm text-gray-700 hidden md:flex"
                >
                  Sign In
                </Button>
                <Button
                  onClick={openSignup}
                  className="bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  <LogIn className="mr-1 h-4 w-4" />
                  {isMobile ? "Join" : "Sign Up"}
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 ml-1 focus:outline-none">
                    {/* Avatar circle with initials */}
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold select-none shadow-sm"
                      style={{ backgroundColor: bgColor }}
                      title={user.name}
                    >
                      {initials}
                    </div>
                    <ChevronDown className="h-3 w-3 text-gray-500 hidden md:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {/* User info header */}
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </>
  );
}