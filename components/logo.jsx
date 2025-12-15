"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getLogoContent } from "@/lib/welcome-utils"

export function Logo({ href = "/", className = "", showBadge = false, badgeText = "", hideText = false }) {
  const [logoContent, setLogoContent] = useState({
    text: "SmartCare",
    color: "#F2B95E", // soft-amber color
    fontSize: "text-xl",
    fontWeight: "font-bold",
    imageUrl: "",
    imageHeight: 32,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadLogoContent = async () => {
      try {
        const content = await getLogoContent()
        if (content) {
          setLogoContent(content)
        }
      } catch (error) {
        console.error("Error loading logo content:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLogoContent()
  }, [])

  return (
    <Link href={href} className={`flex items-center ${className}`}>
      {/* Logo Image (if available) */}
      {!isLoading && logoContent.imageUrl && (
        <div className="relative mr-2" style={{ height: `${logoContent.imageHeight || 32}px` }}>
          <img
            src={logoContent.imageUrl || "/placeholder.svg"}
            alt="SmartCare Logo"
            className="h-full w-auto object-contain"
            style={{ maxHeight: `${logoContent.imageHeight || 32}px` }}
          />
        </div>
      )}

      {/* SmartCare Text (unless hideText is true) */}
      {!hideText && (
        <span className={`${logoContent.fontSize} ${logoContent.fontWeight}`} style={{ color: logoContent.color }}>
          {logoContent.text}
        </span>
      )}

      {/* Role Badge (if showBadge is true) */}
      {showBadge && (
        <span className="ml-2 rounded-md bg-soft-amber px-2 py-1 text-xs font-medium text-white">{badgeText}</span>
      )}
    </Link>
  )
}
