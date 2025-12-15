"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Calendar, Clock, MapPin, User, X, FileText, Stethoscope, CheckCircle2, Phone } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { markAppointmentNotificationsAsRead, hasSummary } from "@/lib/appointment-utils"
import ProfileImage from "@/components/profile-image"

// Add a status badge component to show the appointment status more clearly
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { 
      bg: "bg-gradient-to-r from-amber-100 to-amber-50", 
      text: "text-amber-800", 
      border: "border-amber-300",
      label: "Pending",
      icon: Clock
    },
    approved: { 
      bg: "bg-gradient-to-r from-green-100 to-emerald-50", 
      text: "text-green-800",
      border: "border-green-300",
      label: "Confirmed",
      icon: CheckCircle2
    },
    completed: { 
      bg: "bg-gradient-to-r from-blue-100 to-sky-50", 
      text: "text-blue-800",
      border: "border-blue-300",
      label: "Completed",
      icon: FileText
    },
    cancelled: { 
      bg: "bg-gradient-to-r from-red-100 to-rose-50", 
      text: "text-red-800",
      border: "border-red-300",
      label: "Cancelled",
      icon: X
    },
  }

  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${config.bg} ${config.border} border px-3 py-1 text-xs font-bold ${config.text} shadow-sm`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

export function AppointmentDetailsModal({
  isOpen,
  onClose,
  appointment,
  onCancel,
  onViewSummary,
  fromHistory = false,
}) {
  const { user, userRole } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
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

      // Mark notifications as read when opening details
      if (appointment && user) {
        markAppointmentNotificationsAsRead(appointment.id, userRole)
      }
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
        // Reset closing states after modal fully closes
        setIsClosing(false)
        isClosingRef.current = false
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, appointment, user, userRole])

  // Handle closing with animation (bulletproof like appointment modal)
  const handleCloseWithAnimation = useCallback((e) => {
    if (isClosingRef.current || isClosing) {
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
  }, [onClose, isClosing, isOpen])

  if ((!isOpen && !isVisible) || (!isOpen && isClosingRef.current)) return null
  if (!appointment) return null

  const isUpcoming = appointment.status === "approved" || appointment.status === "pending"
  const isCompleted = appointment.status === "completed"
  const isPending = appointment.status === "pending"
  const isApproved = appointment.status === "approved"

  // Check if the appointment has a summary
  const appointmentHasSummary = hasSummary(appointment)

  // Determine if the current user is the doctor or patient
  const isDoctor = userRole === "doctor"
  const isPatient = userRole === "patient"

  // Get the name of the other party
  const otherPartyName = isDoctor ? appointment.patientName || "Patient" : appointment.doctorName || "Doctor"

  // Get the specialty if viewing as patient
  const specialty = isPatient ? appointment.specialty || "" : ""

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
          if (!isOpen || isClosing || isClosingRef.current) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
          e.stopPropagation()
          e.stopImmediatePropagation?.()
        }}
        onMouseDown={(e) => {
          if (!isOpen || isClosing || isClosingRef.current) {
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
              {getIconComponent()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xs sm:text-sm md:text-base lg:text-base font-bold text-graphite">
                Appointment Details
              </h2>
              {appointment && (
                <div className="mt-1">
                  <StatusBadge status={appointment.status} />
                </div>
              )}
            </div>
          </div>

          {/* Decorative circles - matching appointment modal */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full -ml-10 -mb-10"></div>
        </div>

        {/* Content - matching appointment modal style */}
        <div className="p-2.5 sm:p-3 md:p-3.5 lg:p-4 overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="flex-1 overflow-hidden min-h-0 space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-2.5">
            {/* Other Party Info with Profile Image */}
            <div className="rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-2.5 mb-2">
                <ProfileImage
                  userId={isDoctor ? appointment.patientId : appointment.doctorId}
                  alt={otherPartyName}
                  className="flex-shrink-0"
                  size="md"
                  role={isDoctor ? "patient" : "doctor"}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-graphite truncate">{otherPartyName}</h3>
                  <p className="text-xs sm:text-xs md:text-sm text-drift-gray mt-0.5">
                    {specialty ? `${specialty} • ` : ""}
                    {appointment.type || "Consultation"}
                  </p>
                </div>
            </div>
              {appointment.mode && (
                <div className="ml-14 sm:ml-16 md:ml-18 mt-1.5">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold ${
                    appointment.mode === "online" 
                      ? "bg-blue-100 text-blue-700 border border-blue-200" 
                      : "bg-purple-100 text-purple-700 border border-purple-200"
                  }`}>
                    {appointment.mode === "online" ? "🌐 Online" : "🏥 In-Person"}
                </span>
                </div>
              )}
            </div>

            {/* Date and Time - Enhanced matching modal style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              <div className="flex items-start gap-2 sm:gap-2.5 rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
                <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 items-center justify-center rounded-lg ${theme.iconBg} flex-shrink-0`}>
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 text-soft-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite">Date</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray mt-0.5">
                    {new Date(appointment.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
            </p>
          </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-2.5 rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
                <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 items-center justify-center rounded-lg ${theme.iconBg} flex-shrink-0`}>
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 text-soft-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite">Time</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray mt-0.5">{appointment.time}</p>
            </div>
              </div>
            </div>

            {/* Location/Mode */}
            <div className="flex items-start gap-2 sm:gap-2.5 rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
              <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 items-center justify-center rounded-lg ${theme.iconBg} flex-shrink-0`}>
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 text-soft-amber" />
          </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite">Location</p>
                <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray mt-0.5">
                  {appointment.mode === "online"
                    ? "Virtual Consultation (Video Call)"
                    : appointment.location || "Clinic Visit"}
                </p>
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
                <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite mb-1">📝 Notes</p>
                <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray leading-relaxed">{appointment.notes}</p>
              </div>
            )}

            {/* Doctor's note (if any and appointment is approved) */}
            {appointment.note && (isApproved || isCompleted) && (
              <div className="rounded-lg border border-green-200/50 bg-green-50/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
                <p className="text-xs sm:text-xs md:text-sm font-semibold text-green-800 mb-1">💊 Doctor's Note</p>
                <p className="text-[10px] sm:text-xs md:text-sm text-green-700 leading-relaxed">{appointment.note}</p>
              </div>
            )}

            {/* Cancellation reason (if cancelled) */}
            {appointment.status === "cancelled" && appointment.note && (
              <div className="rounded-lg border border-red-200/50 bg-red-50/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
                <p className="text-xs sm:text-xs md:text-sm font-semibold text-red-800 mb-1">❌ Cancellation Reason</p>
                <p className="text-[10px] sm:text-xs md:text-sm text-red-700 leading-relaxed">{appointment.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with buttons - matching appointment modal style */}
        <div className="p-2 sm:p-2.5 md:p-3 lg:p-3 border-t border-amber-200/30 bg-white/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation?.()
                if (!isClosingRef.current && !isClosing) {
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
              disabled={isClosing || isClosingRef.current}
              className="flex-1 sm:flex-none rounded-lg border-2 border-soft-amber/60 bg-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-soft-amber shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>

            {/* Only show cancel button if not viewing from history and appointment is upcoming */}
            {isUpcoming && onCancel && !fromHistory && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.stopImmediatePropagation?.()
                  if (!isClosingRef.current && !isClosing) {
                    // Close the details modal first
                    handleCloseWithAnimation(e)
                    // Then open the cancel modal after a short delay to ensure modal closes properly
                    setTimeout(() => {
                  onCancel(appointment)
                    }, 300)
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (e.stopImmediatePropagation) {
                    e.stopImmediatePropagation()
                  }
                }}
                disabled={isClosing || isClosingRef.current}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg border-2 border-red-500 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4" />
                Cancel Appointment
              </button>
            )}

            {isCompleted && onViewSummary && (
              <>
                {appointmentHasSummary ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      e.stopImmediatePropagation?.()
                      if (!isClosingRef.current && !isClosing) {
                      onViewSummary(appointment)
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
                    disabled={isClosing || isClosingRef.current}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-white ${theme.buttonBg} shadow-lg hover:shadow-xl ${theme.buttonHover} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed`}
                  >
                    <FileText className="h-4 w-4" />
                    View Summary
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-gray-400 cursor-not-allowed border border-gray-200"
                    title="Summary not available yet"
                  >
                    <FileText className="h-4 w-4" />
                    No Summary Available
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}