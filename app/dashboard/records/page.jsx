"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  Search,
  Eye,
  Plus,
  Trash2,
  AlertCircle,
  Calendar,
  Clock,
  Tag,
  FileImage,
  FileIcon as FilePdf,
  FileSpreadsheet,
  FileTextIcon,
  SlidersHorizontal,
  Share2,
  Users,
  LayoutGrid,
  LayoutList,
} from "lucide-react"
import { PatientRecordModal } from "@/components/patient-record-modal"
import { UploadMedicalRecordModal } from "@/components/upload-medical-record-modal"
import { ShareRecordModal } from "@/components/share-record-modal"
import { useAuth } from "@/contexts/auth-context"
import { getPatientMedicalRecords, getMedicalRecordById, deleteMedicalRecord } from "@/lib/record-utils"
import { SuccessNotification } from "@/components/success-notification"
import { AppointmentHistory } from "@/components/appointment-history"
import { DashboardHeaderBanner } from "@/components/dashboard-header-banner"
import PaginationControls from "@/components/pagination-controls"

export default function PatientRecordsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [isClosingFilters, setIsClosingFilters] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [medicalRecords, setMedicalRecords] = useState([])
  const [fullRecordData, setFullRecordData] = useState(null)
  const [loadingRecord, setLoadingRecord] = useState(false)
  const [error, setError] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [filterDate, setFilterDate] = useState("")
  const [viewMode, setViewMode] = useState(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("records_viewMode")
      return saved === "list" || saved === "grid" ? saved : "grid"
    }
    return "grid"
  }) // grid or list
  const [activeTab, setActiveTab] = useState("records")
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 9

  // Load medical records
  useEffect(() => {
    if (!user) return

    try {
      // Get patient's medical records
      const unsubscribe = getPatientMedicalRecords(user.uid, (recordsData) => {
        setMedicalRecords(recordsData)
        setLoading(false)
      })

      return () => {
        if (typeof unsubscribe === "function") {
          unsubscribe()
        }
      }
    } catch (error) {
      console.error("Error loading medical records:", error)
      setError("Failed to load medical records. Please try again.")
      setLoading(false)
    }
  }, [user])

  // Show success message with auto-hide
  useEffect(() => {
    if (successMessage) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
        setSuccessMessage("")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Get unique record types for filter
  const recordTypes = [...new Set(medicalRecords.map((record) => record.type))]

  // Filter records based on search and type
  const filteredRecords = medicalRecords
    .filter((record) => {
      // Filter by search term
      const matchesSearch =
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()))

      // Filter by type
      const matchesType = filterType === "all" || record.type === filterType

      // Filter by date
      const matchesDate = !filterDate || new Date(record.date).toISOString().split("T")[0] === filterDate

      return matchesSearch && matchesType && matchesDate
    })
    .sort((a, b) => {
      // Sort by uploadedDate (most recent first)
      const dateA = new Date(a.uploadedDate)
      const dateB = new Date(b.uploadedDate)
      return dateB - dateA
    })

  // Handle viewing a record
  const handleViewRecord = async (record) => {
    try {
      setLoadingRecord(true)
      setError("")

      // Get the full record data including file data
      const fullRecord = await getMedicalRecordById(record.id)
      setFullRecordData(fullRecord)
      setSelectedRecord(record)
      setShowRecordModal(true)
    } catch (error) {
      console.error("Error loading record:", error)
      setError("Failed to load record. Please try again.")
    } finally {
      setLoadingRecord(false)
    }
  }

  // Handle sharing a record
  const handleShareRecord = (record) => {
    setSelectedRecord(record)
    setShowShareModal(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = (record) => {
    setRecordToDelete(record)
    setShowDeleteConfirm(true)
  }

  // Handle delete record
  const handleDeleteRecord = async () => {
    if (!recordToDelete) return

    try {
      setDeleting(true)
      await deleteMedicalRecord(recordToDelete.id)
      setShowDeleteConfirm(false)
      setRecordToDelete(null)
      setSuccessMessage("Record deleted successfully")
    } catch (error) {
      console.error("Error deleting record:", error)
      setError("Failed to delete record. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown"
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  // Get file icon based on file type
  const getFileIcon = (fileType) => {
    if (!fileType) return <FileTextIcon className="h-10 w-10 text-drift-gray" />
    if (fileType.startsWith("image/")) return <FileImage className="h-10 w-10 text-soft-amber" />
    if (fileType === "application/pdf") return <FilePdf className="h-10 w-10 text-red-500" />
    if (fileType.includes("spreadsheet") || fileType.includes("excel"))
      return <FileSpreadsheet className="h-10 w-10 text-green-600" />
    return <FileTextIcon className="h-10 w-10 text-blue-500" />
  }

  // Handle upload success
  const handleUploadSuccess = () => {
    setSuccessMessage("Record uploaded successfully")
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setFilterType("all")
    setFilterDate("")
    setCurrentPage(1)
  }

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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterType, filterDate, searchTerm])

  // Ensure default view is grid whenever switching back to Records tab
  useEffect(() => {
    if (activeTab === "records") {
      setViewMode("grid")
    }
  }, [activeTab])

  // Calculate pagination
  const indexOfLastRecord = currentPage * recordsPerPage
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage)
  const displayedRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord)

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    // Scroll to top of records section
    const recordsSection = document.getElementById("records-section")
    if (recordsSection) {
      recordsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Create upload button for header
  const uploadButton = (
    <button
      onClick={() => setShowUploadModal(true)}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-soft-amber to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-amber-500 hover:to-amber-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 animate-fadeIn"
    >
      <Plus className="h-4 w-4" />
      Upload Record
    </button>
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Dashboard Header Banner with page-specific content */}
      <DashboardHeaderBanner
        userRole="patient"
        title="Medical Records"
        subtitle="Manage and organize your health documents"
        actionButton={uploadButton}
        showMetrics={false}
      />

      {/* Enhanced tab controls with switch-like appearance */}
      <div className="flex justify-center mb-6">
        <div className="flex p-1 bg-earth-beige/20 rounded-full shadow-sm">
          <button
            onClick={() => setActiveTab("records")}
            className={`relative px-5 py-2.5 pr-7 text-sm font-medium rounded-full transition-all duration-200 flex items-center gap-2 ${
              activeTab === "records" ? "bg-soft-amber text-white shadow-sm" : "text-drift-gray hover:text-graphite"
            }`}
          >
            <span>Medical Records</span>
            {medicalRecords.length > 0 && (
              <span className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                activeTab === "records" 
                  ? "bg-white/20 text-white border border-white/30" 
                  : "bg-soft-amber text-white"
              }`}>
                {medicalRecords.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`relative px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
              activeTab === "history" ? "bg-soft-amber text-white shadow-sm" : "text-drift-gray hover:text-graphite"
            }`}
          >
            <span>Appointment History</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 animate-slideInDown">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <SuccessNotification message={successMessage} isVisible={showSuccess} onClose={() => setShowSuccess(false)} />
      )}

      {activeTab === "records" ? (
        <>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray" />
              <input
                type="text"
                placeholder="Search records by name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-earth-beige bg-white py-2 pl-10 pr-3 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              />
            </div>
            <div className="flex space-x-2">
          <button
            onClick={() => {
              const newMode = viewMode === "grid" ? "list" : "grid"
              setViewMode(newMode)
              // Save to localStorage for skeleton loading
              if (typeof window !== "undefined") {
                localStorage.setItem("records_viewMode", newMode)
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-graphite shadow-sm transition-all hover:bg-amber-50 hover:border-soft-amber/50 hover:shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
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
            onClick={handleToggleFilters}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-graphite shadow-sm transition-all hover:bg-amber-50 hover:border-soft-amber/50 hover:shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(filterType !== "all" || filterDate) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-soft-amber to-amber-500 text-xs font-bold text-white shadow-md">
                {(filterType !== "all" ? 1 : 0) + (filterDate ? 1 : 0)}
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
              <label htmlFor="filterType" className="text-sm font-semibold text-graphite">
                Record Type
              </label>
              <select
                id="filterType"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-lg border border-amber-200 bg-white py-2 px-3 text-sm text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber transition-all shadow-sm hover:shadow-md"
              >
                <option value="all">All Types</option>
                {recordTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 space-y-2">
              <label htmlFor="filterDate" className="text-sm font-semibold text-graphite">
                Record Date
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
              className="inline-flex items-center gap-2 rounded-lg border-2 border-amber-200 bg-white px-4 py-2.5 text-sm font-semibold text-graphite transition-all hover:bg-amber-50 hover:border-soft-amber/50 shadow-sm hover:shadow-md transform hover:scale-105"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

          {loading ? (
            // Loading state
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-soft-amber mb-4"></div>
                <p className="text-drift-gray">Loading your records...</p>
              </div>
            </div>
          ) : filteredRecords.length > 0 ? (
            <>
            {viewMode === "grid" ? (
              // Grid view
              <div id="records-section" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fadeIn">
                {displayedRecords.map((record, index) => (
                  <div
                    key={record.id}
                    className="group relative overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-2 hover:border-amber-300/60"
                    style={{
                      animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
                      opacity: 0,
                    }}
                  >
                    {/* Decorative circles */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {/* Top bar accent */}
                    <div className="relative h-2 w-full bg-gradient-to-r from-soft-amber via-amber-500 to-soft-amber overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                    
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-pale-stone to-amber-50/50">
                      {record.thumbnail && record.fileType.startsWith("image/") ? (
                        <img
                          src={record.thumbnail || "/placeholder.svg"}
                          alt={record.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100/50">
                          <div className="text-center">
                            <div className="mx-auto mb-2">{getFileIcon(record.fileType)}</div>
                            <div className="text-xs sm:text-sm font-medium text-soft-amber">
                              {record.fileType ? record.fileType.split("/")[1].toUpperCase() : "Unknown"}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                      <div className="absolute bottom-0 left-0 right-0 flex justify-end p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10">
                        <button
                          onClick={() => handleViewRecord(record)}
                          className="rounded-full bg-white p-2 text-soft-amber shadow-md transition-transform hover:scale-105 hover:bg-soft-amber hover:text-white"
                          title="View Record"
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </button>
                        <button
                          onClick={() => handleShareRecord(record)}
                          className="ml-2 rounded-full bg-white p-2 text-blue-500 shadow-md transition-transform hover:scale-105 hover:bg-blue-500 hover:text-white"
                          title="Share Record"
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="sr-only">Share</span>
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(record)}
                          className="ml-2 rounded-full bg-white p-2 text-red-500 shadow-md transition-transform hover:scale-105 hover:bg-red-500 hover:text-white"
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-5 relative z-10">
                      <div className="mb-3">
                        <h3 className="font-bold text-graphite text-base line-clamp-1 group-hover:text-soft-amber transition-colors">{record.name}</h3>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-soft-amber/20 to-amber-50 border border-soft-amber/30 px-2.5 py-1 text-xs font-semibold text-soft-amber">
                            {record.type}
                          </span>
                          <span className="flex items-center text-xs text-drift-gray font-medium">
                            <Tag className="mr-1 h-3 w-3" />
                            {formatFileSize(record.fileSize)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1.5 border border-amber-200 shadow-sm">
                          <Calendar className="h-3.5 w-3.5 text-soft-amber" />
                          <span className="font-semibold text-graphite">
                            {new Date(record.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {record.sharedWith && record.sharedWith.length > 0 && (
                          <div className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 border border-blue-200">
                            <Users className="h-3.5 w-3.5 text-blue-600" />
                            <span className="font-semibold text-blue-700 text-xs">
                              {record.sharedWith.length} {record.sharedWith.length === 1 ? "doctor" : "doctors"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/5 to-transparent rounded-bl-full pointer-events-none"></div>
                  </div>
                ))}
              </div>
            ) : (
              // List view
              <div id="records-section" className="space-y-3 sm:space-y-4 animate-fadeIn">
                {displayedRecords.map((record, index) => (
                  <div
                    key={record.id}
                    className="group relative overflow-hidden rounded-lg sm:rounded-2xl border-l-4 border-soft-amber border border-amber-200/30 sm:border-amber-200/50 bg-white sm:bg-gradient-to-br sm:from-white sm:to-amber-50/30 p-3 sm:p-6 shadow-sm sm:shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-md sm:hover:shadow-xl hover:shadow-amber-500/20 hover:-translate-y-0.5 sm:hover:-translate-y-1 hover:border-amber-300/60"
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
                      <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 sm:border-amber-200 flex-shrink-0">
                        {record.thumbnail && record.fileType.startsWith("image/") ? (
                          <img
                            src={record.thumbnail || "/placeholder.svg"}
                            alt={record.name}
                            className="h-full w-full object-cover rounded-lg sm:rounded-xl"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            {getFileIcon(record.fileType)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                          <h3 className="text-sm sm:text-lg font-semibold text-graphite group-hover:text-amber-600 transition-colors truncate">{record.name}</h3>
                          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-soft-amber/20 to-amber-50 border border-soft-amber/30 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-soft-amber">
                            {record.type}
                          </span>
                        </div>
                        
                        {/* Date and Time - Minimalist on mobile */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mb-2 sm:mb-3">
                          <div className="flex items-center gap-1 sm:gap-2 rounded-md sm:rounded-lg bg-amber-50/50 sm:bg-white/90 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-2 border border-amber-200/50 sm:border-amber-200 shadow-sm sm:shadow-md hover:shadow-md sm:hover:shadow-lg transition-all">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-soft-amber" />
                            <span className="text-xs sm:text-sm font-semibold text-graphite whitespace-nowrap">
                              <span className="sm:hidden">{new Date(record.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                              <span className="hidden sm:inline">{new Date(record.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                            </span>
                          </div>
                          <div className="hidden sm:flex items-center gap-2 rounded-lg bg-white/90 backdrop-blur-sm px-3 py-2 border border-amber-200 shadow-md hover:shadow-lg transition-all">
                            <Tag className="h-4 w-4 text-soft-amber" />
                            <span className="text-sm font-semibold text-graphite">{formatFileSize(record.fileSize)}</span>
                          </div>
                          {record.sharedWith && record.sharedWith.length > 0 && (
                            <div className="hidden sm:flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 border border-blue-200">
                              <Users className="h-3.5 w-3.5 text-blue-600" />
                              <span className="font-semibold text-blue-700 text-xs">
                                {record.sharedWith.length} {record.sharedWith.length === 1 ? "doctor" : "doctors"}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {record.notes && <p className="hidden sm:block text-sm text-drift-gray line-clamp-1">{record.notes}</p>}
                      </div>
                      </div>
                      
                      {/* Action Buttons - minimalist on mobile */}
                      <div className="flex flex-row sm:flex-col gap-2 flex-wrap">
                        <button
                          onClick={() => handleViewRecord(record)}
                          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border-2 border-amber-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold text-graphite hover:bg-amber-50 hover:border-soft-amber/50 transition-all transform hover:scale-105 shadow-sm hover:shadow-md"
                        >
                          <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                        <button
                          onClick={() => handleShareRecord(record)}
                          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border-2 border-blue-300 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all transform hover:scale-105 shadow-sm hover:shadow-md"
                        >
                          <Share2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="hidden sm:inline">Share</span>
                        </button>
                        <button
                          onClick={() => handleDeleteConfirm(record)}
                          className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border-2 border-red-500 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Pagination */}
            {totalPages > 1 && (
              <PaginationControls 
                currentPage={currentPage} 
                totalPages={totalPages} 
                onPageChange={handlePageChange} 
              />
            )}
            </>
          ) : (
            <div className="rounded-lg border border-pale-stone bg-white p-8 text-center shadow-sm animate-fadeIn">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pale-stone">
                <FileText className="h-8 w-8 text-drift-gray" />
              </div>
              <h3 className="mb-1 text-lg font-medium text-graphite">No Records Found</h3>
              <p className="mb-4 text-drift-gray">
                {searchTerm || filterType !== "all" || filterDate
                  ? "No records match your search criteria. Try adjusting your filters."
                  : "You haven't uploaded any medical records yet."}
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-soft-amber to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-amber-500 hover:to-amber-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 transform hover:scale-105"
              >
                <Plus className="h-4 w-4" />
                Upload Your First Record
              </button>
            </div>
          )}
        </>
      ) : (
        // Appointment History Tab Content
        <AppointmentHistory userId={user?.uid} />
      )}

      {/* Record View Modal */}
      <PatientRecordModal
        isOpen={showRecordModal}
        onClose={() => {
          setShowRecordModal(false)
          setFullRecordData(null)
        }}
        record={fullRecordData || selectedRecord}
        loading={loadingRecord}
        showDoctorNotes={true}
      />

      {/* Upload Record Modal */}
      <UploadMedicalRecordModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        userId={user?.uid}
        onSuccess={handleUploadSuccess}
      />

      {/* Share Record Modal */}
      <ShareRecordModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} record={selectedRecord} />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg animate-scaleIn">
            <h3 className="mb-4 text-lg font-medium text-graphite">Delete Record</h3>
            <p className="mb-4 text-drift-gray">
              Are you sure you want to delete "{recordToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setRecordToDelete(null)
                }}
                className="rounded-md border border-earth-beige px-4 py-2 text-sm font-medium text-graphite hover:bg-pale-stone"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRecord}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
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
        
        @keyframes slideInDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
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
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-slideInDown {
          animation: slideInDown 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
