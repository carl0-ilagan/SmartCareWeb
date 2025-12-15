"use client"

import { useState, useEffect, useRef } from "react"
import { AlertCircle, CheckCircle, Calendar, Stethoscope, ArrowRight } from "lucide-react"
import { checkPatientConsultation } from "@/lib/prescription-utils"

export function AppointmentCheckModal({ isOpen, onClose, doctorId, patientId, onVerified }) {
  const [loading, setLoading] = useState(true)
  const [hasConsulted, setHasConsulted] = useState(false)
  const [message, setMessage] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const modalRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsClosing(false)
      checkConsultation()
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, patientId, doctorId])

  const checkConsultation = async () => {
    if (!doctorId || !patientId) return

    setLoading(true)
    try {
      const result = await checkPatientConsultation(doctorId, patientId)
      setHasConsulted(result.hasConsulted)
      setMessage(result.message)
    } catch (error) {
      console.error("Error checking consultation:", error)
      setHasConsulted(false)
      setMessage("Error verifying patient consultation")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const handleContinue = () => {
    if (hasConsulted && onVerified) {
      setIsClosing(true)
      setTimeout(() => {
        onVerified()
        setIsClosing(false)
      }, 300)
    }
  }

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen])

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

  if (!isOpen && !isVisible) return null

  const bgGradient = "bg-gradient-to-br from-soft-amber/10 to-yellow-50"
  const iconColor = "bg-soft-amber/20 text-soft-amber"

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm ${isClosing ? "animate-fade-out" : "animate-fade-in"}`}
    >
      <div
        ref={modalRef}
        className={`w-full max-w-md mx-auto rounded-2xl bg-white shadow-2xl overflow-hidden ${isClosing ? "animate-modal-out" : "animate-modal-in"} ${bgGradient}`}
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

        {/* Header with gradient background */}
        <div className={`${bgGradient} p-6 sm:p-8 relative overflow-hidden`}>
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full ${iconColor}`}>
                <Stethoscope className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
            </div>
            {loading ? (
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-graphite text-center mb-1 sm:mb-2">
                Checking Consultation...
              </h2>
            ) : hasConsulted ? (
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-graphite text-center mb-1 sm:mb-2">
                Consultation Verified ✓
              </h2>
            ) : (
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-graphite text-center mb-1 sm:mb-2">
                Consultation Required
              </h2>
            )}
          </div>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"></div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8">
          <div className="space-y-3 sm:space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-4 sm:py-8">
                <div className="h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-4 border-soft-amber border-t-transparent mb-3 sm:mb-4"></div>
                <p className="text-center text-xs sm:text-sm md:text-base text-drift-gray">
                  Checking consultation status...
                </p>
              </div>
            ) : hasConsulted ? (
              <div className="rounded-lg bg-green-50 border border-green-100 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="flex-shrink-0 mb-3 sm:mb-0 sm:mr-3">
                    <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-medium text-green-800 mb-1 sm:mb-2">
                      Consultation Verified
                    </h3>
                    <p className="text-xs sm:text-sm text-green-700">
                      You have consulted with this patient. You can proceed with creating a prescription.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-100 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="flex-shrink-0 mb-3 sm:mb-0 sm:mr-3">
                    <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-medium text-amber-800 mb-1 sm:mb-2">
                      Consultation Required
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-700">
                      You need to have a consultation with this patient before creating a prescription. Please schedule
                      an appointment first.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2 sm:pt-4">
              {hasConsulted ? (
                <button
                  onClick={handleContinue}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-soft-amber px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-graphite shadow-lg hover:bg-soft-amber/90 transition-all duration-200 hover:shadow-xl"
                >
                  Continue to Prescription
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-soft-amber px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-graphite shadow-lg hover:bg-soft-amber/90 transition-all duration-200 hover:shadow-xl"
                >
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Schedule Appointment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
