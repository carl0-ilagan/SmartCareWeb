"use client"

import { useRouter } from "next/navigation"
import { XCircle } from "lucide-react"

export default function LoginDeniedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pale-stone via-white to-pale-stone">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-graphite mb-2">Login Denied</h1>
        <p className="text-drift-gray mb-6">
          The login attempt from the new device has been denied. For security reasons, access from that device is not allowed.
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

