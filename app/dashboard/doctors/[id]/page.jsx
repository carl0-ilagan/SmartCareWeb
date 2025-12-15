"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Calendar,
  MapPin,
  Phone,
  Mail,
  Award,
  Briefcase,
  MessageSquare,
  ArrowLeft,
  CalendarIcon,
  AlertTriangle,
  Circle,
  Clock,
  CheckCircle,
  Globe,
  Stethoscope,
} from "lucide-react"
import { AppointmentModal } from "@/components/appointment-modal"
import { useAuth } from "@/contexts/auth-context"
import { getPublicDoctorProfile } from "@/lib/doctor-utils"
import { checkExistingConversation, createConversation, getUserOnlineStatus } from "@/lib/message-utils"
import ProfileImage from "@/components/profile-image"
import { getDoctorAvailability } from "@/lib/appointment-utils"

export default function DoctorProfile() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [doctor, setDoctor] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [appointmentSuccess, setAppointmentSuccess] = useState(false)
  const [isMessageLoading, setIsMessageLoading] = useState(false)
  const [availability, setAvailability] = useState([])
  const [availabilityLoading, setAvailabilityLoading] = useState(true)
  const [onlineStatus, setOnlineStatus] = useState({ isOnline: false, lastActive: null })

  useEffect(() => {
    const fetchDoctorData = async () => {
      setIsLoading(true)
      try {
        console.log("Fetching doctor data for ID:", id)

        // Check if user is authenticated
        if (!user) {
          console.log("User not authenticated, redirecting to login")
          router.push("/login")
          return
        }

        // Use our helper function to safely fetch doctor data
        const doctorData = await getPublicDoctorProfile(id)

        if (!doctorData) {
          setError("Doctor not found")
          setIsLoading(false)
          return
        }

        // Ensure education, certifications, and languages are arrays
        const formattedDoctor = {
          ...doctorData,
          education: Array.isArray(doctorData.education)
            ? doctorData.education
            : [doctorData.education].filter(Boolean),
          certifications: Array.isArray(doctorData.certifications)
            ? doctorData.certifications
            : [doctorData.certifications].filter(Boolean),
          languages: Array.isArray(doctorData.languages)
            ? doctorData.languages
            : [doctorData.languages].filter(Boolean),
        }

        setDoctor(formattedDoctor)
        console.log("Doctor data processed successfully", formattedDoctor)

        // Fetch doctor availability
        fetchDoctorAvailability(id)
      } catch (error) {
        console.error("Error fetching doctor data:", error)

        // Handle specific error types
        if (error.code === "permission-denied") {
          setError("You don't have permission to view this doctor's profile. This may be due to security restrictions.")
        } else {
          setError("Failed to load doctor profile. Please try again later.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchDoctorData()
    }
  }, [id, user, router])

  // Live online status subscription
  useEffect(() => {
    if (!id) return
    const unsubscribe = getUserOnlineStatus(id, (status) => {
      setOnlineStatus(status)
      setDoctor((prev) => (prev ? { ...prev, isOnline: status.isOnline } : prev))
    })
    return () => {
      try {
        unsubscribe && unsubscribe()
      } catch {}
    }
  }, [id])

  const fetchDoctorAvailability = async (doctorId) => {
    setAvailabilityLoading(true)
    try {
      const unavailableDates = await getDoctorAvailability(doctorId)
      setAvailability(unavailableDates)
      console.log("Doctor unavailable dates:", unavailableDates)
    } catch (error) {
      console.error("Error fetching doctor availability:", error)
    } finally {
      setAvailabilityLoading(false)
    }
  }

  const handleBookAppointment = () => {
    setIsAppointmentModalOpen(true)
  }

  const handleAppointmentSuccess = () => {
    setIsAppointmentModalOpen(false)
    setAppointmentSuccess(true)

    // Reset success message after 5 seconds
    setTimeout(() => {
      setAppointmentSuccess(false)
    }, 5000)
  }

  const handleMessageDoctor = async () => {
    if (!user || !doctor) return

    setIsMessageLoading(true)

    try {
      // Check if there's an existing conversation
      const existingConversationId = await checkExistingConversation([user.uid, doctor.id])

      if (existingConversationId) {
        // If conversation exists, navigate to it
        router.push(`/dashboard/messages?conversation=${existingConversationId}`)
      } else {
        // Create a new conversation
        const firstMessage = `Hello Dr. ${doctor.lastName || doctor.displayName.split(" ").pop() || ""}, I'd like to discuss my health concerns with you.`
        const conversationId = await createConversation([user.uid, doctor.id], firstMessage)

        // Navigate to the new conversation
        router.push(`/dashboard/messages?conversation=${conversationId}`)
      }
    } catch (error) {
      console.error("Error starting conversation:", error)
      alert("Failed to start conversation. Please try again.")
    } finally {
      setIsMessageLoading(false)
    }
  }

  // Helper function to safely render arrays
  const renderArray = (arr, renderItem) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) {
      return <li className="text-drift-gray">Information not available</li>
    }
    return arr.map((item, index) => renderItem(item, index))
  }

  // Get the current day of the week
  const getDayOfWeek = () => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    return days[new Date().getDay()]
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
  }
  // Presence label: Active now | Active Xm ago | Offline (>=24h)
  const getPresenceLabel = () => {
    if (doctor?.isOnline) return "Active now"
    const last = onlineStatus?.lastActive
    if (!last) return "Offline"
    let lastDate
    try {
      lastDate = last?.toDate ? last.toDate() : new Date(last)
    } catch {
      lastDate = new Date(last)
    }
    const now = new Date()
    const diffMs = now - lastDate
    const diffMin = Math.floor(diffMs / (1000 * 60))
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr >= 24) return "Offline"
    if (diffHr >= 1) return `Active ${diffHr}h ago`
    const mins = Math.max(diffMin, 0)
    return `Active ${mins}m ago`
  }
  // Helper: keep only today/future dates
  const filterUpcomingDates = (dates) => {
    if (!Array.isArray(dates)) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return dates.filter((d) => {
      if (!d) return false
      const dateObj = new Date(d)
      dateObj.setHours(0, 0, 0, 0)
      return dateObj >= today
    })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent"></div>
          <p className="text-drift-gray">Loading doctor profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-graphite">{error}</h2>
        <p className="mb-6 text-drift-gray">
          {error.includes("permission")
            ? "This could be due to security settings. Please contact support if you believe this is an error."
            : "The doctor profile you're looking for could not be found or is currently unavailable."}
        </p>
        <button
          onClick={() => router.back()}
          className="flex items-center rounded-md bg-amber-500 px-4 py-2 text-white hover:bg-amber-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Banner with back button on the right */}
      <div className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Doctor Profile</h1>
            <p className="mt-1 text-amber-100">View doctor information and book appointments</p>
          </div>
          <button
            onClick={() => router.back()}
            className="flex items-center rounded-md bg-white/20 px-3 py-2 text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </button>
        </div>
      </div>

      {/* Success message */}
      {appointmentSuccess && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-green-800">
          <p className="flex items-center font-medium">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Appointment booked successfully!
          </p>
        </div>
      )}

      {/* Doctor profile header */}
      <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
          <div className="relative inline-block align-top">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-amber-100 bg-pale-stone sm:h-32 sm:w-32">
              <ProfileImage
                src={doctor?.photoURL}
                alt={doctor?.displayName}
                className="h-full w-full object-cover"
                role="doctor"
              />
            </div>
            {/* Status dot and presence label pinned to outside bottom-right of avatar */}
            <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 sm:-bottom-1 sm:-right-1 sm:translate-x-1/3 sm:translate-y-1/3 flex items-center gap-1 z-20">
              <span
                className={`h-4 w-4 rounded-full ring-2 ring-white shadow-md ${
                  doctor?.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
                title={doctor?.isOnline ? "Active now" : getPresenceLabel()}
              />
              <span className="hidden sm:inline rounded-full bg-white/95 border border-pale-stone px-2 py-0.5 text-[11px] text-graphite shadow whitespace-nowrap">
                {getPresenceLabel()}
              </span>
            </div>
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
              <h1 className="text-2xl font-bold text-graphite md:text-3xl">{doctor?.displayName}</h1>
              {doctor?.verified && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-lg text-drift-gray">{doctor?.specialty}</p>
            {doctor?.officeHours && (
              <p className="mt-1 text-sm text-drift-gray"><span className="font-medium text-graphite">Office Hours:</span> {doctor.officeHours}</p>
            )}

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {doctor?.experience && (
                <div className="flex items-center text-drift-gray">
                  <Briefcase className="mr-1 h-4 w-4" />
                  <span className="text-sm">{doctor?.experience}</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full sm:w-auto sm:min-w-[260px]">
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={handleBookAppointment}
                className="w-full rounded-md bg-amber-500 px-4 py-2.5 text-white hover:bg-amber-600 font-medium"
              >
                Book Appointment
              </button>
              <button
                onClick={handleMessageDoctor}
                disabled={isMessageLoading}
                className="w-full rounded-md border border-amber-500 px-4 py-2.5 text-amber-600 hover:bg-amber-50 font-medium flex items-center justify-center"
              >
                {isMessageLoading ? (
                  <span className="flex items-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mr-2"></div>
                    Connecting...
                  </span>
                ) : (
                  <>
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      

      {/* Doctor details */}
      {/* Full-width About (always render; conditionally show subsections) */}
      <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Stethoscope className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-semibold text-graphite">About Dr. {doctor?.lastName || doctor?.displayName.split(" ").pop()}</h2>
          </div>
        {doctor?.bio && (
          <p className="text-drift-gray leading-relaxed">{doctor?.bio}</p>
        )}

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {doctor?.education && doctor.education.length > 0 && (
              <div>
                <h3 className="mb-3 font-medium text-graphite flex items-center">
                  <Award className="mr-2 h-5 w-5 text-amber-500" />
                  Education
                </h3>
                <ul className="space-y-3 pl-7">
                  {renderArray(doctor?.education, (edu, index) => (
                    <li key={index} className="list-disc text-drift-gray">
                      {edu}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {doctor?.certifications && doctor.certifications.length > 0 && (
              <div>
                <h3 className="mb-3 font-medium text-graphite flex items-center">
                  <CheckCircle className="mr-2 h-5 w-5 text-amber-500" />
                  Certifications
                </h3>
                <ul className="space-y-3 pl-7">
                  {renderArray(doctor?.certifications, (cert, index) => (
                    <li key={index} className="list-disc text-drift-gray">
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        {doctor?.languages && doctor.languages.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 font-medium text-graphite flex items-center">
                <Globe className="mr-2 h-5 w-5 text-amber-500" />
                Languages
              </h3>
              <div className="flex flex-wrap gap-2 pl-7">
                {doctor.languages.map((lang, index) => (
                  <span key={index} className="rounded-full bg-pale-stone px-3 py-1 text-sm text-drift-gray">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
        )}

          {/* Office Hours moved into About section - supports workingHours grid or officeHours string */}
        {(doctor?.workingHours || doctor?.officeHours) && (
          <div className="mt-6">
            <h3 className="mb-3 font-medium text-graphite flex items-center">
              <Clock className="mr-2 h-5 w-5 text-amber-500" />
              Office Hours
            </h3>
            {doctor?.workingHours ? (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 pl-0">
                {Object.entries(doctor.workingHours || {}).map(([day, hours]) => (
                  <div key={day} className="rounded-md border border-pale-stone p-3">
                    <h4 className="font-medium text-graphite">{day}</h4>
                    <p className="mt-1 text-sm text-drift-gray">{hours || "Not Available"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-drift-gray">{doctor?.officeHours}</p>
            )}
          </div>
        )}
      </div>

      {/* Two-column row: Availability and Contact */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Availability */}
        <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-graphite flex items-center">
            <Clock className="mr-2 h-5 w-5 text-amber-500" />
            Availability
          </h2>

          {availabilityLoading ? (
            <div className="flex justify-center py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
            </div>
          ) : (
            <>
              {doctor?.workingHours && (
                <div>
                  <h3 className="mb-2 font-medium text-graphite">Working Hours</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(doctor.workingHours || {}).map(([day, hours]) => (
                      <div
                        key={day}
                        className={`rounded-md border p-3 ${getDayOfWeek() === day ? "border-amber-300 bg-amber-50" : "border-pale-stone"}`}
                      >
                        <h3 className="font-medium text-graphite">{day}</h3>
                        <p className="mt-1 text-sm text-drift-gray">{hours || "Not Available"}</p>
                        {getDayOfWeek() === day && <p className="text-xs text-amber-600 mt-1">Today</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(() => {
                const upcoming = filterUpcomingDates(availability)
                if (!upcoming || upcoming.length === 0) return null
                return (
                  <div className="mt-6">
                    <h3 className="mb-2 font-medium text-graphite">Unavailable Dates (Upcoming)</h3>
                    <div className="rounded-md border border-red-200 bg-red-50 p-3">
                      <div className="flex flex-wrap gap-2">
                        {upcoming.slice(0, 8).map((date, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-red-600 border border-red-200"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {formatDate(date)}
                          </span>
                        ))}
                        {upcoming.length > 8 && (
                          <span className="rounded-full bg-white px-3 py-1 text-xs text-red-600 border border-red-200">
                            +{upcoming.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </div>

        {/* Contact Information */}
        <div className="rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-graphite">Contact Information</h2>
          <ul className="space-y-4">
            {doctor?.address && (
              <li className="flex items-start">
                <MapPin className="mr-3 h-5 w-5 text-amber-500" />
                <span className="text-drift-gray">{doctor?.address}</span>
              </li>
            )}
            {doctor?.phone && (
              <li className="flex items-center">
                <Phone className="mr-3 h-5 w-5 text-amber-500" />
                <span className="text-drift-gray">{doctor?.phone}</span>
              </li>
            )}
            {doctor?.email && (
              <li className="flex items-center">
                <Mail className="mr-3 h-5 w-5 text-amber-500" />
                <span className="text-drift-gray">{doctor?.email}</span>
              </li>
            )}
          </ul>

          {doctor?.officeHours && (
            <div className="mt-4 rounded-md bg-pale-stone p-3">
              <h3 className="font-medium text-graphite">Office Hours</h3>
              <p className="mt-1 text-sm text-drift-gray">{doctor.officeHours}</p>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        userRole="patient"
        onBook={handleAppointmentSuccess}
        selectedDoctor={doctor ? { id: doctor.id, name: doctor.displayName } : null}
      />
    </div>
  )
}
