"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Calendar, FileText, Home, MessageSquare, FileArchive } from "lucide-react"

export function MobileNav() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [prevScrollPos, setPrevScrollPos] = useState(0)

  const navLinks = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/dashboard/appointments", label: "Appointments", icon: Calendar },
    { href: "/dashboard/prescriptions", label: "Prescriptions", icon: FileText },
    { href: "/dashboard/records", label: "Records", icon: FileArchive },
    { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY

      // Determine if scrolling up or down
      const isScrollingDown = currentScrollPos > prevScrollPos

      // Only update state if there's a significant change to avoid jitter
      if (currentScrollPos > 10) {
        setVisible(!isScrollingDown)
      } else {
        setVisible(true) // Always show at top of page
      }

      setPrevScrollPos(currentScrollPos)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [prevScrollPos])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 border-t border-pale-stone bg-white transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <nav className="flex h-16 items-center justify-around">
        {navLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 flex-col items-center justify-center py-2 transition-colors ${
                isActive ? "text-soft-amber" : "text-drift-gray hover:text-soft-amber"
              }`}
            >
              <link.icon className="h-6 w-6" />
              <span className="mt-1 text-xs">{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
