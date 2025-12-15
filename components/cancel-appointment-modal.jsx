"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { AlertTriangle, X, Calendar, Clock, User, Stethoscope } from "lucide-react"
import { updateAppointmentStatus } from "@/lib/appointment-utils"
import { useAuth } from "@/contexts/auth-context"
import ProfileImage from "@/components/profile-image"

export function CancelAppointmentModal({ isOpen, onClose, appointment, onConfirm }) {
  const { userRole } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const isClosingRef = useRef(false)
  const modalRef = useRef(null)

  // Color scheme - Orange/Amber for all users (matching appointment modal)
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

  const theme = themeColors[userRole] || themeColors.patient

  // Get icon component based on role
  const getIconComponent = () => {
    if (userRole === "patient") {
      return <Calendar className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
    } else {
      return <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
    }
  }

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      // Reset closing states when modal opens
      setIsClosing(false)
      isClosingRef.current = false
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
        // Reset closing states after modal fully closes
        setIsClosing(false)
        isClosingRef.current = false
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason("")
      setIsSubmitting(false)
    }
  }, [isOpen])

  // Handle closing with animation (bulletproof like appointment modal)
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
      // Reset on error
      setIsClosing(false)
      isClosingRef.current = false
    }
  }, [onClose, isClosing, isSubmitting])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting || isClosing || isClosingRef.current) return

    setIsSubmitting(true)

    try {
      // Update appointment status in Firebase with userRole to determine who cancelled
      // This will automatically send email and in-app notifications to the other party
      // Push notifications will be sent by the notification listener when it detects the new notification
      await updateAppointmentStatus(appointment.id, "cancelled", reason, userRole)

      console.log("✅ Appointment cancelled. Email, in-app, and push notifications will be sent to the other party.")

      // Call the onConfirm callback
      if (onConfirm) {
        onConfirm(appointment, reason)
      }

      handleCloseWithAnimation(e)
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      setIsSubmitting(false)
    }
  }

  if ((!isOpen && !isVisible) || (!isOpen && isClosingRef.current)) return null
  if (!appointment) return null

  // Determine if this is a decline (doctor declining pending appointment) or cancel
  const isDecline = userRole === "doctor" && appointment.status === "pending"

  // Get the name of the other party
  const otherPartyName = userRole === "doctor" 
    ? appointment.patientName || appointment.patient || "Patient" 
    : appointment.doctorName || "Doctor"
  
  // Dynamic text based on decline vs cancel
  const modalTitle = isDecline ? "Decline Appointment" : "Cancel Appointment"
  const modalSubtitle = isDecline 
    ? "Are you sure you want to decline this appointment request?"
    : "Are you sure you want to cancel this appointment?"
  const actionButtonText = isDecline ? "Decline Appointment" : "Cancel Appointment"
  const reasonLabel = isDecline ? "Reason for declining" : "Reason for cancellation"
  const reasonPlaceholder = isDecline
    ? "Please provide a reason for declining this appointment request (e.g., scheduling conflict, unavailable time slot, etc.)"
    : "Please provide a reason for cancelling this appointment (e.g., scheduling conflict, medical emergency, etc.)"

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-4 bg-black/60 backdrop-blur-xl ${isClosing ? "animate-fade-out" : "animate-fade-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""}`}
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
        className={`w-full max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-[82vh] lg:max-h-[78vh] flex flex-col ${isClosing ? "animate-modal-out" : "animate-modal-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""} ${theme.headerBg}`}
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
        <div className={`${theme.headerBg} p-2 sm:p-2.5 md:p-3 lg:p-3 relative overflow-hidden flex-shrink-0`}>
          <div className="relative z-10 flex items-center gap-2 sm:gap-2.5">
            <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full ${theme.iconBg} flex-shrink-0`}>
              <AlertTriangle className={`h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 lg:h-4 lg:w-4 ${isDecline ? "text-amber-600" : "text-red-600"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xs sm:text-sm md:text-base lg:text-base font-bold text-graphite">
                {modalTitle}
              </h2>
              <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray mt-0.5">
                {modalSubtitle}
              </p>
            </div>
          </div>

          {/* Decorative circles - matching appointment modal */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full -ml-10 -mb-10"></div>
        </div>

        {/* Content - matching appointment modal style */}
        <div className="p-2.5 sm:p-3 md:p-3.5 lg:p-4 overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-hidden min-h-0 space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-2.5">
            {/* Warning Alert - without icon */}
            <div className={`rounded-lg border ${isDecline ? "border-amber-200/50 bg-amber-50/80" : "border-red-200/50 bg-red-50/80"} backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm`}>
              <div className="flex-1">
                <h3 className={`text-xs sm:text-xs md:text-sm font-semibold ${isDecline ? "text-amber-800" : "text-red-800"}`}>
                  This action cannot be undone
                </h3>
                <p className={`text-[10px] sm:text-xs md:text-sm ${isDecline ? "text-amber-700" : "text-red-700"} mt-1`}>
                  {isDecline 
                    ? "Declining this appointment request will notify the patient. Please provide a reason for declining."
                    : "Cancelling this appointment will notify the other party. Please provide a reason for cancellation."}
                </p>
              </div>
            </div>

            {/* Appointment Info with Profile Image */}
            <div className="rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
                <ProfileImage
                  userId={userRole === "doctor" ? appointment.patientId : appointment.doctorId}
                  alt={otherPartyName}
                  className="flex-shrink-0"
                  size="md"
                  role={userRole === "doctor" ? "patient" : "doctor"}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-graphite truncate">{otherPartyName}</h3>
                  <p className="text-xs sm:text-xs md:text-sm text-drift-gray mt-0.5">
                    {appointment.type || "Consultation"}
                  </p>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                <div className="flex items-start gap-2 sm:gap-2.5 rounded-lg border border-amber-200/50 bg-white/60 p-2 sm:p-2.5 md:p-2.5">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 text-soft-amber flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite">Date</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray">
                      {new Date(appointment.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-2.5 rounded-lg border border-amber-200/50 bg-white/60 p-2 sm:p-2.5 md:p-2.5">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 text-soft-amber flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite">Time</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray">{appointment.time}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
              <div className="flex-1 overflow-hidden min-h-0 space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-2.5">
                <div>
                  <label htmlFor="reason" className="block text-xs sm:text-sm font-semibold text-graphite mb-1">
                    {reasonLabel} <span className={isDecline ? "text-amber-500" : "text-red-500"}>*</span>
                  </label>
                  <textarea
                    id="reason"
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={reasonPlaceholder}
                    required
                    disabled={isSubmitting || isClosing || isClosingRef.current}
                    className={`w-full rounded-lg border border-earth-beige bg-white py-1.5 sm:py-2 px-3 text-xs sm:text-sm text-graphite placeholder:text-drift-gray/60 focus:outline-none focus:ring-1 transition-all duration-200 ${theme.focusBorder} ${theme.focusRing} disabled:bg-pale-stone disabled:text-drift-gray disabled:cursor-not-allowed resize-none`}
                  />
                  <p className="mt-1 text-[10px] sm:text-xs text-drift-gray">
                    This reason will be shared with the {userRole === "doctor" ? "patient" : "doctor"}.
                  </p>
                </div>
              </div>

              {/* Action Buttons - Always visible at bottom */}
              <div className="pt-1.5 sm:pt-2 md:pt-2 lg:pt-2.5 flex-shrink-0 border-t border-amber-200/30 mt-auto">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      e.stopImmediatePropagation?.()
                      if (!isClosingRef.current && !isClosing && !isSubmitting) {
                        handleCloseWithAnimation(e)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (e.stopImmediatePropagation) {
                        e.stopImmediatePropagation()
                      }
                    }}
                    disabled={isSubmitting || isClosing || isClosingRef.current}
                    className="flex-1 sm:flex-none rounded-lg border-2 border-soft-amber/60 bg-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-soft-amber shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isClosing || isClosingRef.current || !reason.trim()}
                    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg border-2 ${isDecline ? "border-amber-500 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 focus:ring-amber-500" : "border-red-500 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500"} px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isDecline ? "Declining..." : "Cancelling..."}
                      </span>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        {actionButtonText}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
        </div>
      </div>
    </div>
  )
}