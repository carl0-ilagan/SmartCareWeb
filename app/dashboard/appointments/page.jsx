"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Clock,
  Plus,
  Search,
  X,
  SlidersHorizontal,
  CalendarDays,
  LayoutGrid,
  LayoutList,
  MapPin,
  FileText,
  CheckCircle2,
  Globe,
  Ban,
  Video,
} from "lucide-react"
import { AppointmentModal } from "@/components/appointment-modal"
import { AppointmentDetailsModal } from "@/components/appointment-details-modal"
import { CancelAppointmentModal } from "@/components/cancel-appointment-modal"
import { AppointmentSummaryModal } from "@/components/appointment-summary-modal"
import { RescheduleModal } from "@/components/reschedule-modal"
import { SuccessNotification } from "@/components/success-notification"
import { DashboardHeaderBanner } from "@/components/dashboard-header-banner"
import { useAuth } from "@/contexts/auth-context"
import { getUserAppointments, batchCheckAppointmentStatus, hasSummary } from "@/lib/appointment-utils"
import ProfileImage from "@/components/profile-image"
import PaginationControls from "@/components/pagination-controls"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, where, orderBy, limit } from "firebase/firestore"
import { getRoomIdForAppointment } from "@/lib/room-utils"

export default function AppointmentsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("appointments_viewMode")
      return saved === "list" || saved === "grid" ? saved : "grid"
    }
    return "grid"
  }) // 'list' or 'grid' - default to grid
  const [isPWA, setIsPWA] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [appointmentsPerPage] = useState(10) // 10 data per page
  // Helper: check if given ISO date string is today
  const isToday = (dateStr) => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      )
    } catch {
      return false
    }
  }

  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false)

  // Notification state
  const [notification, setNotification] = useState({ message: "", isVisible: false })

  // Appointments state
  const [appointments, setAppointments] = useState([])
  
  // Track room IDs for appointments - maps appointmentId -> roomId
  const [appointmentRoomIds, setAppointmentRoomIds] = useState({})

  // Load appointments from Firebase
  useEffect(() => {
    if (!user) return

    let unsubscribe = () => {}

    try {
      unsubscribe = getUserAppointments(user.uid, "patient", (appointmentsData) => {
        // Ensure all appointments have the necessary fields
        const validAppointments = appointmentsData.map((appointment) => ({
          ...appointment,
          doctorName: appointment.doctorName || "Unknown Doctor",
          doctorId: appointment.doctorId || "",
          status: appointment.status || "pending",
          date: appointment.date || new Date().toISOString().split("T")[0],
          time: appointment.time || "00:00",
          type: appointment.type || "Consultation",
          specialty: appointment.specialty || "",
        }))

        setAppointments(validAppointments)
        setLoading(false)
      })
    } catch (error) {
      console.error("Error loading appointments:", error)
      setLoading(false)
    }

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe()
      }
    }
  }, [user])

  // Detect PWA (standalone) to adjust list styling
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
      const iosStandalone = window.navigator.standalone === true
      setIsPWA(Boolean(standalone || iosStandalone))
    } catch {}
  }, [])

  // Show toast if redirected from ended room (doctor revoked)
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const params = new URLSearchParams(window.location.search)
      const toast = params.get("toast")
      if (toast === "room_ended_by_doctor") {
        setNotification({ message: "The room call was ended by the doctor.", isVisible: true })
        // Clean URL
        const url = new URL(window.location.href)
        url.searchParams.delete("toast")
        window.history.replaceState({}, "", url.toString())
      }
    } catch {}
  }, [])

  // Listen for rooms where this patient is invited (receiverId)
  useEffect(() => {
    if (!user?.uid) return

    // Listen for rooms where this patient is the receiver
    const roomsQuery = query(
      collection(db, "calls"),
      where("receiverId", "==", user.uid),
      where("type", "==", "video")
    )

    const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      const roomMap = {}
      
      snapshot.forEach((doc) => {
        const roomData = doc.data()
        const roomId = doc.id
        
        // Only show Join Room button when:
        // 1. Room has appointmentId (doctor created room for specific appointment)
        // 2. Patient is invited (receiverId matches current user)
        // 3. Room status is pending or active
        if (
          roomData.appointmentId && // Must have appointmentId - doctor must create room for appointment
          roomData.receiverId === user.uid &&
          (roomData.status === "pending" || roomData.status === "active")
        ) {
          // Verify appointmentId matches an existing appointment for this patient
          const matchingAppointment = appointments.find(
            (apt) =>
              apt.id === roomData.appointmentId &&
              apt.patientId === user.uid &&
              apt.doctorId === roomData.callerId
          )
          
          if (matchingAppointment) {
            roomMap[roomData.appointmentId] = roomId
          }
        }
      })
      
      setAppointmentRoomIds(roomMap)
    })

    return () => unsubscribe()
  }, [user?.uid, appointments])

  // Add this useEffect to check for appointments that need to be marked as completed
  useEffect(() => {
    if (!appointments.length) return

    const checkAppointmentsStatus = async () => {
      try {
        const updatedAppointments = await batchCheckAppointmentStatus(appointments)

        if (updatedAppointments.length > 0) {
          // Update the local state to reflect the changes
          setAppointments((prevAppointments) =>
            prevAppointments.map((apt) => {
              const updated = updatedAppointments.find((updated) => updated.id === apt.id)
              return updated || apt
            }),
          )

          // Show notification for auto-completed appointments
          if (updatedAppointments.length > 0) {
            setNotification({
              message: `${updatedAppointments.length} appointment(s) marked as completed`,
              isVisible: true,
            })
          }
        }
      } catch (error) {
        console.error("Error checking appointment status:", error)
      }
    }

    // Run immediately on mount
    checkAppointmentsStatus()

    // Set up an interval to check every 30 seconds
    const intervalId = setInterval(checkAppointmentsStatus, 30000)

    return () => clearInterval(intervalId)
  }, [appointments])

  // Filter appointments
  const filteredAppointments = appointments
    .filter((appointment) => {
      // Filter by search term
      const matchesSearch =
        (appointment.doctorName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.specialty || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.notes || "").toLowerCase().includes(searchTerm.toLowerCase())

      // Filter by status
      const matchesStatus = filterStatus === "all" || appointment.status === filterStatus

      // Filter by type
      const matchesType = filterType === "all" || appointment.type === filterType

      return matchesSearch && matchesStatus && matchesType
    })
    .sort((a, b) => {
      // Sort by date (most recent first for completed, soonest first for upcoming)
      const dateA = new Date(a.date + "T" + a.time)
      const dateB = new Date(b.date + "T" + b.time)

      if (a.status === "upcoming" && b.status === "upcoming") {
        return dateA - dateB
      } else if (a.status === "completed" && b.status === "completed") {
        return dateB - dateA
      } else if (a.status === "upcoming") {
        return -1
      } else if (b.status === "upcoming") {
        return 1
      } else {
        return dateB - dateA
      }
    })

  // Get unique appointment types for filter - include all possible types
  const allPossibleTypes = [
    "Initial Visit",
    "Follow-up",
    "Consultation",
    "Annual Physical",
    "Urgent Care",
    "Specialist Referral",
  ]
  const existingTypes = [...new Set(appointments.map((a) => a.type).filter(Boolean))]
  // Merge existing types with all possible types, remove duplicates
  const appointmentTypes = [...new Set([...allPossibleTypes, ...existingTypes])].sort()

  // Handle appointment details
  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailsModalOpen(true)
  }

  // Handle appointment cancellation
  const handleCancelAppointment = (appointment) => {
    setSelectedAppointment(appointment)
    setIsCancelModalOpen(true)
  }

  // Confirm cancellation
  const confirmCancelAppointment = (appointment, reason) => {
    // Close the cancel modal
    setIsCancelModalOpen(false)

    // Show success notification
    setNotification({
      message: "Appointment cancelled successfully",
      isVisible: true,
    })
  }

  // Handle view summary
  const handleViewSummary = (appointment) => {
    setSelectedAppointment(appointment)
    setIsSummaryModalOpen(true)
  }

  // Handle reschedule
  const handleReschedule = (appointment) => {
    setSelectedAppointment(appointment)
    setIsRescheduleModalOpen(true)
  }

  // Confirm reschedule
  const confirmReschedule = (updatedAppointment) => {
    // Update the appointment in the local state
    if (updatedAppointment && updatedAppointment.id) {
      setAppointments((prevAppointments) =>
        prevAppointments.map((apt) => (apt.id === updatedAppointment.id ? updatedAppointment : apt)),
      )
    }

    // Close the reschedule modal
    setIsRescheduleModalOpen(false)

    // Show success notification
    setNotification({
      message: "Appointment rescheduled successfully",
      isVisible: true,
    })
  }

  // Handle booking a new appointment
  const handleBookAppointment = (newAppointment) => {
    // Close the appointment modal
    setIsAppointmentModalOpen(false)

    // Show enhanced success notification
    const appointmentDate = new Date(newAppointment.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    setNotification({
      message: `✅ Appointment successfully booked with ${newAppointment.doctorName} on ${appointmentDate} at ${newAppointment.time}. ${newAppointment.status === "pending" ? "Waiting for doctor's approval." : "Appointment confirmed!"}`,
      isVisible: true,
      type: "success",
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setFilterStatus("all")
    setFilterType("all")
  }

  // Toggle view mode between list and grid
  const toggleViewMode = () => {
    const newMode = viewMode === "list" ? "grid" : "list"
    setViewMode(newMode)
    // Save to localStorage for skeleton loading
    if (typeof window !== "undefined") {
      localStorage.setItem("appointments_viewMode", newMode)
    }
  }

  // Get gradient class based on status - shared function
  const getGradientClass = (status) => {
    const isPending = status === "pending"
    const isApproved = status === "approved"
    const isCompleted = status === "completed"
    const isCancelled = status === "cancelled"

    if (isPending) return "from-amber-50 to-amber-100/50"
    if (isApproved) return "from-green-50 to-emerald-100/50"
    if (isCompleted) return "from-blue-50 to-sky-100/50"
    if (isCancelled) return "from-red-50 to-rose-100/50"
    return "from-gray-50 to-gray-100/50"
  }

  // Get status badge for appointment
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-800 shadow-sm">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        )
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-green-100 to-emerald-50 border border-green-300 px-3 py-1 text-xs font-bold text-green-800 shadow-sm">
            <CheckCircle2 className="h-3 w-3" />
            Confirmed
          </span>
        )
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-100 to-sky-50 border border-blue-300 px-3 py-1 text-xs font-bold text-blue-800 shadow-sm">
            <FileText className="h-3 w-3" />
            Completed
          </span>
        )
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-100 to-rose-50 border border-red-300 px-3 py-1 text-xs font-bold text-red-800 shadow-sm">
            <X className="h-3 w-3" />
            Cancelled
          </span>
        )
      default:
        return null
    }
  }

  // Get border color class based on status
  const getBorderColorClass = (status) => {
    switch (status) {
      case "pending":
        return "border-l-amber-400"
      case "approved":
        return "border-l-green-400"
      case "cancelled":
        return "border-l-red-400"
      case "completed":
        return ""
      default:
        return ""
    }
  }

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, filterType, searchTerm])

  // Calculate pagination - always paginate with 10 items per page
  const indexOfLastAppointment = currentPage * appointmentsPerPage
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage)
  const displayedAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment)

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    // Scroll to top of appointments section
    const appointmentsSection = document.getElementById("appointments-section")
    if (appointmentsSection) {
      appointmentsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Render appointment in list view
  const renderListAppointment = (appointment, index) => {
    const isCompleted = appointment.status === "completed"
    const isCancelled = appointment.status === "cancelled"
    const isPending = appointment.status === "pending"
    const isApproved = appointment.status === "approved"

    // Check if there's an active room for this appointment where patient is invited
    const roomId = appointmentRoomIds[appointment.id]
    const hasActiveRoom = !!roomId
    const canShowJoin = Boolean(
      roomId && appointment.status === "approved" && (appointment.mode === "online") && isToday(appointment.date)
    )

    // Get first letter of doctor name for fallback
    const doctorInitial = appointment.doctorName ? appointment.doctorName.charAt(0).toUpperCase() : "D"

    const listContainerClasses = `group relative overflow-hidden rounded-md border border-earth-beige bg-white px-3 sm:px-4 py-3 shadow-sm transition-colors hover:bg-pale-stone`

    return (
      <div
        key={appointment.id}
        className={listContainerClasses}
        style={{
          animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
          opacity: 0,
        }}
      >
        {/* Minimalist list: no decorative backgrounds */}
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {!isPWA && (
                <div className="hidden sm:block absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-sm"></div>
              )}
              <div className="relative">
                {isPWA ? (
                  <ProfileImage userId={appointment.doctorId} size="sm" fallback={doctorInitial} role="doctor" />
                ) : (
                  <>
                    <ProfileImage userId={appointment.doctorId} size="sm" className="sm:hidden" fallback={doctorInitial} role="doctor" />
                    <ProfileImage userId={appointment.doctorId} size="md" className="hidden sm:block" fallback={doctorInitial} role="doctor" />
                  </>
                )}
              </div>
              {isApproved && (
                <div className={`absolute ${isPWA ? "-bottom-0.5 -right-0.5 h-4 w-4" : "-bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5"} flex items-center justify-center rounded-full bg-green-500 border-2 border-white`}>
                  <CheckCircle2 className={`${isPWA ? "h-2.5 w-2.5" : "h-2.5 w-2.5 sm:h-3 sm:w-3"} text-white`} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <h3 className={`font-semibold text-graphite group-hover:text-amber-600 transition-colors truncate ${isPWA ? "text-[13px]" : "text-sm sm:text-lg"}`}>
                  {appointment.doctorName || "Loading..."}
                </h3>
                {getStatusBadge(appointment.status)}
                {appointment.mode && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    appointment.mode === "online" 
                      ? "bg-blue-100 text-blue-700 border border-blue-200" 
                      : "bg-purple-100 text-purple-700 border border-purple-200"
                  }`}>
                    <span className="flex items-center gap-1">
                      {appointment.mode === "online" ? (
                        <>
                          <Globe className="h-3 w-3" />
                          <span>Online</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="h-3 w-3" />
                          <span>In-Person</span>
                        </>
                      )}
                    </span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-drift-gray mb-1 sm:mb-3 hidden sm:block">
                {appointment.specialty || "General Practice"}
              </p>
              
              {/* Date and Time - Minimalist on mobile */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mb-2 sm:mb-3">
                <div className="flex items-center gap-1 sm:gap-2 rounded-md sm:rounded-lg bg-amber-50/50 sm:bg-white/90 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-2 border border-amber-200/50 sm:border-amber-200 shadow-sm sm:shadow-md hover:shadow-md sm:hover:shadow-lg transition-all">
                  <Calendar
                    className={`h-3 w-3 sm:h-4 sm:w-4 ${
                      isCompleted || isCancelled ? "text-drift-gray" : "text-soft-amber"
                    }`}
                  />
                  <span className="text-xs sm:text-sm font-semibold text-graphite whitespace-nowrap">
                    <span className="sm:hidden">{new Date(appointment.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span className="hidden sm:inline">{new Date(appointment.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 rounded-md sm:rounded-lg bg-amber-50/50 sm:bg-white/90 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-2 border border-amber-200/50 sm:border-amber-200 shadow-sm sm:shadow-md hover:shadow-md sm:hover:shadow-lg transition-all">
                  <Clock className={`h-3 w-3 sm:h-4 sm:w-4 ${
                    isCompleted || isCancelled ? "text-drift-gray" : "text-soft-amber"
                  }`} />
                  <span className="text-xs sm:text-sm font-semibold text-graphite">{appointment.time}</span>
                </div>
                {appointment.type && (
                  <div className="hidden sm:flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-2 border border-amber-200 shadow-md hover:shadow-lg transition-all">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-soft-amber/20">
                      <FileText className="h-4 w-4 text-soft-amber" />
                    </div>
                    <span className="text-sm font-semibold text-graphite">{appointment.type}</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Action Buttons (right side) */}
          <div className={`flex flex-row sm:flex-col gap-2 lg:flex-col xl:flex-row flex-wrap ml-auto items-start ${isPWA ? "mt-1" : ""}`}>
            {/* Join via notification only; no Join button in list */}
            {appointment.status === "completed" ? (
              <button
                onClick={() => handleViewSummary(appointment)}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all transform hover:scale-105 ${
                  hasSummary(appointment)
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                }`}
                disabled={!hasSummary(appointment)}
                title={!hasSummary(appointment) ? "Summary not available yet" : ""}
              >
                <FileText className="h-4 w-4" />
                View Summary
              </button>
            ) : appointment.status === "cancelled" ? (
              <button
                onClick={() => handleReschedule(appointment)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-soft-amber to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-amber-500 hover:to-amber-600 transition-all transform hover:scale-105"
              >
                <Calendar className="h-4 w-4" />
                Reschedule
              </button>
            ) : appointment.status === "declined" ? (
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-drift-gray">
                Appointment Declined
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleViewDetails(appointment)}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-earth-beige bg-white px-4 py-2 text-sm font-medium text-graphite hover:bg-pale-stone transition-colors shadow-sm"
                >
                  <FileText className="h-4 w-4" />
                  Details
                </button>
                <button
                  onClick={() => handleCancelAppointment(appointment)}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors shadow-sm"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notes Section - hidden on mobile for minimalist view */}
        {appointment.notes && (
          <div className="hidden sm:block mt-4 rounded-lg bg-white/80 backdrop-blur-sm border border-amber-200/50 p-4 shadow-md">
            <div className="flex items-center gap-1.5 text-sm text-drift-gray">
              <FileText className="h-3.5 w-3.5 text-graphite flex-shrink-0" />
              <span className="font-semibold text-graphite">Notes:</span>
              <span>{appointment.notes}</span>
            </div>
          </div>
        )}
        {appointment.note && appointment.status === "cancelled" && (
          <div className="hidden sm:block mt-4 rounded-lg bg-red-50/80 backdrop-blur-sm border border-red-200 p-4 shadow-md">
            <div className="flex items-center gap-1.5 text-sm text-red-700">
              <Ban className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
              <span className="font-semibold">Cancellation Reason:</span>
              <span>{appointment.note}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render appointment in grid view
  const renderGridAppointment = (appointment, index) => {
    const isCompleted = appointment.status === "completed"
    const isCancelled = appointment.status === "cancelled"
    const isPending = appointment.status === "pending"
    const isApproved = appointment.status === "approved"

    // Check if there's an active room for this appointment where patient is invited
    const roomId = appointmentRoomIds[appointment.id]
    const hasActiveRoom = !!roomId
    const canShowJoin = Boolean(
      roomId && appointment.status === "approved" && (appointment.mode === "online") && isToday(appointment.date)
    )

    // Get first letter of doctor name for fallback
    const doctorInitial = appointment.doctorName ? appointment.doctorName.charAt(0).toUpperCase() : "D"

    // Get gradient and status styling
    const getStatusStyles = () => {
      if (isPending) {
        return {
          topBar: "bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600",
          glow: "shadow-amber-500/20",
          badgeBg: "bg-amber-50 border-amber-200",
          badgeText: "text-amber-700",
        }
      } else if (isApproved) {
        return {
          topBar: "bg-gradient-to-r from-green-400 via-emerald-500 to-green-600",
          glow: "shadow-green-500/20",
          badgeBg: "bg-green-50 border-green-200",
          badgeText: "text-green-700",
        }
      } else if (isCompleted) {
        return {
          topBar: "bg-gradient-to-r from-blue-400 via-sky-500 to-blue-600",
          glow: "shadow-blue-500/20",
          badgeBg: "bg-blue-50 border-blue-200",
          badgeText: "text-blue-700",
        }
      } else if (isCancelled) {
        return {
          topBar: "bg-gradient-to-r from-red-400 via-rose-500 to-red-600",
          glow: "shadow-red-500/20",
          badgeBg: "bg-red-50 border-red-200",
          badgeText: "text-red-700",
        }
      }
      return {
        topBar: "bg-gradient-to-r from-gray-400 to-gray-600",
        glow: "shadow-gray-500/20",
        badgeBg: "bg-gray-50 border-gray-200",
        badgeText: "text-gray-700",
      }
    }

    const statusStyles = getStatusStyles()

    return (
      <div
        key={appointment.id}
        className={`relative overflow-hidden rounded-xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] flex flex-col ${
          isCompleted ? "opacity-90 hover:opacity-100" : ""
        } ${isCancelled ? "opacity-85 hover:opacity-100" : ""}`}
        style={{
          animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
          opacity: 0,
        }}
      >

        {/* Content */}
        <div className="p-5 flex flex-col h-full">
          {/* Header with profile and name */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className={`absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-md`}></div>
                <div className="relative">
                  <ProfileImage userId={appointment.doctorId} size="md" fallback={doctorInitial} role="doctor" />
                </div>
                {isApproved && (
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 border-2 border-white shadow-sm">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-graphite text-base group-hover:text-amber-600 transition-colors">
                    {appointment.doctorName || "Loading..."}
                  </h3>
                </div>
                <p className="text-xs font-medium text-drift-gray mt-0.5">
                  {appointment.specialty || "General Practice"}
                </p>
              </div>
            </div>
            {/* Join via notification only; no Join button in grid header */}
          </div>

          {/* Status badge and mode */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {getStatusBadge(appointment.status)}
            {appointment.mode && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${
                appointment.mode === "online" 
                  ? "bg-blue-100 text-blue-700 border border-blue-200" 
                  : "bg-purple-100 text-purple-700 border border-purple-200"
              }`}>
                {appointment.mode === "online" ? (
                  <>
                    <Globe className="h-3 w-3" />
                    <span>Video</span>
                  </>
                ) : (
                  <>
                    <MapPin className="h-3 w-3" />
                    <span>Person</span>
                  </>
                )}
              </span>
            )}
          </div>

          {/* Date and Time Cards - matching modal style */}
          <div className="space-y-2 mb-4">
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
                <p className="text-sm font-semibold text-graphite">{appointment.time}</p>
              </div>
            </div>
            {appointment.type && (
              <div className="flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur-sm border border-amber-200 p-2.5 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-soft-amber/20">
                  <FileText className="h-4 w-4 text-soft-amber" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-drift-gray font-medium">Type</p>
                  <p className="text-sm font-semibold text-graphite truncate">{appointment.type}</p>
                </div>
              </div>
            )}
          </div>


          {/* Notes */}
          {appointment.notes && (
            <div className="mb-4 rounded-lg bg-gradient-to-br from-pale-stone/60 to-pale-stone/40 border border-amber-100 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="h-3 w-3 text-graphite" />
                <p className="text-xs font-semibold text-graphite">Notes</p>
              </div>
              <p className="text-xs text-drift-gray line-clamp-2">{appointment.notes}</p>
            </div>
          )}

          {appointment.note && appointment.status === "cancelled" && (
            <div className="mb-4 rounded-lg bg-red-50/80 border border-red-200 p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Ban className="h-3 w-3 text-red-700" />
                <p className="text-xs font-semibold text-red-700">Cancelled</p>
              </div>
              <p className="text-xs text-red-600 line-clamp-2">{appointment.note}</p>
            </div>
          )}

          {/* Action Buttons - footer section with consistent alignment */}
          <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-pale-stone">
            {appointment.status === "completed" ? (
              <button
                onClick={() => handleViewSummary(appointment)}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all transform hover:scale-105 ${
                  hasSummary(appointment)
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                }`}
                disabled={!hasSummary(appointment)}
                title={!hasSummary(appointment) ? "Summary not available yet" : ""}
              >
                <FileText className="h-3.5 w-3.5" />
                View Summary
              </button>
            ) : appointment.status === "cancelled" ? (
              <button
                onClick={() => handleReschedule(appointment)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:shadow-lg hover:from-amber-600 hover:to-amber-700 transition-all transform hover:scale-105"
              >
                <Calendar className="h-3.5 w-3.5" />
                Reschedule
              </button>
            ) : appointment.status === "declined" ? (
              <button
                onClick={() => handleViewDetails(appointment)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-amber-300 bg-white px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all transform hover:scale-105 shadow-sm hover:shadow-md"
              >
                <FileText className="h-3.5 w-3.5" />
                Details
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleViewDetails(appointment)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-amber-300 bg-white px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all transform hover:scale-105 shadow-sm hover:shadow-md"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Details
                </button>
                <button
                  onClick={() => handleCancelAppointment(appointment)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-red-500 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
      </div>
    )
  }

  // Create book appointment button for header
  const bookAppointmentButton = (
    <button
      onClick={() => setIsAppointmentModalOpen(true)}
      className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-soft-amber shadow-sm transition-all hover:bg-amber-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 animate-fadeIn"
    >
      <Plus className="mr-2 h-4 w-4" />
      Book Appointment
    </button>
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Dashboard Header Banner with page-specific content */}
      <DashboardHeaderBanner
        userRole="patient"
        title="My Appointments"
        subtitle="Schedule and manage your healthcare visits"
        actionButton={bookAppointmentButton}
        showMetrics={false}
      />

      {/* Search and controls - matching modal style */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray pointer-events-none" />
          <input
            type="text"
            placeholder="Search by doctor or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-amber-200 bg-white py-2.5 pl-10 pr-3 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber transition-all shadow-sm hover:shadow-md"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleViewMode}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-sm font-medium text-graphite shadow-sm transition-all hover:bg-amber-50 hover:border-amber-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
          >
            {viewMode === "list" ? (
              <>
                <LayoutGrid className="h-4 w-4" />
                Grid View
              </>
            ) : (
              <>
                <LayoutList className="h-4 w-4" />
                List View
              </>
            )}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-sm font-medium text-graphite shadow-sm transition-all hover:bg-amber-50 hover:border-amber-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 relative"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(filterStatus !== "all" || filterType !== "all") && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-soft-amber to-amber-500 text-xs font-bold text-white shadow-md">
                {(filterStatus !== "all" ? 1 : 0) + (filterType !== "all" ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters with smooth animation - matching modal style */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showFilters
            ? "max-h-96 opacity-100 mb-4"
            : "max-h-0 opacity-0 mb-0"
        }`}
      >
        <div className="rounded-2xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:space-x-4 sm:space-y-0">
            <div className="flex-1 space-y-2">
              <label htmlFor="filterStatus" className="text-sm font-semibold text-graphite">
                Status
              </label>
              <div className="relative">
                <select
                  id="filterStatus"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 bg-white py-2.5 pl-3 pr-8 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber transition-all shadow-sm hover:shadow-md appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>')}")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '14px 14px',
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <label htmlFor="filterType" className="text-sm font-semibold text-graphite">
                Type
              </label>
              <div className="relative">
                <select
                  id="filterType"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 bg-white py-2.5 pl-3 pr-8 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber transition-all shadow-sm hover:shadow-md appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>')}")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 8px center',
                    backgroundSize: '14px 14px',
                  }}
                >
                  <option value="all">All Types</option>
                  {appointmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-sm font-medium text-graphite transition-all hover:bg-amber-50 hover:border-amber-300 hover:shadow-md shadow-sm"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4" id="appointments-section">
        {loading ? (
          // Loading state
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
              <p className="text-drift-gray">Loading your appointments...</p>
            </div>
          </div>
        ) : displayedAppointments.length > 0 ? (
          <>
            {/* Display all filtered appointments with pagination (10 per page) */}
            {viewMode === "list" ? (
              <div className="space-y-4">
                {displayedAppointments.map((appointment, index) => renderListAppointment(appointment, index))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedAppointments.map((appointment, index) => renderGridAppointment(appointment, index))}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-8 text-center shadow-lg animate-fadeIn backdrop-blur-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-soft-amber/20">
              <CalendarDays className="h-8 w-8 text-soft-amber" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-graphite">No Appointments Found</h3>
            <p className="mb-4 text-sm text-drift-gray">
              {searchTerm || filterStatus !== "all" || filterType !== "all"
                ? "No appointments match your search criteria. Try adjusting your filters."
                : "You don't have any appointments scheduled. Book your first appointment now."}
            </p>
            <button
              onClick={() => setIsAppointmentModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-soft-amber to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-amber-500 hover:to-amber-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 transform hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              Book Appointment
            </button>
          </div>
        )}
        {/* Pagination - always show if there are more than 10 appointments */}
        {filteredAppointments.length > appointmentsPerPage && (
          <div className="mt-6">
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        )}
      </div>

      {/* Modals */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        userRole="patient"
        onBook={handleBookAppointment}
      />

      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointment={selectedAppointment}
        onCancel={handleCancelAppointment}
        onViewSummary={handleViewSummary}
      />

      <CancelAppointmentModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        appointment={selectedAppointment}
        onConfirm={confirmCancelAppointment}
      />

      <AppointmentSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        appointment={selectedAppointment}
      />

      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={() => setIsRescheduleModalOpen(false)}
        appointment={selectedAppointment}
        onReschedule={confirmReschedule}
      />

      {/* Success Notification */}
      <SuccessNotification
        message={notification.message}
        isVisible={notification.isVisible}
        type={notification.type || "success"}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
