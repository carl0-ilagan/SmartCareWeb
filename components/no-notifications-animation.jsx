"use client"

import { useEffect, useState } from "react"
import { Bell, Calendar, MessageSquare, Pill, FileText } from "lucide-react"

export default function NoNotificationsAnimation() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      <div className="relative h-32 w-32 mb-4">
        {/* Center bell */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform">
          <Bell className="h-12 w-12 text-drift-gray animate-pulse" />
        </div>

        {/* Orbiting icons */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full">
          {/* Calendar */}
          <div className="absolute h-8 w-8 animate-orbit-1">
            <Calendar className="h-8 w-8 text-soft-amber" />
          </div>

          {/* Message */}
          <div className="absolute h-8 w-8 animate-orbit-2">
            <MessageSquare className="h-8 w-8 text-blue-500" />
          </div>

          {/* Pill */}
          <div className="absolute h-8 w-8 animate-orbit-3">
            <Pill className="h-8 w-8 text-green-500" />
          </div>

          {/* File */}
          <div className="absolute h-8 w-8 animate-orbit-4">
            <FileText className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        {/* Floating dots */}
        <div className="absolute h-2 w-2 bg-soft-amber rounded-full top-1/4 left-1/4 animate-float-1"></div>
        <div className="absolute h-2 w-2 bg-blue-500 rounded-full top-3/4 left-1/3 animate-float-2"></div>
        <div className="absolute h-2 w-2 bg-green-500 rounded-full top-1/3 right-1/4 animate-float-3"></div>
        <div className="absolute h-2 w-2 bg-purple-500 rounded-full bottom-1/4 right-1/3 animate-float-4"></div>
      </div>

      <h3 className="text-lg font-medium text-graphite mb-1">No notifications</h3>
      <p className="text-sm text-drift-gray text-center">
        You're all caught up! We'll notify you when there's something new.
      </p>
    </div>
  )
}
