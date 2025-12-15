"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Plus,
  Search,
  LayoutGrid,
  LayoutList,
  FileText,
  CheckCircle2,
  Pill,
  Calendar,
  AlertCircle,
  SlidersHorizontal,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react"
import { SuccessNotification } from "@/components/success-notification"
import { PrescriptionEditModal } from "@/components/prescription-edit-modal"
import { DeletePrescriptionModal } from "@/components/delete-prescription-modal"
import { getDoctorPrescriptions, updatePrescription, deletePrescription } from "@/lib/prescription-utils"
import { useAuth } from "@/contexts/auth-context"
import { generatePrescriptionPDF } from "@/lib/pdf-utils"
import ProfileImage from "@/components/profile-image"
import { PrescriptionPreviewTemplate } from "@/components/prescription-preview-templates"

export default function DoctorPrescriptionsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPatient, setFilterPatient] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [isClosingFilters, setIsClosingFilters] = useState(false)
  const [notification, setNotification] = useState({ message: "", isVisible: false })
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [currentPrescription, setCurrentPrescription] = useState(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState("grid") // 'list' or 'grid'
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [doctorInfo, setDoctorInfo] = useState(null)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch doctor info and prescriptions
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Get doctor profile
        const { getUserProfile } = await import("@/lib/firebase-utils")
        const doctorData = await getUserProfile(user.uid)

        if (doctorData) {
          setDoctorInfo({
            id: user.uid,
            name: doctorData.displayName || user.displayName || "Doctor",
            specialty: doctorData.specialty || "General Practitioner",
            licenseNumber: doctorData.licenseNumber || "N/A",
            clinicAddress: doctorData.officeAddress || "N/A",
            contactNumber: doctorData.phone || "N/A",
            ptrNumber: doctorData.ptrNumber || "N/A",
            s2Number: doctorData.s2Number || "N/A",
          })
        }

        // Get prescriptions
        const result = await getDoctorPrescriptions(user.uid)
        if (result.success) {
          // Process prescriptions to ensure they have the right format
          const processedPrescriptions = result.prescriptions.map((prescription) => {
            // Convert Firestore timestamp to Date if needed
            const startDate =
              prescription.startDate ||
              (prescription.createdAt ? new Date(prescription.createdAt.seconds * 1000) : new Date())
                .toISOString()
                .split("T")[0]

            // Ensure medications is an array
            const medications = prescription.medications || [
              {
                name: prescription.medication || "Unknown medication",
                dosage: prescription.dosage || "N/A",
                frequency: prescription.frequency || "N/A",
                duration: prescription.duration || "N/A",
                instructions: prescription.notes || "",
              },
            ]

            return {
              ...prescription,
              startDate,
              medications,
              patient: prescription.patientName || "Unknown Patient",
              medication: medications[0]?.name || "Unknown medication",
              dosage: medications[0]?.dosage || "N/A",
              frequency: medications[0]?.frequency || "N/A",
              notes: prescription.notes || medications[0]?.instructions || "",
              status: prescription.status || "active",
            }
          })

          setPrescriptions(processedPrescriptions)

          // Extract unique patients from prescriptions
          const uniquePatients = Array.from(
            new Map(
              processedPrescriptions.map((p) => [
                p.patientId,
                {
                  id: p.patientId,
                  name: p.patientName || "Unknown Patient",
                },
              ]),
            ).values(),
          )

          setPatients(uniquePatients)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Filter prescriptions
  const filteredPrescriptions = prescriptions
    .filter((prescription) => {
      // Filter by search term
      const matchesSearch =
        (prescription.patientName || prescription.patient || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prescription.medication || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prescription.notes || "").toLowerCase().includes(searchTerm.toLowerCase())

      // Filter by status
      const matchesStatus = filterStatus === "all" || prescription.status === filterStatus

      // Filter by patient
      const matchesPatient = filterPatient === "all" || prescription.patientId === filterPatient

      return matchesSearch && matchesStatus && matchesPatient
    })
    .sort((a, b) => {
      // Sort by date (most recent first)
      const dateA = a.createdAt?.seconds ? new Date(a.createdAt.seconds * 1000) : new Date(a.startDate || 0)
      const dateB = b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000) : new Date(b.startDate || 0)
      return dateB - dateA
    })

  // Update total pages when filtered prescriptions change
  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredPrescriptions.length / itemsPerPage)))
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [filteredPrescriptions.length, itemsPerPage])

  // Get paginated prescriptions for current status
  const getPaginatedPrescriptionsForStatus = (status) => {
    const prescriptionsWithStatus = filteredPrescriptions.filter((p) => p.status === status)

    if (viewMode === "list") {
      // In list view, we paginate all prescriptions together
      return prescriptionsWithStatus
    } else {
      // In grid view, we paginate each status section separately
      return prescriptionsWithStatus.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    }
  }

  // Get paginated prescriptions for list view (all statuses together)
  const paginatedPrescriptions =
    viewMode === "list"
      ? filteredPrescriptions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
      : filteredPrescriptions

  // Handle pagination
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = []
    const maxPagesToShow = 5

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than or equal to maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // Always show first page
      pageNumbers.push(1)

      // Calculate start and end of middle pages
      let startPage = Math.max(2, currentPage - 1)
      let endPage = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4)
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3)
      }

      // Add ellipsis if needed
      if (startPage > 2) {
        pageNumbers.push("...")
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i)
      }

      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("...")
      }

      // Always show last page
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  // Handle prescription renewal
  const handleRenewPrescription = async (prescription) => {
    // Create a new prescription based on the old one
    const today = new Date()
    const sixMonthsLater = new Date()
    sixMonthsLater.setMonth(today.getMonth() + 6)

    const newPrescription = {
      ...prescription,
      id: undefined, // Remove the id so a new one is generated
      startDate: today.toISOString().split("T")[0],
      endDate: sixMonthsLater.toISOString().split("T")[0],
      status: "active",
      createdAt: new Date(),
    }

    try {
      // Save to Firestore
      const { savePrescription } = await import("@/lib/prescription-utils")
      const result = await savePrescription(newPrescription)

      if (result.success) {
        // Add the new prescription to the local state
        setPrescriptions([
          {
            ...newPrescription,
            id: result.prescriptionId,
          },
          ...prescriptions,
        ])

        // Show success notification
        setNotification({
          message: `Prescription for ${prescription.medication} renewed successfully`,
          isVisible: true,
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Error renewing prescription:", error)
      setNotification({
        message: `Error renewing prescription: ${error.message}`,
        isVisible: true,
      })
    }
  }

  // Handle prescription PDF download
  const handlePrintPrescription = async (prescription) => {
    try {
      if (prescription.downloadedByPatient === true) {
        setNotification({ message: "This prescription has already been downloaded once.", isVisible: true })
        return
      }

      // Find the patient
      const patient = {
        name: prescription.patientName || prescription.patient,
        age: prescription.patientAge || "N/A",
        gender: prescription.patientGender || "N/A",
        birthdate: prescription.patientBirthdate,
      }

      if (!doctorInfo) {
        throw new Error("Doctor information not available")
      }

      // Generate PDF
      const doc = generatePrescriptionPDF(prescription, doctorInfo, patient)

      // Save the PDF
      doc.save(`prescription_${patient.name?.replace(/\s+/g, "_") || "patient"}_${new Date().toISOString().split("T")[0]}.pdf`)

      // Mark as downloaded (one-time)
      try {
        await updatePrescription(prescription.id, { downloadedByPatient: true })
        setPrescriptions((prev) => prev.map((p) => (p.id === prescription.id ? { ...p, downloadedByPatient: true } : p)))
      } catch (e) {
        console.warn("Failed to mark prescription as downloaded:", e)
      }

      setNotification({
        message: `Prescription for ${prescription.medication || prescription.medications?.[0]?.name || "patient"} downloaded successfully`,
        isVisible: true,
      })
    } catch (error) {
      console.error("Error generating or downloading prescription:", error)
      setNotification({
        message: `Error downloading prescription: ${error.message}`,
        isVisible: true,
      })
    }
  }

  // Handle opening the edit modal
  const handleEditPrescription = (prescription) => {
    setCurrentPrescription(prescription)
    setEditModalOpen(true)
  }

  // Handle opening the delete confirmation modal
  const handleConfirmDelete = (prescription) => {
    setCurrentPrescription(prescription)
    setDeleteModalOpen(true)
  }

  // Handle saving edited prescription
  const handleSavePrescription = async (updatedPrescription) => {
    try {
      const result = await updatePrescription(updatedPrescription.id, updatedPrescription)

      if (result.success) {
        setPrescriptions(prescriptions.map((p) => (p.id === updatedPrescription.id ? updatedPrescription : p)))
        setNotification({
          message: `Prescription for ${updatedPrescription.medication} updated successfully`,
          isVisible: true,
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Error updating prescription:", error)
      setNotification({
        message: `Error updating prescription: ${error.message}`,
        isVisible: true,
      })
    }
  }

  // Handle deleting prescription
  const handleDeletePrescription = async (id) => {
    try {
      const result = await deletePrescription(id)

      if (result.success) {
        setPrescriptions(prescriptions.filter((p) => p.id !== id))
        setNotification({
          message: "Prescription deleted successfully",
          isVisible: true,
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Error deleting prescription:", error)
      setNotification({
        message: `Error deleting prescription: ${error.message}`,
        isVisible: true,
      })
    }
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === "list" ? "grid" : "list")
  }

  // Handle viewing prescription details
  const handleViewPrescription = (prescription) => {
    setCurrentPrescription(prescription)
    setShowPrescriptionModal(true)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setFilterStatus("all")
    setFilterPatient("all")
  }

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case "active":
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
          color: "bg-green-100",
          textColor: "text-green-800",
          borderColor: "border-green-200",
          label: "Active",
        }
      case "expired":
        return {
          icon: <AlertCircle className="h-4 w-4 text-amber-600" />,
          color: "bg-amber-100",
          textColor: "text-amber-800",
          borderColor: "border-amber-200",
          label: "Expired",
        }
      case "completed":
        return {
          icon: <FileText className="h-4 w-4 text-blue-600" />,
          color: "bg-blue-100",
          textColor: "text-blue-800",
          borderColor: "border-blue-200",
          label: "Completed",
        }
      default:
        return {
          icon: <FileText className="h-4 w-4 text-gray-600" />,
          color: "bg-gray-100",
          textColor: "text-gray-800",
          borderColor: "border-gray-200",
          label: "Unknown",
        }
    }
  }

  const renderGridPrescription = (prescriptions, status) => {
    const prescriptionsWithStatus = prescriptions.filter((p) => p.status === status)

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {prescriptionsWithStatus.map((prescription, index) => {
          const statusInfo = getStatusInfo(status)
          const startDate = prescription.startDate
            ? new Date(prescription.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "N/A"

          return (
            <div
              key={prescription.id}
              className={`overflow-hidden rounded-xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]`}
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`,
                opacity: 0,
              }}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50">
                      <Pill className={`h-5 w-5 text-soft-amber`} />
                  </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {prescription.medication || (prescription.medications?.[0]?.name || "Prescription")}
                      </h3>
                  <span
                        className={`inline-flex items-center gap-1 rounded-full ${statusInfo.color} px-2 py-0.5 text-[10px] font-medium ${statusInfo.textColor} mt-1`}
                  >
                        {statusInfo.icon}
                    {statusInfo.label}
                  </span>
                </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Patient:</span> {prescription.patient}
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Dosage:</span> {prescription.dosage || prescription.medications?.[0]?.dosage || "—"}
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Frequency:</span> {prescription.frequency || prescription.medications?.[0]?.frequency || "—"}
                  </p>
                  {prescription.notes && (
                    <p className="text-[10px] text-gray-500 line-clamp-2">
                      <span className="font-medium text-gray-600">Notes:</span> {prescription.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-amber-200/50">
                  <ProfileImage userId={prescription.patientId} role="patient" size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{prescription.patient}</p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <Calendar className="h-3 w-3" />
                  <span>{startDate}</span>
                    </div>
                </div>
              </div>

                <div className="flex items-center gap-2">
                <button
                  onClick={() => handleViewPrescription(prescription)}
                    className="flex-1 rounded-lg border-2 border-amber-200/50 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition-all hover:bg-amber-50 hover:border-amber-300"
                >
                  Preview
                </button>
                  {status === "active" && (
                  <button
                      onClick={() => handlePrintPrescription(prescription)}
                      disabled={prescription.downloadedByPatient === true}
                      className={`flex-1 inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                        prescription.downloadedByPatient === true
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-soft-amber to-amber-500 text-white hover:from-amber-500 hover:to-amber-600"
                      }`}
                    >
                      <Download className="mr-1 h-3.5 w-3.5" />
                      {prescription.downloadedByPatient === true ? "Downloaded" : "PDF"}
                    </button>
                  )}
                  {status !== "active" && (
                    <button
                      onClick={() => handleConfirmDelete(prescription)}
                      className="flex-1 inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold border border-red-200 bg-white text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderListView = (prescriptions) => {
    return (
      <div className="space-y-2">
        {prescriptions.map((prescription, index) => {
          const statusInfo = getStatusInfo(prescription.status)
          const startDate = prescription.startDate
            ? new Date(prescription.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "N/A"

          return (
            <div
              key={prescription.id}
              className={`group relative overflow-hidden rounded-xl border border-earth-beige bg-white shadow-sm transition-all hover:shadow-md hover:border-amber-200/80`}
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`,
                opacity: 0,
              }}
            >
              <div className="p-3 sm:p-4">
                {/* Top row: icon + title + status + right meta */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                    <Pill className="h-5 w-5 text-soft-amber" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-graphite truncate">{prescription.medication}</h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full ${statusInfo.color} px-2 py-0.5 text-[10px] font-medium ${statusInfo.textColor}`}
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-drift-gray truncate">
                      {prescription.dosage || prescription.medications?.[0]?.dosage || "—"}, {prescription.frequency || prescription.medications?.[0]?.frequency || "—"}
                  </div>
                </div>
                  <div className="hidden sm:flex items-center gap-3 text-xs text-drift-gray">
                  <div className="flex items-center">
                    <ProfileImage userId={prescription.patientId} role="patient" size="xs" className="mr-1.5" />
                      <span className="truncate max-w-[140px]">{prescription.patient}</span>
                  </div>
                    <div className="flex items-center whitespace-nowrap">
                      <Calendar className="mr-1.5 h-3.5 w-3.5" />
                      <span>{startDate}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom row: notes + doctor/date (mobile) + actions */}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-earth-beige/60 pt-3">
                  {prescription.notes ? (
                    <p className="text-[11px] text-gray-600 line-clamp-1">
                      <span className="font-medium text-gray-700">Notes:</span> {prescription.notes}
                    </p>
                  ) : (
                    <div className="h-0.5" />
                  )}

                  <div className="sm:hidden flex items-center justify-between text-[11px] text-drift-gray">
                  <div className="flex items-center">
                      <ProfileImage userId={prescription.patientId} role="patient" size="xs" className="mr-1" />
                      <span className="truncate max-w-[140px]">{prescription.patient}</span>
                  </div>
                    <div className="flex items-center ml-3">
                      <Calendar className="mr-1 h-3.5 w-3.5" />
                      <span>{startDate}</span>
                </div>
              </div>

                  <div className="flex items-center gap-2 sm:justify-end">
                <button
                  onClick={() => handleViewPrescription(prescription)}
                      className="rounded-lg border border-earth-beige bg-white px-3 py-1.5 text-[11px] font-medium text-graphite transition-colors hover:bg-pale-stone"
                >
                  Preview
                </button>
                <button
                  onClick={() => handleConfirmDelete(prescription)}
                      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-50"
                >
                  Delete
                </button>
                {prescription.status === "active" && (
                  <button
                    onClick={() => handlePrintPrescription(prescription)}
                        disabled={prescription.downloadedByPatient === true}
                        className={`inline-flex items-center rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${
                          prescription.downloadedByPatient === true
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-soft-amber text-white hover:bg-amber-600"
                        }`}
                  >
                    <Download className="mr-1 h-3.5 w-3.5" />
                        {prescription.downloadedByPatient === true ? "Downloaded" : "PDF"}
                  </button>
                )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const handleCloseFilters = () => {
    setIsClosingFilters(true)
    setTimeout(() => {
      setShowFilters(false)
      setIsClosingFilters(false)
    }, 300)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 p-6 text-white shadow-md mb-6">
        {/* Decorative elements */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-32 right-16 h-48 w-48 rounded-full bg-white/5"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">Prescriptions</h1>
            <p className="mt-1 text-white/90 text-sm sm:text-base">Manage your patient prescriptions</p>
          </div>

          <Link
            href="/doctor/prescriptions/new"
            className="mt-4 inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-amber-500 shadow-sm transition-all hover:bg-amber-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 md:mt-0 animate-fadeIn"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Prescription
          </Link>
        </div>
      </div>

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray" />
          <input
            type="text"
            placeholder="Search by patient or medication..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-earth-beige bg-white py-2 pl-10 pr-3 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
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
            onClick={() => {
              if (showFilters) {
                handleCloseFilters()
              } else {
                setShowFilters(true)
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-sm font-medium text-graphite shadow-sm transition-all hover:bg-amber-50 hover:border-amber-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(filterStatus !== "all" || filterPatient !== "all") && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-soft-amber to-amber-500 text-xs font-bold text-white shadow-md">1</span>
            )}
          </button>
        </div>
      </div>

      {/* Filters with smooth animation */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          showFilters ? "max-h-96 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="filterStatus" className="text-sm font-medium text-graphite">Status</label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full rounded-md border border-earth-beige bg-white py-2 px-3 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="filterPatient" className="text-sm font-medium text-graphite">Patient</label>
              <select
                id="filterPatient"
                value={filterPatient}
                onChange={(e) => setFilterPatient(e.target.value)}
                className="w-full rounded-md border border-earth-beige bg-white py-2 px-3 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              >
                <option value="all">All</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus("all")
                  setFilterPatient("all")
                  setSearchTerm("")
                }}
                className="inline-flex items-center rounded-md border border-earth-beige bg-white px-4 py-2 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="rounded-lg border border-pale-stone bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pale-stone">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-drift-gray"
              >
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
                <path d="M12 15V12" />
                <path d="M12 9V6" />
              </svg>
            </div>
            <p className="text-graphite">Loading prescriptions...</p>
          </div>
        ) : filteredPrescriptions.length > 0 ? (
          <>
            {viewMode === "grid" ? (
              // Group by status only when no filters/search
              (filterStatus === "all" && filterPatient === "all" && !searchTerm) ? (
                <>
                  {filteredPrescriptions.some((p) => p.status === "active") && (
                    <div className="space-y-4 animate-fadeIn">
                      <h2 className="text-lg font-semibold text-graphite">Active Prescriptions</h2>
                      {renderGridPrescription(filteredPrescriptions, "active")}
                    </div>
                  )}
                  {filteredPrescriptions.some((p) => p.status === "expired") && (
                    <div className="space-y-4 animate-fadeIn">
                      <h2 className="text-lg font-semibold text-graphite">Expired Prescriptions</h2>
                      {renderGridPrescription(filteredPrescriptions, "expired")}
                    </div>
                  )}
                  {filteredPrescriptions.some((p) => p.status === "completed") && (
                    <div className="space-y-4 animate-fadeIn">
                      <h2 className="text-lg font-semibold text-graphite">Completed Prescriptions</h2>
                      {renderGridPrescription(filteredPrescriptions, "completed")}
                    </div>
                  )}
                </>
              ) : (
                // If filtered, render a flat grid of the filtered prescriptions
                renderGridPrescription(filteredPrescriptions, filterStatus === "all" ? "active" : filterStatus)
              )
            ) : (
              renderListView(filteredPrescriptions)
            )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-1 mt-6">
                    <button
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center rounded-md border p-2 ${
                        currentPage === 1
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-earth-beige text-graphite hover:bg-pale-stone"
                      }`}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {getPageNumbers().map((page, index) =>
                      page === "..." ? (
                        <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={`page-${page}`}
                          onClick={() => goToPage(page)}
                          className={`min-w-[2rem] rounded-md px-3 py-2 text-sm font-medium ${
                            currentPage === page ? "bg-soft-amber text-white" : "text-graphite hover:bg-pale-stone"
                          }`}
                        >
                          {page}
                        </button>
                      ),
                    )}

                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center rounded-md border p-2 ${
                        currentPage === totalPages
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-earth-beige text-graphite hover:bg-pale-stone"
                      }`}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-pale-stone bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pale-stone">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-drift-gray"
                  >
                    <path d="M8 21h8a2 2 0 0 0 2-2v-2H6v2a2 2 0 0 0 2 2Z" />
                    <path d="M19 7v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7" />
                    <path d="M21 10V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2l3 3h12l3-3Z" />
                    <path d="M10 2v4" />
                    <path d="M14 2v4" />
                  </svg>
                </div>
                <h3 className="mb-1 text-lg font-medium text-graphite">No Prescriptions Found</h3>
                <p className="mb-4 text-drift-gray">
                  {searchTerm || filterStatus !== "all" || filterPatient !== "all"
                    ? "No prescriptions match your search criteria. Try adjusting your filters."
                    : "You haven't created any prescriptions yet. Create your first prescription now."}
                </p>
                <Link
                  href="/doctor/prescriptions/new"
                  className="rounded-md bg-soft-amber px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
                >
                  Create Prescription
                </Link>
              </div>
            )}
          </div>

      {/* Prescription Preview Modal */}
      {showPrescriptionModal && currentPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 animate-fadeIn">
          <div className="relative w-full max-w-xs sm:max-w-sm max-h-[95vh] flex flex-col rounded-lg bg-white shadow-xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-center border-b border-pale-stone px-2 py-1.5 flex-shrink-0">
              <h3 className="text-[10px] sm:text-xs font-medium text-graphite">Prescription Preview</h3>
            </div>

            {/* Prescription preview - using PrescriptionPreviewTemplate */}
            <div className="p-1.5 sm:p-2 overflow-y-auto flex-1 min-h-0">
              <div className="overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-lg relative">
                <div className="p-3 sm:p-4 bg-white relative max-w-full mx-auto" data-prescription-preview>
                  <PrescriptionPreviewTemplate
                    template={currentPrescription.template || "classic"}
                    isModal={true}
                    formData={{
                      patientName: currentPrescription.patientName || currentPrescription.patient || "",
                      patientAddress: currentPrescription.patientAddress || "",
                      patientAge: currentPrescription.patientAge || "",
                      patientGender: currentPrescription.patientGender || "",
                      medications: currentPrescription.medications || [
                        {
                          name: currentPrescription.medication,
                          dosage: currentPrescription.dosage,
                          frequency: currentPrescription.frequency,
                          duration: currentPrescription.duration,
                          instructions: currentPrescription.notes,
                        },
                      ],
                      notes: currentPrescription.notes || "",
                      signature: currentPrescription.signature || null,
                    }}
                    doctorInfo={{
                      name: doctorInfo?.name || user?.displayName || "",
                      specialty: doctorInfo?.specialty || "",
                      licenseNumber: doctorInfo?.licenseNumber || "",
                      clinicAddress: doctorInfo?.clinicAddress || doctorInfo?.officeAddress || "",
                      contactNumber: doctorInfo?.contactNumber || doctorInfo?.phone || "",
                      email: doctorInfo?.email || "",
                      province: doctorInfo?.province || "",
                      healthOffice: doctorInfo?.healthOffice || "",
                    }}
                    formatDate={(date) => {
                      const prescriptionDate = currentPrescription.startDate || currentPrescription.createdAt || date
                      const dateObj = prescriptionDate?.seconds
                        ? new Date(prescriptionDate.seconds * 1000)
                        : prescriptionDate?.toDate
                        ? prescriptionDate.toDate()
                        : new Date(prescriptionDate || date)
                      const month = String(dateObj.getMonth() + 1).padStart(2, "0")
                      const day = String(dateObj.getDate()).padStart(2, "0")
                      const year = dateObj.getFullYear()
                      return `${month}/${day}/${year}`
                    }}
                    isMobile={false}
                        />
                      </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end border-t border-pale-stone px-2 py-1.5 flex-shrink-0">
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="rounded-md border border-earth-beige bg-white px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium text-graphite transition-colors hover:bg-pale-stone"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <PrescriptionEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        prescription={currentPrescription}
        onSave={handleSavePrescription}
        onDelete={handleDeletePrescription}
      />

      {/* Delete Confirmation Modal */}
      <DeletePrescriptionModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        prescription={currentPrescription}
        onDelete={handleDeletePrescription}
      />

      {/* Success Notification */}
      <SuccessNotification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
    </div>
  )
}
;<style jsx global>{`
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
  
  @keyframes scaleUp {
    from { 
      opacity: 0;
      transform: scale(0.95);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }
  
  .animate-slideDown {
    animation: slideDown 0.3s ease-out;
  }
  
  .animate-scaleUp {
    animation: scaleUp 0.3s ease-out;
  }
`}</style>
