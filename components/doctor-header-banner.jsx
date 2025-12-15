"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Clock, ArrowRight } from "lucide-react"

export function DoctorHeaderBanner({
  title,
  subtitle,
  stats = [],
  className = "",
  actionLink,
  actionText,
  showTime = true,
  bgColor = "from-amber-500 to-deep-amber",
}) {
  const { user } = useAuth()
  const [greeting, setGreeting] = useState("Good day")
  const [currentTime, setCurrentTime] = useState("")

  // Set greeting based on time of day
  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours()
      if (hour < 12) setGreeting("Good morning")
      else if (hour < 18) setGreeting("Good afternoon")
      else setGreeting("Good evening")

      setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    }

    updateTime()
    const timer = setInterval(updateTime, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  return (
    <div
      className={`relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r ${bgColor} p-6 text-white shadow-lg ${className}`}
    >
      <div className="relative z-10">
        <div className="flex flex-col space-y-1 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">
              {title || `${greeting}, ${user?.displayName || "Doctor"}`}
            </h2>
            <p className="mt-1 text-sm text-white/90 sm:text-base">{subtitle || "Manage your patients efficiently"}</p>
          </div>
          {showTime && (
            <div className="mt-4 flex items-center space-x-2 sm:mt-0">
              <div className="flex h-10 items-center justify-center rounded-lg bg-amber-600/30 backdrop-blur-sm px-4">
                <Clock className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">{currentTime}</span>
              </div>
            </div>
          )}
        </div>

        {stats.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="rounded-lg bg-amber-600/30 p-3 backdrop-blur-sm">
                <div className="flex items-center">
                  {stat.icon}
                  <p className="ml-2 text-xs font-medium uppercase text-white/90">{stat.label}</p>
                </div>
                <p className="mt-1 text-xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {actionLink && actionText && (
          <div className="mt-4">
            <a
              href={actionLink}
              className="inline-flex items-center px-4 py-2 bg-white text-amber-600 font-medium rounded-lg hover:bg-white/90 transition-colors"
            >
              {actionText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        )}
      </div>

      {/* Decorative elements - updated to be less transparent and more subtle */}
      <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-600/20"></div>
      <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-amber-600/20"></div>
      <div className="absolute -bottom-32 right-16 h-48 w-48 rounded-full bg-amber-600/15"></div>
    </div>
  )
}
