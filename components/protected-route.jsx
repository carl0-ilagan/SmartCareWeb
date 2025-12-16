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
  const [checkingMaintenance, setCheckingMaintenance] = useState(true)
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false)

  // Normalize roles: support legacy requiredRole (string) or allowedRoles (array)
  const normalizedAllowedRoles = Array.isArray(allowedRoles) && allowedRoles.length > 0
    ? allowedRoles
    : (requiredRole ? [requiredRole] : [])

  // Check maintenance mode for patient and doctor roles
  useEffect(() => {
    const checkMaintenance = async () => {
      // Only check for patient and doctor roles, admin should always have access
      if (userRole !== "patient" && userRole !== "doctor") {
        setCheckingMaintenance(false)
        return
      }

      // Skip check if already on maintenance page
      if (pathname === "/maintenance") {
        setCheckingMaintenance(false)
        return
      }

      try {
        const response = await fetch("/api/maintenance")
        const data = await response.json()
        
        if (data.success) {
          const enabled = data.enabled || false
          setIsMaintenanceMode(enabled)
          
          // If maintenance is enabled and user is patient/doctor, redirect to maintenance page
          if (enabled) {
            router.push("/maintenance")
            return
          }
        }
      } catch (err) {
        console.error("Error checking maintenance status:", err)
        // On error, assume maintenance is disabled so users aren't blocked
        setIsMaintenanceMode(false)
      } finally {
        setCheckingMaintenance(false)
      }
    }

    if (!loading && user && userRole) {
      checkMaintenance()
    } else {
      setCheckingMaintenance(false)
    }
  }, [loading, user, userRole, pathname, router])

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
    if (!loading && !checkingOTP && !checkingMaintenance) {
      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      } else if (userStatus === 0) {
        // If user is pending approval, redirect to waiting page
        router.push("/waiting-approval")
      } else if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) {
        // If user doesn't have the required role, show access denied
        router.push("/access-denied")
      } else if (isMaintenanceMode && (userRole === "patient" || userRole === "doctor")) {
        // If maintenance mode is enabled and user is patient/doctor, redirect to maintenance page
        router.push("/maintenance")
      }
    }
  }, [user, userRole, loading, checkingOTP, checkingMaintenance, isMaintenanceMode, router, pathname, normalizedAllowedRoles, userStatus])

  if (loading || checkingOTP || checkingMaintenance) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-soft-amber"></div>
      </div>
    )
  }

  if (!user || (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(userRole)) || userStatus === 0) {
    return null
  }

  // Don't render children if maintenance mode is enabled for patient/doctor
  if (isMaintenanceMode && (userRole === "patient" || userRole === "doctor")) {
    return null
  }

  return <>{children}</>
}
