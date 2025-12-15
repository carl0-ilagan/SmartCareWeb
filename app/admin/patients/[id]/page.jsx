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
  FileText,
  ArrowLeft,
  AlertCircle,
  Activity,
  Pill,
  Shield,
  Lock,
  CalendarDays,
  FileIcon,
  Eye,
  History,
  UserCog,
  FileImage,
  FileIcon as FilePdf,
  FileSpreadsheet,
  Info,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getPatientById } from "@/lib/doctor-utils"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AppointmentHistory } from "@/components/appointment-history"
import { AnimatedAccessRestricted } from "@/components/animated-access-restricted"
import { sendAccessRequestNotification } from "@/lib/notification-utils"
import { SuccessNotification } from "@/components/success-notification"
import ProfileImage from "@/components/profile-image"
import { AdminHeaderBanner } from "@/components/admin/admin-header-banner"

export default function AdminPatientDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("profile") // "profile", "appointments", "records", "prescriptions"
  const [accessStatus, setAccessStatus] = useState({
    records: "restricted", // "granted", "restricted", "pending"
    prescriptions: "restricted",
    appointments: "restricted",
  })
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestType, setRequestType] = useState("")
  const [requestReason, setRequestReason] = useState("")
  const [requestLoading, setRequestLoading] = useState(false)
  const [accessHistory, setAccessHistory] = useState([])
  const [privacySettings, setPrivacySettings] = useState({
    allowAdminViewRecords: false,
    allowAdminViewAppointments: false,
    allowAdminViewPrescriptions: false,
  })
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [tabOpen, setTabOpen] = useState(false)

  // Get patient ID from URL
  const patientId = params.id

  // Load patient data
  useEffect(() => {
    if (!user || !patientId) return

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

        setPatient(patientData)

        // Get patient privacy settings
        const settingsDoc = await getDoc(doc(db, "userSettings", patientId))

        if (settingsDoc.exists()) {
          const settings = settingsDoc.data()
          const privacy = settings.privacy || {}

          // Set access status based on privacy settings
          setAccessStatus({
            records: privacy.allowAdminViewRecords ? "granted" : "restricted",
            appointments: privacy.allowAdminViewAppointments ? "granted" : "restricted",
            prescriptions: privacy.allowAdminViewPrescriptions ? "granted" : "restricted",
          })

          setPrivacySettings({
            allowAdminViewRecords: privacy.allowAdminViewRecords || false,
            allowAdminViewAppointments: privacy.allowAdminViewAppointments || false,
            allowAdminViewPrescriptions: privacy.allowAdminViewPrescriptions || false,
          })
        }

        // Get access history
        try {
          const accessHistoryRef = collection(db, "accessLogs")
          const q = query(
            accessHistoryRef,
            where("patientId", "==", patientId),
            orderBy("timestamp", "desc"),
            limit(10),
          )

          const accessSnapshot = await getDocs(q)
          const accessLogs = []

          accessSnapshot.forEach((doc) => {
            const data = doc.data()
            accessLogs.push({
              id: doc.id,
              type: data.dataType,
              status: data.status,
              requestedBy: data.adminName,
              requestedAt: data.timestamp.toDate().toISOString(),
              reason: data.reason,
              expiresAt: data.expiresAt ? data.expiresAt.toDate().toISOString() : null,
              deniedReason: data.deniedReason || null,
            })
          })

          setAccessHistory(accessLogs)
        } catch (error) {
          console.error("Error fetching access logs:", error)
          // Continue with the rest of the function even if access logs fail
        }

        setLoading(false)
      } catch (error) {
        console.error("Error loading patient:", error)
        setError("Failed to load patient information. Please try again.")
        setLoading(false)
      }
    }

    loadPatient()
  }, [user, patientId])

  // Navigate back to patients list
  const handleBackToPatients = () => {
    router.push("/admin/patients")
  }

  // Request access to patient data
  const handleRequestAccess = async () => {
    if (!requestType || !requestReason) return

    setRequestLoading(true)

    try {
      // Create an access request in the database
      const accessRequestRef = collection(db, "accessRequests")
      await addDoc(accessRequestRef, {
        patientId: patientId,
        adminId: user.uid,
        adminName: user.displayName || "Admin User",
        dataType: requestType,
        reason: requestReason,
        status: "pending",
        timestamp: serverTimestamp(),
      })

      // Log the access attempt
      await addDoc(collection(db, "accessLogs"), {
        patientId: patientId,
        adminId: user.uid,
        adminName: user.displayName || "Admin User",
        dataType: requestType,
        status: "pending",
        reason: requestReason,
        timestamp: serverTimestamp(),
      })

      // Send notification to the patient
      await sendAccessRequestNotification(
        patientId,
        user.uid,
        user.displayName || "Admin User",
        requestType,
        requestReason,
      )

      // Update local state to show pending
      setAccessStatus((prev) => ({
        ...prev,
        [requestType]: "pending",
      }))

      // Add to access history
      setAccessHistory((prev) => [
        {
          id: `access${Date.now()}`,
          type: requestType,
          status: "pending",
          requestedBy: `Admin ${user?.displayName || "User"}`,
          requestedAt: new Date().toISOString(),
          reason: requestReason,
        },
        ...prev,
      ])

      // Close modal and reset form
      setShowRequestModal(false)
      setRequestType("")
      setRequestReason("")

      // Replace this:
      // alert(
      //   "Access request submitted successfully. The patient has been notified and you will be updated when they respond.",
      // )

      // With this:
      setSuccessMessage(
        "Access request submitted successfully. The patient has been notified and you will be updated when they respond.",
      )
      setShowSuccessNotification(true)
    } catch (error) {
      console.error("Error requesting access:", error)
      alert("Failed to submit access request. Please try again.")
    } finally {
      setRequestLoading(false)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

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

  // Calculate age from birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) {
      // Check for alternative date fields
      if (patient?.dob) birthdate = patient.dob
      else if (patient?.birthdate) birthdate = patient.birthdate
      else if (patient?.birthDate) birthdate = patient.birthDate
      else if (patient?.dateOfBirth) birthdate = patient.dateOfBirth

      if (!birthdate) return "N/A"
    }

    try {
      const today = new Date()
      const birthDate = new Date(birthdate)

      // Check if the date is valid
      if (isNaN(birthDate.getTime())) return "N/A"

      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDifference = today.getMonth() - birthDate.getMonth()

      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      return age.toString()
    } catch (error) {
      console.error("Error calculating age:", error)
      return "N/A"
    }
  }

  // Log access attempt
  const logAccessAttempt = async (section) => {
    try {
      // Log the access attempt to the database
      await addDoc(collection(db, "accessLogs"), {
        patientId: patientId,
        adminId: user.uid,
        adminName: user.displayName || "Admin User",
        dataType: section,
        status: accessStatus[section],
        timestamp: serverTimestamp(),
      })

      console.log(`Admin ${user?.displayName || "Unknown"} attempted to access ${section} for patient ${patientId}`)
    } catch (error) {
      console.error("Error logging access:", error)
    }
  }

  // Records View Component
  const RecordsView = ({ patientId }) => {
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [showRecordModal, setShowRecordModal] = useState(false)

    // Fetch patient records
    const fetchRecords = useCallback(async () => {
      if (!patientId) return

      setLoading(true)
      setError("")

      try {
        const recordsRef = collection(db, "medicalRecords")
        const q = query(recordsRef, where("patientId", "==", patientId), orderBy("uploadedDate", "desc"))

        const querySnapshot = await getDocs(q)
        const recordsList = []

        querySnapshot.forEach((doc) => {
          recordsList.push({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate?.() || doc.data().date,
            uploadedDate: doc.data().uploadedDate?.toDate?.() || doc.data().uploadedDate,
          })
        })

        setRecords(recordsList)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching records:", err)
        setError("Failed to load medical records. Please try again.")
        setLoading(false)
      }
    }, [patientId])

    useEffect(() => {
      fetchRecords()
    }, [fetchRecords])

    // View record details
    const handleViewRecord = (record) => {
      setSelectedRecord(record)
      setShowRecordModal(true)
    }

    // Get file type icon
    const getFileIcon = (fileType) => {
      if (!fileType) return <FileText className="h-5 w-5" />
      if (fileType.startsWith("image/")) return <FileImage className="h-5 w-5" />
      if (fileType === "application/pdf") return <FilePdf className="h-5 w-5" />
      if (fileType.includes("spreadsheet") || fileType.includes("excel")) return <FileSpreadsheet className="h-5 w-5" />
      return <FileText className="h-5 w-5" />
    }

    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return "N/A"
      return new Date(dateString).toLocaleDateString()
    }

    // Close record modal
    const closeRecordModal = () => {
      setShowRecordModal(false)
      setSelectedRecord(null)
    }

    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-soft-amber mb-3"></div>
            <p className="text-gray-500">Loading medical records...</p>
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

    if (records.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-500">No Medical Records</h3>
          <p className="text-gray-400 mt-1">This patient has no uploaded medical records.</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="border border-pale-stone rounded-lg p-4 hover:border-soft-amber/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-soft-amber/10 flex items-center justify-center text-soft-amber mr-3">
                    {getFileIcon(record.fileType)}
                  </div>
                  <div>
                    <h3 className="font-medium text-graphite">{record.name || "Medical Record"}</h3>
                    <p className="text-xs text-drift-gray">{formatDate(record.date || record.uploadedDate)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleViewRecord(record)}
                  className="text-soft-amber hover:text-amber-600"
                  aria-label="View record details"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 text-sm text-drift-gray">
                <p className="line-clamp-2">{record.description || record.notes || "No description provided"}</p>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs px-2 py-0.5 bg-earth-beige/20 rounded-full text-drift-gray">
                  {record.type || "Medical Document"}
                </span>
                <span className="text-xs text-drift-gray">
                  {record.doctorName ? `Dr. ${record.doctorName}` : "Uploaded by patient"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Record View Modal */}
        {showRecordModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-graphite">Medical Record Details</h3>
                <button
                  onClick={closeRecordModal}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close modal"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md text-sm flex items-center mb-4">
                <Info className="h-4 w-4 mr-2 text-amber-500" />
                <div>
                  <p className="font-medium">Admin Restricted View</p>
                  <p className="text-xs mt-1">
                    You are viewing this record in restricted mode. Downloads and doctor's notes are not available.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-graphite mb-3">{selectedRecord.name || "Medical Record"}</h4>
                  <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-gray-700">Date:</span>
                      <span className="ml-auto text-sm text-gray-500">
                        {formatDate(selectedRecord.date || selectedRecord.uploadedDate)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-gray-700">Type:</span>
                      <span className="ml-auto text-sm text-gray-500">{selectedRecord.type || "Medical Document"}</span>
                    </div>
                    {selectedRecord.fileType && (
                      <div className="flex items-center">
                        <FileIcon className="mr-2 h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-gray-700">File Type:</span>
                        <span className="ml-auto text-sm text-gray-500">
                          {selectedRecord.fileType.split("/")[1]?.toUpperCase() || selectedRecord.fileType}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-gray-700">Uploaded:</span>
                      <span className="ml-auto text-sm text-gray-500">{formatDate(selectedRecord.uploadedDate)}</span>
                    </div>
                  </div>

                  {selectedRecord.notes && (
                    <div className="mt-4">
                      <h4 className="mb-2 text-sm font-medium text-gray-700">Patient Notes:</h4>
                      <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
                        {selectedRecord.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <Shield className="h-4 w-4 mr-2 text-amber-500" />
                      <span>Download and doctor's notes are restricted in admin view</span>
                    </div>
                  </div>
                </div>

                <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
                  {selectedRecord.fileData && selectedRecord.fileType?.startsWith("image/") ? (
                    <img
                      src={selectedRecord.fileData || "/placeholder.svg"}
                      alt={selectedRecord.name || "Medical record"}
                      className="max-h-[400px] max-w-full rounded-lg object-contain"
                    />
                  ) : selectedRecord.fileType === "application/pdf" ? (
                    <div className="flex h-full w-full flex-col items-center justify-center">
                      <FilePdf className="mb-2 h-16 w-16 text-red-500" />
                      <p className="text-center text-gray-500">PDF preview not available in admin view</p>
                    </div>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center">
                      {getFileIcon(selectedRecord.fileType)}
                      <p className="text-center text-gray-500 mt-2">Preview not available for this file type</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md text-sm flex items-center">
            <Shield className="h-4 w-4 mr-2 text-amber-500" />
            <div>
              <p className="font-medium">Restricted Admin View</p>
              <p className="text-xs mt-1">
                You can view records but cannot download files or access doctor's notes. All access is logged for
                compliance purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Prescriptions View Component
  const PrescriptionsView = ({ patientId }) => {
    const [prescriptions, setPrescriptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [selectedPrescription, setSelectedPrescription] = useState(null)
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)

    // Fetch patient prescriptions
    const fetchPrescriptions = useCallback(async () => {
      if (!patientId) return

      setLoading(true)
      setError("")

      try {
        const prescriptionsRef = collection(db, "prescriptions")
        const q = query(prescriptionsRef, where("patientId", "==", patientId), orderBy("createdAt", "desc"))

        const querySnapshot = await getDocs(q)
        const prescriptionsList = []

        querySnapshot.forEach((doc) => {
          prescriptionsList.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
            updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt,
          })
        })

        setPrescriptions(prescriptionsList)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching prescriptions:", err)
        setError("Failed to load prescriptions. Please try again.")
        setLoading(false)
      }
    }, [patientId])

    useEffect(() => {
      fetchPrescriptions()
    }, [fetchPrescriptions])

    // View prescription details
    const handleViewPrescription = (prescription) => {
      setSelectedPrescription(prescription)
      setShowPrescriptionModal(true)
    }

    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return "N/A"
      return new Date(dateString).toLocaleDateString()
    }

    // Close prescription modal
    const closePrescriptionModal = () => {
      setShowPrescriptionModal(false)
      setSelectedPrescription(null)
    }

    // Get status badge
    const getStatusBadge = (status) => {
      switch (status?.toLowerCase()) {
        case "active":
          return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Active</span>
        case "completed":
          return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Completed</span>
        case "expired":
          return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Expired</span>
        case "cancelled":
          return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">Cancelled</span>
        default:
          return (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">{status || "Unknown"}</span>
          )
      }
    }

    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-soft-amber mb-3"></div>
            <p className="text-gray-500">Loading prescriptions...</p>
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

    if (prescriptions.length === 0) {
      return (
        <div className="text-center py-8">
          <Pill className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-500">No Prescriptions</h3>
          <p className="text-gray-400 mt-1">This patient has no prescriptions on record.</p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="border border-pale-stone rounded-lg p-4 hover:border-soft-amber/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="h-10 w-10 rounded-full bg-soft-amber/10 flex items-center justify-center text-soft-amber mr-3">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-graphite">{prescription.medicationName || "Prescription"}</h3>
                    <p className="text-xs text-drift-gray">Prescribed: {formatDate(prescription.createdAt)}</p>
                    <div className="mt-2 text-sm">
                      <p className="text-drift-gray line-clamp-2">
                        {prescription.dosage || "No dosage information"}{" "}
                        {prescription.frequency && `- ${prescription.frequency}`}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center flex-wrap gap-2">
                      {getStatusBadge(prescription.status)}
                      <span className="text-xs text-drift-gray">
                        {prescription.doctorName ? `Dr. ${prescription.doctorName}` : "Unknown doctor"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleViewPrescription(prescription)}
                  className="text-soft-amber hover:text-amber-600"
                  aria-label="View prescription details"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Prescription View Modal */}
        {showPrescriptionModal && selectedPrescription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-graphite">Prescription Details</h3>
                <button
                  onClick={closePrescriptionModal}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close modal"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md text-sm flex items-center mb-4">
                <Info className="h-4 w-4 mr-2 text-amber-500" />
                <div>
                  <p className="font-medium">Admin Restricted View</p>
                  <p className="text-xs mt-1">
                    You are viewing this prescription in restricted mode. Downloads and doctor's private notes are not
                    available.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="font-medium text-graphite mb-3">
                    {selectedPrescription.medicationName || "Prescription"}
                  </h4>
                  <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-gray-700">Prescribed Date:</span>
                      <span className="ml-auto text-sm text-gray-500">
                        {formatDate(selectedPrescription.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-gray-700">Doctor:</span>
                      <span className="ml-auto text-sm text-gray-500">
                        {selectedPrescription.doctorName ? `Dr. ${selectedPrescription.doctorName}` : "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Activity className="mr-2 h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <span className="ml-auto">{getStatusBadge(selectedPrescription.status)}</span>
                    </div>
                    {selectedPrescription.refills !== undefined && (
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-gray-700">Refills:</span>
                        <span className="ml-auto text-sm text-gray-500">{selectedPrescription.refills}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <h4 className="mb-2 text-sm font-medium text-gray-700">Medication Details:</h4>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-700">Dosage:</span>
                        <p className="text-sm text-gray-500">{selectedPrescription.dosage || "Not specified"}</p>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-700">Frequency:</span>
                        <p className="text-sm text-gray-500">{selectedPrescription.frequency || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-700">Duration:</span>
                        <p className="text-sm text-gray-500">{selectedPrescription.duration || "Not specified"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <Shield className="h-4 w-4 mr-2 text-amber-500" />
                      <span>Doctor's private notes are restricted in admin view</span>
                    </div>
                  </div>
                </div>

                <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <Pill className="h-16 w-16 text-amber-300 mb-3" />
                    <h4 className="text-lg font-medium text-gray-700 mb-1">{selectedPrescription.medicationName}</h4>
                    <p className="text-sm text-gray-500 mb-3">{selectedPrescription.dosage}</p>
                    <div className="bg-white rounded-lg border border-gray-200 p-3 w-full max-w-xs">
                      <p className="text-xs text-gray-500 mb-1">Patient Instructions:</p>
                      <p className="text-sm text-gray-700">
                        {selectedPrescription.instructions || "Take as directed by your physician."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md text-sm flex items-center">
            <Shield className="h-4 w-4 mr-2 text-amber-500" />
            <div>
              <p className="font-medium">Restricted Admin View</p>
              <p className="text-xs mt-1">
                You can view basic prescription information but cannot download prescriptions or access detailed
                instructions. All access is logged for compliance purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const headerStats = patient
    ? [
        {
          label: "Status",
          value: patient.status === "inactive" ? "Inactive" : "Active",
          icon: <Shield className="h-4 w-4" />,
        },
        {
          label: "Last Login",
          value: formatDateTime(patient.lastLogin),
          icon: <Clock className="h-4 w-4" />,
        },
        {
          label: "Joined",
          value: formatDateTime(patient.createdAt),
          icon: <Calendar className="h-4 w-4" />,
        },
        {
          label: "Records Access",
          value:
            accessStatus.records === "granted"
              ? "Granted"
              : accessStatus.records === "pending"
                ? "Pending"
                : "Restricted",
          icon: <Shield className="h-4 w-4" />,
        },
      ]
    : [
        { label: "Status", value: "—" },
        { label: "Last Login", value: "—" },
        { label: "Joined", value: "—" },
        { label: "Records Access", value: "—" },
      ]

  return (
    <div className="space-y-6 animate-fadeIn">
      <AdminHeaderBanner
        title={patient?.displayName || "Patient Profile"}
        subtitle="View and manage patient details"
        stats={headerStats}
      />
      <div className="flex justify-between items-center">
          <button
            onClick={handleBackToPatients}
          className="inline-flex items-center rounded-md bg-earth-beige px-3 py-2 text-sm font-medium text-graphite transition-colors hover:bg-earth-beige/80"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Patients
          </button>
        <div className="flex items-center bg-white rounded-md px-3 py-1.5 border border-earth-beige">
          <Shield className="h-4 w-4 text-soft-amber mr-2" />
          <span className="text-xs font-medium text-graphite">Admin View</span>
        </div>
      </div>

      {loading ? (
        // Loading state
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soft-amber mb-4"></div>
            <p className="text-gray-500">Loading patient information...</p>
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
          {/* Tab controls - dropdown on mobile, pill switch on desktop */}
          <div className="mb-6 mt-4">
            {/* Mobile dropdown */}
            <div className="sm:hidden">
              <button
                onClick={() => setTabOpen((prev) => !prev)}
                className="w-full inline-flex items-center justify-between rounded-lg border border-earth-beige bg-white px-3 py-2 text-sm font-medium text-graphite shadow-sm transition hover:border-amber-500 hover:text-amber-700"
              >
                <span className="truncate capitalize">{activeTab.replace(/_/g, " ")}</span>
                <Lock className="h-4 w-4 text-drift-gray" />
              </button>
              <div
                className={`mt-1 rounded-lg border border-earth-beige bg-white shadow-md transition-all duration-200 ease-out ${
                  tabOpen ? "max-h-64 opacity-100 scale-100 pointer-events-auto" : "max-h-0 opacity-0 scale-95 pointer-events-none"
                } overflow-hidden`}
              >
                {[
                  { id: "profile", label: "Profile", icon: <User className="h-4 w-4 mr-2" /> },
                  { id: "appointments", label: "Appointments", icon: <CalendarDays className="h-4 w-4 mr-2" /> },
                  { id: "records", label: "Health Records", icon: <FileIcon className="h-4 w-4 mr-2" /> },
                  { id: "prescriptions", label: "Prescriptions", icon: <Pill className="h-4 w-4 mr-2" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setTabOpen(false)
                      if (tab.id === "appointments") logAccessAttempt("appointments")
                      if (tab.id === "records") logAccessAttempt("records")
                      if (tab.id === "prescriptions") logAccessAttempt("prescriptions")
                    }}
                    className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                      activeTab === tab.id ? "bg-amber-50 text-amber-700" : "hover:bg-cream text-graphite"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.id !== "profile" &&
                      (accessStatus?.[tab.id === "records" ? "records" : tab.id] ?? "") !== "granted" && (
                        <Lock className="h-3 w-3 ml-2 text-gray-400" />
                      )}
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
                onClick={() => {
                  setActiveTab("appointments")
                  logAccessAttempt("appointments")
                }}
                className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "appointments"
                    ? "bg-soft-amber text-white shadow-sm"
                    : "text-drift-gray hover:text-graphite"
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                <span>Appointments</span>
                {accessStatus.appointments !== "granted" && <Lock className="h-3 w-3 text-gray-400" />}
              </button>
              <button
                onClick={() => {
                  setActiveTab("records")
                  logAccessAttempt("records")
                }}
                className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "records" ? "bg-soft-amber text-white shadow-sm" : "text-drift-gray hover:text-graphite"
                }`}
              >
                <FileIcon className="h-4 w-4" />
                <span>Health Records</span>
                {accessStatus.records !== "granted" && <Lock className="h-3 w-3 text-gray-400" />}
              </button>
              <button
                onClick={() => {
                  setActiveTab("prescriptions")
                  logAccessAttempt("prescriptions")
                }}
                className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === "prescriptions"
                    ? "bg-soft-amber text-white shadow-sm"
                    : "text-drift-gray hover:text-graphite"
                }`}
              >
                <Pill className="h-4 w-4" />
                <span>Prescriptions</span>
                {accessStatus.prescriptions !== "granted" && <Lock className="h-3 w-3 text-gray-400" />}
              </button>
              </div>
            </div>
          </div>

          {/* Conditional rendering based on active tab */}
          {activeTab === "profile" && (
            <>
              {/* Patient Information */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Contact Information */}
                <div className="rounded-lg border border-pale-stone bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-soft-amber/30">
                  <h2 className="mb-4 text-lg font-semibold text-graphite">Contact Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <User className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Full Name</p>
                        <p className="text-drift-gray">{patient.displayName}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Mail className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Email</p>
                        <p className="text-drift-gray">{patient.email || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Phone className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Phone</p>
                        <p className="text-drift-gray">{patient.phoneNumber || patient.phone || "Not provided"}</p>
                      </div>
                    </div>
                    {patient.address && (
                      <div className="flex items-start">
                        <MapPin className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                        <div>
                          <p className="text-sm font-medium text-graphite">Address</p>
                          <p className="text-drift-gray">{patient.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medical Information */}
                <div className="rounded-lg border border-pale-stone bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-soft-amber/30">
                  <h2 className="mb-4 text-lg font-semibold text-graphite">Medical Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Calendar className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Date of Birth</p>
                        <p className="text-drift-gray">
                          {patient.dateOfBirth
                            ? formatDate(patient.dateOfBirth)
                            : patient.dob
                              ? formatDate(patient.dob)
                              : patient.birthdate
                                ? formatDate(patient.birthdate)
                                : patient.birthDate
                                  ? formatDate(patient.birthDate)
                                  : "Not provided"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Activity className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Blood Type</p>
                        <p className="text-drift-gray">{patient.bloodType || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Clock className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Age</p>
                        <p className="text-drift-gray">{calculateAge(patient.dateOfBirth || patient.dob)}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <UserCog className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Account Status</p>
                        <p className="text-drift-gray flex items-center">
                          <span
                            className={`w-2 h-2 rounded-full mr-2 ${
                              patient.status === "inactive"
                                ? "bg-red-500"
                                : (
                                      patient.lastLogin &&
                                        new Date().getTime() - patient.lastLogin.toDate().getTime() <
                                          7 * 24 * 60 * 60 * 1000
                                    )
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                            }`}
                          ></span>
                          {patient.status === "inactive"
                            ? "Inactive"
                            : patient.lastLogin &&
                                new Date().getTime() - patient.lastLogin.toDate().getTime() < 7 * 24 * 60 * 60 * 1000
                              ? "Active"
                              : "Inactive"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="rounded-lg border border-pale-stone bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-soft-amber/30">
                  <h2 className="mb-4 text-lg font-semibold text-graphite">Account Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <Calendar className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Registration Date</p>
                        <p className="text-drift-gray">
                          {patient.createdAt ? formatDate(patient.createdAt.toDate()) : "Not available"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Clock className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Last Login</p>
                        <p className="text-drift-gray">
                          {patient.lastLogin ? formatDate(patient.lastLogin.toDate()) : "Never"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Shield className="mr-3 mt-0.5 h-5 w-5 text-soft-amber" />
                      <div>
                        <p className="text-sm font-medium text-graphite">Data Access</p>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex items-center">
                            <span className="text-xs text-drift-gray mr-2">Health Records:</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                accessStatus.records === "granted"
                                  ? "bg-green-100 text-green-800"
                                  : accessStatus.records === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {accessStatus.records === "granted"
                                ? "Access Granted"
                                : accessStatus.records === "pending"
                                  ? "Access Pending"
                                  : "Restricted"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-drift-gray mr-2">Appointments:</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                accessStatus.appointments === "granted"
                                  ? "bg-green-100 text-green-800"
                                  : accessStatus.appointments === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {accessStatus.appointments === "granted"
                                ? "Access Granted"
                                : accessStatus.appointments === "pending"
                                  ? "Access Pending"
                                  : "Restricted"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-drift-gray mr-2">Prescriptions:</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                accessStatus.prescriptions === "granted"
                                  ? "bg-green-100 text-green-800"
                                  : accessStatus.prescriptions === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {accessStatus.prescriptions === "granted"
                                ? "Access Granted"
                                : accessStatus.prescriptions === "pending"
                                  ? "Access Pending"
                                  : "Restricted"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-graphite mb-2">Access History</h3>
                    {accessHistory.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {accessHistory.map((access) => (
                          <div key={access.id} className="text-xs p-2 bg-earth-beige/10 rounded-md">
                            <div className="flex justify-between">
                              <span className="font-medium">
                                {access.type ? access.type.charAt(0).toUpperCase() + access.type.slice(1) : "Unknown"}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full ${
                                  access.status === "granted"
                                    ? "bg-green-100 text-green-800"
                                    : access.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                }`}
                              >
                                {access.status
                                  ? access.status.charAt(0).toUpperCase() + access.status.slice(1)
                                  : "Unknown"}
                              </span>
                            </div>
                            <div className="mt-1 text-drift-gray">
                              {access.requestedBy} • {new Date(access.requestedAt).toLocaleDateString()}
                            </div>
                            <div className="mt-1 text-graphite">Reason: {access.reason || "Not specified"}</div>
                            {access.expiresAt && (
                              <div className="mt-1 text-drift-gray">
                                Expires: {new Date(access.expiresAt).toLocaleDateString()}
                              </div>
                            )}
                            {access.deniedReason && (
                              <div className="mt-1 text-red-600">Denied: {access.deniedReason}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-drift-gray">No access history available</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "appointments" && (
            <div className="bg-white rounded-lg border border-pale-stone shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-graphite">Appointment History</h2>
                <div className="flex items-center text-sm text-drift-gray">
                  <History className="h-4 w-4 mr-1" />
                  <span>Admin view - Read only</span>
                </div>
              </div>

              {accessStatus.appointments === "granted" ? (
                <AppointmentHistory userId={patientId} viewMode="admin" />
              ) : (
                <AnimatedAccessRestricted
                  status={accessStatus.appointments}
                  message={
                    accessStatus.appointments === "pending"
                      ? "Your request for access to this patient's appointment history is pending approval. The patient has been notified."
                      : "You don't have permission to view this patient's appointment history. The patient has not enabled admin access to their appointments."
                  }
                  onRequestAccess={() => {
                    setRequestType("appointments")
                    setShowRequestModal(true)
                  }}
                  isLoading={requestLoading && requestType === "appointments"}
                />
              )}
            </div>
          )}

          {activeTab === "records" && (
            <div className="bg-white rounded-lg border border-pale-stone shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-graphite">Health Records</h2>
                <div className="flex items-center">
                  {accessStatus.records === "granted" ? (
                    <div className="flex items-center text-sm text-green-600">
                      <Shield className="h-4 w-4 mr-1" />
                      <span>Access Granted</span>
                    </div>
                  ) : accessStatus.records === "pending" ? (
                    <div className="flex items-center text-sm text-yellow-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Access Request Pending</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setRequestType("records")
                        setShowRequestModal(true)
                      }}
                      className="flex items-center text-sm bg-earth-beige/20 text-soft-amber px-3 py-1.5 rounded-md hover:bg-earth-beige/30 transition-colors"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      <span>Request Access</span>
                    </button>
                  )}
                </div>
              </div>

              {accessStatus.records === "granted" ? (
                <RecordsView patientId={patientId} />
              ) : (
                <AnimatedAccessRestricted
                  status={accessStatus.records}
                  message={
                    accessStatus.records === "pending"
                      ? "Your request for access to this patient's health records is pending approval. The patient has been notified."
                      : "You don't have permission to view this patient's health records. The patient has not enabled admin access to their medical records."
                  }
                  onRequestAccess={() => {
                    setRequestType("records")
                    setShowRequestModal(true)
                  }}
                  isLoading={requestLoading && requestType === "records"}
                />
              )}
            </div>
          )}

          {activeTab === "prescriptions" && (
            <div className="bg-white rounded-lg border border-pale-stone shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-graphite">Prescriptions</h2>
                <div className="flex items-center">
                  {accessStatus.prescriptions === "granted" ? (
                    <div className="flex items-center text-sm text-green-600">
                      <Shield className="h-4 w-4 mr-1" />
                      <span>Access Granted</span>
                    </div>
                  ) : accessStatus.prescriptions === "pending" ? (
                    <div className="flex items-center text-sm text-yellow-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>Access Request Pending</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setRequestType("prescriptions")
                        setShowRequestModal(true)
                      }}
                      className="flex items-center text-sm bg-earth-beige/20 text-soft-amber px-3 py-1.5 rounded-md hover:bg-earth-beige/30 transition-colors"
                    >
                      <Shield className="h-4 w-4 mr-1" />
                      <span>Request Access</span>
                    </button>
                  )}
                </div>
              </div>

              {accessStatus.prescriptions === "granted" ? (
                <PrescriptionsView patientId={patientId} />
              ) : (
                <AnimatedAccessRestricted
                  status={accessStatus.prescriptions}
                  message={
                    accessStatus.prescriptions === "pending"
                      ? "Your request for access to this patient's prescription data is pending approval. The patient has been notified."
                      : "You don't have permission to view this patient's prescription data. The patient has not enabled admin access to their prescriptions."
                  }
                  onRequestAccess={() => {
                    setRequestType("prescriptions")
                    setShowRequestModal(true)
                  }}
                  isLoading={requestLoading && requestType === "prescriptions"}
                />
              )}
            </div>
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

      {/* Request Access Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full animate-in zoom-in-95 duration-300">
            <h3 className="text-lg font-semibold text-graphite mb-2">Request Access</h3>
            <p className="text-drift-gray mb-4">
              Please provide a valid reason for accessing this patient's {requestType}. This request will be logged and
              may require approval.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="requestReason" className="block text-sm font-medium text-graphite mb-1">
                  Reason for Access
                </label>
                <textarea
                  id="requestReason"
                  rows={4}
                  className="w-full rounded-md border border-pale-stone p-2 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                  placeholder="Explain why you need access to this data..."
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                ></textarea>
              </div>

              <div className="bg-soft-amber/10 p-3 rounded-md">
                <p className="text-xs text-soft-amber">
                  <Shield className="h-3 w-3 inline-block mr-1" />
                  This request will be logged with your user ID, timestamp, and reason. Access is granted based on
                  legitimate need and patient privacy policies.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRequestModal(false)
                  setRequestType("")
                  setRequestReason("")
                }}
                className="px-4 py-2 border border-pale-stone rounded-md text-drift-gray hover:bg-earth-beige/10 transition-colors"
                disabled={requestLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestAccess}
                className="px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-amber-600 transition-colors flex items-center"
                disabled={requestLoading || !requestReason.trim()}
              >
                {requestLoading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      <SuccessNotification
        message={successMessage}
        isVisible={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        duration={5000}
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
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
