"use client"

import { useState, useEffect } from "react"
import {
  FileText,
  Search,
  Eye,
  AlertCircle,
  Calendar,
  Clock,
  Tag,
  FileImage,
  FileIcon as FilePdf,
  FileSpreadsheet,
  FileTextIcon,
  SlidersHorizontal,
  MessageSquare,
  User,
  Download,
  LayoutGrid,
  LayoutList,
} from "lucide-react"
import { PatientRecordModal } from "@/components/patient-record-modal"
import { RecordNoteModal } from "@/components/record-note-modal"
import { useAuth } from "@/contexts/auth-context"
import { getAllPatientsMedicalRecords, getMedicalRecordById } from "@/lib/record-utils"
import { getUserById } from "@/lib/firebase-utils"
import { SuccessNotification } from "@/components/success-notification"
import NoRecordsAnimation from "@/components/no-records-animation"
import PaginationControls from "@/components/pagination-controls"

export default function DoctorRecordsPage() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterPatient, setFilterPatient] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [isClosingFilters, setIsClosingFilters] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState([])
  const [patientNames, setPatientNames] = useState({})
  const [fullRecordData, setFullRecordData] = useState(null)
  const [loadingRecord, setLoadingRecord] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [filterDate, setFilterDate] = useState("")
  const [viewMode, setViewMode] = useState("grid") // grid or list
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 5

  // Load medical records
  useEffect(() => {
    let unsubscribe = () => {}

    const fetchRecords = async () => {
      if (user && user.uid) {
        unsubscribe = getAllPatientsMedicalRecords(user.uid, (data) => {
          setRecords(data)
          setLoading(false)

          // Fetch patient names for all records
          const patientIds = [...new Set(data.map((record) => record.patientId))]
          fetchPatientNames(patientIds)
        })
      }
    }

    fetchRecords()

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe()
      }
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

  const fetchPatientNames = async (patientIds) => {
    const names = { ...patientNames }

    for (const id of patientIds) {
      if (!names[id]) {
        try {
          const patient = await getUserById(id)
          names[id] = patient.name || patient.displayName || "Unknown Patient"
        } catch (error) {
          console.error(`Error fetching patient ${id}:`, error)
          names[id] = "Unknown Patient"
        }
      }
    }

    setPatientNames(names)
  }

  // Get unique record types for filter
  const recordTypes = [...new Set(records.map((record) => record.type))]

  // Filter records based on search, type, and patient
  const filteredRecords = records
    .filter((record) => {
      // Filter by search term
      const matchesSearch =
        record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patientNames[record.patientId] || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.notes && record.notes.toLowerCase().includes(searchTerm.toLowerCase()))

      // Filter by type
      const matchesType = filterType === "all" || record.type === filterType

      // Filter by patient
      const matchesPatient = filterPatient === "all" || record.patientId === filterPatient

      // Filter by date
      const matchesDate = !filterDate || new Date(record.date).toISOString().split("T")[0] === filterDate

      return matchesSearch && matchesType && matchesPatient && matchesDate
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

  // Handle adding a note to a record
  const handleAddNote = (record) => {
    setSelectedRecord(record)
    setShowNoteModal(true)
  }

  // Handle note added successfully
  const handleNoteAdded = () => {
    setSuccessMessage("Note added successfully")
    setShowNoteModal(false)
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

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setFilterType("all")
    setFilterPatient("all")
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
  }, [filterType, filterPatient, filterDate, searchTerm])

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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 p-6 text-white shadow-md mb-6">
        {/* Decorative elements */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-32 right-16 h-48 w-48 rounded-full bg-white/5"></div>

        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white md:text-3xl">Shared Medical Records</h1>
          <p className="mt-1 text-white/90">View and manage records shared by your patients</p>
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

      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray" />
          <input
            type="text"
            placeholder="Search records by name, type, or patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-earth-beige bg-white py-2 pl-10 pr-3 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
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
            {(filterType !== "all" || filterPatient !== "all" || filterDate) && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-soft-amber to-amber-500 text-xs font-bold text-white shadow-md">
                {(filterType !== "all" ? 1 : 0) + (filterPatient !== "all" ? 1 : 0) + (filterDate ? 1 : 0)}
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
              <label htmlFor="filterPatient" className="text-sm font-semibold text-graphite">
                Patient
              </label>
              <select
                id="filterPatient"
                value={filterPatient}
                onChange={(e) => setFilterPatient(e.target.value)}
                className="w-full rounded-lg border border-amber-200 bg-white py-2 px-3 text-sm text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber transition-all shadow-sm hover:shadow-md"
              >
                <option value="all">All Patients</option>
                {Object.entries(patientNames).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
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
            <p className="text-drift-gray">Loading shared records...</p>
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
                      onClick={() => handleAddNote(record)}
                      className="ml-2 rounded-full bg-white p-2 text-green-500 shadow-md transition-transform hover:scale-105 hover:bg-green-500 hover:text-white"
                      title="Add Note"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="sr-only">Add Note</span>
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
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1.5 border border-amber-200 shadow-sm">
                      <User className="h-3.5 w-3.5 text-soft-amber" />
                      <span className="font-semibold text-graphite text-xs">{patientNames[record.patientId] || "Unknown"}</span>
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
                    {record.doctorNotes && record.doctorNotes.length > 0 && (
                      <div className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 border border-green-200">
                        <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                        <span className="font-semibold text-green-700 text-xs">{record.doctorNotes.length} notes</span>
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
                    
                    {/* Patient name - minimalist on mobile */}
                    <div className="hidden sm:flex items-center gap-1.5 mb-2">
                      <div className="flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1 border border-amber-200 shadow-sm">
                        <User className="h-3.5 w-3.5 text-soft-amber" />
                        <span className="font-semibold text-graphite text-xs">{patientNames[record.patientId] || "Unknown"}</span>
                      </div>
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
                      {record.doctorNotes && record.doctorNotes.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 border border-green-200">
                          <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                          <span className="font-semibold text-green-700 text-xs">{record.doctorNotes.length} notes</span>
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
                      onClick={() => handleAddNote(record)}
                      className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border-2 border-green-300 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold text-green-600 hover:bg-green-50 hover:border-green-400 transition-all transform hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="hidden sm:inline">Add Note</span>
                    </button>
                    <button
                      onClick={() => handleViewRecord(record)}
                      className="inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border-2 border-amber-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold text-graphite hover:bg-amber-50 hover:border-soft-amber/50 transition-all transform hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="hidden sm:inline">Download</span>
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
        <NoRecordsAnimation />
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

      {/* Add Note Modal */}
      {selectedRecord && showNoteModal && (
        <RecordNoteModal
          isOpen={showNoteModal}
          onClose={() => setShowNoteModal(false)}
          record={selectedRecord}
          onSuccess={handleNoteAdded}
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
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
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
