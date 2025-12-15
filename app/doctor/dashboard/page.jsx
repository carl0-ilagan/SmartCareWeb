"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  User,
  Users,
  Clock8,
  CalendarClock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileBarChart,
  UserPlus,
  ClipboardCheck,
  FileSymlink,
} from "lucide-react"
import { MiniCalendar } from "@/components/mini-calendar"
import { AppointmentModal } from "@/components/appointment-modal"
import { DoctorAvailabilityModal } from "@/components/doctor-availability-modal"
import { AvailabilitySuccessModal } from "@/components/availability-success-modal"
import { AppointmentSuccessModal } from "@/components/appointment-success-modal"
import { DashboardHeaderBanner } from "@/components/dashboard-header-banner"
import { useAuth } from "@/contexts/auth-context"
import { formatDateForDisplay } from "@/lib/appointment-utils"
import ProfileImage from "@/components/profile-image"
import {
  getConnectedPatients,
  getTodayAppointments,
  getUnreadMessageCount,
  getAppointmentCounts,
  getCalendarAppointments,
  getPrescriptionCount,
} from "@/lib/dashboard-utils"
import { getDoctorPrescriptions } from "@/lib/prescription-utils"
import { getDoctorAvailability, setDoctorAvailability } from "@/lib/appointment-utils"
import { getNewlyConnectedPatients, getFollowUpAppointments, getPatientRecordStats } from "@/lib/doctor-utils"
import { NotificationListener } from "@/components/notification-listener"

export default function DoctorDashboard() {
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [unavailableDates, setUnavailableDates] = useState([])
  const [showAvailabilitySuccessModal, setShowAvailabilitySuccessModal] = useState(false)
  const [showAppointmentSuccessModal, setShowAppointmentSuccessModal] = useState(false)
  const [appointmentSuccessMessage, setAppointmentSuccessMessage] = useState("")
  const [dashboardData, setDashboardData] = useState({
    patientInteractions: { count: 0, patients: [] },
    todayAppointments: [],
    recentPrescriptions: [],
    prescriptionCount: 0,
    unreadMessages: 0,
    monthlyCounts: {
      appointments: 0,
      prescriptions: 0,
    },
    calendarAppointments: [],
  })
  const [patientInsights, setPatientInsights] = useState({
    newPatients: { count: 0, patients: [] },
    followUps: { count: 0, appointments: [] },
    recordStats: { total: 0, shared: 0, recent: 0 },
    isLoading: true,
  })
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  // Load unavailable dates on component mount - only show upcoming dates
  useEffect(() => {
    const loadUnavailableDates = async () => {
      if (!user?.uid) return

      try {
        // Try to get from Firebase first
        const unavailableDatesArray = await getDoctorAvailability(user.uid)
        if (unavailableDatesArray && unavailableDatesArray.length > 0) {
          // Filter to only show upcoming unavailable dates (not past dates)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          const upcomingUnavailableDates = unavailableDatesArray.filter((dateString) => {
            try {
              const date = new Date(dateString)
              date.setHours(0, 0, 0, 0)
              return date >= today
            } catch (error) {
              console.error("Error parsing date:", dateString, error)
              return false
            }
          })
          
          setUnavailableDates(upcomingUnavailableDates)
          return
        }

        // Fallback to localStorage if Firebase fails or returns empty
        const savedDates = localStorage.getItem("doctorUnavailableDates")
        if (savedDates) {
          try {
            const parsedDates = JSON.parse(savedDates)
            // Filter to only show upcoming unavailable dates
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            const upcomingUnavailableDates = parsedDates.filter((dateString) => {
              try {
                const date = new Date(dateString)
                date.setHours(0, 0, 0, 0)
                return date >= today
              } catch (error) {
                console.error("Error parsing date:", dateString, error)
                return false
              }
            })
            
            setUnavailableDates(upcomingUnavailableDates)
          } catch (error) {
            console.error("Error parsing saved dates:", error)
            setUnavailableDates([])
          }
        }
      } catch (error) {
        console.error("Error loading unavailable dates:", error)
        // Fallback to localStorage
        const savedDates = localStorage.getItem("doctorUnavailableDates")
        if (savedDates) {
          try {
            const parsedDates = JSON.parse(savedDates)
            // Filter to only show upcoming unavailable dates
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            
            const upcomingUnavailableDates = parsedDates.filter((dateString) => {
              try {
                const date = new Date(dateString)
                date.setHours(0, 0, 0, 0)
                return date >= today
              } catch (error) {
                console.error("Error parsing date:", dateString, error)
                return false
              }
            })
            
            setUnavailableDates(upcomingUnavailableDates)
          } catch (error) {
            console.error("Error parsing saved dates:", error)
            setUnavailableDates([])
          }
        }
      }
    }

    loadUnavailableDates()
  }, [user])

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.uid) return

      setIsLoading(true)
      try {
        // Get connected patients
        const patientInteractions = await getConnectedPatients(user.uid)

        // Get today's appointments
        const todayAppointments = await getTodayAppointments(user.uid, 3) // Limit to 3

        // Get prescription count
        const prescriptionCount = await getPrescriptionCount(user.uid, true)

        // Get prescription details
        const prescriptionResult = await getDoctorPrescriptions(user.uid)
        const recentPrescriptions = prescriptionResult.success
          ? prescriptionResult.prescriptions.slice(0, 5).map((prescription) => ({
              id: prescription.id,
              patient: prescription.patientName || "Unknown Patient",
              medication: prescription.medications[0]?.name || "Medication",
              dosage: prescription.medications[0]?.dosage || "",
              frequency: prescription.medications[0]?.frequency || "",
              date: prescription.createdAt?.toDate() || new Date(),
            }))
          : []

        // Get unread message count
        const unreadCount = await getUnreadMessageCount(user.uid)

        // Get monthly counts
        const appointmentCounts = await getAppointmentCounts(user.uid, "doctor")

        // Get all appointments for calendar
        const calendarAppointments = await getCalendarAppointments(user.uid, true)

        // Filter to only show approved appointments
        const approvedAppointments = todayAppointments.filter((apt) => {
          const status = apt.status?.toLowerCase()
          return status === "approved" || status === "confirmed"
        })

        setDashboardData({
          patientInteractions,
          todayAppointments: approvedAppointments.map((apt) => ({
            id: apt.id,
            patient: apt.patient?.displayName || "Unknown Patient",
            patientId: apt.patientId || null,
            age: apt.patient?.age || calculateAge(apt.patient?.dob) || "N/A",
            time: apt.time || "12:00 PM",
            status: apt.status || "approved",
            reason: apt.reason || apt.type || "Consultation",
            type: apt.type || apt.reason || "Consultation",
          })),
          recentPrescriptions,
          prescriptionCount,
          unreadMessages: unreadCount,
          monthlyCounts: {
            appointments: appointmentCounts.total || 0,
            prescriptions: prescriptionResult.success ? prescriptionResult.prescriptions.length : 0,
          },
          calendarAppointments,
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        // Set empty data on error - no fake data
        setDashboardData({
          patientInteractions: { count: 0, patients: [] },
          todayAppointments: [],
          recentPrescriptions: [],
          prescriptionCount: 0,
          unreadMessages: 0,
          monthlyCounts: {
            appointments: 0,
            prescriptions: 0,
          },
          calendarAppointments: [],
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return null

    let birthDate
    if (dob instanceof Date) {
      birthDate = dob
    } else if (dob.toDate && typeof dob.toDate === "function") {
      // Handle Firestore Timestamp
      birthDate = dob.toDate()
    } else if (typeof dob === "string") {
      birthDate = new Date(dob)
    } else {
      return null
    }

    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  // Load patient insights data
  useEffect(() => {
    const loadPatientInsights = async () => {
      if (!user?.uid) return

      setPatientInsights((prev) => ({ ...prev, isLoading: true }))
      try {
        // Get newly connected patients (within the last week)
        const newPatients = await getNewlyConnectedPatients(user.uid)

        // Get follow-up appointments
        const followUps = await getFollowUpAppointments(user.uid)

        // Get patient record statistics
        const recordStats = await getPatientRecordStats(user.uid)

        setPatientInsights({
          newPatients,
          followUps,
          recordStats,
          isLoading: false,
        })
      } catch (error) {
        console.error("Error loading patient insights:", error)
        // Set empty data on error - no fake data
        setPatientInsights({
          newPatients: { count: 0, patients: [] },
          followUps: { count: 0, appointments: [] },
          recordStats: { total: 0, shared: 0, recent: 0 },
          isLoading: false,
        })
      }
    }

    loadPatientInsights()
  }, [user])

  // Handle saving unavailable dates
  const handleSaveAvailability = async (dates) => {
    try {
      if (user?.uid) {
        // Save to Firebase
        await setDoctorAvailability(user.uid, dates)
      }

      // Also save to localStorage as backup
      localStorage.setItem("doctorUnavailableDates", JSON.stringify(dates))

      // Update state
      setUnavailableDates(dates)
      setShowAvailabilitySuccessModal(true)
    } catch (error) {
      console.error("Error saving availability:", error)
      // Still show success if we at least saved to localStorage
      setShowAvailabilitySuccessModal(true)
    }
  }

  const handleBookAppointment = (appointmentData) => {
    // Update local state to show the new appointment
    setDashboardData((prev) => ({
      ...prev,
      todayAppointments: [
        {
          id: `new-${Date.now()}`,
          patient: appointmentData.patientName || "New Patient",
          age: appointmentData.patientAge || "N/A",
          time: appointmentData.time,
          status: "confirmed",
          reason: appointmentData.reason || "Consultation",
        },
        ...prev.todayAppointments,
      ],
    }))

    // Show enhanced success message with appointment details
    const appointmentDate = new Date(appointmentData.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    setAppointmentSuccessMessage(
      `✅ Appointment successfully scheduled with ${appointmentData.patientName} on ${appointmentDate} at ${appointmentData.time}. Patient has been notified via email and in-app notification.`
    )
    setShowAppointmentSuccessModal(true)
  }

  // Handle calendar date click
  const handleCalendarDateClick = (dateString) => {
    // Set the selected date and open the appointment modal
    setSelectedDate(dateString)
    setIsAppointmentModalOpen(true)
  }

  // Handle opening the appointment modal without a pre-selected date
  const handleOpenAppointmentModal = () => {
    setSelectedDate("") // Clear any previously selected date
    setIsAppointmentModalOpen(true)
  }

  // Handle closing the appointment modal
  const handleCloseAppointmentModal = () => {
    setIsAppointmentModalOpen(false)
    setSelectedDate("") // Clear the selected date when closing
  }

  return (
    <>
      <style jsx global>{`
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
      `}</style>
      <div className="space-y-6">
        {/* Dashboard Header Banner */}
        <DashboardHeaderBanner userRole="doctor" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-graphite md:text-3xl">Doctor Dashboard</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsAvailabilityModalOpen(true)}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-amber-500 bg-white px-5 py-2.5 sm:py-3 text-sm font-semibold text-amber-600 shadow-md transition-all duration-300 hover:bg-amber-50 hover:border-amber-600 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 w-full sm:w-auto"
            >
              <Clock8 className="h-4 w-4" />
              <span>Manage Availability</span>
            </button>
            <button
              onClick={handleOpenAppointmentModal}
              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-6 py-2.5 sm:py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:from-amber-600 hover:via-amber-700 hover:to-amber-800 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 w-full sm:w-auto"
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
              {/* Icon with pulse effect */}
              <div className="relative flex items-center justify-center">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 relative z-10" />
                <div className="absolute inset-0 bg-white/30 rounded-full blur-md opacity-0 group-hover:opacity-100 animate-pulse"></div>
              </div>
              <span className="relative z-10">Schedule Appointment</span>
            </button>
          </div>
        </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border border-pale-stone bg-white p-4 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Stats */}
          <div className="col-span-full grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Today's Appointments */}
            <Link
              href="/doctor/appointments"
              className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-4 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 h-20 w-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-drift-gray">Today's Appointments</h3>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 transition-all duration-300 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white group-hover:scale-110 shadow-sm">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold text-graphite">{dashboardData.todayAppointments.length}</p>
                <p className="text-sm font-medium text-drift-gray mt-1">Approved</p>
              </div>
            </Link>

            {/* Patients */}
            <Link
              href="/doctor/patients"
              className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-4 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 h-20 w-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-drift-gray">Total Patients</h3>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 transition-all duration-300 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white group-hover:scale-110 shadow-sm">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold text-graphite">{dashboardData.patientInteractions.count}</p>
                <p className="text-sm font-medium text-drift-gray mt-1">Active</p>
              </div>
            </Link>

            {/* Prescriptions */}
            <Link
              href="/doctor/prescriptions"
              className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-4 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 h-20 w-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-drift-gray">Prescriptions</h3>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 transition-all duration-300 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white group-hover:scale-110 shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold text-graphite">{dashboardData.prescriptionCount}</p>
                <p className="text-sm font-medium text-drift-gray mt-1">This month</p>
              </div>
            </Link>

            {/* Messages */}
            <Link
              href="/doctor/messages"
              className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-4 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 h-20 w-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-drift-gray">Messages</h3>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 transition-all duration-300 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white group-hover:scale-110 shadow-sm">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold text-graphite">{dashboardData.unreadMessages}</p>
                <p className="text-sm font-medium text-drift-gray mt-1">Unread</p>
                {/* New message indicator */}
                {dashboardData.unreadMessages > 0 && (
                  <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md">
                    {dashboardData.unreadMessages > 9 ? "9+" : dashboardData.unreadMessages}
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Today's Appointments */}
          <div className="col-span-full rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-lg md:col-span-1 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 shadow-sm">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-graphite">Today's Appointments</h2>
                  <p className="text-xs text-drift-gray mt-0.5">Your scheduled visits</p>
                </div>
              </div>
              <Link
                href="/doctor/appointments"
                className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-500/20 hover:scale-105"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardData.todayAppointments.length > 0 ? (
                dashboardData.todayAppointments.slice(0, 3).map((appointment, index) => (
                  <div
                    key={appointment.id}
                    className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                      opacity: 0,
                    }}
                  >
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 h-24 w-24 bg-amber-500/5 rounded-full -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 left-0 h-16 w-16 bg-amber-500/5 rounded-full -ml-8 -mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                      {/* Patient Profile Section */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
                          <ProfileImage
                            userId={appointment.patientId}
                            size="md"
                            fallback={appointment.patient?.charAt(0) || "P"}
                            role="patient"
                            className="relative"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-graphite text-base group-hover:text-amber-600 transition-colors truncate">
                            {appointment.patient}
                          </h3>
                          <p className="text-sm text-drift-gray mt-0.5">
                            {appointment.age ? `Age: ${appointment.age}` : ""}
                            {appointment.type && (
                              <span className="ml-2">{appointment.type}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Time and Status Section */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-sm px-3 py-2 border border-amber-200/50 shadow-sm">
                          <Clock className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-graphite">{appointment.time}</span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize shadow-sm ${
                            appointment.status === "confirmed" || appointment.status === "approved"
                              ? "bg-gradient-to-r from-green-100 to-emerald-50 text-green-800 border border-green-200"
                              : appointment.status === "pending"
                                ? "bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-800 border border-amber-200"
                                : appointment.status === "cancelled"
                                  ? "bg-gradient-to-r from-red-100 to-rose-50 text-red-800 border border-red-200"
                                  : "bg-gradient-to-r from-blue-100 to-sky-50 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {appointment.status === "confirmed" || appointment.status === "approved" ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : appointment.status === "pending" ? (
                            <Clock className="h-3.5 w-3.5" />
                          ) : appointment.status === "cancelled" ? (
                            <AlertCircle className="h-3.5 w-3.5" />
                          ) : null}
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border-2 border-dashed border-amber-200/50 bg-gradient-to-br from-amber-50/30 to-white">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 shadow-sm">
                    <CalendarClock className="h-10 w-10" />
                  </div>
                  <p className="text-graphite font-medium mb-1">No appointments scheduled for today</p>
                  <p className="text-sm text-drift-gray mb-4">Schedule your next appointment</p>
                  <button
                    onClick={handleOpenAppointmentModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:scale-105"
                  >
                    <Plus className="h-4 w-4" />
                    Schedule Appointment
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Calendar */}
          <div className="group relative overflow-hidden rounded-2xl border-2 border-amber-200/60 bg-gradient-to-br from-white via-amber-50/40 to-amber-50/20 p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:border-amber-300/80">
            {/* Enhanced decorative background elements */}
            <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-amber-400/10 to-transparent rounded-full -mr-20 -mt-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute bottom-0 left-0 h-32 w-32 bg-gradient-to-tr from-amber-300/10 to-transparent rounded-full -ml-16 -mb-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-1/2 left-1/2 h-24 w-24 bg-amber-500/5 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 text-amber-700 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                    <Calendar className="h-6 w-6" />
                    <div className="absolute -inset-1 bg-amber-400/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-graphite">Calendar</h2>
                    <p className="text-xs text-drift-gray mt-0.5">View your schedule</p>
                  </div>
                </div>
                {unavailableDates.length > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-200">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {unavailableDates.length} unavailable {unavailableDates.length === 1 ? "day" : "days"}
                  </span>
                )}
              </div>
              <div className="relative rounded-xl bg-white/80 backdrop-blur-sm border border-amber-200/50 p-4 shadow-inner">
                <MiniCalendar
                  patientAppointments={dashboardData.calendarAppointments}
                  unavailableDates={unavailableDates}
                  onDateClick={handleCalendarDateClick}
                />
              </div>
            </div>
          </div>

          {/* Recent Prescriptions */}
          <div className="col-span-full rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-lg md:col-span-1 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-graphite">Recent Prescriptions</h2>
                  <p className="text-xs text-drift-gray mt-0.5">Your active medications</p>
                </div>
              </div>
              <Link
                href="/doctor/prescriptions"
                className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-500/20 hover:scale-105"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardData.recentPrescriptions.length > 0 ? (
                dashboardData.recentPrescriptions.slice(0, 3).map((prescription, index) => (
                  <div
                    key={prescription.id}
                    className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
                    style={{
                      animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                      opacity: 0,
                    }}
                  >
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 h-20 w-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 shadow-sm group-hover:scale-110 transition-transform duration-300">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-graphite text-base group-hover:text-amber-600 transition-colors">
                            {prescription.medication}
                          </p>
                          <p className="text-sm text-drift-gray mt-1">
                            <span className="font-medium">{prescription.dosage}</span> - {prescription.frequency}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-sm px-3 py-2 border border-amber-200/50 shadow-sm">
                          <User className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-graphite">{prescription.patient}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-sm px-3 py-2 border border-amber-200/50 shadow-sm">
                          <Calendar className="h-4 w-4 text-amber-600" />
                          <span className="text-sm font-medium text-graphite">{formatDateForDisplay(prescription.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border-2 border-dashed border-amber-200/50 bg-gradient-to-br from-amber-50/30 to-white">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 shadow-sm">
                    <FileText className="h-10 w-10" />
                  </div>
                  <p className="text-graphite font-medium mb-1">No recent prescriptions</p>
                  <p className="text-sm text-drift-gray">Your prescriptions will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Patient Insights */}
          <div className="rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 shadow-sm">
                <FileBarChart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-graphite">Patient Insights</h2>
                <p className="text-xs text-drift-gray mt-0.5">Analytics & statistics</p>
              </div>
            </div>
            {patientInsights.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl bg-gradient-to-br from-white to-amber-50/30 border border-amber-200/50 p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
                  style={{
                    animation: `fadeInUp 0.5s ease-out 0s both`,
                    opacity: 0,
                  }}
                >
                  <div className="absolute bottom-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full -mr-8 -mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <UserPlus className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-graphite text-base group-hover:text-amber-600 transition-colors mb-2">
                        New Patients
                      </h3>
                      <p className="text-sm text-drift-gray leading-relaxed">
                        {patientInsights.newPatients.count} new patient{patientInsights.newPatients.count !== 1 ? "s" : ""}{" "}
                        this week
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
                  style={{
                    animation: `fadeInUp 0.5s ease-out 0.1s both`,
                    opacity: 0,
                  }}
                >
                  <div className="absolute bottom-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full -mr-8 -mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <ClipboardCheck className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-graphite text-base group-hover:text-amber-600 transition-colors mb-2">
                        Follow-ups
                      </h3>
                      <p className="text-sm text-drift-gray leading-relaxed">
                        {patientInsights.followUps.count} follow-up appointment
                        {patientInsights.followUps.count !== 1 ? "s" : ""} scheduled
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
                  style={{
                    animation: `fadeInUp 0.5s ease-out 0.2s both`,
                    opacity: 0,
                  }}
                >
                  <div className="absolute bottom-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full -mr-8 -mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      <FileSymlink className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-graphite text-base group-hover:text-amber-600 transition-colors mb-2">
                        Patient Records
                      </h3>
                      <p className="text-sm text-drift-gray leading-relaxed">
                        {patientInsights.recordStats.shared} records shared with you, {patientInsights.recordStats.recent}{" "}
                        in the last 30 days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={handleCloseAppointmentModal}
        userRole="doctor"
        onBook={handleBookAppointment}
        patients={dashboardData.patientInteractions.patients.map((patient) => ({
          id: patient.id,
          name: patient.name,
          age: patient.age || null,
        }))}
        initialDate={selectedDate} // Pass the selected date to the modal
      />

      <DoctorAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => setIsAvailabilityModalOpen(false)}
        onSave={handleSaveAvailability}
        initialDates={unavailableDates}
      />

      {/* Availability Success Modal */}
      <AvailabilitySuccessModal
        isOpen={showAvailabilitySuccessModal}
        onClose={() => setShowAvailabilitySuccessModal(false)}
        message="Your availability has been updated successfully!"
        className="mt-16"
      />

      {/* Appointment Success Modal */}
      <AppointmentSuccessModal
        isOpen={showAppointmentSuccessModal}
        onClose={() => setShowAppointmentSuccessModal(false)}
        message={appointmentSuccessMessage}
        className="mt-16"
      />

      {/* Notification Listener for Push Notifications */}
      {user && <NotificationListener userId={user.uid} enabled={true} />}
      </div>
    </>
  )
}
