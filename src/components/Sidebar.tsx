// @ts-nocheck
'use client'
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { MapPin, Trash, Coins, Medal, Settings, Home, Truck, ShieldCheck } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

const PUBLIC_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/request-collection", icon: MapPin, label: "Report Waste" },
  { href: "/collect", icon: Trash, label: "Collect Waste" },
  { href: "/rewards", icon: Coins, label: "Rewards" },
  { href: "/leaderboard", icon: Medal, label: "Leaderboard" },
]

const DRIVER_ITEMS = [
  { href: "/driver", icon: Truck, label: "Driver Dashboard" },
]

const ADMIN_ITEMS = [
  { href: "/admin", icon: ShieldCheck, label: "Admin Panel" },
]

interface SidebarProps {
  open: boolean
}

export default function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const role = (user as any)?.role

  const extraItems = [
    ...(role === "driver" || role === "admin" ? DRIVER_ITEMS : []),
    ...(role === "admin" || role === "dispatcher" ? ADMIN_ITEMS : []),
  ]

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const active = pathname === href
    return (
      <Link href={href} passHref>
        <Button
          variant={active ? "secondary" : "ghost"}
          className={`w-full justify-start py-3 ${
            active
              ? "bg-green-100 text-green-800"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Icon className="mr-3 h-5 w-5" />
          <span className="text-base">{label}</span>
        </Button>
      </Link>
    )
  }

  return (
    <aside
      className={`bg-white border-r pt-20 border-gray-200 text-gray-800 w-64 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out ${
        open ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}
    >
      <nav className="h-full flex flex-col justify-between">
        <div className="px-4 py-6 space-y-1">
          {PUBLIC_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}

          {extraItems.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  {role === "driver" ? "Driver" : "Admin"}
                </p>
              </div>
              {extraItems.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <NavItem href="/settings" icon={Settings} label="Settings" />
        </div>
      </nav>
    </aside>
  )
}