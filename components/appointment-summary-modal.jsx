"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Calendar, Clock, Stethoscope, ClipboardList, CalendarClock, FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import ProfileImage from "@/components/profile-image"
import { getUserDetails } from "@/lib/user-utils"

export function AppointmentSummaryModal({ isOpen, onClose, appointment }) {
  const { userRole } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const isClosingRef = useRef(false)
  const modalRef = useRef(null)
  const [doctorName, setDoctorName] = useState("")
  const [loadingDoctor, setLoadingDoctor] = useState(false)

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

  // Fetch doctor details when modal opens (for patient view)
  useEffect(() => {
    if (isOpen && appointment && userRole === "patient") {
      const fetchDoctorName = async () => {
        const doctorId = appointment.doctorId || ""
        const nameFromAppointment = appointment.doctorName || null

        if (nameFromAppointment && nameFromAppointment !== "Doctor") {
          setDoctorName(nameFromAppointment)
          return
        }

        if (doctorId) {
          try {
            setLoadingDoctor(true)
            const doctorDetails = await getUserDetails(doctorId)
            if (doctorDetails) {
              const actualName = doctorDetails.displayName || doctorDetails.name || "Doctor"
              setDoctorName(actualName)
            }
          } catch (error) {
            console.error("Error fetching doctor details:", error)
            setDoctorName(nameFromAppointment || "Doctor")
          } finally {
            setLoadingDoctor(false)
          }
        } else {
          setDoctorName(nameFromAppointment || "Doctor")
        }
      }

      fetchDoctorName()
    } else if (isOpen && appointment) {
      // For doctor view, just use patient name from appointment
      setDoctorName(appointment.patientName || "Patient")
    }
  }, [isOpen, appointment, userRole])

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
  }, [onClose, isClosing])

  if ((!isOpen && !isVisible) || (!isOpen && isClosingRef.current)) return null
  if (!appointment) return null

  // Check if summary exists
  const summary = appointment.summary || {}
  const hasSummaryData = !!(
    summary.diagnosis ||
    summary.recommendations ||
    summary.followUp
  )

  // Get the other party's info
  const isPatient = userRole === "patient"
  const otherPartyId = isPatient ? appointment.doctorId : appointment.patientId
  const otherPartyName = isPatient 
    ? (doctorName || appointment.doctorName || "Doctor")
    : (appointment.patientName || "Patient")
  const otherPartyInitial = otherPartyName ? otherPartyName.charAt(0).toUpperCase() : (isPatient ? "D" : "P")
  const specialty = isPatient ? (appointment.specialty || "") : ""

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xl ${isClosing ? "animate-fade-out" : "animate-fade-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""}`}
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
        className={`w-full max-w-md mx-auto rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${isClosing ? "animate-modal-out" : "animate-modal-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""} ${theme.headerBg}`}
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
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
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
          .animate-fade-in { animation: fadeIn 0.3s ease-out; }
          .animate-fade-out { animation: fadeOut 0.3s ease-out; }
          .animate-modal-in { animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
          .animate-modal-out { animation: modalOut 0.3s ease-in; }
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

        {/* Header with gradient background and decorative circles */}
        <div className={`${theme.headerBg} p-2 sm:p-3 md:p-4 relative overflow-hidden flex-shrink-0`}>
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full -ml-10 -mb-10"></div>
          
          {/* Header icon and text - Left aligned */}
          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            <div className={`flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full ${theme.iconBg} flex-shrink-0`}>
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-graphite">
                Appointment Summary
              </h2>
              {appointment && (
                <p className="text-xs sm:text-sm text-drift-gray mt-0.5">
                  {isPatient ? "View your appointment summary" : "View appointment summary"}
                </p>
              )}
            </div>
          </div>

          {/* Other party info - Below header */}
          <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 mt-3 sm:mt-4">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full opacity-20 blur-sm"></div>
              <div className="relative">
                {loadingDoctor ? (
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-100 animate-pulse"></div>
                ) : (
                  <ProfileImage 
                    userId={otherPartyId} 
                    size="md" 
                    fallback={otherPartyInitial} 
                    role={isPatient ? "doctor" : "patient"} 
                  />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {loadingDoctor ? (
                <div className="space-y-1.5">
                  <div className="h-4 w-24 bg-amber-100 rounded animate-pulse"></div>
                  <div className="h-3 w-16 bg-amber-100 rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  <p className="text-sm sm:text-base font-bold text-graphite truncate">
                    {isPatient ? (doctorName ? `Dr. ${doctorName}` : "Doctor") : otherPartyName}
                  </p>
                  <p className="text-xs sm:text-sm text-drift-gray font-medium">
                    {specialty || appointment.type || (isPatient ? "Doctor" : "Patient")}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content - Transparent to show gradient background like appointment modal */}
        <div className="p-3 sm:p-4 md:p-6 overflow-hidden flex-1 min-h-0">
          <div className="space-y-3 sm:space-y-4 max-h-full overflow-y-auto scrollbar-hide">
            {/* Date and Time Cards - Enhanced matching modal style */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur-sm border border-amber-200 p-2.5 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-soft-amber/20">
                  <Calendar className="h-4 w-4 text-soft-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-drift-gray font-medium">Date</p>
                  <p className="text-sm font-semibold text-graphite truncate">
                    {new Date(appointment.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur-sm border border-amber-200 p-2.5 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-soft-amber/20">
                  <Clock className="h-4 w-4 text-soft-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-drift-gray font-medium">Time</p>
                  <p className="text-sm font-semibold text-graphite">{appointment.time || "Not specified"}</p>
              </div>
            </div>
          </div>

          {hasSummaryData ? (
              <div className="space-y-3 sm:space-y-4">
              {summary.diagnosis && (
                  <div className="rounded-lg bg-white/80 backdrop-blur-sm border border-amber-200/50 p-3 sm:p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-soft-amber/20">
                          <Stethoscope className="h-4 w-4 text-soft-amber" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-graphite mb-1.5">Diagnosis</p>
                        <p className="text-xs sm:text-sm text-drift-gray leading-relaxed whitespace-pre-wrap">{summary.diagnosis}</p>
                      </div>
                    </div>
                </div>
              )}

              {summary.recommendations && (
                  <div className="rounded-lg bg-white/80 backdrop-blur-sm border border-amber-200/50 p-3 sm:p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-soft-amber/20">
                          <ClipboardList className="h-4 w-4 text-soft-amber" />
                  </div>
                </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-graphite mb-1.5">Recommendations</p>
                        <p className="text-xs sm:text-sm text-drift-gray leading-relaxed whitespace-pre-wrap">{summary.recommendations}</p>
                  </div>
                  </div>
                </div>
              )}

              {summary.followUp && (
                  <div className="rounded-lg bg-white/80 backdrop-blur-sm border border-amber-200/50 p-3 sm:p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-soft-amber/20">
                          <CalendarClock className="h-4 w-4 text-soft-amber" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-graphite mb-1.5">Follow-up</p>
                        <p className="text-xs sm:text-sm text-drift-gray leading-relaxed">{summary.followUp}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-4 sm:p-5 text-center shadow-sm">
                <div className="flex flex-col items-center">
                  <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-amber-400 mb-2" />
                  <p className="text-xs sm:text-sm text-amber-800 font-medium">
                    No summary information is available for this appointment yet.
                  </p>
                </div>
            </div>
          )}

            {/* Close Button */}
            <div className="flex justify-end pt-4 border-t border-amber-200/50">
            <button
                onClick={handleCloseWithAnimation}
                className={`inline-flex items-center justify-center gap-2 rounded-lg ${theme.buttonBg} px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white ${theme.buttonHover} transition-all transform hover:scale-105 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                disabled={isClosing}
            >
              Close
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

