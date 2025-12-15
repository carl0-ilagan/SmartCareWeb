"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Check, X, Calendar, Clock, Stethoscope, User } from "lucide-react"
import { updateAppointmentStatus } from "@/lib/appointment-utils"
import { useAuth } from "@/contexts/auth-context"
import ProfileImage from "@/components/profile-image"

export function AppointmentApprovalModal({ isOpen, onClose, appointment, onApprove }) {
  const { userRole } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [doctorNote, setDoctorNote] = useState("")
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

  const theme = themeColors[userRole] || themeColors.doctor

  // Get icon component
  const getIconComponent = () => {
    return <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
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
      setDoctorNote("")
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
      // Update appointment status in Firebase - this will automatically send notifications
      // For approval, cancelledBy should be null (only used for cancellation/decline)
      await updateAppointmentStatus(appointment.id, "approved", doctorNote, null)

      console.log("✅ Appointment approved. Email, in-app, and push notifications will be sent to patient.")

      // Call the onApprove callback
      if (onApprove) {
        onApprove(appointment, doctorNote)
      }

      handleCloseWithAnimation(e)
    } catch (error) {
      console.error("Error approving appointment:", error)
      setIsSubmitting(false)
    }
  }

  if ((!isOpen && !isVisible) || (!isOpen && isClosingRef.current)) return null
  if (!appointment) return null

  const patientName = appointment.patientName || appointment.patient || "Patient"

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
              <Check className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-graphite">
                Approve Appointment
              </h2>
              <p className="text-xs sm:text-sm text-drift-gray mt-0.5">
                Confirm this appointment request
              </p>
            </div>
          </div>

          {/* Decorative circles - matching appointment modal */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full -ml-10 -mb-10"></div>
        </div>

        {/* Content - matching appointment modal style */}
        <div className="p-3 sm:p-4 md:p-6 overflow-hidden flex-1 min-h-0">
          <div className="space-y-2 sm:space-y-3 md:space-y-4 max-h-full overflow-y-auto scrollbar-hide">
            {/* Success Alert */}
            <div className="rounded-lg border border-green-200/50 bg-green-50/80 backdrop-blur-sm p-3 sm:p-4 shadow-sm">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-green-800">
                    Appointment will be confirmed
                  </h3>
                  <p className="text-xs sm:text-sm text-green-700 mt-1">
                    The patient will be notified once you approve this appointment.
                  </p>
                </div>
              </div>
            </div>

            {/* Patient Info with Profile Image */}
            <div className="rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <ProfileImage
                  userId={appointment.patientId}
                  alt={patientName}
                  className="flex-shrink-0"
                  size="lg"
                  role="patient"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-graphite truncate">{patientName}</h3>
                  <p className="text-xs sm:text-sm text-drift-gray mt-0.5">
                    {appointment.type || "Consultation"}
                  </p>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 ml-16 sm:ml-20">
                <div className="flex items-start gap-2 rounded-lg border border-amber-200/50 bg-white/60 p-2 sm:p-3">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-soft-amber flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-graphite">Date</p>
                    <p className="text-xs text-drift-gray">
                      {new Date(appointment.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-amber-200/50 bg-white/60 p-2 sm:p-3">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-soft-amber flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-graphite">Time</p>
                    <p className="text-xs text-drift-gray">{appointment.time}</p>
                  </div>
                </div>
              </div>

              {/* Notes if available */}
              {appointment.notes && (
                <div className="mt-3 ml-16 sm:ml-20 rounded-lg border border-amber-200/50 bg-white/60 p-2 sm:p-3">
                  <p className="text-xs font-semibold text-graphite mb-1">📝 Patient Notes</p>
                  <p className="text-xs text-drift-gray leading-relaxed">{appointment.notes}</p>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="doctorNote" className="block text-xs sm:text-sm font-semibold text-graphite mb-1.5 sm:mb-2">
                  Add a note for the patient (optional)
                </label>
                <textarea
                  id="doctorNote"
                  rows={3}
                  value={doctorNote}
                  onChange={(e) => setDoctorNote(e.target.value)}
                  placeholder="Any special instructions or information for the patient (e.g., preparation needed, documents to bring, etc.)"
                  disabled={isSubmitting || isClosing || isClosingRef.current}
                  className={`w-full rounded-lg border border-earth-beige bg-white py-2 sm:py-2.5 px-3 text-xs sm:text-sm text-graphite placeholder:text-drift-gray/60 focus:outline-none focus:ring-1 transition-all duration-200 ${theme.focusBorder} ${theme.focusRing} disabled:bg-pale-stone disabled:text-drift-gray disabled:cursor-not-allowed resize-none`}
                />
                <p className="mt-1.5 text-xs text-drift-gray">
                  This note will be visible to the patient and included in the approval notification.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 sm:pt-3 md:pt-4">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
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
                    className="flex-1 sm:flex-none rounded-lg border-2 border-soft-amber/60 bg-white px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-soft-amber shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isClosing || isClosingRef.current}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg border-2 border-green-500 bg-gradient-to-r from-green-600 to-emerald-700 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg hover:from-green-700 hover:to-emerald-800 hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Approving...
                      </span>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Approve Appointment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}