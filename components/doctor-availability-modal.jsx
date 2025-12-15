"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { AlertCircle, Calendar, ChevronDown, ChevronUp, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  setDoctorAvailability,
  getDoctorAvailability,
  normalizeDate,
  formatDateForDisplay,
  updateAppointmentStatus,
} from "@/lib/appointment-utils"
import { sendNotification } from "@/lib/notification-utils"
import { sendEmailNotification } from "@/lib/email-service"
import { getUserDetails } from "@/lib/user-utils"
import { AvailabilitySuccessModal } from "@/components/availability-success-modal"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore"

export function DoctorAvailabilityModal({ isOpen, onClose, onSave }) {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [selectedDates, setSelectedDates] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState([])
  const [conflictWarning, setConflictWarning] = useState(null)
  const [bookedDates, setBookedDates] = useState({})
  const [isClosing, setIsClosing] = useState(false)
  const [error, setError] = useState(null)
  const [isConflictDropdownOpen, setIsConflictDropdownOpen] = useState(false)
  const [selectedDateDropdown, setSelectedDateDropdown] = useState(null) // Track which date's dropdown is open
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false) // Success modal state
  const isClosingRef = useRef(false)
  const modalRef = useRef(null)
  const dateButtonRefs = useRef({}) // Refs for date buttons to position dropdown

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsClosing(false)
      setIsSubmitting(false) // Reset submitting state when modal opens
      setIsSuccessModalOpen(false) // Reset success modal when availability modal opens
      isClosingRef.current = false
      setSelectedDateDropdown(null) // Reset dropdown when modal opens
      setConflictWarning(null) // Reset conflict warning
      setError(null) // Reset error state
      if (typeof document !== "undefined") {
        document.body.style.overflow = "hidden"
      }
      loadDoctorAvailability()
      loadDoctorBookedDates()
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setIsClosing(false)
        setIsSubmitting(false) // Reset submitting state when modal closes
        isClosingRef.current = false
        setSelectedDateDropdown(null) // Reset dropdown when modal closes
        setConflictWarning(null) // Reset conflict warning
        setError(null) // Reset error state
      }, 300)
      if (typeof document !== "undefined") {
        document.body.style.overflow = ""
      }
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectedDateDropdown && !e.target.closest('.calendar')) {
        setSelectedDateDropdown(null)
      }
    }
    if (selectedDateDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [selectedDateDropdown])

  // Load doctor's unavailable dates
  const loadDoctorAvailability = async () => {
    if (!user?.uid) return

    try {
      const unavailableDates = await getDoctorAvailability(user.uid)
      setSelectedDates(unavailableDates)
    } catch (error) {
      console.error("Error loading doctor availability:", error)
    }
  }

  // Load doctor's booked dates
  const loadDoctorBookedDates = async () => {
    if (!user?.uid) return

    try {
      const bookedDatesMap = {}

      // Query appointments for this doctor
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("doctorId", "==", user.uid),
        where("status", "in", ["pending", "approved"]),
      )

      const querySnapshot = await getDocs(appointmentsQuery)

      querySnapshot.forEach((doc) => {
        const appointment = doc.data()
        const date = appointment.date

        if (!bookedDatesMap[date]) {
          bookedDatesMap[date] = []
        }

        bookedDatesMap[date].push({
          id: doc.id,
          time: appointment.time,
          patientName: appointment.patientName,
          status: appointment.status,
        })
      })

      setBookedDates(bookedDatesMap)
    } catch (error) {
      console.error("Error loading doctor booked dates:", error)
    }
  }

  // Generate calendar days when month changes
  useEffect(() => {
    generateCalendarDays()
  }, [currentMonth])

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // Get the first day of the month
    const firstDay = new Date(year, month, 1)
    const firstDayIndex = firstDay.getDay()

    // Get the last day of the month
    const lastDay = new Date(year, month + 1, 0)
    const lastDate = lastDay.getDate()

    // Get the last day of the previous month
    const prevLastDay = new Date(year, month, 0)
    const prevLastDate = prevLastDay.getDate()

    // Calculate total days to display (42 = 6 rows of 7 days)
    const totalDays = 42

    const days = []

    // Previous month's days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevLastDate - i)
      days.push({
        date,
        day: prevLastDate - i,
        isCurrentMonth: false,
        isToday: false,
        dateString: normalizeDate(date),
      })
    }

    // Current month's days
    for (let i = 1; i <= lastDate; i++) {
      const date = new Date(year, month, i)
      const today = new Date()
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

      days.push({
        date,
        day: i,
        isCurrentMonth: true,
        isToday,
        dateString: normalizeDate(date),
      })
    }

    // Next month's days
    const remainingDays = totalDays - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      days.push({
        date,
        day: i,
        isCurrentMonth: false,
        isToday: false,
        dateString: normalizeDate(date),
      })
    }

    setCalendarDays(days)
  }

  // Handle date selection
  const toggleDateSelection = (dateString) => {
    const normalizedDateString = normalizeDate(dateString)
    const hasBookings = bookedDates[normalizedDateString] && bookedDates[normalizedDateString].length > 0
    
    setSelectedDates((prev) => {
      const isSelected = prev.includes(dateString)
      
      if (isSelected) {
        // Deselecting - close dropdown if open
        setSelectedDateDropdown(null)
        return prev.filter((d) => d !== dateString)
      } else {
        // Selecting - if has bookings, open dropdown
        if (hasBookings) {
          setSelectedDateDropdown(dateString)
        }
        return [...prev, dateString]
      }
    })
  }

  // Navigate to previous month
  const goToPrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // Handle closing with animation - matching appointment modal
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
      console.error("Error in onClose:", error)
    }
    
    // Reset after animation completes
    setTimeout(() => {
      setIsClosing(false)
      isClosingRef.current = false
    }, 300)
  }, [isClosing, onClose])

  const handleClose = () => {
    if (isSubmitting || isClosingRef.current) return
    handleCloseWithAnimation()
  }

  // Update the handleSubmit function to cancel/decline appointments and send notifications
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate that at least one date is selected
    if (selectedDates.length === 0) {
      setError("Please select at least one date to set as unavailable.")
      return
    }

    setIsSubmitting(true)
    setError(null) // Clear any previous errors

    try {
      // Get all appointments that will be affected
      const appointmentsToProcess = []

      for (const dateString of selectedDates) {
        const normalizedDate = normalizeDate(dateString)
        if (bookedDates[normalizedDate] && bookedDates[normalizedDate].length > 0) {
          // Get full appointment details from Firestore
          const appointmentsQuery = query(
            collection(db, "appointments"),
            where("doctorId", "==", user.uid),
            where("date", "==", normalizedDate),
            where("status", "in", ["pending", "approved", "confirmed"])
          )
          
          const querySnapshot = await getDocs(appointmentsQuery)
          querySnapshot.forEach((doc) => {
            appointmentsToProcess.push({
              id: doc.id,
              ...doc.data(),
            })
          })
        }
      }

      // Process appointments: cancel approved/confirmed, decline pending
      // Group by patient to send only ONE notification per patient
      if (appointmentsToProcess.length > 0) {
        // Group appointments by patient ID
        const appointmentsByPatient = new Map()
        
        for (const appointment of appointmentsToProcess) {
          const patientId = appointment.patientId
          if (!appointmentsByPatient.has(patientId)) {
            appointmentsByPatient.set(patientId, [])
          }
          appointmentsByPatient.get(patientId).push(appointment)
        }

        // Process each patient's appointments
        for (const [patientId, patientAppointments] of appointmentsByPatient.entries()) {
          // Process all appointments for this patient - update status WITHOUT notifications
          for (const appointment of patientAppointments) {
            const isPending = appointment.status === "pending"
            const newStatus = isPending ? "declined" : "cancelled"
            const cancellationNote = `Doctor set this date as unavailable`

            // Manually update appointment status to avoid duplicate notifications
            const appointmentRef = doc(db, "appointments", appointment.id)
            const updateData = {
              status: newStatus,
              updatedAt: serverTimestamp(),
              note: cancellationNote,
            }

            if (newStatus === "declined") {
              updateData.declinedAt = serverTimestamp()
              updateData.declinedBy = "doctor"
              updateData.notifications = { patient: false, doctor: false } // Don't notify here
            } else if (newStatus === "cancelled") {
              updateData.cancelledAt = serverTimestamp()
              updateData.cancelledBy = "doctor"
              updateData.notifications = { patient: false, doctor: false } // Don't notify here
            }

            await updateDoc(appointmentRef, updateData)
          }

          // Send ONE consolidated notification per patient
          // Get the first appointment for patient details
          const firstAppointment = patientAppointments[0]
          const patientDetails = await getUserDetails(patientId)
          const doctorDetails = await getUserDetails(user.uid)
          const doctorName = doctorDetails?.displayName || "Doctor"
          const doctorPhotoURL = doctorDetails?.photoURL || null

          // Count affected appointments
          const cancelledCount = patientAppointments.filter(a => a.status !== "pending").length
          const declinedCount = patientAppointments.filter(a => a.status === "pending").length
          const totalCount = patientAppointments.length

          // Send ONE email notification
          if (patientDetails?.email) {
            const emailSubject = totalCount === 1
              ? (declinedCount > 0 
                  ? `Appointment Request Declined - Dr. ${doctorName}`
                  : `Appointment Cancelled - Dr. ${doctorName}`)
              : `Multiple Appointments Affected - Dr. ${doctorName}`
            
            let emailMessage = `Dear ${firstAppointment.patientName || "Patient"},\n\n`
            
            if (totalCount === 1) {
              const isPending = firstAppointment.status === "pending"
              emailMessage += (isPending
                ? `We regret to inform you that your appointment request with Dr. ${doctorName}${firstAppointment.specialty ? ` (${firstAppointment.specialty})` : ''} has been declined.\n\n`
                : `We regret to inform you that your appointment with Dr. ${doctorName}${firstAppointment.specialty ? ` (${firstAppointment.specialty})` : ''} has been cancelled.\n\n`) +
                `Appointment Details:\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `Doctor: Dr. ${doctorName}${firstAppointment.specialty ? ` (${firstAppointment.specialty})` : ''}\n` +
                `Date: ${formatDateForDisplay(firstAppointment.date)}\n` +
                `Time: ${firstAppointment.time}\n` +
                `Type: ${firstAppointment.type || "Consultation"}\n` +
                `Reason: Doctor set this date as unavailable\n` +
                `Status: ${isPending ? "Declined" : "Cancelled"}\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
            } else {
              emailMessage += `We regret to inform you that ${totalCount} of your appointments with Dr. ${doctorName}${firstAppointment.specialty ? ` (${firstAppointment.specialty})` : ''} have been affected.\n\n` +
                `Summary:\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                (cancelledCount > 0 ? `• ${cancelledCount} appointment(s) cancelled\n` : '') +
                (declinedCount > 0 ? `• ${declinedCount} appointment request(s) declined\n` : '') +
                `Reason: Doctor set these dates as unavailable\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
            }

            emailMessage += `Please log in to Smart Care to ${totalCount === 1 ? (declinedCount > 0 ? "book a new appointment" : "reschedule your appointment") : "view your appointments"} if needed.\n\n` +
              `We apologize for any inconvenience.\n\n` +
              `Best regards,\n` +
              `Smart Care Team`

            sendEmailNotification(patientDetails.email, emailSubject, emailMessage, patientId)
              .then(() => {
                console.log(`✅ Email notification sent to patient: ${patientDetails.email}`)
              })
              .catch(err => {
                if (err?.message && !err.message.includes('ETIMEDOUT') && !err.message.includes('timeout')) {
                  console.error("Error sending email notification:", err)
                }
              })
          }

          // Send ONE in-app notification
          try {
            const notificationMessage = totalCount === 1
              ? `Dr. ${doctorName} has ${declinedCount > 0 ? "declined" : "cancelled"} your appointment on ${formatDateForDisplay(firstAppointment.date)} at ${firstAppointment.time}. Reason: Doctor set this date as unavailable`
              : `Dr. ${doctorName} has affected ${totalCount} of your appointments. Reason: Doctor set these dates as unavailable`

            await sendNotification(patientId, {
              title: totalCount === 1 
                ? (declinedCount > 0 ? "Appointment Request Declined" : "Appointment Cancelled")
                : "Multiple Appointments Affected",
              message: notificationMessage,
              type: "appointment",
              actionLink: "/dashboard/appointments",
              actionText: "View Appointments",
              imageUrl: doctorPhotoURL,
              metadata: {
                appointmentIds: patientAppointments.map(a => a.id),
                doctorId: user.uid,
                doctorName: doctorName,
                doctorPhotoURL: doctorPhotoURL,
                status: cancelledCount > 0 ? "cancelled" : "declined",
                cancelledBy: cancelledCount > 0 ? "doctor" : null,
                declinedBy: declinedCount > 0 ? "doctor" : null,
                isDecline: declinedCount > 0,
                cancellationReason: "Doctor set this date as unavailable",
                declineReason: "Doctor set this date as unavailable",
              },
            })
            console.log(`✅ In-app notification sent to patient`)
          } catch (notifError) {
            console.error("Error sending in-app notification:", notifError)
          }
        }
      }

      // Save unavailable dates to Firebase
      await setDoctorAvailability(user.uid, selectedDates)

      // Call the onSave callback
      if (onSave) {
        onSave(selectedDates)
      }

      // Reset submitting state before closing
      setIsSubmitting(false)

      // Close the availability modal first
      handleClose()

      // Show success modal after a short delay
      setTimeout(() => {
        setIsSuccessModalOpen(true)
      }, 300)
    } catch (error) {
      console.error("Error saving doctor availability:", error)
      setIsSubmitting(false)
      setError("Failed to update availability. Please try again.")
    }
  }

  if (!isOpen && !isVisible) return null

  // Format month name
  const monthName = currentMonth.toLocaleString("default", { month: "long" })
  const year = currentMonth.getFullYear()

  // Get day names
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  // Theme colors matching appointment modal
  const theme = {
    headerBg: "bg-gradient-to-br from-soft-amber/10 to-yellow-50",
    iconBg: "bg-soft-amber/20 text-soft-amber",
    focusBorder: "focus:border-soft-amber",
    focusRing: "focus:ring-soft-amber",
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes modalIn { 
          from { 
            opacity: 0; 
            transform: translate(-50%, -48%) scale(0.96); 
          } 
          to { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1); 
          } 
        }
        @keyframes modalOut { 
          from { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1); 
          } 
          to { 
            opacity: 0; 
            transform: translate(-50%, -48%) scale(0.96); 
          } 
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out forwards;
        }
        .animate-fade-out {
          animation: fade-out 0.25s ease-out forwards;
        }
      `}</style>
      {/* Backdrop with blur - matching appointment modal */}
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-4 bg-black/60 backdrop-blur-xl ${isClosing ? "animate-fade-out" : "animate-fade-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""}`}
        onClick={(e) => {
          // If not open or closing, prevent all interactions
          if (!isOpen || isClosing || isClosingRef.current) {
            if (e) {
              e.preventDefault()
              e.stopPropagation()
            }
            return
          }
          // Only close if clicking backdrop itself (not children)
          if (e.target !== e.currentTarget) {
            e.stopPropagation()
            return
          }
          handleCloseWithAnimation(e)
        }}
        onMouseDown={(e) => {
          // Prevent interactions if not open or closing
          if (!isOpen || isClosing || isClosingRef.current) {
            if (e) {
              e.preventDefault()
              e.stopPropagation()
            }
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
        className={`w-full max-w-md lg:max-w-2xl mx-auto rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[88vh] lg:max-h-[85vh] flex flex-col ${isClosing ? "animate-modal-out" : "animate-modal-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""} ${theme.headerBg}`}
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
        {/* Header with gradient background - matching appointment modal */}
        <div className={`${theme.headerBg} p-2 sm:p-2.5 md:p-3 lg:p-3 relative overflow-hidden flex-shrink-0`}>
          <div className="relative z-10 flex items-center gap-2 sm:gap-2.5">
            <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full ${theme.iconBg} flex-shrink-0`}>
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4" />
            </div>
            <h2 className="text-xs sm:text-sm md:text-base lg:text-base font-bold text-gray-900">Manage Availability</h2>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full -ml-10 -mb-10"></div>
        </div>

        {/* Content - matching appointment modal structure */}
        <div className="p-2.5 sm:p-3 md:p-3.5 lg:p-4 overflow-y-auto flex-1 min-h-0 flex flex-col">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 sm:p-4 mb-2 sm:mb-3 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center">
                <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-3">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs sm:text-sm font-semibold text-red-800 mb-1">
                    {error.includes("Please select") ? "No Dates Selected" : "Error"}
                  </h3>
                  <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="flex-shrink-0 mt-2 sm:mt-0 sm:ml-3 text-red-600 hover:text-red-800 transition-colors"
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0 space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-2.5">
            <p className="text-xs sm:text-sm text-gray-900">
            Select dates when you are <span className="font-semibold">unavailable</span> for appointments.
          </p>

          <div className="calendar relative">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={goToPrevMonth} 
                className="p-2 rounded-lg hover:bg-amber-50 transition-colors duration-200" 
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-soft-amber" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {monthName} {year}
              </h3>
              <button 
                onClick={goToNextMonth} 
                className="p-2 rounded-lg hover:bg-amber-50 transition-colors duration-200" 
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-soft-amber" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-2 relative">
              {/* Day names */}
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs sm:text-sm font-semibold text-gray-900 py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((day, index) => {
                const normalizedDateString = normalizeDate(day.date)
                const hasBookings = bookedDates[normalizedDateString] && bookedDates[normalizedDateString].length > 0
                const isSelected = selectedDates.includes(day.dateString)
                const isPast = day.date < new Date() && !day.isToday
                const isDropdownOpen = selectedDateDropdown === day.dateString

                return (
                  <div key={index} className="relative">
                  <button
                    type="button"
                      ref={(el) => {
                        if (el) {
                          dateButtonRefs.current[day.dateString] = el
                        }
                      }}
                      onClick={() => !isPast && toggleDateSelection(day.dateString)}
                      disabled={isPast}
                    className={`
                        w-full p-2 sm:p-2.5 text-xs sm:text-sm rounded-lg flex items-center justify-center relative transition-all duration-200
                        ${!day.isCurrentMonth ? "text-gray-400" : "text-gray-900 font-medium"}
                        ${day.isToday ? "border-2 border-soft-amber bg-amber-50 text-gray-900 font-semibold" : ""}
                        ${isSelected ? "bg-gradient-to-br from-red-100 to-red-200 text-gray-900 border-2 border-red-300 font-semibold shadow-sm" : "hover:bg-amber-50 border border-transparent text-gray-900"}
                        ${isPast ? "opacity-50 cursor-not-allowed text-gray-400" : "cursor-pointer hover:border-soft-amber/50"}
                        ${!day.isCurrentMonth && isPast ? "text-gray-300" : ""}
                    `}
                  >
                    {day.day}
                      {hasBookings && !isSelected && (
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-blue-500 shadow-sm"></span>
                      )}
                    </button>

                    {/* Floating Permission Button for selected date with bookings */}
                    {isSelected && hasBookings && isDropdownOpen && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-56 sm:w-64 bg-white rounded-lg shadow-xl border-2 border-amber-200 overflow-hidden"
                        style={{
                          position: 'absolute',
                        }}
                      >
                        {/* Content */}
                        <div className="p-3 sm:p-4">
                          <div className="flex items-start gap-2 mb-3">
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs sm:text-sm font-semibold text-graphite mb-1">
                                {formatDateForDisplay(day.dateString)}
                              </p>
                              <p className="text-xs text-drift-gray">
                                This date has existing bookings. Do you want to proceed?
                              </p>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDateDropdown(null)
                                // Deselect the date
                                setSelectedDates((prev) => prev.filter((d) => d !== day.dateString))
                              }}
                              className="flex-1 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-graphite bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDateDropdown(null)
                              }}
                              className="flex-1 px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-soft-amber to-amber-500 hover:from-amber-500 hover:to-amber-600 rounded-lg shadow-sm transition-all duration-200"
                            >
                              Proceed
                  </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span>Unavailable ({selectedDates.length})</span>
              <div className="w-2 h-2 rounded-full bg-blue-500 ml-2"></div>
              <span>Has bookings</span>
            </div>
          </div>


          {conflictWarning && (
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 shadow-sm overflow-hidden">
              {/* Dropdown Header */}
              <button
                type="button"
                onClick={() => setIsConflictDropdownOpen(!isConflictDropdownOpen)}
                className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-amber-100/50 transition-colors duration-200"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 text-left">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-amber-800">
                      Conflicting Appointments Detected
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5 truncate">
                      {conflictWarning.split('.')[0]}
                    </p>
                  </div>
                </div>
                {isConflictDropdownOpen ? (
                  <ChevronUp className="h-5 w-5 text-amber-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-amber-600 flex-shrink-0" />
                )}
              </button>

              {/* Dropdown Content */}
              {isConflictDropdownOpen && (
                <div className="border-t border-amber-200 bg-white/50 p-3 sm:p-4 space-y-3 animate-slideDown">
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-amber-800 font-medium">
                      You have existing appointments on the selected unavailable dates. These appointments will need to be rescheduled or cancelled.
                    </p>
                    {/* Show conflicting dates */}
          {selectedDates.some((date) => {
            const normalizedDate = normalizeDate(date)
            return bookedDates[normalizedDate] && bookedDates[normalizedDate].length > 0
          }) && (
                      <div className="mt-3 p-3 bg-amber-100/50 rounded-lg border border-amber-200">
                        <p className="text-xs font-semibold text-amber-900 mb-2">Conflicting Dates:</p>
                        <ul className="space-y-1.5">
                {selectedDates
                  .map((date) => {
                    const normalizedDate = normalizeDate(date)
                    if (bookedDates[normalizedDate] && bookedDates[normalizedDate].length > 0) {
                      return (
                                  <li key={date} className="text-xs text-amber-800">
                                    <span className="font-semibold">{formatDateForDisplay(date)}</span>
                                    <ul className="ml-3 mt-1 space-y-0.5">
                            {bookedDates[normalizedDate].map((booking, i) => (
                                        <li key={i} className="text-amber-700">
                                          • {booking.time} - {booking.patientName} ({booking.status})
                              </li>
                            ))}
                          </ul>
                        </li>
                      )
                    }
                    return null
                  })
                  .filter(Boolean)}
              </ul>
            </div>
          )}
              </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-amber-200">
                <button
                  type="button"
                      onClick={() => {
                        setConflictWarning(null)
                        setIsConflictDropdownOpen(false)
                      }}
                      className="rounded-lg border-2 border-soft-amber/60 bg-white px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-soft-amber shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setConflictWarning(null)
                        setIsConflictDropdownOpen(false)
                        setIsSubmitting(true)
                        try {
                    // Save unavailable dates to Firebase
                    await setDoctorAvailability(user.uid, selectedDates)
                    // Call the onSave callback
                    if (onSave) {
                      onSave(selectedDates)
                    }
                    handleClose()
                        } catch (error) {
                          console.error("Error saving availability:", error)
                          setIsSubmitting(false)
                        }
                  }}
                      className="rounded-lg bg-gradient-to-r from-soft-amber to-amber-500 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg hover:from-amber-500 hover:to-amber-600 hover:shadow-xl transition-all duration-200"
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          )}
            </div>
          )}
          </div>
            
          {/* Action Buttons - matching appointment modal style */}
          <div className="pt-1.5 sm:pt-2 md:pt-2 lg:pt-2.5 flex-shrink-0 border-t border-amber-200/30 mt-auto">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!isClosingRef.current) {
                      handleCloseWithAnimation(e)
                    }
                  }}
                  disabled={isSubmitting || isClosing || isClosingRef.current}
                  className="flex-1 sm:flex-none rounded-lg border-2 border-soft-amber/60 bg-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-soft-amber shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isClosing || isClosingRef.current}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-soft-amber to-amber-500 shadow-lg hover:from-amber-500 hover:to-amber-600 hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save Availability"
                  )}
                </button>
              </div>
            </form>
            </div>
        </div>
        </div>
      </div>

      {/* Success Modal */}
      <AvailabilitySuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message="Your availability has been updated successfully!"
      />
    </>
  )
}
