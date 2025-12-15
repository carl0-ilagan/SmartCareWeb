"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { CheckCircle2, ArrowRight } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import ProfileImage from "@/components/profile-image"

export function SaveConfirmationModal({
  isOpen,
  onClose,
  title = "Profile Updated",
  message = "Your profile information has been successfully updated.",
}) {
  const { user, userProfile } = useAuth()
  const [startX, setStartX] = useState(null)
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const modalRef = useRef(null)
  const isClosingRef = useRef(false)

  // Handle close with animation
  const handleCloseWithAnimation = useCallback((e) => {
    if (isClosingRef.current || isClosing) {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      return
    }
    
    isClosingRef.current = true
    
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    setIsClosing(true)
    
    try {
      onClose()
    } catch (error) {
      console.error("Error calling onClose:", error)
    }
    
    setTimeout(() => {
      if (!isOpen) {
        setIsClosing(false)
        setTimeout(() => {
          if (!isOpen) {
            isClosingRef.current = false
          }
        }, 300)
      }
    }, 600)
  }, [onClose, isClosing, isOpen])

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      if (!isClosingRef.current) {
        setIsVisible(true)
        setIsClosing(false)
        const resetTimer = setTimeout(() => {
          if (isOpen && !isClosingRef.current) {
            isClosingRef.current = false
          }
        }, 600)
        return () => clearTimeout(resetTimer)
      }
    } else {
      const hideTimer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => {
          isClosingRef.current = false
        }, 200)
      }, 350)
      return () => clearTimeout(hideTimer)
    }
  }, [isOpen])

  // Handle escape key press
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e) => {
      if (e.key === "Escape" && !isClosingRef.current) {
        e.preventDefault()
        e.stopPropagation()
        handleCloseWithAnimation(e)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, handleCloseWithAnimation])

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  // Reset offset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setOffsetX(0)
    }
  }, [isOpen])

  // Swipe handlers
  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleMouseDown = (e) => {
    setStartX(e.clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!isDragging || startX === null) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startX
    setOffsetX(diff)
  }

  const handleMouseMove = (e) => {
    if (!isDragging || startX === null) return
    const currentX = e.clientX
    const diff = currentX - startX
    setOffsetX(diff)
  }

  const handleTouchEnd = () => {
    if (Math.abs(offsetX) > 100) {
      handleCloseWithAnimation(null)
    } else {
      setOffsetX(0)
    }
    setIsDragging(false)
    setStartX(null)
  }

  const handleMouseUp = () => {
    if (Math.abs(offsetX) > 100) {
      handleCloseWithAnimation(null)
    } else {
      setOffsetX(0)
    }
    setIsDragging(false)
    setStartX(null)
  }

  if (!isOpen && !isVisible) return null
  if (!isOpen && isClosingRef.current) return null

  const photoURL = userProfile?.photoURL || user?.photoURL || null
  const displayName = userProfile?.displayName || user?.displayName || ""

  // Theme colors matching appointment modal
  const theme = {
    headerBg: "bg-gradient-to-br from-soft-amber/10 to-yellow-50",
    buttonBg: "bg-gradient-to-r from-soft-amber to-amber-500",
    buttonHover: "hover:from-amber-500 hover:to-amber-600",
    focusRing: "focus:ring-soft-amber",
    borderColor: "border-amber-200",
    accentColor: "text-soft-amber",
    iconBg: "bg-soft-amber/20 text-soft-amber",
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-4 bg-black/60 backdrop-blur-xl ${isClosing ? "animate-fade-out" : "animate-fade-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""}`}
      onClick={(e) => {
        if (!isOpen || isClosing || isClosingRef.current) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        if (e.target !== e.currentTarget) {
          e.stopPropagation()
          return
        }
        handleCloseWithAnimation(e)
      }}
      onMouseDown={(e) => {
        if (!isOpen || isClosing || isClosingRef.current) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        if (e.target !== e.currentTarget) {
          e.stopPropagation()
        }
      }}
      style={{ backdropFilter: 'blur(16px)' }}
    >
      <div
        ref={modalRef}
        className={`w-full max-w-md mx-auto rounded-2xl shadow-2xl overflow-hidden ${isClosing ? "animate-modal-out" : "animate-modal-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""} ${theme.headerBg}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (!isOpen || isClosing || isClosingRef.current) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
          e.stopPropagation()
        }}
        onMouseDown={(e) => {
          if (!isOpen || isClosing || isClosingRef.current) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
          e.stopPropagation()
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          transform: `translateX(${offsetX}px)`,
          opacity: isClosing ? 0 : Math.max(0, 1 - Math.abs(offsetX) / 200),
        }}
      >
        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes fadeOut {
            from {
              opacity: 1;
            }
            to {
              opacity: 0;
            }
          }
          @keyframes modalIn {
            from {
              opacity: 0;
              transform: scale(0.9) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          @keyframes modalOut {
            from {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
            to {
              opacity: 0;
              transform: scale(0.9) translateY(20px);
            }
          }
          @keyframes bounceIn {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              opacity: 1;
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }
          .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
          }
          .animate-fade-out {
            animation: fadeOut 0.3s ease-out;
          }
          .animate-modal-in {
            animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .animate-modal-out {
            animation: modalOut 0.3s ease-in;
          }
          .animate-bounce-in {
            animation: bounceIn 0.6s ease-out;
          }
        `}</style>

        {/* Header matching appointment modal */}
        <div className={`${theme.headerBg} p-2 sm:p-2.5 md:p-3 lg:p-3 relative overflow-hidden flex-shrink-0`}>
          <div className="relative z-10 flex items-center justify-start gap-2 sm:gap-2.5">
            <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full ${theme.iconBg} flex-shrink-0`}>
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <h2 className="text-xs sm:text-sm md:text-base lg:text-base font-bold text-graphite">
              {title}
            </h2>
          </div>

          {/* Decorative circles matching appointment modal */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full -ml-10 -mb-10"></div>
        </div>

        {/* Content section */}
        <div className="p-2.5 sm:p-3 md:p-3.5 lg:p-4 bg-white">
          <div className="space-y-3 sm:space-y-4">
            {/* Success icon */}
            <div className="flex items-center justify-center">
              {photoURL ? (
                <div className="relative">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-white shadow-lg overflow-hidden ring-2 ring-soft-amber/30">
                    <ProfileImage
                      src={photoURL}
                      alt={displayName || "User"}
                      className="h-full w-full"
                      role={userProfile?.role || "patient"}
                    />
                  </div>
                  {/* Success badge */}
                  <div className="absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 bg-green-500 rounded-full border-2 border-white p-1 sm:p-1.5 shadow-lg animate-bounce-in">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full ${theme.iconBg} border-4 border-white shadow-lg animate-bounce-in`}>
                    <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="text-center">
              <p className="text-xs sm:text-sm md:text-base text-drift-gray">{message}</p>
            </div>

            {/* Button */}
            <div className="pt-2">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (!isClosingRef.current) {
                    handleCloseWithAnimation(e)
                  }
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                }}
                disabled={isClosing || isClosingRef.current}
                className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-white ${theme.buttonBg} ${theme.buttonHover} shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 ${theme.focusRing} focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}