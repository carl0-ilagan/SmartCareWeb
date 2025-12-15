"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertTriangle, Info, AlertOctagon } from "lucide-react"

export function SuccessNotification({
  message,
  isVisible = false,
  onClose = () => {},
  type = "success",
  position = "top-right",
  duration = 5000,
}) {
  const [isClosing, setIsClosing] = useState(false)
  const [isShowing, setIsShowing] = useState(isVisible)
  const [isAnimating, setIsAnimating] = useState(false)

  // Update internal state when isVisible prop changes
  useEffect(() => {
    if (isVisible && !isShowing) {
      setIsShowing(true)
      setIsClosing(false)
      // Trigger animation after a brief delay for smooth pop-up
      setTimeout(() => {
        setIsAnimating(true)
      }, 10)
    } else if (!isVisible && isShowing) {
      handleClose()
    }
  }, [isVisible, isShowing])

  // Set up auto-dismiss timer
  useEffect(() => {
    let timer
    if (isShowing && !isClosing && isAnimating) {
      timer = setTimeout(() => {
        handleClose()
      }, duration)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [isShowing, isClosing, isAnimating, duration])

  const handleClose = () => {
    setIsClosing(true)
    setIsAnimating(false)
    setTimeout(() => {
      setIsShowing(false)
      setIsClosing(false)
      onClose()
    }, 400)
  }

  // Don't render anything if not showing and not in closing animation
  if (!isShowing && !isClosing) return null

  // Determine notification type styling - matching offline indicator design
  const getTypeStyles = () => {
    switch (type) {
      case "error":
        return {
          bgGradient: "bg-gradient-to-br from-red-50 via-red-50/95 to-red-50/90",
          borderColor: "border-red-200/80",
          titleColor: "text-red-900",
          descColor: "text-red-700/90",
          iconBg: "bg-gradient-to-br from-red-100 to-red-200/80",
          iconColor: "text-red-600",
          shadowColor: "shadow-red-200/50",
          icon: <AlertOctagon className="h-5 w-5" />,
        }
      case "warning":
        return {
          bgGradient: "bg-gradient-to-br from-amber-50 via-amber-50/95 to-amber-50/90",
          borderColor: "border-amber-200/80",
          titleColor: "text-amber-900",
          descColor: "text-amber-700/90",
          iconBg: "bg-gradient-to-br from-amber-100 to-amber-200/80",
          iconColor: "text-amber-600",
          shadowColor: "shadow-amber-200/50",
          icon: <AlertTriangle className="h-5 w-5" />,
        }
      case "info":
        return {
          bgGradient: "bg-gradient-to-br from-blue-50 via-blue-50/95 to-blue-50/90",
          borderColor: "border-blue-200/80",
          titleColor: "text-blue-900",
          descColor: "text-blue-700/90",
          iconBg: "bg-gradient-to-br from-blue-100 to-blue-200/80",
          iconColor: "text-blue-600",
          shadowColor: "shadow-blue-200/50",
          icon: <Info className="h-5 w-5" />,
        }
      case "success":
      default:
        return {
          bgGradient: "bg-gradient-to-br from-green-50 via-green-50/95 to-green-50/90",
          borderColor: "border-green-200/80",
          titleColor: "text-green-900",
          descColor: "text-green-700/90",
          iconBg: "bg-gradient-to-br from-green-100 to-green-200/80",
          iconColor: "text-green-600",
          shadowColor: "shadow-green-200/50",
          icon: <CheckCircle className="h-5 w-5" />,
        }
    }
  }

  const styles = getTypeStyles()

  // Determine position styling - matching offline indicator position
  const getPositionStyles = () => {
    switch (position) {
      case "top-left":
        return "top-16 left-4 md:left-6"
      case "top-center":
        return "top-16 left-1/2 -translate-x-1/2"
      case "bottom-right":
        return "bottom-4 right-4 md:right-6"
      case "bottom-left":
        return "bottom-4 left-4 md:left-6"
      case "bottom-center":
        return "bottom-4 left-1/2 -translate-x-1/2"
      case "top-right":
      default:
        return "top-16 right-4 md:right-6"
    }
  }

  // Match offline indicator exact design - full width at top with max-width container
  if (position === "top-center" || position === "top-right" || position === "top-left" || !position || position === "default") {
    return (
      <div className="fixed top-16 left-0 right-0 z-50 px-4 md:px-6 pointer-events-none">
        <div className={`mx-auto max-w-7xl transition-all duration-500 ease-out ${
          isAnimating && !isClosing
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 -translate-y-4 scale-95'
        }`}>
          <div className={`rounded-xl border-2 ${styles.borderColor} ${styles.bgGradient} p-4 shadow-lg ${styles.shadowColor} backdrop-blur-sm`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${styles.iconBg} shadow-sm`}>
                <span className={styles.iconColor}>
                {styles.icon}
                </span>
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${styles.titleColor}`}>{message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // For bottom positions, use corner positioning with same smooth animations
  return (
    <div className={`fixed ${getPositionStyles()} z-50 max-w-md pointer-events-none`}>
      <div className={`transition-all duration-500 ease-out ${
        isAnimating && !isClosing
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-4 scale-95'
      }`}>
        <div className={`rounded-xl border-2 ${styles.borderColor} ${styles.bgGradient} p-4 shadow-lg ${styles.shadowColor} backdrop-blur-sm`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full ${styles.iconBg} shadow-sm`}>
              <span className={styles.iconColor}>
              {styles.icon}
              </span>
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${styles.titleColor}`}>{message}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
