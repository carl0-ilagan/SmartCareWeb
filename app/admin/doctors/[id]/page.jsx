"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  AlertCircle,
  CalendarDays,
  Users,
  Award,
  Briefcase,
  Building,
  Languages,
  FileText,
  Stethoscope,
  BookOpen,
  ClipboardList,
  ChevronDown,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getConnectedPatients } from "@/lib/doctor-utils"
import { AdminHeaderBanner } from "@/components/admin/admin-header-banner"

export default function AdminDoctorDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("profile") // "profile", "schedule", "patients"
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    completedAppointments: 0,
  })
  const [patientsList, setPatientsList] = useState([])
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [tabOpen, setTabOpen] = useState(false)

  // Get doctor ID from URL
  const doctorId = params.id

  // Load doctor data
  useEffect(() => {
    if (!user || !doctorId) return

    const loadDoctor = async () => {
      setLoading(true)
      setError("")

      try {
        // First try to get from doctors collection
        const doctorDoc = await getDoc(doc(db, "doctors", doctorId))

        if (doctorDoc.exists()) {
          const doctorData = doctorDoc.data()
          console.log("Doctor found in doctors collection:", doctorData)
          setDoctor({
            id: doctorDoc.id,
            ...doctorData,
          })
        } else {
          // If not found, try users collection with role=doctor
          const usersRef = collection(db, "users")
          const q = query(usersRef, where("uid", "==", doctorId), where("role", "==", "doctor"))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const doctorData = querySnapshot.docs[0].data()
            console.log("Doctor found in users collection with role=doctor:", doctorData)
            setDoctor({
              id: querySnapshot.docs[0].id,
              ...doctorData,
            })
          } else {
            // Last attempt - try to get from users collection directly
            const userDoc = await getDoc(doc(db, "users", doctorId))

            if (userDoc.exists()) {
              const userData = userDoc.data()
              console.log("User found in users collection:", userData)
              setDoctor({
                id: userDoc.id,
                ...userData,
              })
            } else {
              setError("Doctor not found.")
            }
          }
        }

        // Get doctor stats
        await loadDoctorStats(doctorId)

        // Load patients
        await loadPatients(doctorId)

        setLoading(false)
      } catch (error) {
        console.error("Error loading doctor:", error)
        setError("Failed to load doctor information. Please try again.")
        setLoading(false)
      }
    }

    loadDoctor()
  }, [user, doctorId])

  // Load doctor statistics
  const loadDoctorStats = async (doctorId) => {
    try {
      // Get appointments
      const appointmentsQuery = query(collection(db, "appointments"), where("doctorId", "==", doctorId))
      const appointmentsSnapshot = await getDocs(appointmentsQuery)
      const totalAppointments = appointmentsSnapshot.size
      let completedAppointments = 0

      // Get unique patient IDs from appointments
      const patientIdsFromAppointments = new Set()
      appointmentsSnapshot.forEach((doc) => {
        const appointment = doc.data()
        if (appointment.status === "completed") {
          completedAppointments++
        }
        if (appointment.patientId) {
          patientIdsFromAppointments.add(appointment.patientId)
        }
      })

      // Get patients from conversations
      const conversationsQuery = query(
        collection(db, "conversations"),
        where("participants", "array-contains", doctorId),
      )
      const conversationsSnapshot = await getDocs(conversationsQuery)

      const patientIdsFromConversations = new Set()
      conversationsSnapshot.forEach((doc) => {
        const conversation = doc.data()
        if (conversation.participants) {
          conversation.participants.forEach((participantId) => {
            if (participantId !== doctorId) {
              patientIdsFromConversations.add(participantId)
            }
          })
        }
      })

      // Combine patient IDs from both sources
      const allPatientIds = new Set([...patientIdsFromAppointments, ...patientIdsFromConversations])

      // Filter to only include actual patients (role = patient)
      const confirmedPatientIds = new Set()
      for (const patientId of allPatientIds) {
        try {
          const patientDoc = await getDoc(doc(db, "users", patientId))
          if (patientDoc.exists()) {
            const patientData = patientDoc.data()
            if (patientData.role === "patient" || !patientData.role) {
              confirmedPatientIds.add(patientId)
            }
          }
        } catch (err) {
          console.error(`Error checking patient ${patientId}:`, err)
        }
      }

      console.log(`Found ${confirmedPatientIds.size} confirmed patients for doctor ${doctorId}`)

      setStats({
        totalPatients: confirmedPatientIds.size,
        totalAppointments,
        completedAppointments,
      })
    } catch (error) {
      console.error("Error loading doctor stats:", error)
      // Don't set an error, just log it
    }
  }

  // Load patients
  const loadPatients = async (doctorId) => {
    setPatientsLoading(true)
    try {
      // Use the getConnectedPatients utility from doctor-utils
      const patientIds = await getConnectedPatients(doctorId)
      console.log(`Found ${patientIds.length} connected patients for doctor ${doctorId}`)

      // Get patient details
      const patients = []
      for (const patientId of patientIds) {
        try {
          const patientDoc = await getDoc(doc(db, "users", patientId))
          if (patientDoc.exists()) {
            const patientData = patientDoc.data()
            // Only include users with role "patient" or no role specified
            if (!patientData.role || patientData.role === "patient") {
              patients.push({
                id: patientId,
                ...patientData,
              })
            }
          }
        } catch (err) {
          console.error(`Error fetching patient ${patientId}:`, err)
        }
      }

      console.log(`Loaded ${patients.length} patient details`)
      setPatientsList(patients)

      // Update stats with the correct patient count
      setStats((prevStats) => ({
        ...prevStats,
        totalPatients: patients.length,
      }))
    } catch (error) {
      console.error("Error loading patients:", error)
    } finally {
      setPatientsLoading(false)
    }
  }

  // Navigate back to doctors list
  const handleBackToDoctors = () => {
    router.push("/admin/doctors")
  }

  // Format date
  const formatDate = (dateValue) => {
    if (!dateValue) return "N/A"

    // Handle Firestore Timestamp
    if (dateValue && typeof dateValue.toDate === "function") {
      return dateValue.toDate().toLocaleDateString()
    }

    // Handle Date objects or ISO strings
    try {
      return new Date(dateValue).toLocaleDateString()
    } catch (e) {
      return "Invalid Date"
    }
  }

  // Get doctor's full name
  const getDoctorName = () => {
    if (!doctor) return ""

    if (doctor.displayName) return doctor.displayName
    if (doctor.name) return doctor.name
    if (doctor.fullName) return doctor.fullName

    const firstName = doctor.firstName || doctor.first_name || ""
    const lastName = doctor.lastName || doctor.last_name || ""

    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim()
    }

    return "Unknown Doctor"
  }

  // Get doctor's specialty
  const getDoctorSpecialty = () => {
    if (!doctor) return "General Medicine"

    return doctor.specialty || doctor.specialization || doctor.medicalSpecialty || doctor.field || "General Medicine"
  }

  // Header stats for AdminHeaderBanner
  const headerStats = doctor
    ? [
        {
          label: "Patients",
          value: stats.totalPatients || 0,
          icon: <Users className="h-4 w-4" />,
        },
        {
          label: "Appointments",
          value: stats.totalAppointments || 0,
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          label: "Completed",
          value: stats.completedAppointments || 0,
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          label: "Status",
          value: doctor.status === "inactive" || doctor.isOnline === false ? "Inactive" : "Active",
          icon: <Stethoscope className="h-4 w-4" />,
        },
      ]
    : [
        { label: "Patients", value: "—" },
        { label: "Appointments", value: "—" },
        { label: "Completed", value: "—" },
        { label: "Status", value: "—" },
      ]

  const formatDateTime = (value) => {
    if (!value) return "Never"
    try {
      const dateObj = value?.toDate ? value.toDate() : new Date(value)
      if (isNaN(dateObj.getTime())) return "Never"
      return dateObj.toLocaleString()
    } catch (e) {
      return "Never"
    }
  }

  // Schedule View Component
  const ScheduleView = ({ doctorId }) => {
    const [schedule, setSchedule] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Fetch doctor schedule
    const fetchSchedule = useCallback(async () => {
      if (!doctorId) return

      setLoading(true)
      setError("")

      try {
        // Try to get from availability collection
        const availabilityRef = collection(db, "availability")
        const q = query(availabilityRef, where("doctorId", "==", doctorId))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const scheduleData = []
          querySnapshot.forEach((doc) => {
            scheduleData.push({
              id: doc.id,
              ...doc.data(),
            })
          })
          setSchedule(scheduleData)
        } else {
          // Try to get from doctor's document if it has a schedule field
          const doctorDoc = await getDoc(doc(db, "doctors", doctorId))
          if (doctorDoc.exists() && doctorDoc.data().schedule) {
            setSchedule(doctorDoc.data().schedule)
          } else {
            // Check users collection
            const userDoc = await getDoc(doc(db, "users", doctorId))
            if (userDoc.exists() && userDoc.data().schedule) {
              setSchedule(userDoc.data().schedule)
            } else if (userDoc.exists() && userDoc.data().officeHours) {
              // If there's officeHours field, use that as text
              setSchedule([
                {
                  officeHours: userDoc.data().officeHours,
                  isTextOnly: true,
                },
              ])
            } else {
              setSchedule([])
            }
          }
        }

        setLoading(false)
      } catch (err) {
        console.error("Error fetching schedule:", err)
        setError("Failed to load doctor's schedule. Please try again.")
        setLoading(false)
      }
    }, [doctorId])

    useEffect(() => {
      fetchSchedule()
    }, [fetchSchedule])

    // Format time
    const formatTime = (time) => {
      if (!time) return "N/A"

      // If it's already in HH:MM format
      if (typeof time === "string" && time.includes(":")) {
        return time
      }

      // If it's a number (minutes since midnight)
      if (typeof time === "number") {
        const hours = Math.floor(time / 60)
        const minutes = time % 60
        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
      }

      return time
    }

    // Get day name
    const getDayName = (day) => {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

      // If it's already a day name
      if (typeof day === "string" && isNaN(day)) {
        return day.charAt(0).toUpperCase() + day.slice(1)
      }

      // If it's a number (0-6)
      if (typeof day === "number" || !isNaN(day)) {
        return days[Number.parseInt(day) % 7]
      }

      return day
    }

    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-soft-amber mb-3"></div>
            <p className="text-gray-500">Loading schedule...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
        </div>
      )
    }

    if (!schedule || schedule.length === 0) {
      return (
        <div className="text-center py-8 animate-fadeIn">
          <div className="flex flex-col items-center justify-center">
            <Calendar className="h-16 w-16 text-gray-300 animate-pulse mb-4" />
            <h3 className="text-lg font-medium text-gray-500">No Schedule Available</h3>
            <p className="text-gray-400 mt-1">This doctor has not set their availability schedule yet.</p>
          </div>
        </div>
      )
    }

    // Check if we have text-only schedule (office hours as text)
    if (schedule[0]?.isTextOnly && schedule[0]?.officeHours) {
      return (
        <div className="p-6 border border-pale-stone rounded-lg bg-white">
          <div className="flex items-start">
            <Clock className="h-6 w-6 text-soft-amber mr-3 mt-1" />
            <div>
              <h3 className="font-medium text-graphite mb-2">Office Hours</h3>
              <p className="text-drift-gray whitespace-pre-line">{schedule[0].officeHours}</p>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.isArray(schedule) ? (
            schedule.map((slot, index) => (
              <div
                key={slot.id || index}
                className="border border-pale-stone rounded-lg p-4 hover:border-soft-amber/30 transition-colors"
              >
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-soft-amber/10 flex items-center justify-center text-soft-amber mr-3">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-graphite">{getDayName(slot.day)}</h3>
                    <div className="mt-2">
                      <p className="text-sm text-drift-gray">
                        <span className="font-medium">Hours:</span> {formatTime(slot.startTime)} -{" "}
                        {formatTime(slot.endTime)}
                      </p>
                      {slot.breakStart && slot.breakEnd && (
                        <p className="text-sm text-drift-gray">
                          <span className="font-medium">Break:</span> {formatTime(slot.breakStart)} -{" "}
                          {formatTime(slot.breakEnd)}
                        </p>
                      )}
                      {slot.maxPatients && (
                        <p className="text-sm text-drift-gray">
                          <span className="font-medium">Max Patients:</span> {slot.maxPatients}
                        </p>
                      )}
                      {slot.slotDuration && (
                        <p className="text-sm text-drift-gray">
                          <span className="font-medium">Appointment Duration:</span> {slot.slotDuration} min
                        </p>
                      )}
                    </div>
                    <div className="mt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${slot.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {slot.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <p className="text-center text-gray-500">Schedule data is not in the expected format.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Patients View Component
  const PatientsView = () => {
    // View patient details
    const handleViewPatient = (patientId) => {
      router.push(`/admin/patients/${patientId}`)
    }

    if (patientsLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-soft-amber mb-3"></div>
            <p className="text-gray-500">Loading patients...</p>
          </div>
        </div>
      )
    }

    if (patientsList.length === 0) {
      return (
        <div className="text-center py-8 animate-fadeIn">
          <div className="flex flex-col items-center justify-center">
            <Users className="h-16 w-16 text-gray-300 animate-pulse mb-4" />
            <h3 className="text-lg font-medium text-gray-500">No Patients</h3>
            <p className="text-gray-400 mt-1">This doctor has no patients assigned yet.</p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patientsList.map((patient) => (
            <div
              key={patient.id}
              className="border border-pale-stone rounded-lg p-4 hover:border-soft-amber/30 transition-colors cursor-pointer"
              onClick={() => handleViewPatient(patient.id)}
            >
              <div className="flex items-start">
                <div className="h-10 w-10 rounded-full bg-soft-amber/10 flex items-center justify-center text-soft-amber mr-3">
                  {patient.photoURL ? (
                    <img
                      src={patient.photoURL || "/placeholder.svg"}
                      alt={patient.displayName || "Patient"}
                      className="h-10 w-10 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null
                        e.target.src = "/placeholder.svg?height=40&width=40"
                      }}
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-graphite">
                    {patient.displayName ||
                      `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
                      "Unknown Patient"}
                  </h3>
                  <p className="text-xs text-drift-gray">{patient.email || "No email provided"}</p>
                  <div className="mt-2">
                    <p className="text-sm text-drift-gray">
                      <Phone className="h-3 w-3 inline mr-1" />
                      {patient.phoneNumber || patient.phone || "No phone provided"}
                    </p>
                    {(patient.dateOfBirth || patient.dob || patient.birthDate) && (
                      <p className="text-sm text-drift-gray">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {formatDate(patient.dateOfBirth || patient.dob || patient.birthDate)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {loading ? (
        // Loading state
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soft-amber mb-4"></div>
            <p className="text-gray-500">Loading doctor information...</p>
          </div>
        </div>
      ) : error ? (
        // Error state
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <div className="flex justify-center mb-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-red-800">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleBackToDoctors}
            className="mt-4 inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm border border-red-200 transition-colors hover:bg-red-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Doctors
          </button>
        </div>
      ) : doctor ? (
        <>
          <AdminHeaderBanner
            title={`Dr. ${getDoctorName()}`}
            subtitle={getDoctorSpecialty()}
            stats={headerStats}
          />
          <div className="flex justify-between items-center">
              <button
                onClick={handleBackToDoctors}
              className="inline-flex items-center rounded-md bg-earth-beige px-3 py-2 text-sm font-medium text-graphite transition-colors hover:bg-earth-beige/80"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Doctors
              </button>
            <div className="flex items-center bg-white rounded-md px-3 py-1.5 border border-earth-beige">
              <Stethoscope className="h-4 w-4 text-soft-amber mr-2" />
              <span className="text-xs font-medium text-graphite">Doctor Profile</span>
                  </div>
                </div>

          {/* Tab controls */}
          <div className="mb-6 mt-4">
            {/* Mobile dropdown */}
            <div className="sm:hidden">
              <button
                onClick={() => setTabOpen((prev) => !prev)}
                className="w-full inline-flex items-center justify-between rounded-lg border border-earth-beige bg-white px-3 py-2 text-sm font-medium text-graphite shadow-sm transition hover:border-amber-500 hover:text-amber-700"
              >
                <span className="flex items-center">
                  {activeTab === "profile" && <User className="h-4 w-4 mr-2" />}
                  {activeTab === "schedule" && <CalendarDays className="h-4 w-4 mr-2" />}
                  {activeTab === "patients" && <Users className="h-4 w-4 mr-2" />}
                  <span className="truncate capitalize">
                    {activeTab === "profile" ? "Profile" : activeTab === "schedule" ? "Schedule" : "Patients"}
                  </span>
                </span>
                <ChevronDown className={`h-4 w-4 text-drift-gray transition-transform duration-200 ${tabOpen ? "rotate-180" : ""}`} />
              </button>
              <div
                className={`mt-1 rounded-lg border border-earth-beige bg-white shadow-md transition-all duration-200 ease-out ${
                  tabOpen ? "max-h-64 opacity-100 scale-100 pointer-events-auto" : "max-h-0 opacity-0 scale-95 pointer-events-none"
                } overflow-hidden`}
              >
                {[
                  { id: "profile", label: "Profile", icon: <User className="h-4 w-4 mr-2" /> },
                  { id: "schedule", label: "Schedule", icon: <CalendarDays className="h-4 w-4 mr-2" /> },
                  { id: "patients", label: "Patients", icon: <Users className="h-4 w-4 mr-2" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setTabOpen(false)
                    }}
                    className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                      activeTab === tab.id ? "bg-amber-50 text-amber-700" : "hover:bg-cream text-graphite"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
                </div>
              </div>

            {/* Desktop pills */}
            <div className="hidden sm:flex justify-center overflow-x-auto">
            <div className="flex p-1 bg-earth-beige/20 rounded-full shadow-sm">
              <button
                onClick={() => setActiveTab("profile")}
                className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "profile" ? "bg-soft-amber text-white shadow-sm" : "text-drift-gray hover:text-graphite"
                }`}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab("schedule")}
                className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "schedule"
                    ? "bg-soft-amber text-white shadow-sm"
                    : "text-drift-gray hover:text-graphite"
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                <span>Schedule</span>
              </button>
              <button
                onClick={() => setActiveTab("patients")}
                className={`relative px-5 py-2.5 pr-7 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 ${
                  activeTab === "patients"
                    ? "bg-soft-amber text-white shadow-sm"
                    : "text-drift-gray hover:text-graphite"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Patients</span>
                {(stats.totalPatients || 0) > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                    activeTab === "patients" 
                      ? "bg-white/20 text-white border border-white/30" 
                      : "bg-soft-amber text-white"
                  }`}>
                    {stats.totalPatients || 0}
                </span>
                )}
              </button>
              </div>
            </div>
          </div>

          {/* Conditional rendering based on active tab */}
          {activeTab === "profile" && (
            <>
              {/* Doctor Information */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Personal Information */}
                <div className="rounded-lg border border-pale-stone bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-soft-amber/30">
                  <h2 className="mb-4 text-lg font-semibold text-graphite">Personal Details</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <User className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Full Name</p>
                        <p className="text-drift-gray">Dr. {getDoctorName()}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mail className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Email</p>
                        <p className="text-drift-gray">{doctor.email || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Phone</p>
                        <p className="text-drift-gray">{doctor.phoneNumber || doctor.phone || "Not provided"}</p>
                      </div>
                    </div>
                    {doctor.address && (
                      <div className="flex items-start">
                        <MapPin className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                        <div>
                          <p className="text-sm font-medium text-graphite">Address</p>
                          <p className="text-drift-gray">{doctor.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Information */}
                <div className="rounded-lg border border-pale-stone bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-soft-amber/30">
                  <h2 className="mb-4 text-lg font-semibold text-graphite">Professional Details</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Briefcase className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Specialty</p>
                        <p className="text-drift-gray">{getDoctorSpecialty()}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FileText className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">License Number</p>
                        <p className="text-drift-gray">{doctor.licenseNumber || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Clock className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Experience</p>
                        <p className="text-drift-gray">{doctor.experience || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Languages className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Languages</p>
                        <p className="text-drift-gray">{doctor.languages || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Qualifications */}
                <div className="rounded-lg border border-pale-stone bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-soft-amber/30">
                  <h2 className="mb-4 text-lg font-semibold text-graphite">Qualifications</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Award className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Education</p>
                        <p className="text-drift-gray">{doctor.education || doctor.qualifications || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <BookOpen className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Certifications</p>
                        <p className="text-drift-gray">{doctor.certifications || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Practice Information */}
                <div className="rounded-lg border border-pale-stone bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-soft-amber/30">
                  <h2 className="mb-4 text-lg font-semibold text-graphite">Practice Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Building className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Office Address</p>
                        <p className="text-drift-gray">{doctor.officeAddress || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Clock className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Office Hours</p>
                        <p className="text-drift-gray">{doctor.officeHours || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Bio */}
              {doctor.bio || doctor.about || doctor.description ? (
                <div className="mt-6 rounded-lg border border-pale-stone bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-graphite">Professional Bio</h2>
                  <p className="text-drift-gray">{doctor.bio || doctor.about || doctor.description}</p>
                </div>
              ) : null}
            </>
          )}

          {activeTab === "schedule" && (
            <div className="bg-white rounded-lg border border-pale-stone shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-graphite">Doctor's Schedule</h2>
                <div className="flex items-center text-sm text-drift-gray">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Weekly Availability</span>
                </div>
              </div>

              <ScheduleView doctorId={doctorId} />
            </div>
          )}

          {activeTab === "patients" && (
            <div className="bg-white rounded-lg border border-pale-stone shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-graphite">Doctor's Patients</h2>
                <div className="flex items-center text-sm text-drift-gray">
                  <Users className="h-4 w-4 mr-1" />
                  <span>Total: {stats.totalPatients || 0}</span>
                </div>
              </div>

              <PatientsView />
            </div>
          )}
        </>
      ) : (
        // Not found
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <div className="flex justify-center mb-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-red-800">Doctor Not Found</h3>
          <p className="text-red-600">The doctor you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={handleBackToDoctors}
            className="mt-4 inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm border border-red-200 transition-colors hover:bg-red-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Doctors
          </button>
        </div>
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
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
