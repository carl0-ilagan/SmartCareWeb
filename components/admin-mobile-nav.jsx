"\"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, Calendar, Shield, FileText, TrendingUp } from "lucide-react"

export function AdminMobileNav() {
  const pathname = usePathname()

  // Navigation items for mobile
  const navItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/admin/dashboard",
    },
    {
      title: "Analytics",
      icon: <TrendingUp className="h-5 w-5" />,
      href: "/admin/analytics",
    },
    {
      title: "Patients",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/patients",
    },
    {
      title: "Doctors",
      icon: <UserCog className="h-5 w-5" />,
      href: "/admin/doctors",
    },
    {
      title: "Pending Accounts",
      icon: <UserCog className="h-5 w-5" />,
      href: "/admin/pending-accounts",
    },
    {
      title: "Appointments",
      icon: <Calendar className="h-5 w-5" />,
      href: "/admin/appointments",
    },
    {
      title: "Reports",
      icon: <FileText className="h-5 w-5" />,
      href: "/admin/reports",
    },
    {
      title: "Feedback",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/admin/feedback",
    },
    {
      title: "Logs",
      icon: <Activity className="h-5 w-5" />,
      href: "/admin/logs",
    },
    {
      title: "Roles",
      icon: <Shield className="h-5 w-5" />,
      href: "/admin/roles",
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/admin/settings",
    },
  ]

  // Check if the current path matches the nav item
  const isActive = (href) => {
    return pathname === href
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-pale-stone z-30">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className={`flex flex-col items-center justify-center p-2 w-16 ${
              isActive(item.href) ? "text-soft-amber" : "text-drift-gray hover:text-soft-amber"
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

import { Activity, MessageSquare, UserCog, Settings } from "lucide-react"
