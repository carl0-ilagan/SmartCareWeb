"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { WelcomeModal } from "@/components/welcome-modal"

export function PostLoginWelcome() {
  const { user, userRole } = useAuth()
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const flag = typeof window !== "undefined" ? localStorage.getItem("welcomeAfterLogin") : null
      if (user && userRole && flag === "1") {
        setShow(true)
      }
    } catch {}
  }, [user, userRole])

  const handleClose = () => {
    try {
      localStorage.removeItem("welcomeAfterLogin")
    } catch {}
    setShow(false)
  }

  if (!show) return null

  return (
    <WelcomeModal isOpen={show} onClose={handleClose} userType={userRole} />
  )
}


