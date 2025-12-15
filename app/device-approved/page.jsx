"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function DeviceApprovedPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userRole } = useAuth()
  const uid = searchParams.get("uid")
  const deviceId = searchParams.get("deviceId")

  useEffect(() => {
    // Redirect based on user role or to login
    const timer = setTimeout(() => {
      if (userRole === "patient") {
        router.push("/dashboard")
      } else if (userRole === "doctor") {
        router.push("/doctor/dashboard")
      } else if (userRole === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/login?deviceApproved=true")
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [router, userRole])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pale-stone via-white to-pale-stone">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-graphite mb-2">Device Approved Successfully!</h1>
        <p className="text-drift-gray mb-6">
          Your device has been approved and added to your trusted devices. You can now log in from this device.
        </p>
        <p className="text-sm text-drift-gray">
          Redirecting to login page...
        </p>
      </div>
    </div>
  )
}

