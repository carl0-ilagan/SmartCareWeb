"use client"
import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Check,
  X,
  Download,
  Eye,
  CheckCircle,
  ChevronDown,
} from "lucide-react"
import { collection, getDocs, query, orderBy, getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AdminHeaderBanner } from "@/components/admin-header-banner"

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    completed: 0,
  })

  // Fetch appointments data
  useEffect(() => {
    async function fetchAppointments() {
      try {
        setIsLoading(true)
        const appointmentsRef = collection(db, "appointments")
        const appointmentsQuery = query(appointmentsRef, orderBy("date", "desc"))
        const querySnapshot = await getDocs(appointmentsQuery)

        const appointmentsData = []
        let confirmedCount = 0
        let pendingCount = 0
        let completedCount = 0

        // Process each appointment
        for (const docSnapshot of querySnapshot.docs) {
          const data = docSnapshot.data()

          // Fetch doctor details to get specialty and image
          let doctorSpecialty = "General Practitioner"
          let doctorEmail = ""
          let doctorAvatar = data.doctorAvatar || null
          if (data.doctorId) {
            try {
              const doctorDoc = await getDoc(doc(db, "users", data.doctorId))
              if (doctorDoc.exists()) {
                const doctorData = doctorDoc.data()
                doctorSpecialty = doctorData.specialty || "General Practitioner"
                doctorEmail = doctorData.email || ""
                // Use the doctor's photoURL if available and not already set
                if (!doctorAvatar && doctorData.photoURL) {
                  doctorAvatar = doctorData.photoURL
                }
              }
            } catch (err) {
              console.error("Error fetching doctor details:", err)
            }
          }

          // Fetch patient details to get email and image
          let patientEmail = data.patientEmail || ""
          let patientAvatar = data.patientAvatar || null
          if (data.patientId) {
            try {
              const patientDoc = await getDoc(doc(db, "users", data.patientId))
              if (patientDoc.exists()) {
                const patientData = patientDoc.data()
                patientEmail = patientData.email || ""
                // Use the patient's photoURL if available and not already set
                if (!patientAvatar && patientData.photoURL) {
                  patientAvatar = patientData.photoURL
                }
              }
            } catch (err) {
              console.error("Error fetching patient details:", err)
            }
          }

          const appointment = {
            id: docSnapshot.id,
            patientName: data.patientName || "Unknown Patient",
            patientEmail: patientEmail,
            doctorName: data.doctorName || "Unknown Doctor",
            doctorEmail: doctorEmail,
            doctorSpecialty: doctorSpecialty,
            date: data.date || new Date().toISOString().split("T")[0],
            time: data.time || "00:00",
            status: data.status || "pending",
            type: data.type || "consultation",
            patientAvatar: patientAvatar || "/placeholder.svg?height=40&width=40",
            doctorAvatar: doctorAvatar || "/placeholder.svg?height=40&width=40",
            reason: data.reason || "",
            patientId: data.patientId || "",
            doctorId: data.doctorId || "",
            createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : null,
            updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : null,
            location: data.location || "Virtual Consultation",
          }

          // Count by status
          if (appointment.status === "confirmed" || appointment.status === "approved") confirmedCount++
          else if (appointment.status === "pending") pendingCount++
          else if (appointment.status === "completed") completedCount++

          appointmentsData.push(appointment)
        }

        setAppointments(appointmentsData)
        setFilteredAppointments(appointmentsData)
        setStats({
          total: appointmentsData.length,
          confirmed: confirmedCount,
          pending: pendingCount,
          completed: completedCount,
        })
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching appointments:", err)
        setError("Failed to load appointments. Please try again later.")
        setIsLoading(false)
      }
    }

    fetchAppointments()
  }, [])

  // Handle search and filter
  useEffect(() => {
    let result = [...appointments]

    // Apply search
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase()
      result = result.filter(
        (appointment) =>
          appointment.patientName.toLowerCase().includes(searchTermLower) ||
          appointment.doctorName.toLowerCase().includes(searchTermLower) ||
          (appointment.patientEmail && appointment.patientEmail.toLowerCase().includes(searchTermLower)) ||
          (appointment.doctorEmail && appointment.doctorEmail.toLowerCase().includes(searchTermLower)) ||
          appointment.doctorSpecialty.toLowerCase().includes(searchTermLower) ||
          appointment.type.toLowerCase().includes(searchTermLower),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      // Handle both "confirmed" and "approved" as the same status
      if (statusFilter === "confirmed") {
        result = result.filter((appointment) => appointment.status === "confirmed" || appointment.status === "approved")
      } else {
        result = result.filter((appointment) => appointment.status === statusFilter)
      }
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const todayStr = today.toISOString().split("T")[0]
      const tomorrowStr = tomorrow.toISOString().split("T")[0]

      if (dateFilter === "today") {
        result = result.filter((appointment) => appointment.date === todayStr)
      } else if (dateFilter === "tomorrow") {
        result = result.filter((appointment) => appointment.date === tomorrowStr)
      } else if (dateFilter === "upcoming") {
        result = result.filter((appointment) => {
          const appointmentDate = new Date(appointment.date)
          return appointmentDate >= today
        })
      } else if (dateFilter === "past") {
        result = result.filter((appointment) => {
          const appointmentDate = new Date(appointment.date)
          return appointmentDate < today
        })
      }
    }

    setFilteredAppointments(result)
    setCurrentPage(1)
  }, [searchTerm, statusFilter, dateFilter, appointments])

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "No date"
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE))
  const paginatedAppointments = filteredAppointments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  // Format time for display
  const formatTime = (time) => {
    return time || "Not specified"
  }

  // Get status icon and color
  const getStatusDisplay = (status) => {
    switch (status) {
      case "confirmed":
      case "approved":
        return {
          icon: <Check className="h-3 w-3 mr-1" />,
          label: "Confirmed",
          className: "bg-green-100 text-green-800",
        }
      case "pending":
        return {
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: "Pending",
          className: "bg-yellow-100 text-yellow-800",
        }
      case "cancelled":
        return {
          icon: <X className="h-3 w-3 mr-1" />,
          label: "Cancelled",
          className: "bg-red-100 text-red-800",
        }
      case "completed":
        return {
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
          label: "Completed",
          className: "bg-blue-100 text-blue-800",
        }
      default:
        return {
          icon: <Clock className="h-3 w-3 mr-1" />,
          label: status.charAt(0).toUpperCase() + status.slice(1),
          className: "bg-gray-100 text-gray-800",
        }
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse w-full">
        <div className="h-40 bg-gray-200 rounded-xl mb-6"></div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gray-200 h-8 w-64 rounded"></h1>
          <div className="bg-gray-200 h-10 w-32 rounded"></div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 w-full">
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="bg-gray-200 h-10 w-full md:w-64 rounded"></div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="bg-gray-200 h-10 w-full md:w-48 rounded"></div>
              <div className="bg-gray-200 h-10 w-full md:w-48 rounded"></div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {[...Array(7)].map((_, i) => (
                    <th key={i} className="py-3 px-4 border-b border-earth-beige">
                      <div className="bg-gray-200 h-6 w-full rounded"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="py-4 px-4 border-b border-earth-beige">
                        <div className="bg-gray-200 h-6 w-full rounded"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="w-full">
        <AdminHeaderBanner title="Appointments" subtitle="View all patient appointments" />
        <div className="bg-white rounded-lg shadow-sm p-6 w-full">
          <div className="text-center py-10">
            <div className="text-red-500 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <AdminHeaderBanner
        title="Appointments"
        subtitle="View all patient appointments in the system"
        stats={[
          {
            label: "Total",
            value: stats.total,
            icon: <Calendar className="h-4 w-4 text-white/70" />,
          },
          {
            label: "Confirmed",
            value: stats.confirmed,
            icon: <Check className="h-4 w-4 text-white/70" />,
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: <Clock className="h-4 w-4 text-white/70" />,
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: <CheckCircle className="h-4 w-4 text-white/70" />,
          },
        ]}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-graphite">Appointments</h1>
        <button
          onClick={() => (window.location.href = "/admin/reports?type=appointments")}
          className="inline-flex items-center px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 w-full">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search by name, email, specialty..."
              className="w-full pl-10 pr-4 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-1 focus:ring-soft-amber"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-drift-gray" />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            {/* Status dropdown */}
            <div className="relative w-full md:w-48">
              <button
                onClick={() => setStatusDropdownOpen((prev) => !prev)}
                className="w-full inline-flex items-center justify-between pl-10 pr-3 py-2 border border-earth-beige rounded-md bg-white text-graphite text-sm font-medium shadow-sm transition hover:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              >
                <span className="flex items-center">
                  <Filter className="h-5 w-5 text-drift-gray mr-2 absolute left-3" />
                  {statusFilter === "all"
                    ? "All Status"
                    : statusFilter === "confirmed"
                      ? "Confirmed"
                      : statusFilter === "pending"
                        ? "Pending"
                        : statusFilter === "completed"
                          ? "Completed"
                          : "Cancelled"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-drift-gray transition-transform duration-200 ${statusDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`absolute left-0 right-0 mt-1 origin-top rounded-lg border border-earth-beige bg-white shadow-lg transition-all duration-200 ease-out ${
                  statusDropdownOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
                }`}
              >
                {[
                  { value: "all", label: "All Status" },
                  { value: "confirmed", label: "Confirmed" },
                  { value: "pending", label: "Pending" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setStatusFilter(option.value)
                      setStatusDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      statusFilter === option.value ? "bg-soft-amber text-white" : "text-graphite hover:bg-pale-stone"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date dropdown */}
            <div className="relative w-full md:w-48">
              <button
                onClick={() => setDateDropdownOpen((prev) => !prev)}
                className="w-full inline-flex items-center justify-between pl-10 pr-3 py-2 border border-earth-beige rounded-md bg-white text-graphite text-sm font-medium shadow-sm transition hover:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              >
                <span className="flex items-center">
                  <Calendar className="h-5 w-5 text-drift-gray mr-2 absolute left-3" />
                  {dateFilter === "all"
                    ? "All Dates"
                    : dateFilter === "today"
                      ? "Today"
                      : dateFilter === "tomorrow"
                        ? "Tomorrow"
                        : dateFilter === "upcoming"
                          ? "Upcoming"
                          : "Past Appointments"}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-drift-gray transition-transform duration-200 ${dateDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`absolute left-0 right-0 mt-1 origin-top rounded-lg border border-earth-beige bg-white shadow-lg transition-all duration-200 ease-out ${
                  dateDropdownOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
                }`}
              >
                {[
                  { value: "all", label: "All Dates" },
                  { value: "today", label: "Today" },
                  { value: "tomorrow", label: "Tomorrow" },
                  { value: "upcoming", label: "Upcoming" },
                  { value: "past", label: "Past Appointments" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setDateFilter(option.value)
                      setDateDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      dateFilter === option.value ? "bg-soft-amber text-white" : "text-graphite hover:bg-pale-stone"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Appointments - mobile cards */}
        <div className="grid gap-3 sm:hidden">
          {paginatedAppointments.length > 0 ? (
            paginatedAppointments.map((appointment) => {
              const { icon, label, className } = getStatusDisplay(appointment.status)
              return (
                <div
                  key={appointment.id}
                  className="p-4 rounded-lg border border-earth-beige bg-white shadow-sm"
                  onClick={() => {
                    setSelectedAppointment(appointment)
                    setShowDetailsModal(true)
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={appointment.patientAvatar || "/placeholder.svg"}
                        alt={appointment.patientName}
                        className="h-10 w-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = "/placeholder.svg?height=40&width=40"
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-graphite truncate">{appointment.patientName}</p>
                        <p className="text-xs text-drift-gray truncate">{appointment.patientEmail || "No email"}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
                      {icon}
                      {label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={appointment.doctorAvatar || "/placeholder.svg"}
                      alt={appointment.doctorName}
                      className="h-9 w-9 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "/placeholder.svg?height=36&width=36"
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-drift-gray">Doctor</p>
                      <p className="text-sm font-medium text-graphite truncate">{appointment.doctorName}</p>
                      <p className="text-xs text-drift-gray truncate">{appointment.doctorSpecialty}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-graphite mt-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-drift-gray mr-2" />
                      <span className="truncate">{formatDate(appointment.date)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-drift-gray mr-2" />
                      <span>{formatTime(appointment.time)}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-drift-gray mr-2" />
                      <span className="capitalize">{appointment.type}</span>
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAppointment(appointment)
                          setShowDetailsModal(true)
                        }}
                        className="p-2 text-soft-amber hover:bg-amber-50 rounded-full"
                        aria-label="View appointment"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center text-drift-gray py-6 bg-cream rounded-lg border border-earth-beige">
              No appointments found matching your criteria.
            </div>
          )}
        </div>

        {/* Appointments Table */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Patient
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Doctor
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Date
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Time
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Type
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Status
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppointments.length > 0 ? (
                paginatedAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-pale-stone/50">
                    <td className="py-4 px-4 border-b border-earth-beige">
                      <div className="flex items-center">
                        <img
                          src={appointment.patientAvatar || "/placeholder.svg"}
                          alt={appointment.patientName}
                          className="h-10 w-10 rounded-full mr-3 object-cover"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = "/placeholder.svg?height=40&width=40"
                          }}
                        />
                        <div>
                          <span className="font-medium text-graphite">{appointment.patientName}</span>
                          <p className="text-xs text-drift-gray">{appointment.patientEmail || "Email not available"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige">
                      <div className="flex items-center">
                        <img
                          src={appointment.doctorAvatar || "/placeholder.svg"}
                          alt={appointment.doctorName}
                          className="h-10 w-10 rounded-full mr-3 object-cover"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.src = "/placeholder.svg?height=40&width=40"
                          }}
                        />
                        <div>
                          <span className="font-medium text-graphite">{appointment.doctorName}</span>
                          <p className="text-xs text-drift-gray">{appointment.doctorSpecialty}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige text-drift-gray">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-drift-gray" />
                        {formatDate(appointment.date)}
                      </div>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige text-drift-gray">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-drift-gray" />
                        {formatTime(appointment.time)}
                      </div>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige">
                      <span className="capitalize text-drift-gray">{appointment.type}</span>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige">
                      {(() => {
                        const { icon, label, className } = getStatusDisplay(appointment.status)
                        return (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
                          >
                            {icon}
                            {label}
                          </span>
                        )
                      })()}
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige text-right">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment)
                            setShowDetailsModal(true)
                          }}
                          className="p-1 rounded-full hover:bg-pale-stone text-drift-gray"
                          aria-label="View appointment details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-drift-gray border-b border-earth-beige">
                    No appointments found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-drift-gray">
            Showing <span className="font-medium">{paginatedAppointments.length}</span> of{" "}
            <span className="font-medium">{filteredAppointments.length}</span> appointments
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 border border-earth-beige rounded-md text-drift-gray hover:bg-pale-stone disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="text-sm text-graphite">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 border border-earth-beige rounded-md text-drift-gray hover:bg-pale-stone disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-graphite mr-3">Appointment Details</h3>
                {(() => {
                  const { icon, label, className } = getStatusDisplay(selectedAppointment.status)
                  return (
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
                    >
                      {icon}
                      {label}
                    </span>
                  )
                })()}
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 rounded-full hover:bg-pale-stone text-drift-gray"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-pale-stone/30 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-graphite mb-3 border-b pb-2 border-earth-beige">
                  Patient Information
                </h4>
                <div className="flex items-center mb-4">
                  <img
                    src={selectedAppointment.patientAvatar || "/placeholder.svg"}
                    alt={selectedAppointment.patientName}
                    className="h-16 w-16 rounded-full mr-3 border-2 border-white shadow-sm object-cover"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.svg?height=64&width=64"
                    }}
                  />
                  <div>
                    <p className="font-medium text-graphite text-lg">{selectedAppointment.patientName}</p>
                    <p className="text-sm text-drift-gray">
                      {selectedAppointment.patientEmail || "Email not available"}
                    </p>
                    {selectedAppointment.patientId && (
                      <p className="text-xs text-drift-gray mt-1">
                        <a
                          href={`/admin/patients/${selectedAppointment.patientId}`}
                          className="text-soft-amber hover:underline inline-flex items-center"
                        >
                          View Patient Profile
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 ml-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <h4 className="text-sm font-medium text-graphite mb-3 border-b pb-2 border-earth-beige mt-6">
                  Doctor Information
                </h4>
                <div className="flex items-center mb-4">
                  <img
                    src={selectedAppointment.doctorAvatar || "/placeholder.svg"}
                    alt={selectedAppointment.doctorName}
                    className="h-16 w-16 rounded-full mr-3 border-2 border-white shadow-sm object-cover"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "/placeholder.svg?height=64&width=64"
                    }}
                  />
                  <div>
                    <p className="font-medium text-graphite text-lg">{selectedAppointment.doctorName}</p>
                    <p className="text-sm text-drift-gray">{selectedAppointment.doctorSpecialty}</p>
                    {selectedAppointment.doctorEmail && (
                      <p className="text-xs text-drift-gray">{selectedAppointment.doctorEmail}</p>
                    )}
                    {selectedAppointment.doctorId && (
                      <p className="text-xs text-drift-gray mt-1">
                        <a
                          href={`/admin/doctors/${selectedAppointment.doctorId}`}
                          className="text-soft-amber hover:underline inline-flex items-center"
                        >
                          View Doctor Profile
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3 ml-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-pale-stone/30 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-graphite mb-3 border-b pb-2 border-earth-beige">
                  Appointment Details
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-soft-amber mr-3" />
                    <div>
                      <p className="font-medium text-graphite">Date</p>
                      <p className="text-sm text-drift-gray">{formatDate(selectedAppointment.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-soft-amber mr-3" />
                    <div>
                      <p className="font-medium text-graphite">Time</p>
                      <p className="text-sm text-drift-gray">{formatTime(selectedAppointment.time)}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <User className="h-5 w-5 text-soft-amber mr-3" />
                    <div>
                      <p className="font-medium text-graphite">Appointment Type</p>
                      <p className="text-sm text-drift-gray capitalize">{selectedAppointment.type}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-soft-amber mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-graphite">Location</p>
                      <p className="text-sm text-drift-gray">{selectedAppointment.location}</p>
                    </div>
                  </div>

                  {selectedAppointment.createdAt && (
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-soft-amber mr-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-graphite">Created</p>
                        <p className="text-sm text-drift-gray">
                          {selectedAppointment.createdAt?.toLocaleDateString()} at{" "}
                          {selectedAppointment.createdAt?.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedAppointment.reason && (
              <div className="mt-4 pt-4 border-t border-earth-beige">
                <h4 className="text-sm font-medium text-graphite mb-2">Reason for Visit</h4>
                <p className="text-drift-gray bg-pale-stone/50 p-3 rounded-md">{selectedAppointment.reason}</p>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-earth-beige flex justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 border border-earth-beige rounded-md text-drift-gray hover:bg-pale-stone"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
