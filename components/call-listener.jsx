"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import IncomingCallNotification from "./incoming-call-notification"

export default function CallListener() {
  const { user } = useAuth()
  const [showIncomingCall, setShowIncomingCall] = useState(false)

  useEffect(() => {
    // This component simply renders the IncomingCallNotification
    // The notification itself handles the logic for listening to incoming calls
    if (user) {
      setShowIncomingCall(true)
    } else {
      setShowIncomingCall(false)
    }
  }, [user])

  if (!showIncomingCall) return null

  return <IncomingCallNotification />
}
