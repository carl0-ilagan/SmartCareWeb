"use client"

import { useState, useEffect, useRef } from "react"
import { Phone, Video, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useCall } from "@/contexts/call-context"
import { useRouter } from "next/navigation"

export default function IncomingCallNotification() {
  const { user } = useAuth()
  const { incomingCall, callerInfo, answerCall, rejectCall } = useCall()
  const router = useRouter()
  const ringtoneRef = useRef(null)

  useEffect(() => {
    // Play ringtone when there's an incoming call
    if (incomingCall && ringtoneRef.current) {
      ringtoneRef.current.play().catch((error) => {
        console.error("Error playing ringtone:", error)
      })
    } else if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }

    // Auto-reject call after 30 seconds if not answered
    let timeoutId
    if (incomingCall) {
      timeoutId = setTimeout(() => {
        handleReject()
      }, 30000)
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current.currentTime = 0
      }
    }
  }, [incomingCall])

  const handleAccept = async () => {
    if (!incomingCall) return

    try {
      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current.currentTime = 0
      }

      // Accept the call
      await answerCall(incomingCall.callId)

      // Navigate to the appropriate call page based on user role
      if (user.role === 'patient') {
        router.push(`/dashboard/calls/${incomingCall.type}/${incomingCall.callId}`)
      } else {
        router.push(`/doctor/calls/${incomingCall.type}/${incomingCall.callId}`)
      }
    } catch (error) {
      console.error("Error accepting call:", error)
      alert("Could not accept call. Please try again.")
    }
  }

  const handleReject = async () => {
    if (!incomingCall) return

    try {
      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current.currentTime = 0
      }

      // Reject the call
      await rejectCall(incomingCall.callId)
    } catch (error) {
      console.error("Error rejecting call:", error)
      alert("Could not reject call. Please try again.")
    }
  }

  if (!incomingCall || !callerInfo) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl animate-bounce-slow">
        {/* Ringtone */}
        <audio ref={ringtoneRef} src="/sounds/ringtone.mp3" loop />
        
        {/* Caller Info */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full">
            {callerInfo.photoURL ? (
              <img
                src={callerInfo.photoURL}
                alt={callerInfo.displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-soft-amber text-white">
                <span className="text-2xl font-medium">
                  {callerInfo.displayName?.charAt(0) || "U"}
                </span>
              </div>
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{callerInfo.displayName}</h2>
          <p className="text-sm text-gray-500">
            Incoming {incomingCall.type === "video" ? "Video" : "Voice"} Call
          </p>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleReject}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            onClick={handleAccept}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white transition hover:bg-green-600"
          >
            {incomingCall.type === "video" ? (
              <Video className="h-6 w-6" />
            ) : (
              <Phone className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
