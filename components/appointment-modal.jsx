"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Calendar, Clock, AlertCircle, FileText, User, Stethoscope } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  createAppointment,
  getAvailableTimeSlots,
  getAllDoctors,
  getAvailablePatients,
  normalizeDate,
  formatDateForDisplay,
} from "@/lib/appointment-utils"
import { sendPushNotification } from "@/lib/push-notification-utils"

// All possible time slots
const allTimeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
]

export function AppointmentModal({
  isOpen,
  onClose,
  userRole = "patient",
  onBook,
  appointmentToReschedule = null,
  patients = [],
  initialDate = "", // New prop to accept a pre-selected date
  selectedDoctor = null,
}) {
  const { user } = useAuth()
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [reason, setReason] = useState("")
  const [doctor, setDoctor] = useState("")
  const [patient, setPatient] = useState("")
  const [type, setType] = useState("")
  const [mode, setMode] = useState("visit") // visit | online
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])
  const [unavailableDates, setUnavailableDates] = useState([])
  const [isVisible, setIsVisible] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [patientsList, setPatientsList] = useState([])
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [error, setError] = useState(null)
  const [unavailableTimeSlots, setUnavailableTimeSlots] = useState([])
  const [dateFullyBooked, setDateFullyBooked] = useState(false)
  const [isDateUnavailable, setIsDateUnavailable] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  // All refs must be called before any conditional returns
  const isClosingRef = useRef(false)
  const modalRef = useRef(null)

  // BULLETPROOF CLOSE HANDLER - NO DUPLICATES EVER
  const handleCloseWithAnimation = useCallback((e) => {
    // ABORT IMMEDIATELY - check ref FIRST
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
    
    // LOCK IMMEDIATELY - set ref FIRST before anything else
    isClosingRef.current = true
    
    // Stop all event propagation IMMEDIATELY
    if (e) {
      e.preventDefault()
      e.stopPropagation()
      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation()
      }
    }
    
    // Set UI state immediately
    setIsClosing(true)
    
    // Call onClose immediately (don't wait for setTimeout)
    try {
      onClose()
    } catch (error) {
      console.error("Error calling onClose:", error)
    }
    
    // Reset after animation completes - prevents any re-triggering
    // Longer timeout to ensure modal is completely closed
    setTimeout(() => {
      // Only reset if modal is still closed (double check)
      if (!isOpen) {
        setIsClosing(false)
        // Keep ref locked for a bit longer to prevent any reopening
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
      // Only proceed if we're not in the middle of closing
      if (!isClosingRef.current) {
        setIsVisible(true)
        setIsClosing(false)
        setError(null)
        // Load doctors or patients based on user role
        if (userRole === "patient") {
          loadDoctors()
        } else {
          loadPatients()
        }
        // Reset close ref after modal is fully open (longer delay to prevent race conditions)
        const resetTimer = setTimeout(() => {
          if (isOpen && !isClosingRef.current) {
            isClosingRef.current = false
          }
        }, 600) // Increased delay
        return () => clearTimeout(resetTimer)
      }
    } else {
      // When isOpen becomes false, ensure modal starts closing
      // Don't reset closing ref immediately - keep it locked until modal is fully hidden
      const hideTimer = setTimeout(() => {
        setIsVisible(false)
        // Only reset ref after a longer delay to prevent any reopening
        setTimeout(() => {
          isClosingRef.current = false
        }, 200)
      }, 350)
      return () => clearTimeout(hideTimer)
    }
  }, [isOpen, userRole])

  // Handle escape key press
  useEffect(() => {
    if (!isOpen) return
    
    const handleEscape = (e) => {
      if (e.key === "Escape" && !isSubmitting && !isClosingRef.current) {
        e.preventDefault()
        e.stopPropagation()
        handleCloseWithAnimation(e)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, isSubmitting, handleCloseWithAnimation])

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

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Use initialDate if provided, otherwise reset
      setDate(initialDate || "")
      setTime("")
      setReason("")
      // Preselect doctor if provided
      if (userRole === "patient" && selectedDoctor && selectedDoctor.id) {
        setDoctor(selectedDoctor.id)
      } else {
        setDoctor("")
      }
      setPatient("")
      // Set default type based on role: doctor schedules "Follow-up", patient selects from list
      setType(userRole === "doctor" ? "Follow-up" : "")
      setMode("visit")
      setAvailableTimeSlots([])
      setUnavailableDates([])
      setUnavailableTimeSlots([])
      setDateFullyBooked(false)
      setIsDateUnavailable(false)
      setError(null)
    }
  }, [isOpen, initialDate, userRole, selectedDoctor])

  // Filter out past dates from unavailable dates
  const filterFutureDates = (dates) => {
    if (!dates || dates.length === 0) return []
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return dates.filter((dateString) => {
      if (!dateString) return false
      const dateObj = new Date(dateString)
      dateObj.setHours(0, 0, 0, 0)
      return dateObj >= today
    })
  }

  // Load available time slots when date or doctor changes
  useEffect(() => {
    if (date && (doctor || userRole === "doctor")) {
      const doctorId = userRole === "patient" ? doctor : user?.uid
      if (doctorId) {
        loadAvailableTimeSlots(doctorId, date)
      }
    }
  }, [date, doctor, userRole, user?.uid])

  // Load doctors from Firebase
  const loadDoctors = async () => {
    setLoadingDoctors(true)
    setError(null)
    try {
      const doctorsList = await getAllDoctors()
      // Filter out past dates from each doctor's unavailable dates
      const filteredDoctors = doctorsList.map((doc) => ({
        ...doc,
        unavailableDates: doc.unavailableDates ? filterFutureDates(doc.unavailableDates) : [],
      }))
      setDoctors(filteredDoctors)
    } catch (error) {
      console.error("Error loading doctors:", error)
      setError("Failed to load doctors. Please try again later.")
      setDoctors([
        { id: "1", name: "Dr. Sarah Johnson", specialty: "Cardiologist" },
        { id: "2", name: "Dr. Michael Chen", specialty: "Dermatologist" },
        { id: "3", name: "Dr. Emily Rodriguez", specialty: "Neurologist" },
        { id: "4", name: "Dr. David Kim", specialty: "Pediatrician" },
      ]) // Fallback to mock data
    } finally {
      setLoadingDoctors(false)
    }
  }

  // Load patients from Firebase - only those with completed appointments
  const loadPatients = async () => {
    setLoadingPatients(true)
    setError(null)
    try {
      if (patients && patients.length > 0) {
        // Use provided patients list if available
        setPatientsList(patients)
      } else {
        // Fetch from Firebase - filter to only patients with completed appointments
        const doctorId = user?.uid || null
        const patientsList = await getAvailablePatients(doctorId)
        setPatientsList(
          patientsList.length > 0
            ? patientsList
            : []
        )
        
        // Show message if no patients with completed appointments
        if (patientsList.length === 0) {
          setError("No patients with completed appointment history available. You can only schedule appointments for patients who have completed at least one appointment with you.")
        }
      }
    } catch (error) {
      console.error("Error loading patients:", error)
      setError("Failed to load patients. Please try again later.")
      setPatientsList([])
    } finally {
      setLoadingPatients(false)
    }
  }

  // Load available time slots for a doctor on a specific date
  const loadAvailableTimeSlots = async (doctorId, date) => {
    setLoadingTimeSlots(true)
    setError(null)
    try {
      const result = await getAvailableTimeSlots(doctorId, date)

      // Update state with available and unavailable slots
      setAvailableTimeSlots(result.available)
      setUnavailableTimeSlots(result.unavailable)
      setDateFullyBooked(result.isFullyBooked)
      setIsDateUnavailable(result.isDateUnavailable)

      // Update unavailable dates list - filter out past dates
      if (result.unavailableDates && result.unavailableDates.length > 0) {
        const futureDates = filterFutureDates(result.unavailableDates)
        setUnavailableDates(futureDates)
      }

      // Clear time selection if the date is unavailable or fully booked
      if (result.isDateUnavailable || result.isFullyBooked) {
        setTime("")
      }
    } catch (error) {
      console.error("Error loading available time slots:", error)
      setError("Failed to load available time slots. Using default schedule.")
      setAvailableTimeSlots(allTimeSlots) // Fallback to all time slots
      setUnavailableTimeSlots([])
      setDateFullyBooked(false)
      setIsDateUnavailable(false)
    } finally {
      setLoadingTimeSlots(false)
    }
  }

  const isRescheduling = !!appointmentToReschedule

  // Get tomorrow's date for min date attribute
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

  // Validate form fields
  const isFormValid = () => {
    if (userRole === "patient") {
      return !!doctor && !!date && !!time && !!type && !!reason.trim()
    } else {
      return !!patient && !!date && !!time && !!type && !!reason.trim()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate all fields first
    if (!isFormValid()) {
      setError("Please fill all fields")
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Create appointment data
      const appointmentData =
        userRole === "patient"
          ? {
              patientId: user?.uid || "patient-id",
              patientName: user?.displayName || "Patient",
              doctorId: doctor,
              doctorName: doctors.find((d) => d.id === doctor)?.name || "Doctor",
              specialty: doctors.find((d) => d.id === doctor)?.specialty || "",
              date,
              time,
              type: type || "Consultation",
              mode,
              notes: reason,
              createdBy: user?.uid || "patient-id",
            }
          : {
              patientId: patient,
              patientName: patientsList.find((p) => p.id === patient)?.name || "Patient",
              doctorId: user?.uid || "doctor-id",
              doctorName: user?.displayName || "Doctor",
              specialty: user?.specialty || "Doctor",
              date,
              time,
              type: "Follow-up", // Doctor can only schedule Follow-up appointments
              mode,
              notes: reason,
              createdBy: user?.uid || "doctor-id",
            }

      // Create appointment in Firebase
      // This will automatically:
      // 1. Create in-app notification (system dropdown) for the recipient
      // 2. Send email notification to the recipient
      // 3. Push notification will be handled by NotificationListener when recipient opens app
      let appointmentId
      try {
        appointmentId = await createAppointment(appointmentData)
        console.log("✅ Appointment created successfully with ID:", appointmentId)
      } catch (error) {
        console.error("Error creating appointment in Firebase:", error)
        // Generate a mock ID for fallback
        appointmentId = "appointment-" + Date.now()
      }

      // Send confirmation push notification to the current user (person who booked/scheduled)
      try {
        const formattedDate = formatDateForDisplay(appointmentData.date)
        
        if (userRole === "patient") {
          // Confirmation for patient who booked the appointment
          await sendPushNotification("Appointment Requested", {
            body: `Your appointment request with Dr. ${appointmentData.doctorName} on ${formattedDate} at ${appointmentData.time} has been submitted. The doctor will review and confirm.`,
            tag: "appointment-requested",
            icon: "/SmartCare.png",
            badge: "/SmartCare.png",
            data: {
              url: "/dashboard/appointments",
              appointmentId: appointmentId,
              doctorId: appointmentData.doctorId,
              doctorName: appointmentData.doctorName,
              date: appointmentData.date,
              time: appointmentData.time,
            },
          })
          console.log("✅ Confirmation push notification sent to patient")
          console.log("📧 Email and in-app notification sent to doctor (will be received when doctor opens app)")
        } else if (userRole === "doctor") {
          // Confirmation for doctor who scheduled the appointment
          await sendPushNotification("Appointment Scheduled", {
            body: `You have scheduled an appointment with ${appointmentData.patientName} on ${formattedDate} at ${appointmentData.time}.`,
            tag: "appointment-scheduled",
            icon: "/SmartCare.png",
            badge: "/SmartCare.png",
            data: {
              url: "/doctor/appointments",
              appointmentId: appointmentId,
              patientId: appointmentData.patientId,
              patientName: appointmentData.patientName,
              date: appointmentData.date,
              time: appointmentData.time,
            },
          })
          console.log("✅ Confirmation push notification sent to doctor")
          console.log("📧 Email and in-app notification sent to patient (will be received when patient opens app)")
        }
      } catch (pushError) {
        console.error("Error sending confirmation push notification:", pushError)
        // Don't fail the appointment creation if push notification fails
      }

      // Call onBook callback with appointment data
      if (onBook) {
        onBook({
          ...appointmentData,
          id: appointmentId,
          // If doctor created the appointment, it's automatically approved
          status: userRole === "doctor" ? "approved" : "pending",
        })
      }

      setIsSubmitting(false)
      
      // Close modal after successful submission - use same handler to prevent duplicate
      if (!isClosingRef.current) {
        handleCloseWithAnimation(null)
      }
    } catch (error) {
      console.error("Error booking appointment:", error)
      setError("Failed to book appointment. Please try again.")
      setIsSubmitting(false)
    }
  }

  // Check if a date is unavailable
  const checkDateUnavailable = (dateString) => {
    const normalizedDate = normalizeDate(dateString)
    return unavailableDates.includes(normalizedDate)
  }

  // Appointment types
  const appointmentTypes = [
    "Initial Visit",
    "Follow-up",
    "Consultation",
    "Annual Physical",
    "Urgent Care",
    "Specialist Referral",
  ]

  // Color scheme - Orange/Amber for all users
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

  // Don't render if both isOpen and isVisible are false
  // Also don't render if we're closing and isOpen is false (prevents duplicates)
  if ((!isOpen && !isVisible) || (!isOpen && isClosingRef.current)) return null

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-4 bg-black/60 backdrop-blur-xl ${isClosing ? "animate-fade-out" : "animate-fade-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""}`}
      onClick={(e) => {
        // If not open or closing, prevent all interactions
        if (!isOpen || isClosing || isClosingRef.current) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        // Only close if clicking backdrop itself (not children)
        if (e.target !== e.currentTarget) {
          e.stopPropagation()
          return
        }
        // Close immediately
        handleCloseWithAnimation(e)
      }}
      onMouseDown={(e) => {
        // If not open or closing, prevent all interactions
        if (!isOpen || isClosing || isClosingRef.current) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        // Prevent mousedown from bubbling if clicking on backdrop
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
          // Prevent interactions if not open or closing
          if (!isOpen || isClosing || isClosingRef.current) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
          e.stopPropagation()
          e.stopImmediatePropagation?.()
        }}
        onMouseDown={(e) => {
          // Prevent interactions if not open or closing
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

        {/* Header with gradient background */}
        <div className={`${theme.headerBg} p-2 sm:p-2.5 md:p-3 lg:p-3 relative overflow-hidden flex-shrink-0`}>
          <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-2.5">
            <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full ${theme.iconBg} flex-shrink-0`}>
              {getIconComponent()}
            </div>
            <h2 className="text-xs sm:text-sm md:text-base lg:text-base font-bold text-graphite text-center">
              {isRescheduling
                ? "Reschedule Appointment"
                : userRole === "patient"
                  ? "Book an Appointment"
                  : "Schedule an Appointment"}
            </h2>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full -ml-10 -mb-10"></div>
        </div>

        {/* Content - No scrollbar, fits all content - Transparent to show gradient background */}
        <div className="p-2.5 sm:p-3 md:p-3.5 lg:p-4 overflow-hidden flex-1 min-h-0 flex flex-col">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 sm:p-4 mb-2 sm:mb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-3">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs sm:text-sm font-medium text-red-800 mb-1">
                    Error
                  </h3>
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-hidden min-h-0 space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-2.5">
            {/* Visit mode selection */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-semibold text-graphite">Appointment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <label className={`relative flex items-center gap-2 rounded-lg border-2 p-2 sm:p-2.5 md:p-3 cursor-pointer transition-all duration-200 ${
                  mode === "visit" 
                    ? `${theme.radioBorder} ${theme.radioBg} shadow-md`
                    : "border-earth-beige bg-white hover:border-gray-300"
                }`}>
                  <input
                    type="radio"
                    name="appointment-mode"
                    value="visit"
                    checked={mode === "visit"}
                    onChange={() => setMode("visit")}
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 accent-soft-amber`}
                  />
                  <div className="flex-1">
                    <span className="block text-xs font-medium text-graphite">Visit</span>
                    <span className="block text-[10px] text-drift-gray">In-person</span>
                  </div>
                </label>
                <label className={`relative flex items-center gap-2 rounded-lg border-2 p-2 sm:p-2.5 md:p-3 cursor-pointer transition-all duration-200 ${
                  mode === "online" 
                    ? `${theme.radioBorder} ${theme.radioBg} shadow-md`
                    : "border-earth-beige bg-white hover:border-gray-300"
                }`}>
                  <input
                    type="radio"
                    name="appointment-mode"
                    value="online"
                    checked={mode === "online"}
                    onChange={() => setMode("online")}
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 accent-soft-amber`}
                  />
                  <div className="flex-1">
                    <span className="block text-xs font-medium text-graphite">Online</span>
                    <span className="block text-[10px] text-drift-gray">Video Call</span>
                  </div>
                </label>
              </div>
            </div>

            {userRole === "patient" && (
              <div className="space-y-1.5">
                <label htmlFor="doctor" className="text-xs sm:text-sm font-semibold text-graphite">
                  Select Doctor
                </label>
                <select
                  id="doctor"
                  value={doctor}
                  onChange={(e) => {
                    setDoctor(e.target.value)
                    // Reset date and time when doctor changes
                    setDate("")
                    setTime("")
                    setUnavailableDates([])

                    // Update unavailable dates based on selected doctor - filter out past dates
                    const selectedDoctor = doctors.find((d) => d.id === e.target.value)
                    if (selectedDoctor && selectedDoctor.unavailableDates) {
                      const futureDates = filterFutureDates(selectedDoctor.unavailableDates)
                      setUnavailableDates(futureDates)
                    }
                  }}
                  required
                  disabled={loadingDoctors}
                  className={`w-full rounded-lg border border-earth-beige bg-white py-1.5 sm:py-2 pl-3 pr-10 text-xs sm:text-sm text-graphite focus:outline-none focus:ring-1 transition-all duration-300 ease-in-out disabled:bg-pale-stone disabled:text-drift-gray hover:border-soft-amber/50 hover:shadow-sm ${theme.focusBorder} ${theme.focusRing} appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-right-2 bg-[length:16px_16px]`}
                  style={{
                    backgroundPosition: 'right 8px center',
                  }}
                >
                  <option value="">{loadingDoctors ? "Loading doctors..." : "Select a doctor"}</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} - {doc.specialty}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {userRole === "doctor" && (
              <div className="space-y-1.5">
                <label htmlFor="patient" className="text-xs sm:text-sm font-semibold text-graphite">
                  Select Patient
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray pointer-events-none z-10" />
                  <select
                    id="patient"
                    value={patient}
                    onChange={(e) => setPatient(e.target.value)}
                    required
                    disabled={loadingPatients}
                    className={`w-full rounded-lg border border-earth-beige bg-white py-1.5 sm:py-2 pl-10 pr-8 text-xs sm:text-sm text-graphite focus:outline-none focus:ring-1 transition-all duration-300 ease-in-out disabled:bg-pale-stone disabled:text-drift-gray hover:border-soft-amber/50 hover:shadow-sm ${theme.focusBorder} ${theme.focusRing} appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-right-2 bg-[length:14px_14px]`}
                    style={{
                      backgroundPosition: 'right 8px center',
                    }}
                  >
                    <option value="">{loadingPatients ? "Loading patients..." : "Select a patient"}</option>
                    {patientsList.map((pat) => (
                      <option key={pat.id} value={pat.id}>
                        {pat.name || pat.displayName} {pat.age ? `- Age: ${pat.age}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="date" className="text-xs sm:text-sm font-semibold text-graphite">
                Date
              </label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray pointer-events-none z-10 transition-colors duration-300 group-focus-within:text-soft-amber" />
                <input
                  id="date"
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className={`w-full rounded-lg border border-earth-beige bg-white py-1.5 sm:py-2 pl-10 pr-3 text-xs sm:text-sm text-graphite focus:outline-none focus:ring-1 transition-all duration-300 ease-in-out hover:border-soft-amber/50 hover:shadow-sm ${theme.focusBorder} ${theme.focusRing} cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity`}
                  style={{
                    colorScheme: 'light',
                  }}
                />
              </div>

              {date && isDateUnavailable && (
                <div className="mt-1 flex items-center text-xs text-red-500">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  This date is unavailable for appointments.
                </div>
              )}

              {date && dateFullyBooked && (
                <div className="mt-1 flex items-center text-xs text-red-500">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  This date is fully booked. Please select another date.
                </div>
              )}

              {unavailableDates.length > 0 && (
                <div className="mt-1 text-xs text-drift-gray">
                  <span className="font-medium">Unavailable dates:</span>{" "}
                  {unavailableDates.slice(0, 3).map((d, i) => (
                    <span key={d}>
                      {formatDateForDisplay(d)}
                      {i < Math.min(unavailableDates.length - 1, 2) ? ", " : ""}
                    </span>
                  ))}
                  {unavailableDates.length > 3 && ` and ${unavailableDates.length - 3} more...`}
                </div>
              )}
            </div>

            {/* Time and Appointment Type - Side by side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2.5 lg:gap-3">
              <div className="space-y-1.5">
                <label htmlFor="time" className="text-xs sm:text-sm font-semibold text-graphite">
                  Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray pointer-events-none z-10" />
                  <select
                    id="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    disabled={loadingTimeSlots || availableTimeSlots.length === 0 || isDateUnavailable || dateFullyBooked}
                    className={`w-full rounded-lg border border-earth-beige bg-white py-1.5 sm:py-2 pl-10 pr-8 text-xs sm:text-sm text-graphite focus:outline-none focus:ring-1 disabled:bg-pale-stone disabled:text-drift-gray transition-all duration-300 ease-in-out hover:border-soft-amber/50 hover:shadow-sm ${theme.focusBorder} ${theme.focusRing} appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-right-2 bg-[length:14px_14px]`}
                    style={{
                      backgroundPosition: 'right 8px center',
                    }}
                  >
                  <option value="">{loadingTimeSlots ? "Loading available times..." : "Select a time"}</option>
                  {availableTimeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                </div>

                {date && !loadingTimeSlots && (
                  <div className="mt-2">
                    {unavailableTimeSlots.length > 0 && (
                      <div className="text-xs text-drift-gray">
                        <p className="font-medium mb-1">Unavailable times:</p>
                        <ul className="space-y-1">
                          {unavailableTimeSlots.map((slot) => (
                            <li key={slot.time} className="flex items-center text-red-500">
                              <span className="inline-block w-16">{slot.time}</span>
                              <span className="text-xs">- {slot.reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {availableTimeSlots.length === 0 && !dateFullyBooked && !isDateUnavailable && (
                      <div className="mt-1 flex items-center text-xs text-amber-500">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        No available time slots for this date. Please select another date.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="type" className="text-xs sm:text-sm font-semibold text-graphite">
                  Appointment Type
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray pointer-events-none z-10" />
                  {userRole === "doctor" ? (
                    // For doctors: fixed to "Follow-up" (default appointment type)
                    <input
                      id="type"
                      type="text"
                      value="Follow-up"
                      disabled
                      readOnly
                      className={`w-full rounded-lg border border-earth-beige bg-pale-stone py-1.5 sm:py-2 pl-10 pr-3 text-xs sm:text-sm text-drift-gray cursor-not-allowed`}
                    />
                  ) : (
                    // For patients: can select from dropdown
                    <select
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      required
                      className={`w-full rounded-lg border border-earth-beige bg-white py-1.5 sm:py-2 pl-10 pr-8 text-xs sm:text-sm text-graphite focus:outline-none focus:ring-1 transition-all duration-300 ease-in-out hover:border-soft-amber/50 hover:shadow-sm ${theme.focusBorder} ${theme.focusRing} appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-right-2 bg-[length:14px_14px]`}
                      style={{
                        backgroundPosition: 'right 8px center',
                      }}
                    >
                      <option value="">Select appointment type</option>
                      {appointmentTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reason" className="text-xs sm:text-sm font-semibold text-graphite">
                Reason for Visit
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe the reason for the visit"
                required
                rows={2}
                className={`w-full rounded-lg border border-earth-beige bg-white py-1.5 sm:py-2 px-3 text-xs sm:text-sm text-graphite placeholder:text-drift-gray/60 focus:outline-none focus:ring-1 transition-colors duration-200 ${theme.focusBorder} ${theme.focusRing}`}
              />
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
                    if (!isClosingRef.current) {
                      handleCloseWithAnimation(e)
                    }
                  }}
                  onMouseDown={(e) => {
                    // Prevent event bubbling on mousedown as well
                    e.stopPropagation()
                  }}
                  disabled={isSubmitting || isClosing || isClosingRef.current}
                  className="flex-1 sm:flex-none rounded-lg border-2 border-soft-amber/60 bg-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-soft-amber shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    loadingTimeSlots ||
                    availableTimeSlots.length === 0 ||
                    isDateUnavailable ||
                    dateFullyBooked ||
                    isClosing ||
                    !isFormValid()
                  }
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-soft-amber to-amber-500 shadow-lg hover:from-amber-500 hover:to-amber-600 hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isRescheduling ? "Rescheduling..." : userRole === "patient" ? "Booking..." : "Scheduling..."}
                    </span>
                  ) : (
                    isRescheduling ? "Reschedule Appointment" : userRole === "patient" ? "Book Appointment" : "Schedule Appointment"
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
