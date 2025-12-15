"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  X,
  SlidersHorizontal,
  CalendarDays,
  LayoutGrid,
  LayoutList,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getPatientById } from "@/lib/doctor-utils"
import { getUserAppointments } from "@/lib/appointment-utils"
import { AppointmentDetailsModal } from "@/components/appointment-details-modal"

export default function PatientAppointmentsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [patient, setPatient] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState("list") // 'list' or 'grid'
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Get patient ID from URL
  const patientId = params.id

  // Load patient data and appointments
  useEffect(() => {
    if (!user || !patientId) return

    const loadData = async () => {
      setLoading(true)

      try {
        // Get patient data
        const patientData = await getPatientById(patientId)
        setPatient(patientData)

        // Set up listener for appointments
        const unsubscribe = getUserAppointments(patientId, "patient", (appointmentsData) => {
          // Only include appointments with this doctor
          const filteredAppointments = appointmentsData.filter((appointment) => appointment.doctorId === user.uid)
          setAppointments(filteredAppointments)
          setLoading(false)
        })

        return () => {
          if (typeof unsubscribe === "function") {
            unsubscribe()
          }
        }
      } catch (error) {
        console.error("Error loading data:", error)
        setLoading(false)
      }
    }

    loadData()
  }, [user, patientId])

  // Filter appointments
  const filteredAppointments = appointments
    .filter((appointment) => {
      // Filter by search term
      const matchesSearch =
        (appointment.type || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.notes || "").toLowerCase().includes(searchTerm.toLowerCase())

      // Filter by status
      const matchesStatus = filterStatus === "all" || appointment.status === filterStatus

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      // Sort by date (most recent first for completed, soonest first for upcoming)
      const dateA = new Date(a.date + "T" + a.time)
      const dateB = new Date(b.date + "T" + b.time)

      // Pending appointments first
      if (a.status === "pending" && b.status !== "pending") return -1
      if (a.status !== "pending" && b.status === "pending") return 1

      // Then approved appointments
      if (a.status === "approved" && b.status !== "approved" && b.status !== "pending") return -1
      if (a.status !== "approved" && a.status !== "pending" && b.status === "approved") return 1

      // Then by date
      if ((a.status === "pending" || a.status === "approved") && (b.status === "pending" || b.status === "approved")) {
        return dateA - dateB
      } else if (a.status === "completed" && b.status === "completed") {
        return dateB - dateA
      } else {
        return dateB - dateA
      }
    })

  // Navigate back to patient details
  const handleBackToPatient = () => {
    router.push(`/doctor/patients/${patientId}`)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setFilterStatus("all")
  }

  // Toggle view mode between list and grid
  const toggleViewMode = () => {
    setViewMode(viewMode === "list" ? "grid" : "list")
  }

  // Open appointment details modal
  const openDetailsModal = (appointment) => {
    setSelectedAppointment(appointment)
    setShowDetailsModal(true)
  }

  // Close appointment details modal
  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedAppointment(null)
  }

  // Get status badge for appointment
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            Pending
          </span>
        )
      case "approved":
        return (
          <span className="ml-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Approved
          </span>
        )
      case "completed":
        return (
          <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
            Completed
          </span>
        )
      case "cancelled":
        return (
          <span className="ml-2 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Cancelled</span>
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

  // Render appointment in list view
  const renderListAppointment = (appointment, index) => {
    const isCompleted = appointment.status === "completed"
    const isCancelled = appointment.status === "cancelled"
    const isPending = appointment.status === "pending"

    return (
      <div
        key={appointment.id}
        className={`group overflow-hidden rounded-lg border-l-4 ${getBorderColorClass(
          appointment.status,
        )} border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-amber-300/30 ${
          isCompleted ? "opacity-80 hover:opacity-100" : ""
        } ${isCancelled ? "opacity-70 hover:opacity-90" : ""}`}
        style={{
          animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`,
          opacity: 0,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-3 sm:mb-0">
            <div className="flex items-center">
              <User className={`mr-2 h-5 w-5 ${isCompleted || isCancelled ? "text-gray-400" : "text-amber-500"}`} />
              <h3 className="font-medium text-gray-800">{patient?.displayName || "Patient"}</h3>
              {getStatusBadge(appointment.status)}
            </div>
            <p className="text-sm text-gray-500">{appointment.type}</p>
            {appointment.notes && <p className="text-sm text-gray-500">Notes: {appointment.notes}</p>}
            {appointment.note && appointment.status === "approved" && (
              <p className="mt-1 text-sm font-medium text-gray-700">
                Your note: <span className="font-normal text-gray-500">{appointment.note}</span>
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center rounded-md bg-gray-100 px-3 py-1">
              <Calendar className={`mr-2 h-4 w-4 ${isCompleted || isCancelled ? "text-gray-400" : "text-amber-500"}`} />
              <span className="text-sm text-gray-700">{new Date(appointment.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center rounded-md bg-gray-100 px-3 py-1">
              <Clock className={`mr-2 h-4 w-4 ${isCompleted || isCancelled ? "text-gray-400" : "text-amber-500"}`} />
              <span className="text-sm text-gray-700">{appointment.time}</span>
            </div>
            {isCancelled && (
              <div className="flex items-center rounded-md bg-gray-100 px-3 py-1">
                <X className="mr-2 h-4 w-4 text-red-500" />
                <span className="text-sm text-red-500">Cancelled</span>
              </div>
            )}
          </div>
        </div>
        {appointment.note && appointment.status === "cancelled" && (
          <div className="mt-3 rounded-md bg-red-50 p-2">
            <p className="text-sm text-red-700">
              <span className="font-medium">Reason:</span> {appointment.note}
            </p>
          </div>
        )}
        <div className="mt-4 flex justify-end space-x-2">
          {appointment.status === "completed" ? (
            <button
              onClick={() => openDetailsModal(appointment)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              View Details
            </button>
          ) : appointment.status === "cancelled" ? (
            <button
              onClick={() => openDetailsModal(appointment)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              View Details
            </button>
          ) : appointment.status === "pending" ? (
            <>
              <button
                onClick={() => openDetailsModal(appointment)}
                className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                View Details
              </button>
              <button
                onClick={() => {}}
                className="rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-200"
              >
                Decline
              </button>
              <button
                onClick={() => {}}
                className="rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-600 transition-colors hover:bg-green-200"
              >
                Approve
              </button>
            </>
          ) : (
            <button
              onClick={() => openDetailsModal(appointment)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    )
  }

  // Render appointment in grid view
  const renderGridAppointment = (appointment, index) => {
    const isCompleted = appointment.status === "completed"
    const isCancelled = appointment.status === "cancelled"
    const isPending = appointment.status === "pending"

    return (
      <div
        key={appointment.id}
        className={`group rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-amber-300/30 ${
          isCompleted ? "opacity-80 hover:opacity-100" : ""
        } ${isCancelled ? "opacity-70 hover:opacity-90" : ""}`}
        style={{
          animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`,
          opacity: 0,
        }}
      >
        <div
          className={`h-2 w-full ${
            appointment.status === "pending"
              ? "bg-amber-400"
              : appointment.status === "approved"
                ? "bg-green-400"
                : appointment.status === "cancelled"
                  ? "bg-red-400"
                  : "bg-blue-400"
          }`}
        ></div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center">
              <User className={`mr-2 h-5 w-5 ${isCompleted || isCancelled ? "text-gray-400" : "text-amber-500"}`} />
              <h3 className="font-medium text-gray-800">{patient?.displayName || "Patient"}</h3>
            </div>
            {getStatusBadge(appointment.status)}
          </div>

          <p className="text-sm text-gray-500 mb-2">{appointment.type}</p>

          {appointment.notes && <p className="text-sm text-gray-500 mb-2 line-clamp-2">Notes: {appointment.notes}</p>}

          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center">
              <Calendar className={`mr-2 h-4 w-4 ${isCompleted || isCancelled ? "text-gray-400" : "text-amber-500"}`} />
              <span className="text-sm text-gray-700">{new Date(appointment.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <Clock className={`mr-2 h-4 w-4 ${isCompleted || isCancelled ? "text-gray-400" : "text-amber-500"}`} />
              <span className="text-sm text-gray-700">{appointment.time}</span>
            </div>
          </div>

          {appointment.note && appointment.status === "cancelled" && (
            <div className="mt-3 rounded-md bg-red-50 p-2">
              <p className="text-sm text-red-700">
                <span className="font-medium">Reason:</span> {appointment.note}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {appointment.status === "completed" ||
            appointment.status === "cancelled" ||
            appointment.status === "approved" ? (
              <button
                onClick={() => openDetailsModal(appointment)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                View Details
              </button>
            ) : appointment.status === "pending" ? (
              <>
                <button
                  onClick={() => openDetailsModal(appointment)}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  View Details
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {}}
                    className="flex-1 rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-600 transition-colors hover:bg-red-200"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => {}}
                    className="flex-1 rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-600 transition-colors hover:bg-green-200"
                  >
                    Approve
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/90 to-amber-600 p-6 shadow-md">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10"></div>

        <div className="relative z-10">
          <button
            onClick={handleBackToPatient}
            className="mb-4 inline-flex items-center rounded-md bg-white/20 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Patient
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              {!loading && patient ? (
                <>
                  <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white md:text-3xl">Appointments</h1>
                    <p className="mt-1 text-amber-50">{patient.displayName}'s appointment history</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mr-4 h-16 w-16 animate-pulse rounded-full bg-white/20"></div>
                  <div>
                    <div className="h-7 w-48 animate-pulse rounded-md bg-white/20 mb-2"></div>
                    <div className="h-5 w-32 animate-pulse rounded-md bg-white/20"></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by type or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-gray-700 placeholder:text-gray-400/60 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={toggleViewMode}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            {viewMode === "list" ? (
              <>
                <LayoutGrid className="mr-2 h-4 w-4" />
                Grid View
              </>
            ) : (
              <>
                <LayoutList className="mr-2 h-4 w-4" />
                List View
              </>
            )}
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {filterStatus !== "all" && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                1
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm animate-slideDown">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:space-x-4 sm:space-y-0">
            <div className="flex-1 space-y-2">
              <label htmlFor="filterStatus" className="text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-gray-700 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button
              onClick={clearFilters}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          // Loading state
          <div className="flex justify-center py-12">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mb-4"></div>
              <p className="text-gray-500">Loading appointments...</p>
            </div>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <>
            {/* Pending Appointments */}
            {filteredAppointments.some((a) => a.status === "pending") && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Pending Appointments</h2>
                {viewMode === "list" ? (
                  <div className="space-y-4">
                    {filteredAppointments
                      .filter((a) => a.status === "pending")
                      .map((appointment, index) => renderListAppointment(appointment, index))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAppointments
                      .filter((a) => a.status === "pending")
                      .map((appointment, index) => renderGridAppointment(appointment, index))}
                  </div>
                )}
              </div>
            )}

            {/* Approved Appointments */}
            {filteredAppointments.some((a) => a.status === "approved") && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Approved Appointments</h2>
                {viewMode === "list" ? (
                  <div className="space-y-4">
                    {filteredAppointments
                      .filter((a) => a.status === "approved")
                      .map((appointment, index) => renderListAppointment(appointment, index))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAppointments
                      .filter((a) => a.status === "approved")
                      .map((appointment, index) => renderGridAppointment(appointment, index))}
                  </div>
                )}
              </div>
            )}

            {/* Past Appointments */}
            {filteredAppointments.some((a) => a.status === "completed") && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Past Appointments</h2>
                {viewMode === "list" ? (
                  <div className="space-y-4">
                    {filteredAppointments
                      .filter((a) => a.status === "completed")
                      .map((appointment, index) => renderListAppointment(appointment, index))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAppointments
                      .filter((a) => a.status === "completed")
                      .map((appointment, index) => renderGridAppointment(appointment, index))}
                  </div>
                )}
              </div>
            )}

            {/* Cancelled Appointments */}
            {filteredAppointments.some((a) => a.status === "cancelled") && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Cancelled Appointments</h2>
                {viewMode === "list" ? (
                  <div className="space-y-4">
                    {filteredAppointments
                      .filter((a) => a.status === "cancelled")
                      .map((appointment, index) => renderListAppointment(appointment, index))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAppointments
                      .filter((a) => a.status === "cancelled")
                      .map((appointment, index) => renderGridAppointment(appointment, index))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <CalendarDays className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-1 text-lg font-medium text-gray-800">No Appointments Found</h3>
            <p className="mb-4 text-gray-500">
              {searchTerm || filterStatus !== "all"
                ? "No appointments match your search criteria. Try adjusting your filters."
                : `You don't have any appointments with ${patient?.displayName || "this patient"} yet.`}
            </p>
            <button
              onClick={handleBackToPatient}
              className="inline-flex items-center rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patient Profile
            </button>
          </div>
        )}
      </div>

      {/* Appointment Details Modal */}
      {showDetailsModal && selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          isOpen={showDetailsModal}
          onClose={closeDetailsModal}
          viewMode="doctor"
          patient={patient}
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
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
