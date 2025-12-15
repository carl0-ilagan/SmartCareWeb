"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Shield, CheckCircle2, XCircle, Loader2, Mail } from "lucide-react"
import { getPendingLoginRequest, checkDeviceTrust } from "@/lib/device-auth"
import { getOrCreateDeviceId } from "@/lib/device-utils"

export default function DeviceWaitingApprovalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, userRole } = useAuth()
  const [status, setStatus] = useState("pending") // pending, approved, denied, expired
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState("")

  const userId = searchParams.get("uid") || user?.uid
  const deviceId = getOrCreateDeviceId()

  useEffect(() => {
    if (!userId || !deviceId) {
      setError("Missing user or device information")
      setChecking(false)
      return
    }

    // Check login request status and device trust
    const checkStatus = async () => {
      try {
        // First, check if device is now trusted (this happens after approval)
        const deviceTrust = await checkDeviceTrust(userId, deviceId)
        
        if (deviceTrust.isTrusted) {
          // Device is now trusted, redirect to dashboard
          setStatus("approved")
          setTimeout(() => {
            if (userRole === "patient") {
              router.push("/dashboard")
            } else if (userRole === "doctor") {
              router.push("/doctor/dashboard")
            } else if (userRole === "admin") {
              router.push("/admin/dashboard")
            } else {
              router.push("/")
            }
          }, 1000)
          setChecking(false)
          return
        }

        // If not trusted yet, check login request status
        const request = await getPendingLoginRequest(userId, deviceId)

        if (!request) {
          // No request found - might be expired or already processed
          // Check one more time if device is trusted
          const recheck = await checkDeviceTrust(userId, deviceId)
          if (recheck.isTrusted) {
            setStatus("approved")
            setTimeout(() => {
              if (userRole === "patient") {
                router.push("/dashboard")
              } else if (userRole === "doctor") {
                router.push("/doctor/dashboard")
              } else if (userRole === "admin") {
                router.push("/admin/dashboard")
              } else {
                router.push("/")
              }
            }, 1000)
          } else {
            setStatus("expired")
          }
          setChecking(false)
          return
        }

        if (request.status === "approved") {
          setStatus("approved")
          // Wait a moment then redirect
          setTimeout(() => {
            if (userRole === "patient") {
              router.push("/dashboard")
            } else if (userRole === "doctor") {
              router.push("/doctor/dashboard")
            } else if (userRole === "admin") {
              router.push("/admin/dashboard")
            } else {
              router.push("/")
            }
          }, 1000)
        } else if (request.status === "denied") {
          setStatus("denied")
        } else {
          setStatus("pending")
        }

        setChecking(false)
      } catch (error) {
        console.error("Error checking login request:", error)
        setError("Failed to check approval status")
        setChecking(false)
      }
    }

    // Check immediately
    checkStatus()

    // Poll every 2 seconds for status updates (faster detection)
    const interval = setInterval(checkStatus, 2000)

    return () => clearInterval(interval)
  }, [userId, deviceId, router, userRole])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pale-stone via-white to-pale-stone">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-soft-amber mx-auto mb-4" />
          <p className="text-drift-gray">Checking approval status...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pale-stone via-white to-pale-stone">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-graphite mb-2">Error</h1>
          <p className="text-drift-gray mb-6">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-soft-amber text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  if (status === "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pale-stone via-white to-pale-stone">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-graphite mb-2">Device Approved!</h1>
          <p className="text-drift-gray mb-6">Your device has been approved. Redirecting to your dashboard...</p>
          <Loader2 className="h-8 w-8 animate-spin text-soft-amber mx-auto" />
        </div>
      </div>
    )
  }

  if (status === "denied") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pale-stone via-white to-pale-stone">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-graphite mb-2">Login Denied</h1>
          <p className="text-drift-gray mb-6">
            This login attempt was denied. For security reasons, you cannot access your account from this device.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-soft-amber text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  if (status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pale-stone via-white to-pale-stone">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-graphite mb-2">Request Expired</h1>
          <p className="text-drift-gray mb-6">
            The approval request has expired. Please try logging in again to generate a new approval request.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-soft-amber text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Pending status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pale-stone via-white to-pale-stone p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-soft-amber/10 mb-4">
            <Shield className="h-10 w-10 text-soft-amber animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-graphite mb-2">Waiting for Approval</h1>
          <p className="text-drift-gray">
            We've sent an approval email to your registered email address.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Check Your Email</p>
              <p className="text-xs text-blue-700">
                Please check your email inbox and click the "Approve Login" button to authorize this device.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-drift-gray">
            <Loader2 className="h-5 w-5 animate-spin text-soft-amber" />
            <span>Waiting for approval...</span>
          </div>

          <div className="pt-4 border-t border-pale-stone">
            <p className="text-xs text-drift-gray text-center mb-4">
              This page will automatically update when your device is approved.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="w-full px-4 py-2 text-sm text-soft-amber border border-soft-amber rounded-lg hover:bg-soft-amber/5 transition-colors"
            >
              Cancel and Return to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

