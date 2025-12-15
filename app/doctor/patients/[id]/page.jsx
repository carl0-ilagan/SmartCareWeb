"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  FileText,
  MessageSquare,
  ArrowLeft,
  AlertCircle,
  Stethoscope,
  Activity,
  Pill,
  ChevronRight,
  CalendarDays,
  MessageCircle,
  FileIcon,
  Shield,
  Heart,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getPatientById, getPatientInteractions } from "@/lib/doctor-utils"
// Import the AppointmentHistory component
import { AppointmentHistory } from "@/components/appointment-history"
import ProfileImage from "@/components/profile-image"

export default function PatientDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [patient, setPatient] = useState(null)
  const [interactions, setInteractions] = useState({
    appointments: 0,
    messages: 0,
    records: 0,
    sharedRecords: 0,
    lastInteraction: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  // Add state for activeTab
  const [activeTab, setActiveTab] = useState("profile") // "profile" or "appointments"

  // Get patient ID from URL
  const patientId = params.id

  // Load patient data
  useEffect(() => {
    if (!user || !patientId) return

    // Update the loadPatient function to properly handle the phone number
    const loadPatient = async () => {
      setLoading(true)
      setError("")

      try {
        // Get patient data
        const patientData = await getPatientById(patientId)

        if (!patientData) {
          setError("Patient not found.")
          setLoading(false)
          return
        }

        // Log the patient data to verify we're getting the phone number
        console.log("Patient data:", patientData)

        setPatient(patientData)

        // Get interaction data
        const interactionData = await getPatientInteractions(user.uid, patientId)
        setInteractions(interactionData)

        setLoading(false)
      } catch (error) {
        console.error("Error loading patient:", error)
        setError("Failed to load patient information. Please try again.")
        setLoading(false)
      }
    }

    loadPatient()
  }, [user, patientId])

  // Navigate to messages page - opens directly to conversation with this patient
  const handleViewMessages = () => {
    router.push(`/doctor/chat?patientId=${patientId}`)
  }

  // Navigate to records page
  const handleViewRecords = () => {
    router.push(`/doctor/patients/${patientId}/records`)
  }

  // Navigate to prescriptions page
  const handleViewPrescriptions = () => {
    router.push(`/doctor/patients/${patientId}/prescriptions`)
  }

  // Navigate back to patients list
  const handleBackToPatients = () => {
    router.push("/doctor/patients")
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 p-4 sm:p-6 shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10"></div>

        <div className="relative z-10">
          <button
            onClick={handleBackToPatients}
            className="mb-4 inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/30 hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patients
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {!loading && patient ? (
                <>
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-white/50 overflow-hidden shadow-xl">
                    <ProfileImage
                      src={patient.photoURL}
                      alt={patient.displayName || "Patient"}
                      className="h-full w-full"
                      role="patient"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{patient.displayName}</h1>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        Patient
                      </span>
                      {patient.email && (
                        <span className="flex items-center text-white/90 text-xs sm:text-sm">
                          <Mail className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                          {patient.email}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 sm:h-20 sm:w-20 animate-pulse rounded-full bg-white/20"></div>
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

      {loading ? (
        // Loading state
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soft-amber mb-4"></div>
            <p className="text-drift-gray">Loading patient information...</p>
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
            onClick={handleBackToPatients}
            className="mt-4 inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm border border-red-200 transition-colors hover:bg-red-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </button>
        </div>
      ) : patient ? (
        <>
          {/* Enhanced tab controls with switch-like appearance */}
          <div className="flex justify-center mb-6 mt-8">
            <div className="flex p-1 bg-amber-100/50 rounded-full shadow-sm">
              <button
                onClick={() => setActiveTab("profile")}
                className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeTab === "profile" ? "bg-amber-500 text-white shadow-sm" : "text-amber-700 hover:text-amber-900"
                }`}
              >
                <span>Patient Profile</span>
              </button>
              <button
                onClick={() => setActiveTab("appointments")}
                className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
                  activeTab === "appointments"
                    ? "bg-amber-500 text-white shadow-sm"
                    : "text-amber-700 hover:text-amber-900"
                }`}
              >
                <span>Appointment History</span>
              </button>
            </div>
          </div>

          {/* Conditional rendering based on active tab */}
          {activeTab === "profile" ? (
            <>
              {/* Patient Information */}
              <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {/* Contact Information */}
                <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
                  <div className="mb-6 flex items-center gap-3 pb-4 border-b-2 border-amber-200/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-soft-amber to-amber-500 shadow-lg">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Contact Information</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                        <User className="h-5 w-5 text-soft-amber" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                        <p className="text-base sm:text-lg text-gray-900 break-words">{patient.displayName}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                        <Mail className="h-5 w-5 text-soft-amber" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Email</p>
                        <p className="text-base sm:text-lg text-gray-900 break-words">{patient.email || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                        <Phone className="h-5 w-5 text-soft-amber" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Phone</p>
                        <p className="text-base sm:text-lg text-gray-900">{patient.phoneNumber || patient.phone || "Not provided"}</p>
                      </div>
                    </div>

                    {patient.address && (
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                          <MapPin className="h-5 w-5 text-soft-amber" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Address</p>
                          <p className="text-base sm:text-lg text-gray-900 break-words">{patient.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medical Information */}
                <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
                  <div className="mb-6 flex items-center gap-3 pb-4 border-b-2 border-amber-200/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-500 shadow-lg">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Medical Information</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                        <Calendar className="h-5 w-5 text-soft-amber" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date of Birth</p>
                        <p className="text-base sm:text-lg text-gray-900">
                          {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-400/20 to-red-50 flex-shrink-0">
                        <Activity className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Blood Type</p>
                        <p className="text-base sm:text-lg text-gray-900">{patient.bloodType || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-50 flex-shrink-0">
                        <Shield className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Allergies</p>
                        <p className="text-base sm:text-lg text-gray-900">{patient.allergies || "None reported"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-400/20 to-purple-50 flex-shrink-0">
                        <Pill className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Current Medications</p>
                        <p className="text-base sm:text-lg text-gray-900 break-words">{patient.medications || "None reported"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interaction Summary */}
                <div className="rounded-2xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
                  <div className="mb-6 flex items-center gap-3 pb-4 border-b-2 border-amber-200/30">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-500 shadow-lg">
                      <FileIcon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Interaction Summary</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                        <CalendarDays className="h-5 w-5 text-soft-amber" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Appointments</p>
                        <p className="text-base sm:text-lg text-gray-900">{interactions.appointments} total</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                        <MessageCircle className="h-5 w-5 text-soft-amber" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Messages</p>
                        <p className="text-base sm:text-lg text-gray-900">{interactions.messages} total</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                        <FileText className="h-5 w-5 text-soft-amber" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Medical Records</p>
                        <p className="text-base sm:text-lg text-gray-900">
                          {interactions.records} total / {interactions.sharedRecords || 0} shared with you
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                        <Clock className="h-5 w-5 text-soft-amber" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Last Interaction</p>
                        <p className="text-base sm:text-lg text-gray-900">
                          {interactions.lastInteraction
                            ? formatDate(interactions.lastInteraction)
                            : "No interactions yet"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-amber-100/50 hover:bg-white/80 transition-all duration-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                        <Shield className="h-5 w-5 text-soft-amber" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Records Access</p>
                        <p className="text-base sm:text-lg text-gray-900">
                          Patient must explicitly share medical records with you to view them
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                <button
                  onClick={handleViewMessages}
                  className="group flex items-center justify-between rounded-xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 p-4 sm:p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl hover:border-amber-300 hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-soft-amber/20 to-amber-50 text-soft-amber group-hover:from-soft-amber/30 group-hover:to-amber-100 transition-all duration-200 shadow-md">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Messages</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Open conversation</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-soft-amber transition-colors flex-shrink-0" />
                </button>

                <button
                  onClick={handleViewRecords}
                  className="group flex items-center justify-between rounded-xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 p-4 sm:p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl hover:border-amber-300 hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-soft-amber/20 to-amber-50 text-soft-amber group-hover:from-soft-amber/30 group-hover:to-amber-100 transition-all duration-200 shadow-md">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Medical Records</h3>
                      <p className="text-xs sm:text-sm text-gray-600">View shared records</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-soft-amber transition-colors flex-shrink-0" />
                </button>

                <button
                  onClick={handleViewPrescriptions}
                  className="group flex items-center justify-between rounded-xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 p-4 sm:p-5 shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl hover:border-amber-300 hover:scale-105"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-soft-amber/20 to-amber-50 text-soft-amber group-hover:from-soft-amber/30 group-hover:to-amber-100 transition-all duration-200 shadow-md">
                      <Pill className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Prescriptions</h3>
                      <p className="text-xs sm:text-sm text-gray-600">Manage prescriptions</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-soft-amber transition-colors flex-shrink-0" />
                </button>
              </div>
            </>
          ) : (
            // Appointment History Tab Content
            <AppointmentHistory userId={patientId} viewMode="doctor" doctorId={user?.uid} />
          )}
        </>
      ) : (
        // Not found
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <div className="flex justify-center mb-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-red-800">Patient Not Found</h3>
          <p className="text-red-600">The patient you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={handleBackToPatients}
            className="mt-4 inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm border border-red-200 transition-colors hover:bg-red-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
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
      `}</style>
    </div>
  )
}
