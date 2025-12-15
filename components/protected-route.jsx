"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

// Add check for user status
export function ProtectedRoute({ children, allowedRoles = [], requiredRole }) {
  const { user, userRole, loading, userStatus } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [checkingOTP, setCheckingOTP] = useState(true)

  // Normalize roles: support legacy requiredRole (string) or allowedRoles (array)
  const normalizedAllowedRoles = Array.isArray(allowedRoles) && allowedRoles.length > 0
    ? allowedRoles
    : (requiredRole ? [requiredRole] : [])

  // Check if OTP verification is pending (2FA enabled but not verified)
  useEffect(() => {
    if (typeof window === "undefined") {
      setCheckingOTP(false)
      return
    }

    // Skip check if already on verify-otp page
    if (pathname === "/verify-otp") {
      setCheckingOTP(false)
      return
    }

    const pendingAuth = sessionStorage.getItem("pendingAuth")
    const otpVerified = sessionStorage.getItem("otpVerified")
    
    // If pendingAuth exists and OTP is not verified, redirect to verify-otp
    if (pendingAuth && !otpVerified) {
      try {
        const authData = JSON.parse(pendingAuth)
        const redirectPath = pathname
        router.push(`/verify-otp?email=${encodeURIComponent(authData.email || "")}&redirect=${encodeURIComponent(redirectPath)}`)
      } catch (e) {
        console.error("Error parsing pendingAuth:", e)
        setCheckingOTP(false)
      }
    } else {
      setCheckingOTP(false)
    }
  }, [pathname, router])

  // Persist last allowed path so Access Denied can send users back
  useEffect(() => {
    if (loading || checkingOTP) return
    const hasAccess = !!user && userStatus !== 0 && (normalizedAllowedRoles.length === 0 || normalizedAllowedRoles.includes(userRole))
    if (hasAccess) {
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("lastAllowedPath", pathname)
        }
      } catch (_) {}
    }
  }, [loading, checkingOTP, user, userRole, userStatus, pathname, normalizedAllowedRoles])

  useEffect(() => {
    if (!loading && !checkingOTP) {
      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      } else if (userStatus === 0) {
        // If user is pending approval, redirect to waiting page
        router.push("/waiting-approval")
      } else if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
        // If user doesn't have the required role, show access denied
        router.push("/access-denied")
      }
    }
  }, [user, userRole, loading, checkingOTP, router, pathname, normalizedAllowedRoles, userStatus])

  if (loading || checkingOTP) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-soft-amber"></div>
      </div>
    )
  }

  if (!user || (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) || userStatus === 0) {
    return null
  }

  return <>{children}</>
}
