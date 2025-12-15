"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

// Add check for user status
export function ProtectedRoute({ children, allowedRoles = [], requiredRole }) {
  const { user, userRole, loading, userStatus } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Normalize roles: support legacy requiredRole (string) or allowedRoles (array)
  const normalizedAllowedRoles = Array.isArray(allowedRoles) && allowedRoles.length > 0
    ? allowedRoles
    : (requiredRole ? [requiredRole] : [])

  // Persist last allowed path so Access Denied can send users back
  useEffect(() => {
    if (loading) return
    const hasAccess = !!user && userStatus !== 0 && (normalizedAllowedRoles.length === 0 || normalizedAllowedRoles.includes(userRole))
    if (hasAccess) {
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("lastAllowedPath", pathname)
        }
      } catch (_) {}
    }
  }, [loading, user, userRole, userStatus, pathname, normalizedAllowedRoles])

  useEffect(() => {
    if (!loading) {
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
  }, [user, userRole, loading, router, pathname, normalizedAllowedRoles, userStatus])

  if (loading) {
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
