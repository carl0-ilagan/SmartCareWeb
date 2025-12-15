"use client"

import { useState, useEffect, useRef } from "react"
import { Phone, Video, X, PhoneOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function DoctorCallNotification({ call, onAnswer, onDecline }) {
  const router = useRouter()
  const { user } = useAuth()
  const [callerDetails, setCallerDetails] = useState(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const ringtoneRef = useRef(null)

  // Play ringtone when component mounts
  useEffect(() => {
    if (ringtoneRef.current) {
      ringtoneRef.current.play().catch((error) => {
        console.error("Error playing ringtone:", error)
      })
    }

    // Fetch caller details
    const fetchCallerDetails = async () => {
      try {
        // In a real app, you would fetch this from your database
        // For now, we'll use mock data
        const mockUsers = {
          doctor1: { displayName: "Dr. Sarah Johnson", photoURL: null, role: "doctor" },
          doctor2: { displayName: "Dr. Michael Chen", photoURL: null, role: "doctor" },
          patient1: { displayName: "John Smith", photoURL: null, role: "patient" },
          patient2: { displayName: "Emily Johnson", photoURL: null, role: "patient" },
        }

        setCallerDetails(mockUsers[call.callerId] || { displayName: "Unknown Caller" })
      } catch (error) {
        console.error("Error fetching caller details:", error)
        setCallerDetails({ displayName: "Unknown Caller" })
      }
    }

    fetchCallerDetails()

    // Auto-decline call after 30 seconds if not answered
    const timer = setTimeout(() => {
      if (onDecline) onDecline()
    }, 30000)

    return () => {
      clearTimeout(timer)
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
        ringtoneRef.current.currentTime = 0
      }
    }
  }, [call, onDecline])

  const handleAnswer = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }

    if (onAnswer) onAnswer()

    // The actual navigation is now handled in the answerCall function in the CallContext
    // This ensures proper routing based on user role
  }

  const handleDecline = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }

    if (onDecline) onDecline()
  }

  if (!call || !callerDetails) return null

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-80 rounded-lg bg-white shadow-lg transition-all duration-300 ${
        isExpanded ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
      }`}
    >
      <audio ref={ringtoneRef} src="/sounds/ringtone.mp3" loop />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {call.type === "video" ? (
              <Video className="h-5 w-5 text-soft-amber mr-2" />
            ) : (
              <Phone className="h-5 w-5 text-soft-amber mr-2" />
            )}
            <h3 className="font-medium text-graphite">
              {call.type === "video" ? "Incoming Video Call" : "Incoming Voice Call"}
            </h3>
          </div>
          <button onClick={() => setIsExpanded(false)} className="text-drift-gray hover:text-graphite">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center mb-4">
          <div className="h-12 w-12 rounded-full bg-pale-stone flex items-center justify-center mr-3">
            {callerDetails.photoURL ? (
              <img
                src={callerDetails.photoURL || "/placeholder.svg"}
                alt={callerDetails.displayName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xl text-drift-gray">{callerDetails.displayName.charAt(0)}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-graphite">{callerDetails.displayName}</p>
            <p className="text-xs text-drift-gray">{callerDetails.role === "patient" ? "Patient" : "Doctor"}</p>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleDecline}
            className="flex-1 mr-2 rounded-md bg-red-500 py-2 text-white hover:bg-red-600 flex items-center justify-center"
          >
            <PhoneOff className="h-5 w-5 mr-1" />
            Decline
          </button>
          <button
            onClick={handleAnswer}
            className="flex-1 rounded-md bg-green-500 py-2 text-white hover:bg-green-600 flex items-center justify-center"
          >
            {call.type === "video" ? (
              <>
                <Video className="h-5 w-5 mr-1" />
                Answer
              </>
            ) : (
              <>
                <Phone className="h-5 w-5 mr-1" />
                Answer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
