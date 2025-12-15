"use client"

import { useState, useEffect } from "react"
import { DashboardNav } from "@/components/dashboard-nav"
import { MobileNav } from "@/components/mobile-nav"
import { ProtectedRoute } from "@/components/protected-route"
import { useMobile } from "@/hooks/use-mobile"
import { usePathname } from "next/navigation"
import CallNotification from "@/components/call-notification"
import { NotificationListener } from "@/components/notification-listener"
import { useAuth } from "@/contexts/auth-context"
import SessionTimeoutListener from "@/components/session-timeout-listener"
import { OfflineIndicator } from "@/components/offline-indicator"

export default function DashboardLayout({ children }) {
  const { user } = useAuth()
  const isMobile = useMobile()
  const pathname = usePathname()
  const [isPageTransitioning, setIsPageTransitioning] = useState(false)
  const [currentPath, setCurrentPath] = useState(pathname)
  const [content, setContent] = useState(children)

  // Check if we're on the messages page
  const isMessagesPage = pathname === "/dashboard/messages"

  // Handle page transitions
  useEffect(() => {
    if (pathname !== currentPath) {
      setIsPageTransitioning(true)

      // Short delay to allow animation to play
      const timer = setTimeout(() => {
        setContent(children)
        setCurrentPath(pathname)
        setIsPageTransitioning(false)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [pathname, children, currentPath])

  // Hide scrollbar on body/html for patient pages
  useEffect(() => {
    document.body.classList.add("scrollbar-hide")
    document.documentElement.classList.add("scrollbar-hide")
    
    return () => {
      document.body.classList.remove("scrollbar-hide")
      document.documentElement.classList.remove("scrollbar-hide")
    }
  }, [])

  // Don't show navigation on messages page for full screen experience
  if (isMessagesPage) {
    return <ProtectedRoute requiredRole="patient">{children}</ProtectedRoute>
  }

  return (
    <ProtectedRoute requiredRole="patient">
      <div className="min-h-screen bg-pale-stone scrollbar-hide">
        <OfflineIndicator />
        <DashboardNav />
        <main className="mx-auto w-full max-w-screen-2xl px-3 pb-20 pt-24 md:px-4 md:pb-12 lg:px-6 xl:px-8 scrollbar-hide overflow-y-auto">
          <div className={`${isPageTransitioning ? "opacity-0" : "page-transition-enter"}`}>{content}</div>
        </main>
        {isMobile && <MobileNav />}
        <CallNotification />
        {/* Notification Listener for Push Notifications - Available on all patient pages */}
        {user && <NotificationListener userId={user.uid} enabled={true} />}
        {user && <SessionTimeoutListener userId={user.uid} />}
        {/* Suspicious verification modal will open from settings page only */}
      </div>
    </ProtectedRoute>
  )
}
