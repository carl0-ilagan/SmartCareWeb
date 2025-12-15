"use client"

import { useState, useEffect } from "react"
import { DoctorTopNav } from "@/components/doctor-top-nav"
import { DoctorMobileNav } from "@/components/doctor-mobile-nav"
import { ProtectedRoute } from "@/components/protected-route"
import { useMobile } from "@/hooks/use-mobile"
import { usePathname } from "next/navigation"
import CallNotification from "@/components/call-notification"
import { NotificationListener } from "@/components/notification-listener"
import { useAuth } from "@/contexts/auth-context"
import SessionTimeoutListener from "@/components/session-timeout-listener"
import { OfflineIndicator } from "@/components/offline-indicator"

export default function DoctorLayout({ children }) {
  const { user } = useAuth()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const isMobile = useMobile()
  const pathname = usePathname()
  const [isPageTransitioning, setIsPageTransitioning] = useState(false)
  const [currentPath, setCurrentPath] = useState(pathname)
  const [content, setContent] = useState(children)

  // Check if we're on the chat page
  const isMessagesPage = pathname === "/doctor/chat"

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

  // Hide scrollbar on body/html for doctor pages
  useEffect(() => {
    document.body.classList.add("scrollbar-hide")
    document.documentElement.classList.add("scrollbar-hide")
    
    return () => {
      document.body.classList.remove("scrollbar-hide")
      document.documentElement.classList.remove("scrollbar-hide")
    }
  }, [])

  // Don't show navigation on chat page for full screen experience
  if (isMessagesPage) {
    return <ProtectedRoute requiredRole="doctor">{children}</ProtectedRoute>
  }

  return (
    <ProtectedRoute requiredRole="doctor">
      <div className="min-h-screen bg-pale-stone scrollbar-hide">
        <OfflineIndicator />
        <DoctorTopNav showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />
        <main className="mx-auto w-full max-w-screen-2xl px-3 pb-20 pt-24 md:px-4 md:pb-12 lg:px-6 xl:px-8 scrollbar-hide overflow-y-auto">
          <div className={`${isPageTransitioning ? "opacity-0" : "page-transition-enter"}`}>{content}</div>
        </main>
        {isMobile && <DoctorMobileNav />}
        <CallNotification />
        {/* Notification Listener for Push Notifications - Available on all doctor pages */}
        {user && <NotificationListener userId={user.uid} enabled={true} />}
        {user && <SessionTimeoutListener userId={user.uid} />}
        {/* Suspicious verification modal will open from settings page only */}
      </div>
    </ProtectedRoute>
  )
}
