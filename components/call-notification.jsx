"use client"

import { useState, useEffect, useRef } from "react"
import { Phone, Video, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { doc as firestoreDoc, getDoc, onSnapshot, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { addCallStatusMessage } from "@/lib/message-utils"

export default function CallNotification() {
  const router = useRouter()
  const { user } = useAuth()
  const [incomingCall, setIncomingCall] = useState(null)
  const [callerInfo, setCallerInfo] = useState(null)
  const [isRinging, setIsRinging] = useState(false)
  const audioRef = useRef(null)

  // Listen for incoming calls
  useEffect(() => {
    if (!user) return

    const unsubscribe = onSnapshot(firestoreDoc(db, "activeCall", user.uid), async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const callData = docSnapshot.data()

        // Only process if this is an incoming call (not initiated by the current user)
        if (callData.initiator !== user.uid) {
          setIncomingCall(callData)
          setIsRinging(true)

          // Get caller information
          try {
            const callerDoc = await getDoc(firestoreDoc(db, "users", callData.initiator))
            if (callerDoc.exists()) {
              setCallerInfo({
                id: callerDoc.id,
                ...callerDoc.data(),
              })
            }
          } catch (error) {
            console.error("Error fetching caller info:", error)
          }
        }
      } else {
        // No active call, clear state
        setIncomingCall(null)
        setCallerInfo(null)
        setIsRinging(false)
      }
    })

    return () => unsubscribe()
  }, [user])

  // Play ringing sound
  useEffect(() => {
    if (isRinging && audioRef.current) {
      audioRef.current.volume = 0.7
      audioRef.current.currentTime = 0
      audioRef.current.play().catch((err) => console.error("Error playing sound:", err))
    } else if (!isRinging && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [isRinging])

  // Accept call
  const handleAcceptCall = async () => {
    if (!incomingCall || !user) return

    try {
      setIsRinging(false)

      // Update call status to accepted
      await updateDoc(firestoreDoc(db, "calls", incomingCall.callId), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      })

      // Remove active call reference to dismiss notification
      await deleteDoc(firestoreDoc(db, "activeCall", user.uid))

      // Navigate to the appropriate call page
      if (user.role === "doctor") {
        if (incomingCall.type === "video") {
          router.push(`/doctor/calls/video/${incomingCall.initiator}`)
        } else {
          router.push(`/doctor/calls/voice/${incomingCall.initiator}`)
        }
      } else {
        if (incomingCall.type === "video") {
          router.push(`/dashboard/calls/video/${incomingCall.initiator}`)
        } else {
          router.push(`/dashboard/calls/voice/${incomingCall.initiator}`)
        }
      }
    } catch (error) {
      console.error("Error accepting call:", error)
    }
  }

  // Reject call
  const handleRejectCall = async () => {
    if (!incomingCall || !user) return

    try {
      setIsRinging(false)

      // Update call status to rejected
      await updateDoc(firestoreDoc(db, "calls", incomingCall.callId), {
        status: "rejected",
        endedAt: serverTimestamp(),
      })

      // Add call status message to conversation if this is a call from a chat
      if (incomingCall.conversationId) {
        await addCallStatusMessage(incomingCall.conversationId, {
          type: incomingCall.type,
          status: "rejected",
          initiator: incomingCall.initiator,
          duration: 0,
          participants: incomingCall.participants,
        })
      }

      // Remove active call reference
      await deleteDoc(firestoreDoc(db, "activeCall", user.uid))

      // Clear state
      setIncomingCall(null)
      setCallerInfo(null)
    } catch (error) {
      console.error("Error rejecting call:", error)
    }
  }

  // If no incoming call, don't render anything
  if (!incomingCall || !callerInfo) return null

  return (
    <>
      {/* Ringing sound */}
      <audio ref={audioRef} src="/sounds/phone-ringing.mp3" loop />

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md animate-pulse-slow rounded-lg bg-white p-6 shadow-lg">
          <div className="flex flex-col items-center">
            <div className="mb-4 text-xl font-semibold text-graphite">
              Incoming {incomingCall.type === "video" ? "Video" : "Voice"} Call
            </div>

            <div className="mb-6 flex flex-col items-center">
              <div className="mb-2 h-20 w-20 overflow-hidden rounded-full bg-pale-stone">
                {callerInfo.photoURL ? (
                  <img
                    src={callerInfo.photoURL || "/placeholder.svg"}
                    alt={callerInfo.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-soft-amber text-white">
                    {callerInfo.displayName?.charAt(0) || "U"}
                  </div>
                )}
              </div>
              <div className="text-lg font-medium text-graphite">{callerInfo.displayName}</div>
              {callerInfo.specialty && <div className="text-sm text-drift-gray">{callerInfo.specialty}</div>}
            </div>

            <div className="flex w-full justify-center space-x-4">
              <button
                onClick={handleRejectCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
              >
                <X className="h-6 w-6" />
              </button>

              <button
                onClick={handleAcceptCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600"
              >
                {incomingCall.type === "video" ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
