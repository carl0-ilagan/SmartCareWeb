"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      setIsAnimating(false)
      // Smooth fade out
      setTimeout(() => {
      setShowOfflineMessage(false)
      }, 300)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
      // Trigger animation after a brief delay for smooth pop-up
      setTimeout(() => {
        setIsAnimating(true)
      }, 10)
      // Hide message after 5 seconds with smooth fade
      setTimeout(() => {
        setIsAnimating(false)
      setTimeout(() => {
        setShowOfflineMessage(false)
        }, 400)
      }, 5000)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline || !showOfflineMessage) {
    return null
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-4 md:px-6 pointer-events-none">
      <div className={`mx-auto max-w-7xl transition-all duration-500 ease-out ${
        isAnimating 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 -translate-y-4 scale-95'
      }`}>
        <div className="rounded-xl border-2 border-orange-200/80 bg-gradient-to-br from-orange-50 via-orange-50/95 to-orange-50/90 p-4 shadow-lg shadow-orange-200/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-orange-200/80 shadow-sm">
              <WifiOff className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900">You're offline</p>
              <p className="text-xs text-orange-700/90 mt-0.5">
                Showing cached data. Some features may be limited.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

