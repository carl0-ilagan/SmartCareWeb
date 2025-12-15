"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  CalendarDays,
  SlidersHorizontal,
  FileText,
  LayoutGrid,
  LayoutList,
  Eye,
  CheckCircle2,
  Globe,
  X,
  Ban,
} from "lucide-react"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AppointmentDetailsModal } from "@/components/appointment-details-modal"
import { AppointmentSummaryModal } from "@/components/appointment-summary-modal"
import { hasSummary } from "@/lib/appointment-utils"
import PaginationControls from "@/components/pagination-controls"
import ProfileImage from "@/components/profile-image"

// Add doctorId and viewMode props to the component definition
export function AppointmentHistory({ userId, viewMode: initialViewMode = "patient", doctorId }) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [isClosingFilters, setIsClosingFilters] = useState(false)
  const [filterDate, setFilterDate] = useState("")
  const [error, setError] = useState("")
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showSummaryModal, setShowSummaryModal] = useState(false)
  // Add view mode state (grid or list) - default to grid for consistency
  const [viewMode, setViewMode] = useState("grid")
  // Appointments per page - 9 for consistent pagination
  const appointmentsPerPage = 9
  const [currentPage, setCurrentPage] = useState(1)

  // Load appointments
  // In the useEffect where appointments are loaded, update the query based on viewMode
  useEffect(() => {
    if (!userId) return
    
    // For doctor view, doctorId is REQUIRED for privacy protection
    if (initialViewMode === "doctor" && !doctorId) {
      setError("Doctor ID is required to view patient appointment history")
      setLoading(false)
      setAppointments([])
      return
    }

    try {
      setLoading(true)
      setError("")

      // Create the appropriate query based on viewMode
      // IMPORTANT: For doctor view, only show appointments where the doctor is the current doctor
      // This ensures patient privacy - doctors can only see their own appointments with the patient
      let q
      if (initialViewMode === "doctor" && doctorId) {
        // For doctor view: Filter by both doctorId AND patientId for privacy
        // Doctor can only see appointments where they are the attending doctor
        q = query(
          collection(db, "appointments"),
          where("doctorId", "==", doctorId),
          where("patientId", "==", userId),
          orderBy("date", "desc"),
        )
      } else {
        // For patient view: Get all appointments for the patient
        q = query(collection(db, "appointments"), where("patientId", "==", userId), orderBy("date", "desc"))
      }

      // Rest of the code remains the same
      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const appointmentsData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          
          // Additional client-side filter for privacy protection (defense in depth)
          // Ensure doctors can ONLY see appointments where they are the attending doctor
          let filteredData = appointmentsData
          if (initialViewMode === "doctor" && doctorId) {
            filteredData = appointmentsData.filter((appointment) => {
              // Double-check: Only show if doctorId matches (extra privacy layer)
              return appointment.doctorId === doctorId && appointment.patientId === userId
            })
          }
          
          // Sort appointments by date (most recent first)
          const sortedAppointments = [...filteredData].sort(
            (a, b) => new Date(b.date + " " + b.time) - new Date(a.date + " " + a.time),
          )
          setAppointments(sortedAppointments)
          setLoading(false)
        },
        (error) => {
          console.error("Error fetching appointments:", error)
          setError(error.message)
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Error fetching appointments:", error)
      setError(error.message)
      setLoading(false)
    }
  }, [userId, initialViewMode, doctorId])

  // Filter appointments based on search, status, and date
  const filteredAppointments = appointments.filter((appointment) => {
    // Filter by search term
    const matchesSearch =
      appointment.doctorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.location?.toLowerCase().includes(searchTerm.toLowerCase())

    // Filter by status
    const matchesStatus = filterStatus === "all" || appointment.status === filterStatus

    // Filter by date
    const matchesDate = !filterDate || appointment.date === filterDate

    return matchesSearch && matchesStatus && matchesDate
  })

  // Calculate pagination
  const indexOfLastAppointment = currentPage * appointmentsPerPage
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / appointmentsPerPage))
  const displayedAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment)

  // Get gradient class based on status - matching appointments page
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
        return "border-l-blue-400"
      default:
        return "border-l-soft-amber"
    }
  }

  // Get status badge - matching appointments page
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
            Approved
          </span>
        )
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-100 to-sky-50 border border-blue-300 px-3 py-1 text-xs font-bold text-blue-800 shadow-sm">
            <CheckCircle2 className="h-3 w-3" />
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date"

    try {
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
      return new Date(dateString).toLocaleDateString(undefined, options)
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }


  // Handle view details
  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment)
    setShowSummaryModal(false)
  }

  // Handle view summary
  const handleViewSummary = (appointment) => {
    setSelectedAppointment(appointment)
    setShowSummaryModal(true)
  }

  // Handle cancel appointment
  const handleCancelAppointment = (appointment) => {
    // This would be implemented to handle cancellation
    console.log("Cancel appointment:", appointment.id)
  }

  // Update the useEffect to check for appointments that need to be marked as completed
  useEffect(() => {
    if (!appointments.length) return

    const checkAppointmentsStatus = async () => {
      // Mock function to simulate checking appointment status
      const batchCheckAppointmentStatus = async (appointments) => {
        return []
      }
      const updatedAppointments = await batchCheckAppointmentStatus(appointments)

      if (updatedAppointments.length > 0) {
        // Update the local state to reflect the changes
        setAppointments((prevAppointments) =>
          prevAppointments.map((apt) => {
            const updated = updatedAppointments.find((updated) => updated.id === apt.id)
            return updated || apt
          }),
        )
      }
    }

    // Run immediately on mount
    checkAppointmentsStatus()

    // Set up an interval to check every minute
    const intervalId = setInterval(checkAppointmentsStatus, 60000)

    return () => clearInterval(intervalId)
  }, [appointments])

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    // Scroll to top of appointments section
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatus, filterDate])

  // Handle filter toggle with smooth animation
  const handleToggleFilters = () => {
    if (showFilters) {
      setIsClosingFilters(true)
      setTimeout(() => {
        setShowFilters(false)
        setIsClosingFilters(false)
      }, 300)
    } else {
      setShowFilters(true)
      setIsClosingFilters(false)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setFilterStatus("all")
    setFilterDate("")
    setCurrentPage(1)
  }

  // Render appointment in list view - matching appointments page
  const renderListAppointment = (appointment, index) => {
    const isCompleted = appointment.status === "completed"
    const isCancelled = appointment.status === "cancelled"
    const isPending = appointment.status === "pending"
    const isApproved = appointment.status === "approved"

    // Get first letter of doctor/patient name for fallback
    const nameInitial = initialViewMode === "doctor" 
      ? (appointment.patientName?.charAt(0).toUpperCase() || "P")
      : (appointment.doctorName?.charAt(0).toUpperCase() || "D")

    return (
      <div
        key={appointment.id}
        className={`group relative overflow-hidden rounded-lg sm:rounded-2xl border-l-4 ${getBorderColorClass(appointment.status)} border border-amber-200/30 sm:border-amber-200/50 bg-white sm:bg-gradient-to-br ${getGradientClass(appointment.status)} p-3 sm:p-6 shadow-sm sm:shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-md sm:hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:border-amber-300/60 ${
          isCompleted ? "opacity-90 hover:opacity-100" : ""
        } ${isCancelled ? "opacity-85 hover:opacity-100" : ""}`}
        style={{
          animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
          opacity: 0,
        }}
      >
        {/* Decorative background pattern - hidden on mobile */}
        <div className="hidden sm:block absolute right-0 top-0 h-32 w-32 bg-white/20 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="hidden sm:block absolute bottom-0 left-0 h-24 w-24 bg-white/20 rounded-full -ml-12 -mb-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="hidden sm:block absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full opacity-20 group-hover:opacity-40 transition-opacity blur-sm"></div>
              <div className="relative">
                <ProfileImage 
                  userId={initialViewMode === "doctor" ? appointment.patientId : appointment.doctorId} 
                  size="sm" 
                  className="sm:hidden" 
                  fallback={nameInitial} 
                  role={initialViewMode === "doctor" ? "patient" : "doctor"} 
                />
                <ProfileImage 
                  userId={initialViewMode === "doctor" ? appointment.patientId : appointment.doctorId} 
                  size="md" 
                  className="hidden sm:block" 
                  fallback={nameInitial} 
                  role={initialViewMode === "doctor" ? "patient" : "doctor"} 
                />
              </div>
              {isApproved && (
                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-green-500 border-2 border-white">
                  <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <h3 className="text-sm sm:text-lg font-semibold text-graphite group-hover:text-amber-600 transition-colors truncate">
                  {initialViewMode === "doctor" ? appointment.patientName : appointment.doctorName}
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
                {appointment.specialty || appointment.type || "General Practice"}
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
                  <span className="text-xs sm:text-sm font-semibold text-graphite">{appointment.time || "Time not specified"}</span>
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

          {/* Action Buttons - matching modal style, minimalist on mobile */}
          <div className="flex flex-row sm:flex-col gap-2 lg:flex-col xl:flex-row flex-wrap">
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
            ) : (
              <button
                onClick={() => handleViewDetails(appointment)}
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-graphite hover:bg-amber-50 hover:border-soft-amber/50 transition-all transform hover:scale-105 shadow-sm hover:shadow-md"
              >
                <FileText className="h-4 w-4" />
                Details
              </button>
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

  // Render appointment in grid view - matching appointments page
  const renderGridAppointment = (appointment, index) => {
    const isCompleted = appointment.status === "completed"
    const isCancelled = appointment.status === "cancelled"
    const isPending = appointment.status === "pending"
    const isApproved = appointment.status === "approved"

    // Get first letter of doctor/patient name for fallback
    const nameInitial = initialViewMode === "doctor" 
      ? (appointment.patientName?.charAt(0).toUpperCase() || "P")
      : (appointment.doctorName?.charAt(0).toUpperCase() || "D")

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
        className={`group relative overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br ${getGradientClass(appointment.status)} shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-2 backdrop-blur-sm flex flex-col min-h-[500px] ${
          isCompleted ? "opacity-90 hover:opacity-100" : ""
        } ${isCancelled ? "opacity-85 hover:opacity-100" : ""}`}
        style={{
          animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
          opacity: 0,
        }}
      >
        {/* Decorative circles - matching modal */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Animated top bar */}
        <div className={`relative h-3 w-full ${statusStyles.topBar} overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col h-full">
          {/* Header with profile, name */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className={`absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-md`}></div>
                <div className="relative">
                  <ProfileImage 
                    userId={initialViewMode === "doctor" ? appointment.patientId : appointment.doctorId} 
                    size="md" 
                    fallback={nameInitial} 
                    role={initialViewMode === "doctor" ? "patient" : "doctor"} 
                  />
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
                    {initialViewMode === "doctor" ? appointment.patientName : appointment.doctorName}
                  </h3>
                </div>
                <p className="text-xs font-medium text-drift-gray mt-0.5">
                  {appointment.specialty || appointment.type || "General Practice"}
                </p>
              </div>
            </div>
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
                <p className="text-sm font-semibold text-graphite">{appointment.time || "Time not specified"}</p>
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
            ) : (
              <button
                onClick={() => handleViewDetails(appointment)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border-2 border-amber-300 bg-white px-4 py-2.5 text-xs font-bold text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all transform hover:scale-105 shadow-sm hover:shadow-md"
              >
                <FileText className="h-3.5 w-3.5" />
                Details
              </button>
            )}
          </div>
        </div>

        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray" />
          <input
            type="text"
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-earth-beige bg-white py-2 pl-10 pr-3 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-graphite shadow-sm transition-all hover:bg-amber-50 hover:border-soft-amber/50 hover:shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
          >
            {viewMode === "grid" ? (
              <>
                <LayoutList className="h-4 w-4" />
                List View
              </>
            ) : (
              <>
                <LayoutGrid className="h-4 w-4" />
                Grid View
              </>
            )}
          </button>
          <button
            onClick={handleToggleFilters}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-graphite shadow-sm transition-all hover:bg-amber-50 hover:border-soft-amber/50 hover:shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(filterStatus !== "all" || filterDate) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-soft-amber to-amber-500 text-xs font-bold text-white shadow-md">
                {(filterStatus !== "all" ? 1 : 0) + (filterDate ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className={`rounded-lg border border-amber-200 bg-white p-4 shadow-md transition-all duration-300 ${
          isClosingFilters ? "animate-slideUp opacity-0" : "animate-slideDown opacity-100"
        }`}>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:space-x-4 sm:space-y-0">
            <div className="flex-1 space-y-2">
              <label htmlFor="filterStatus" className="text-sm font-semibold text-graphite">
                Appointment Status
              </label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-lg border border-amber-200 bg-white py-2 px-3 text-sm text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber transition-all shadow-sm hover:shadow-md"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="approved">Scheduled</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="flex-1 space-y-2">
              <label htmlFor="filterDate" className="text-sm font-semibold text-graphite">
                Appointment Date
              </label>
              <input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full rounded-lg border border-amber-200 bg-white py-2 px-3 text-sm text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber transition-all shadow-sm hover:shadow-md"
              />
            </div>

            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-graphite transition-all hover:bg-amber-50 hover:border-soft-amber/50 hover:shadow-md transform hover:scale-105 w-full sm:w-auto shadow-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soft-amber mb-4"></div>
            <p className="text-drift-gray">Loading your appointment history...</p>
          </div>
        </div>
      ) : filteredAppointments.length > 0 ? (
        <>
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
            {searchTerm || filterStatus !== "all" || filterDate
              ? "No appointments match your search criteria. Try adjusting your filters."
              : "You don't have any appointment history yet."}
          </p>
        </div>
      )}

      {/* Replace the load more button with pagination controls */}
      {filteredAppointments.length > 0 && totalPages > 1 && (
        <div className="mt-6">
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && !showSummaryModal && (
        <AppointmentDetailsModal
          isOpen={true}
          onClose={() => setSelectedAppointment(null)}
          appointment={selectedAppointment}
          viewMode={initialViewMode}
          onCancel={handleCancelAppointment}
          onViewSummary={() => setShowSummaryModal(true)}
          fromHistory={true} // Pass fromHistory prop to hide cancel button
        />
      )}

      {/* Appointment Summary Modal */}
      {selectedAppointment && showSummaryModal && (
        <AppointmentSummaryModal
          isOpen={true}
          onClose={() => {
            setShowSummaryModal(false)
            setSelectedAppointment(null)
          }}
          appointment={selectedAppointment}
        />
      )}

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
        
        @keyframes slideUp {
          from {
            opacity: 1;
            transform: translateY(0);
            max-height: 500px;
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
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
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
