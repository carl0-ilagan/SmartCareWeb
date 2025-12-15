"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Video, FileText, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createVideoRoom } from "@/lib/room-utils"

export function CreateRoomModal({ isOpen, onClose, patients = [] }) {
  const { user, userRole } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const isClosingRef = useRef(false)
  const modalRef = useRef(null)

  // Color scheme - Orange/Amber matching other booking modals
  const themeColors = {
    patient: {
      headerBg: "bg-gradient-to-br from-soft-amber/10 to-yellow-50",
      buttonBg: "bg-gradient-to-r from-soft-amber to-amber-500",
      buttonHover: "hover:from-amber-500 hover:to-amber-600",
      focusRing: "focus:ring-soft-amber",
      borderColor: "border-amber-200",
      accentColor: "text-soft-amber",
      iconBg: "bg-soft-amber/20 text-soft-amber",
      radioBorder: "border-soft-amber/50",
      radioBg: "bg-amber-50",
      focusBorder: "focus:border-soft-amber",
    },
    doctor: {
      headerBg: "bg-gradient-to-br from-soft-amber/10 to-yellow-50",
      buttonBg: "bg-gradient-to-r from-soft-amber to-amber-500",
      buttonHover: "hover:from-amber-500 hover:to-amber-600",
      focusRing: "focus:ring-soft-amber",
      borderColor: "border-amber-200",
      accentColor: "text-soft-amber",
      iconBg: "bg-soft-amber/20 text-soft-amber",
      radioBorder: "border-soft-amber/50",
      radioBg: "bg-amber-50",
      focusBorder: "focus:border-soft-amber",
    },
  }

  const theme = themeColors[userRole] || themeColors.doctor

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      isClosingRef.current = false
      setIsVisible(true)
      setError(null)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setIsClosing(false)
        isClosingRef.current = false
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setRoomName("")
      setIsSubmitting(false)
      setError(null)
    }
  }, [isOpen])

  // Handle closing with animation
  const handleCloseWithAnimation = useCallback((e) => {
    if (isClosingRef.current || isClosing || isSubmitting) {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
        if (e.stopImmediatePropagation) {
          e.stopImmediatePropagation()
        }
      }
      return
    }
    isClosingRef.current = true
    if (e) {
      e.preventDefault()
      e.stopPropagation()
      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation()
      }
    }
    setIsClosing(true)
    try {
      onClose()
    } catch (error) {
      console.error("Error calling onClose:", error)
      setIsClosing(false)
      isClosingRef.current = false
    }
  }, [onClose, isClosing, isSubmitting])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting || isClosing || isClosingRef.current) return

    setIsSubmitting(true)
    setError(null)

    try {
      if (!roomName.trim()) throw new Error("Room name is required")

      const { callId } = await createVideoRoom({
        roomName: roomName.trim(),
        doctorId: user?.uid,
        doctorName: user?.displayName || "Doctor",
        patientId: null,
        scheduledAt: null,
      })

      if (typeof window !== "undefined") {
        window.location.href = `/calls/room/${callId}`
      }
    } catch (err) {
      console.error("Error creating room:", err)
      setError(err.message || "Failed to create room")
      setIsSubmitting(false)
    }
  }

  if ((!isOpen && !isVisible) || (!isOpen && isClosingRef.current)) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xl ${isClosing ? "animate-fade-out" : "animate-fade-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""}`}
      onClick={(e) => {
        if (!isOpen || isClosing || isClosingRef.current || isSubmitting) {
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
        if (!isOpen || isClosing || isClosingRef.current || isSubmitting) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        if (e.target === e.currentTarget) {
          // Allow backdrop clicks
        } else {
          e.stopPropagation()
        }
      }}
      style={{ backdropFilter: 'blur(16px)' }}
    >
      <div
        ref={modalRef}
        className={`w-full max-w-md mx-auto rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${isClosing ? "animate-modal-out" : "animate-modal-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""} ${theme.headerBg}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (!isOpen || isClosing || isClosingRef.current || isSubmitting) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
          e.stopPropagation()
          e.stopImmediatePropagation?.()
        }}
        onMouseDown={(e) => {
          if (!isOpen || isClosing || isClosingRef.current || isSubmitting) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
          e.stopPropagation()
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
        `}</style>
        <style jsx global>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Header with gradient background - matching appointment modal */}
        <div className={`${theme.headerBg} p-2 sm:p-3 md:p-4 relative overflow-hidden flex-shrink-0`}>
          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            <div className={`flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full ${theme.iconBg} flex-shrink-0`}>
              <Video className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-graphite">
                Create Call Room
              </h2>
              <p className="text-xs sm:text-sm text-drift-gray mt-0.5">
                Set up a video room and invite the patient.
              </p>
            </div>
          </div>

          {/* Decorative circles - matching appointment modal */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full -ml-10 -mb-10"></div>
        </div>

        {/* Content - matching appointment modal style */}
        <div className="p-3 sm:p-4 md:p-6 overflow-hidden flex-1 min-h-0 bg-white">
          <div className="space-y-2 sm:space-y-3 md:space-y-4 max-h-full overflow-y-auto scrollbar-hide">
            {/* Info Alert */}
            <div className="rounded-lg border border-blue-200/50 bg-blue-50/80 backdrop-blur-sm p-3 sm:p-4 shadow-sm">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Video className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-blue-800">
                    Create Video Room
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-700 mt-1">
                    After creating the room, you can invite patients from the room page.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="rounded-lg border border-red-200/50 bg-red-50/80 backdrop-blur-sm p-3 sm:p-4 shadow-sm">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <X className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-graphite">
                  Room Name
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray" />
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="e.g., Follow-up with John"
                    required
                    disabled={isSubmitting}
                    className={`w-full rounded-lg border ${theme.borderColor} bg-white py-2.5 pl-10 pr-3 text-sm text-graphite ${theme.focusBorder} focus:outline-none focus:ring-2 ${theme.focusRing} disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                </div>
                <p className="text-xs text-drift-gray">
                  Choose a descriptive name for your video call room.
                </p>
              </div>

              {/* Buttons - left aligned on desktop, stacked on mobile with Cancel at bottom */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-start gap-2 sm:gap-3 pt-4 border-t border-amber-200/50">
                <button
                  type="submit"
                  disabled={isSubmitting || !roomName.trim()}
                  className={`w-full sm:w-auto rounded-lg ${theme.buttonBg} px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg ${theme.buttonHover} transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                >
                  {isSubmitting ? "Creating..." : "Create Room"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseWithAnimation}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto rounded-lg border-2 border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-all transform hover:scale-105 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
