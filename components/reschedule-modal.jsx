"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Calendar, Clock, AlertCircle, FileText } from "lucide-react"
import { rescheduleAppointment, getAvailableTimeSlots, normalizeDate, formatDateForDisplay } from "@/lib/appointment-utils"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"
import ProfileImage from "@/components/profile-image"
import { getUserDetails } from "@/lib/user-utils"

export function RescheduleModal({ isOpen, onClose, appointment, onReschedule }) {
  const { user, userRole } = useAuth()
  const [doctorDetails, setDoctorDetails] = useState(null)
  const [loadingDoctor, setLoadingDoctor] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [notes, setNotes] = useState("")
  const [mode, setMode] = useState("visit") // visit | online
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])
  const [unavailableTimeSlots, setUnavailableTimeSlots] = useState([])
  const [unavailableDates, setUnavailableDates] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [dateFullyBooked, setDateFullyBooked] = useState(false)
  const [isDateUnavailable, setIsDateUnavailable] = useState(false)
  const [error, setError] = useState(null)
  const [isClosing, setIsClosing] = useState(false)
  const isClosingRef = useRef(false)
  const modalRef = useRef(null)

  // Color scheme - Orange/Amber (matching appointment modal)
  const themeColors = {
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
  }

  const theme = themeColors

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

  // BULLETPROOF CLOSE HANDLER - NO DUPLICATES EVER
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

  // Only allow patients to reschedule
  useEffect(() => {
    if (isOpen && userRole !== "patient") {
      console.warn("Only patients can reschedule appointments")
      onClose()
      return
    }
  }, [isOpen, userRole, onClose])

  // Load doctor details when modal opens
  useEffect(() => {
    if (isOpen && appointment && appointment.doctorId) {
      setLoadingDoctor(true)
      getUserDetails(appointment.doctorId)
        .then((details) => {
          setDoctorDetails(details)
          setLoadingDoctor(false)
        })
        .catch((error) => {
          console.error("Error loading doctor details:", error)
          setLoadingDoctor(false)
        })
    } else {
      setDoctorDetails(null)
      setLoadingDoctor(false)
    }
  }, [isOpen, appointment])

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen && appointment) {
      if (!isClosingRef.current) {
      setIsVisible(true)
        setIsClosing(false)
      setDate(appointment.date || "")
      setTime("")
      setNotes(appointment.notes || "")
      setMode(appointment.mode || "visit")
      setError(null)
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
          if (!isOpen) {
            setIsClosing(false)
            isClosingRef.current = false
          }
        }, 300)
      }, 300)
      return () => clearTimeout(hideTimer)
    }
  }, [isOpen, appointment])

  // Load available time slots when date changes
  useEffect(() => {
    if (date && appointment) {
      loadAvailableTimeSlots()
    }
  }, [date, appointment])

  // Load available time slots for the selected date
  const loadAvailableTimeSlots = async () => {
    if (!appointment || !date) return

    setLoadingTimeSlots(true)
    setError(null)
    try {
      const doctorId = appointment.doctorId
      const result = await getAvailableTimeSlots(doctorId, date)

      // Update state with available and unavailable slots
      if (result && typeof result === "object") {
        // If result is an object with available property (new format)
        setAvailableTimeSlots(Array.isArray(result.available) ? result.available : [])
        setUnavailableTimeSlots(Array.isArray(result.unavailable) ? result.unavailable : [])
        setDateFullyBooked(result.isFullyBooked || false)
        setIsDateUnavailable(result.isDateUnavailable || false)

        // Update unavailable dates list - filter out past dates
        if (result.unavailableDates && Array.isArray(result.unavailableDates)) {
          const futureDates = filterFutureDates(result.unavailableDates)
          setUnavailableDates(futureDates)
        }
      } else if (Array.isArray(result)) {
        // If result is just an array of time slots (old format)
        setAvailableTimeSlots(result)
        setUnavailableTimeSlots([])
        setDateFullyBooked(false)
        setIsDateUnavailable(false)
      } else {
        // Fallback for unexpected result format
        console.error("Unexpected result format from getAvailableTimeSlots:", result)
        setAvailableTimeSlots([])
        setUnavailableTimeSlots([])
        setDateFullyBooked(false)
        setIsDateUnavailable(false)
      }

      // If we're rescheduling for the same date, add the current time slot back
      if (date === appointment.date && appointment.time) {
        const currentSlots = Array.isArray(availableTimeSlots) ? [...availableTimeSlots] : []
        if (!currentSlots.includes(appointment.time)) {
          currentSlots.push(appointment.time)
          currentSlots.sort((a, b) => {
            // Sort time slots chronologically
            const timeA = new Date(`2000/01/01 ${a}`).getTime()
            const timeB = new Date(`2000/01/01 ${b}`).getTime()
            return timeA - timeB
          })
          setAvailableTimeSlots(currentSlots)
        }
      }
    } catch (error) {
      console.error("Error loading available time slots:", error)
      setError("Failed to load available time slots. Please try again.")
      setAvailableTimeSlots([])
      setUnavailableTimeSlots([])
      setDateFullyBooked(false)
      setIsDateUnavailable(false)
    } finally {
      setLoadingTimeSlots(false)
    }
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Update appointment in Firebase with user role to determine who rescheduled
      await rescheduleAppointment(appointment.id, date, time, notes, userRole, user?.uid)

      // Persist mode change if modified
      try {
        if (mode && mode !== (appointment.mode || "")) {
          const aptRef = doc(db, "appointments", appointment.id)
          await updateDoc(aptRef, { mode })
        }
      } catch {}

      // Call the onReschedule callback
      if (onReschedule) {
        const updatedAppointment = {
          ...appointment,
          date,
          time,
          notes,
          mode,
          status: "pending", // Reset to pending when rescheduled
        }
        onReschedule(updatedAppointment)
      }

      if (!isClosingRef.current) {
        handleCloseWithAnimation(null)
      }
    } catch (error) {
      console.error("Error rescheduling appointment:", error)
      setError("Failed to reschedule appointment. Please try again.")
      setIsSubmitting(false)
    }
  }

  // Check if a date is unavailable
  const checkDateUnavailable = (dateString) => {
    const normalizedDate = normalizeDate(dateString)
    return unavailableDates.includes(normalizedDate)
  }

  if ((!isOpen && !isVisible) || (!isOpen && isClosingRef.current)) return null
  if (!appointment) return null

  // Get tomorrow's date for min date attribute
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split("T")[0]

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
          <div className="relative z-10 flex items-center justify-center gap-2 sm:gap-2.5">
            <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full ${theme.iconBg} flex-shrink-0`}>
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 lg:h-4 lg:w-4" />
            </div>
            <h2 className="text-xs sm:text-sm md:text-base lg:text-base font-bold text-graphite text-center">
              Reschedule Appointment
            </h2>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full -ml-10 -mb-10"></div>
        </div>

        {/* Content - No scrollbar, fits all content */}
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

          {/* Current Appointment Details - Enhanced with Doctor Profile */}
          <div className="rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm mb-2 sm:mb-3">
            <h3 className="text-xs sm:text-xs md:text-sm font-semibold text-amber-800 mb-2">Current Appointment Details</h3>
            
            {/* Doctor Info with Profile Image */}
            <div className="flex items-center gap-2 sm:gap-2.5 mb-2 pb-2 border-b border-amber-200/50">
              {loadingDoctor ? (
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-amber-100 animate-pulse flex-shrink-0"></div>
              ) : (
                <ProfileImage
                  userId={appointment.doctorId}
                  alt={appointment.doctorName || "Doctor"}
                  className="flex-shrink-0"
                  size="md"
                  role="doctor"
                />
              )}
              <div className="flex-1 min-w-0">
                {loadingDoctor ? (
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-amber-100 rounded animate-pulse"></div>
                    <div className="h-3 w-16 bg-amber-100 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <>
                    <h4 className="text-xs sm:text-sm md:text-base font-semibold text-graphite truncate">
                      {appointment.doctorName || doctorDetails?.displayName || doctorDetails?.name || "Doctor"}
                    </h4>
                    <p className="text-xs sm:text-xs md:text-sm text-drift-gray">
                      {doctorDetails?.specialty || "General Practitioner"} • {appointment.type || "Consultation"}
                    </p>
                  </>
                )}
              </div>
              {appointment.mode && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold flex-shrink-0 ${
                  appointment.mode === "online" 
                    ? "bg-blue-100 text-blue-700 border border-blue-200" 
                    : "bg-purple-100 text-purple-700 border border-purple-200"
                }`}>
                  {appointment.mode === "online" ? "🌐 Online" : "🏥 Visit"}
                </span>
              )}
            </div>

            {/* Date and Time Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-2">
              <div className="flex items-start gap-2 rounded-lg border border-amber-200/50 bg-white/60 p-2 sm:p-2.5">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-soft-amber flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite">Date</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray">
                    {new Date(appointment.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-amber-200/50 bg-white/60 p-2 sm:p-2.5">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-soft-amber flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite">Time</p>
                  <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray">{appointment.time}</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-hidden min-h-0 space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-2.5">
            {/* Appointment Mode selection */}
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
                    name="reschedule-mode"
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
                    name="reschedule-mode"
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

            {/* Date and Time - Side by side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-2.5 lg:gap-3">
              <div className="space-y-1.5">
                <label htmlFor="date" className="text-xs sm:text-sm font-semibold text-graphite">
                New Date
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
                    disabled={isSubmitting || isClosing || isClosingRef.current}
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

              <div className="space-y-1.5">
                <label htmlFor="time" className="text-xs sm:text-sm font-semibold text-graphite">
                New Time
              </label>
              <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray pointer-events-none z-10" />
                <select
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  disabled={
                    loadingTimeSlots ||
                    !Array.isArray(availableTimeSlots) ||
                    availableTimeSlots.length === 0 ||
                    isDateUnavailable ||
                    dateFullyBooked ||
                      isSubmitting ||
                      isClosing ||
                      isClosingRef.current
                  }
                    className={`w-full rounded-lg border border-earth-beige bg-white py-1.5 sm:py-2 pl-10 pr-8 text-xs sm:text-sm text-graphite focus:outline-none focus:ring-1 disabled:bg-pale-stone disabled:text-drift-gray transition-all duration-300 ease-in-out hover:border-soft-amber/50 hover:shadow-sm ${theme.focusBorder} ${theme.focusRing} appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-right-2 bg-[length:14px_14px]`}
                    style={{
                      backgroundPosition: 'right 8px center',
                    }}
                >
                  <option value="">{loadingTimeSlots ? "Loading available times..." : "Select a time"}</option>
                  {Array.isArray(availableTimeSlots) &&
                    availableTimeSlots.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                </select>
              </div>

              {date && !loadingTimeSlots && (
                <div className="mt-2">
                  {Array.isArray(unavailableTimeSlots) && unavailableTimeSlots.length > 0 && (
                    <div className="text-xs text-drift-gray">
                      <p className="font-medium mb-1">Unavailable times:</p>
                      <ul className="space-y-1">
                        {unavailableTimeSlots.map((slot, index) => (
                          <li key={index} className="flex items-center text-red-500">
                            <span className="inline-block w-16">{typeof slot === "object" ? slot.time : slot}</span>
                            {typeof slot === "object" && slot.reason && (
                              <span className="text-xs">- {slot.reason}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(availableTimeSlots) &&
                    availableTimeSlots.length === 0 &&
                    !dateFullyBooked &&
                    !isDateUnavailable &&
                    !loadingTimeSlots && (
                      <div className="mt-1 flex items-center text-xs text-amber-500">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        No available time slots for this date. Please select another date.
                      </div>
                    )}
                </div>
              )}
              </div>
            </div>

            {/* Reason for Rescheduling - Full width below Date/Time */}
            <div className="space-y-1.5">
              <label htmlFor="notes" className="text-xs sm:text-sm font-semibold text-graphite">
                Reason for Rescheduling (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-drift-gray pointer-events-none z-10" />
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about why you're rescheduling"
                  rows={2}
                  className={`w-full rounded-lg border border-earth-beige bg-white py-1.5 sm:py-2 pl-10 pr-3 text-xs sm:text-sm text-graphite placeholder:text-drift-gray/60 focus:outline-none focus:ring-1 transition-colors duration-200 ${theme.focusBorder} ${theme.focusRing}`}
                  disabled={isSubmitting || isClosing || isClosingRef.current}
                />
              </div>
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
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  loadingTimeSlots ||
                  !time ||
                  !Array.isArray(availableTimeSlots) ||
                  availableTimeSlots.length === 0 ||
                  isDateUnavailable ||
                    dateFullyBooked ||
                    isClosing ||
                    isClosingRef.current
                  }
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-white ${theme.buttonBg} shadow-lg ${theme.buttonHover} hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Rescheduling...
                    </span>
                  ) : (
                    "Reschedule Appointment"
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
