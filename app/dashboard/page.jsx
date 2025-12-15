"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Calendar,
  Clock,
  MessageSquare,
  Pill,
  Plus,
  User,
  Heart,
  Activity,
  Droplet,
  Utensils,
  Moon,
  Smile,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  CalendarClock,
  FileText,
} from "lucide-react"
import { MiniCalendar } from "@/components/mini-calendar"
import { AppointmentModal } from "@/components/appointment-modal"
import { SuccessNotification } from "@/components/success-notification"
import { DashboardHeaderBanner } from "@/components/dashboard-header-banner"
import { useAuth } from "@/contexts/auth-context"
import { formatDateForDisplay } from "@/lib/appointment-utils"
import ProfileImage from "@/components/profile-image"
import {
  getConnectedDoctors,
  getUpcomingAppointments,
  getUnreadMessageCount,
  getCalendarAppointments,
  getDoctorUnavailabilityForPatient,
  getPrescriptionCount,
} from "@/lib/dashboard-utils"
import { getPatientPrescriptions } from "@/lib/prescription-utils"
import { getPatientMedicalRecordsCount } from "@/lib/record-utils"

export default function PatientDashboard() {
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [notification, setNotification] = useState({ message: "", isVisible: false })
  const [dashboardData, setDashboardData] = useState({
    doctorInteractions: { count: 0, doctors: [] },
    upcomingAppointments: [],
    recentPrescriptions: [],
    prescriptionCount: 0,
    unreadMessages: 0,
    medicalRecordsCount: 0,
    calendarAppointments: [],
    doctorUnavailability: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const searchParams = useSearchParams()
  const { user } = useAuth()

  // Check for success message in URL parameters
  useEffect(() => {
    const success = searchParams.get("success")
    const message = searchParams.get("message")

    if (success === "true" && message) {
      setNotification({
        message: decodeURIComponent(message),
        isVisible: true,
      })
    }
  }, [searchParams])

  // Calculate next checkup date from upcoming appointments
  const getNextCheckupDate = (appointments) => {
    if (!appointments || appointments.length === 0) return null
    
    // Get current date at start of day for proper comparison
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Filter out cancelled and completed appointments, get only upcoming ones
    const upcomingValid = appointments
      .filter((apt) => {
        const status = apt.status?.toLowerCase()
        return status !== "cancelled" && status !== "completed"
      })
      .map((apt) => {
        // Handle different date formats
        let dateObj
        if (apt.date instanceof Date) {
          dateObj = new Date(apt.date)
        } else if (typeof apt.date === "string") {
          dateObj = new Date(apt.date)
        } else {
          return null
        }
        
        // Set to start of day for comparison
        dateObj.setHours(0, 0, 0, 0)
        
        return {
          ...apt,
          dateObj,
        }
      })
      .filter((apt) => apt && apt.dateObj && apt.dateObj >= today) // Only future dates
      .sort((a, b) => a.dateObj - b.dateObj) // Sort by date ascending
    
    // Return the earliest upcoming appointment date
    return upcomingValid.length > 0 ? upcomingValid[0].dateObj : null
  }

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.uid) return

      setIsLoading(true)
      try {
        // Get connected doctors
        const doctorInteractions = await getConnectedDoctors(user.uid)

        // Get upcoming appointments
        const upcomingAppointments = await getUpcomingAppointments(user.uid, false, 3) // Limit to 3

        // Get prescription details first to count active ones
        const prescriptionResult = await getPatientPrescriptions(user.uid)
        const allPrescriptions = prescriptionResult.success ? prescriptionResult.prescriptions : []
        
        // Count only active prescriptions (not expired or completed)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const activePrescriptions = allPrescriptions.filter((prescription) => {
          // Check if prescription is active (not expired)
          if (prescription.expiryDate) {
            const expiryDate = prescription.expiryDate.toDate()
            expiryDate.setHours(0, 0, 0, 0)
            return expiryDate >= today
          }
          // If no expiry date, consider it active
          return true
        })
        const prescriptionCount = activePrescriptions.length

        const recentPrescriptions = allPrescriptions.slice(0, 5).map((prescription) => ({
          id: prescription.id,
          medication: prescription.medications[0]?.name || "Medication",
          dosage: prescription.medications[0]?.dosage || "",
          frequency: prescription.medications[0]?.frequency || "",
          doctor: prescription.doctorName || "Dr. Unknown",
          date: prescription.createdAt?.toDate() || new Date(),
        }))

        // Get medical records count
        const medicalRecordsCount = await getPatientMedicalRecordsCount(user.uid)

        // Get all appointments for calendar
        const calendarAppointments = await getCalendarAppointments(user.uid, false)

        // Get doctor unavailability for connected doctors
        const doctorUnavailability = await getDoctorUnavailabilityForPatient(user.uid)

        // Map appointments with proper date handling and doctor info
        const mappedAppointments = upcomingAppointments.map((apt) => ({
          id: apt.id,
          doctor: apt.otherParty?.displayName || "Dr. Unknown",
          specialty: apt.otherParty?.specialty || "Specialist",
          doctorId: apt.doctorId || apt.otherParty?.id || null,
          date: apt.date ? new Date(apt.date) : new Date(),
          time: apt.time || "12:00 PM",
          status: apt.status || "confirmed",
          type: apt.type || apt.reason || "Consultation",
          mode: apt.mode || "in-person",
        }))

        setDashboardData({
          doctorInteractions,
          upcomingAppointments: mappedAppointments,
          recentPrescriptions,
          prescriptionCount,
          unreadMessages: 0, // Keep for compatibility but not used
          medicalRecordsCount,
          calendarAppointments,
          doctorUnavailability,
        })
      } catch (error) {
        console.error("Error loading dashboard data:", error)
        // Set empty data on error - no fake data
        setDashboardData({
          doctorInteractions: { count: 0, doctors: [] },
          upcomingAppointments: [],
          recentPrescriptions: [],
          prescriptionCount: 0,
          unreadMessages: 0,
          medicalRecordsCount: 0,
          calendarAppointments: [],
          doctorUnavailability: [],
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  // Handle booking a new appointment
  const handleBookAppointment = (newAppointment) => {
    // In a real app, this would save to the backend

    // Update local state to show the new appointment
    setDashboardData((prev) => ({
      ...prev,
      upcomingAppointments: [
        {
          id: `new-${Date.now()}`,
          doctor: newAppointment.doctorName || "Dr. Unknown",
          specialty: "Specialist",
          date: new Date(newAppointment.date),
          time: newAppointment.time,
          status: "pending",
        },
        ...prev.upcomingAppointments,
      ],
    }))

    // Show success notification
    setNotification({
      message: "Appointment booked successfully",
      isVisible: true,
    })
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

  // Health tips data
  const healthTips = [
    {
      icon: <Droplet className="h-5 w-5 text-blue-500" />,
      title: "Stay Hydrated",
      content: "Drink at least 8 glasses of water daily to maintain proper hydration.",
    },
    {
      icon: <Activity className="h-5 w-5 text-green-500" />,
      title: "Regular Exercise",
      content: "Aim for at least 30 minutes of moderate exercise 5 days a week.",
    },
    {
      icon: <Utensils className="h-5 w-5 text-orange-500" />,
      title: "Balanced Diet",
      content: "Include fruits, vegetables, whole grains, and lean proteins in your daily meals.",
    },
    {
      icon: <Moon className="h-5 w-5 text-purple-500" />,
      title: "Adequate Sleep",
      content: "Aim for 7-9 hours of quality sleep each night for optimal health.",
    },
    {
      icon: <Smile className="h-5 w-5 text-yellow-500" />,
      title: "Manage Stress",
      content: "Practice mindfulness, deep breathing, or meditation to reduce stress levels.",
    },
  ]

  // Get next checkup date for banner
  const nextCheckupDate = getNextCheckupDate(dashboardData.upcomingAppointments)

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
        <DashboardHeaderBanner userRole="patient" nextCheckupDate={nextCheckupDate} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-graphite md:text-3xl">Dashboard</h1>
        <button
          onClick={handleOpenAppointmentModal}
          className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:from-amber-600 hover:via-amber-700 hover:to-amber-800 hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></div>
          {/* Icon with pulse effect */}
          <div className="relative flex items-center justify-center">
            <Plus className="h-5 w-5 relative z-10" />
            <div className="absolute inset-0 bg-white/30 rounded-full blur-md opacity-0 group-hover:opacity-100 animate-pulse"></div>
          </div>
          <span className="relative z-10">Book Appointment</span>
        </button>
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
            {/* Appointments */}
            <Link
              href="/dashboard/appointments"
              className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-4 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 h-20 w-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-drift-gray">Appointments</h3>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 transition-all duration-300 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white group-hover:scale-110 shadow-sm">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold text-graphite">{dashboardData.upcomingAppointments.length}</p>
                <p className="text-sm font-medium text-drift-gray mt-1">Upcoming</p>
              </div>
            </Link>

            {/* Prescriptions */}
            <Link
              href="/dashboard/prescriptions"
              className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-4 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 h-20 w-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-drift-gray">Prescriptions</h3>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 transition-all duration-300 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white group-hover:scale-110 shadow-sm">
                    <Pill className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold text-graphite">{dashboardData.prescriptionCount}</p>
                <p className="text-sm font-medium text-drift-gray mt-1">Active</p>
              </div>
            </Link>

            {/* Medical Records */}
            <Link
              href="/dashboard/records"
              className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-4 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 h-20 w-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-drift-gray">Medical Records</h3>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 transition-all duration-300 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white group-hover:scale-110 shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold text-graphite">
                  {dashboardData.medicalRecordsCount ?? 0}
                </p>
                <p className="text-sm font-medium text-drift-gray mt-1">Total Records</p>
              </div>
            </Link>

            {/* Doctors */}
            <Link
              href="/dashboard/doctors"
              className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-4 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 h-20 w-20 bg-amber-500/5 rounded-full -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-drift-gray">Doctors</h3>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 transition-all duration-300 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white group-hover:scale-110 shadow-sm">
                    <User className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-bold text-graphite">{dashboardData.doctorInteractions.count}</p>
                <p className="text-sm font-medium text-drift-gray mt-1">Connected</p>
              </div>
            </Link>
          </div>

          {/* Upcoming Appointments */}
          <div className="col-span-full rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-lg md:col-span-1 lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 shadow-sm">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-graphite">Upcoming Appointments</h2>
                  <p className="text-xs text-drift-gray mt-0.5">Your scheduled visits</p>
                </div>
              </div>
              <Link
                href="/dashboard/appointments"
                className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-500/20 hover:scale-105"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardData.upcomingAppointments.length > 0 ? (
                dashboardData.upcomingAppointments.map((appointment, index) => (
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
                      {/* Doctor Profile Section */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
                          <ProfileImage
                            userId={appointment.doctorId}
                            size="md"
                            fallback={appointment.doctor?.charAt(0) || "D"}
                            role="doctor"
                            className="relative"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-graphite text-base group-hover:text-amber-600 transition-colors truncate">
                            {appointment.doctor}
                          </h3>
                          <p className="text-sm text-drift-gray mt-0.5">{appointment.specialty}</p>
                          {appointment.type && (
                            <p className="text-xs text-drift-gray/70 mt-1">{appointment.type}</p>
                          )}
                        </div>
                      </div>

                      {/* Date, Time, and Status Section */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-sm px-3 py-2 border border-amber-200/50 shadow-sm">
                            <Calendar className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-graphite">{formatDateForDisplay(appointment.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg bg-white/80 backdrop-blur-sm px-3 py-2 border border-amber-200/50 shadow-sm">
                            <Clock className="h-4 w-4 text-amber-600" />
                            <span className="text-sm font-medium text-graphite">{appointment.time}</span>
                          </div>
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
                  <p className="text-graphite font-medium mb-1">No upcoming appointments</p>
                  <p className="text-sm text-drift-gray mb-4">Schedule your next visit with your doctor</p>
                  <button
                    onClick={handleOpenAppointmentModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-amber-600 hover:to-amber-700 hover:shadow-lg hover:scale-105"
                  >
                    <Plus className="h-4 w-4" />
                    Book Appointment
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
              <div className="mb-6 flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 via-amber-200 to-amber-300 text-amber-700 shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                  <Calendar className="h-6 w-6" />
                  <div className="absolute -inset-1 bg-amber-400/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-graphite">Calendar</h2>
                  <p className="text-xs text-drift-gray mt-0.5">View your schedule</p>
                </div>
              </div>
              <div className="relative rounded-xl bg-white/80 backdrop-blur-sm border border-amber-200/50 p-4 shadow-inner">
                <MiniCalendar
                  patientAppointments={dashboardData.calendarAppointments}
                  doctorUnavailability={dashboardData.doctorUnavailability}
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
                  <Pill className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-graphite">Recent Prescriptions</h2>
                  <p className="text-xs text-drift-gray mt-0.5">Your active medications</p>
                </div>
              </div>
              <Link
                href="/dashboard/prescriptions"
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
                          <Pill className="h-6 w-6" />
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
                          <span className="text-sm font-medium text-graphite">{prescription.doctor}</span>
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
                    <Pill className="h-10 w-10" />
                  </div>
                  <p className="text-graphite font-medium mb-1">No recent prescriptions</p>
                  <p className="text-sm text-drift-gray">Your prescriptions will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Health Tips */}
          <div className="rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 shadow-sm">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-graphite">Health Tips</h2>
                  <p className="text-xs text-drift-gray mt-0.5">Wellness recommendations</p>
                </div>
              </div>
              <Link
                href="/dashboard/health-tips"
                className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-500/20 hover:scale-105"
              >
                View More
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {healthTips.slice(0, 3).map((tip, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                    opacity: 0,
                  }}
                >
                  {/* Decorative background elements */}
                  <div className="absolute bottom-0 right-0 h-16 w-16 bg-amber-500/5 rounded-full -mr-8 -mb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md group-hover:scale-110 transition-transform duration-300">
                      {tip.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-graphite text-base group-hover:text-amber-600 transition-colors mb-2">
                        {tip.title}
                      </h3>
                      <p className="text-sm text-drift-gray leading-relaxed">{tip.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals and Notifications */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={handleCloseAppointmentModal}
        userRole="patient"
        onBook={handleBookAppointment}
        connectedDoctors={dashboardData.doctorInteractions.doctors}
        initialDate={selectedDate} // Pass the selected date to the modal
      />

      <SuccessNotification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
      </div>
    </>
  )
}
