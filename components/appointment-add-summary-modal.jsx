"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, FileText, Stethoscope } from "lucide-react"
import { updateAppointmentSummary } from "@/lib/appointment-utils"
import { useAuth } from "@/contexts/auth-context"
import { getUserDetails } from "@/lib/user-utils"
import ProfileImage from "@/components/profile-image"

export function AppointmentAddSummaryModal({ isOpen, onClose, appointment, onSummaryAdded }) {
  const { userRole } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const isClosingRef = useRef(false)
  const modalRef = useRef(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [patientName, setPatientName] = useState("Patient")
  const [loadingPatient, setLoadingPatient] = useState(false)

  // Form state
  const [diagnosis, setDiagnosis] = useState("")
  const [recommendations, setRecommendations] = useState("")
  const [followUp, setFollowUp] = useState("")

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

  // Fetch patient details when modal opens
  useEffect(() => {
    if (isOpen && appointment) {
      const fetchPatientName = async () => {
        const patientId = appointment.patientId || ""
        
        // First try to get from appointment data
        const nameFromAppointment = 
          appointment.patientName || 
          appointment.patient?.name || 
          appointment.patient?.displayName ||
          appointment.patient || 
          null

        if (nameFromAppointment && nameFromAppointment !== "Patient") {
          setPatientName(nameFromAppointment)
          return
        }

        // If not in appointment data, fetch from user database
        if (patientId) {
          try {
            setLoadingPatient(true)
            const patientDetails = await getUserDetails(patientId)
            if (patientDetails) {
              const actualName = patientDetails.displayName || patientDetails.name || "Patient"
              setPatientName(actualName)
            }
          } catch (error) {
            console.error("Error fetching patient details:", error)
            setPatientName(nameFromAppointment || "Patient")
          } finally {
            setLoadingPatient(false)
          }
        } else {
          setPatientName(nameFromAppointment || "Patient")
        }
      }

      fetchPatientName()
    }
  }, [isOpen, appointment])

  // Initialize form with existing data if available
  useEffect(() => {
    if (appointment && appointment.summary) {
      const { summary } = appointment
      if (summary.diagnosis) setDiagnosis(summary.diagnosis)
      if (summary.recommendations) setRecommendations(summary.recommendations)
      if (summary.followUp) setFollowUp(summary.followUp)
    } else {
      // Reset form when modal opens with new appointment
      setDiagnosis("")
      setRecommendations("")
      setFollowUp("")
      setError("")
      setSuccess(false)
    }
  }, [appointment])

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      // Reset closing states when modal opens
      setIsClosing(false)
      isClosingRef.current = false
      setIsVisible(true)
      setError("")
      setSuccess(false)
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
    if (isOpen && !appointment?.summary) {
      setDiagnosis("")
      setRecommendations("")
      setFollowUp("")
      setError("")
      setSuccess(false)
    }
  }, [isOpen, appointment])

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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isSubmitting || isClosing || isClosingRef.current) return

    if (!appointment || !appointment.id) {
      setError("Appointment information is missing")
      return
    }

    // Validate required fields
    if (!diagnosis.trim()) {
      setError("Please enter a diagnosis")
      return
    }

    if (!recommendations.trim()) {
      setError("Please enter recommendations")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      // Create summary data (follow-up is optional)
      const summaryData = {
        diagnosis: diagnosis.trim(),
        recommendations: recommendations.trim(),
        followUp: followUp.trim() || null, // Optional field
        updatedAt: new Date().toISOString(),
      }

      // Update appointment with summary
      await updateAppointmentSummary(appointment.id, summaryData)

      setSuccess(true)

      // Notify parent component
      if (onSummaryAdded) {
        onSummaryAdded({
          ...appointment,
          summary: summaryData,
        })
      }

      // Close modal after a short delay
      setTimeout(() => {
        handleCloseWithAnimation(e)
      }, 1000)
    } catch (error) {
      console.error("Error adding summary:", error)
      setError(error.message || "Failed to add summary")
      setIsSubmitting(false)
    }
  }

  if ((!isOpen && !isVisible) || (!isOpen && isClosingRef.current)) return null
  if (!appointment) return null

  const patientId = appointment.patientId || appointment.patient?.id || ""
  const patientInitial = patientName && patientName !== "Patient" ? patientName.charAt(0).toUpperCase() : "P"

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
          
          {/* Header icon and text - Left aligned even on mobile */}
          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            <div className={`flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full ${theme.iconBg} flex-shrink-0`}>
              <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base md:text-lg font-bold text-graphite">
                Add Appointment Summary
              </h2>
              {appointment && (
                <p className="text-xs sm:text-sm text-drift-gray mt-0.5">
                  Complete the appointment summary
                </p>
              )}
            </div>
          </div>
          
          {/* Patient info - Below header, always visible */}
          <div className="relative z-10 flex items-center gap-2.5 sm:gap-3 mt-3 sm:mt-4">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full opacity-20 blur-sm"></div>
              <div className="relative">
                {loadingPatient ? (
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-100 animate-pulse"></div>
                ) : (
                  <ProfileImage userId={patientId} size="md" fallback={patientInitial} role="patient" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              {loadingPatient ? (
                <div className="space-y-1.5">
                  <div className="h-4 w-24 bg-amber-100 rounded animate-pulse"></div>
                  <div className="h-3 w-16 bg-amber-100 rounded animate-pulse"></div>
                </div>
              ) : (
                <>
                  <p className="text-sm sm:text-base font-bold text-graphite truncate">{patientName}</p>
                  <p className="text-xs sm:text-sm text-drift-gray font-medium">Patient</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content - Transparent to show gradient background like appointment modal */}
        <div className="p-3 sm:p-4 md:p-6 overflow-hidden flex-1 min-h-0">
          <div className="space-y-3 sm:space-y-4 max-h-full overflow-y-auto scrollbar-hide">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="flex-shrink-0 mb-3 sm:mb-0 sm:mr-3">
                    <X className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-medium text-red-800 mb-1 sm:mb-2">
                      Error
                    </h3>
                    <p className="text-xs sm:text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 border border-green-100 p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="flex-shrink-0 mb-3 sm:mb-0 sm:mr-3">
                    <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-medium text-green-800 mb-1 sm:mb-2">
                      Success
                    </h3>
                    <p className="text-xs sm:text-sm text-green-700">Summary added successfully!</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="diagnosis" className="text-xs sm:text-sm font-semibold text-graphite">
                  Diagnosis <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="diagnosis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 bg-white py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/50 transition-all shadow-sm hover:shadow-md resize-none"
                  rows={3}
                  placeholder="Enter diagnosis"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="recommendations" className="text-xs sm:text-sm font-semibold text-graphite">
                  Recommendations <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="recommendations"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 bg-white py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/50 transition-all shadow-sm hover:shadow-md resize-none"
                  rows={4}
                  placeholder="Enter recommendations"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="followUp" className="text-xs sm:text-sm font-semibold text-graphite">
                  Follow-up <span className="text-xs font-normal text-drift-gray">(Optional)</span>
                </label>
                <input
                  id="followUp"
                  type="text"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 bg-white py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/50 transition-all shadow-sm hover:shadow-md"
                  placeholder="e.g., Recommended in 6 months"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-amber-200/50">
                <button
                  type="button"
                  onClick={handleCloseWithAnimation}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-amber-200 bg-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-graphite hover:bg-amber-50 hover:border-soft-amber/50 transition-all transform hover:scale-105 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={isSubmitting || isClosing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`inline-flex items-center justify-center gap-2 rounded-lg ${theme.buttonBg} px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white ${theme.buttonHover} transition-all transform hover:scale-105 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                  disabled={isSubmitting || isClosing}
                >
                  <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {isSubmitting ? "Saving..." : "Save Summary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

