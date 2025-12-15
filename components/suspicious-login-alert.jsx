"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"

export function SuspiciousLoginAlert() {
  const { suspiciousLogin, confirmSuspiciousLogin, rejectSuspiciousLogin } = useAuth()
  const [isConfirming, setIsConfirming] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (suspiciousLogin) {
      setShowAlert(true)
    }
  }, [suspiciousLogin])

  if (!showAlert || !suspiciousLogin) return null

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await confirmSuspiciousLogin()
      setShowAlert(false)
    } catch (error) {
      console.error("Error confirming login:", error)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      await rejectSuspiciousLogin()
      setShowAlert(false)
    } catch (error) {
      console.error("Error rejecting login:", error)
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center text-red-600">
          <AlertCircle className="mr-2 h-6 w-6" />
          <h2 className="text-xl font-bold">Suspicious Login Detected</h2>
        </div>

        <p className="mb-4">
          We detected a login from a new location or device. If this was you, please confirm. Otherwise, reject this
          login attempt for your security.
        </p>

        <div className="mb-4 rounded bg-gray-100 p-3">
          <p>
            <strong>Device:</strong> {suspiciousLogin.deviceInfo.deviceName}
          </p>
          <p>
            <strong>IP Address:</strong> {suspiciousLogin.ipAddress}
          </p>
          <p>
            <strong>Reason:</strong> {suspiciousLogin.reasons.join(", ")}
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleReject}
            disabled={isRejecting || isConfirming}
            className="flex items-center rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
          >
            <XCircle className="mr-2 h-4 w-4" />
            {isRejecting ? "Rejecting..." : "Reject"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isRejecting || isConfirming}
            className="flex items-center rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {isConfirming ? "Confirming..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  )
}
