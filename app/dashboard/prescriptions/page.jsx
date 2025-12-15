"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Pill,
  Calendar,
  Download,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  LayoutList,
  SlidersHorizontal,
} from "lucide-react"
import { getPatientPrescriptions, generatePrintablePrescription } from "@/lib/prescription-utils"
import { generatePrescriptionPDF } from "@/lib/pdf-utils"
import { SuccessNotification } from "@/components/success-notification"
import { useAuth } from "@/contexts/auth-context"
import ProfileImage from "@/components/profile-image"
import { DashboardHeaderBanner } from "@/components/dashboard-header-banner"
import { PrescriptionPreviewTemplate } from "@/components/prescription-preview-templates"

export default function PatientPrescriptionsPage() {
  const { user } = useAuth()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [isClosingFilters, setIsClosingFilters] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState(null)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)
  const [notification, setNotification] = useState({ message: "", isVisible: false })
  const [patientInfo, setPatientInfo] = useState(null)
  const [viewMode, setViewMode] = useState(() => {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("prescriptions_viewMode")
      return saved === "list" || saved === "grid" ? saved : "grid"
    }
    return "grid"
  }) // "grid" or "list"
  const [filterDoctor, setFilterDoctor] = useState("all")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(9) // Fixed to 9 items per page
  const [totalPages, setTotalPages] = useState(1)

  // Add this function inside the component but outside any other functions:
  const calculateAge = (birthdate) => {
    if (!birthdate) return null

    try {
      const today = new Date()
      const birthDate = new Date(birthdate)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDifference = today.getMonth() - birthDate.getMonth()

      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      return age
    } catch (error) {
      console.error("Error calculating age:", error)
      return null
    }
  }

  // Fetch patient info and prescriptions
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Get patient profile
        const { getUserProfile } = await import("@/lib/firebase-utils")
        const userData = await getUserProfile(user.uid)

        if (userData) {
          const calculatedAge = calculateAge(userData.dateOfBirth)
          setPatientInfo({
            id: user.uid,
            name: userData.displayName || user.displayName || "Patient",
            age: userData.age || calculatedAge || "N/A",
            gender: userData.gender || "Not specified",
            dateOfBirth: userData.dateOfBirth,
            address: userData.address || userData.streetAddress || "",
          })
        }

        // Get prescriptions
        const result = await getPatientPrescriptions(user.uid)
        if (result.success) {
          // Process prescriptions to ensure they have the right format
          const processedPrescriptions = result.prescriptions.map((prescription) => {
            // Convert Firestore timestamp to Date if needed
            const createdAt = prescription.createdAt?.seconds
              ? new Date(prescription.createdAt.seconds * 1000)
              : new Date()

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
              createdAt,
              medications,
              status: prescription.status || "active",
            }
          })

          setPrescriptions(processedPrescriptions)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Fetch doctor information
  const fetchDoctorInfo = async (doctorId) => {
    if (!doctorId) return null

    try {
      const { getUserProfile } = await import("@/lib/firebase-utils")
      const doctorData = await getUserProfile(doctorId)

      if (doctorData) {
        return {
          name: doctorData.displayName || "Doctor",
          specialty: doctorData.specialty || "General Practitioner",
          licenseNumber: doctorData.licenseNumber || "License",
          clinicAddress: doctorData.officeAddress || "Clinic Address",
          contactNumber: doctorData.phone || doctorData.contactNumber || "Contact Number",
          ptrNumber: doctorData.ptrNumber || "PTR Number",
          s2Number: doctorData.s2Number || "S2 Number",
        }
      }
    } catch (error) {
      console.error("Error fetching doctor info:", error)
    }

    return null
  }

  // Now update the handleViewPrescription function to fetch doctor info
  const handleViewPrescription = async (prescription) => {
    setSelectedPrescription(prescription)

    // Fetch doctor info if we have the doctorId
    if (prescription.doctorId) {
      const doctorInfo = await fetchDoctorInfo(prescription.doctorId)
      if (doctorInfo) {
        // Update the prescription with doctor info
        setSelectedPrescription({
          ...prescription,
          doctorInfo,
        })
      }
    }

    setShowPrescriptionModal(true)
  }

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.medications.some(
        (med) =>
          med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          med.instructions?.toLowerCase().includes(searchTerm.toLowerCase()),
      )

    const matchesStatus = filterStatus === "all" || prescription.status === filterStatus
    const matchesDoctor = filterDoctor === "all" || prescription.doctorId === filterDoctor

    return matchesSearch && matchesStatus && matchesDoctor
  })

  // Update total pages when filtered prescriptions change
  useEffect(() => {
    setTotalPages(Math.max(1, Math.ceil(filteredPrescriptions.length / itemsPerPage)))
    // Reset to first page when filters change
    setCurrentPage(1)
  }, [filteredPrescriptions.length, itemsPerPage])

  // Handle filter close with animation
  const handleCloseFilters = () => {
    setIsClosingFilters(true)
    setTimeout(() => {
      setShowFilters(false)
      setIsClosingFilters(false)
    }, 300)
  }

  // Get paginated prescriptions
  const paginatedPrescriptions = filteredPrescriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

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

  // Handle prescription download/print
  const handlePrintPrescription = (prescription) => {
    try {
      // Generate printable prescription
      const printWindow = generatePrintablePrescription(
        prescription,
        {
          name: prescription.doctorName,
          specialty: "General Practitioner", // In a real app, this would come from the prescription data
          licenseNumber: "1234567",
          clinicAddress: "123 Health St., Quezon City, Philippines",
          contactNumber: "(02) 1234-5678",
          ptrNumber: "2025-0001234",
          s2Number: "S2-123456",
        },
        patientInfo,
      )

      // Trigger print dialog
      setTimeout(() => {
        printWindow.print()
      }, 500)

      setNotification({
        message: "Prescription ready to print",
        isVisible: true,
      })
    } catch (error) {
      console.error("Error generating print preview:", error)
      setNotification({
        message: "Error generating print preview",
        isVisible: true,
      })
    }
  }

  // Handle PDF download - capture preview content directly without opening modal
  const handleDownloadPDF = async (prescription) => {
    try {
      // Check if already downloaded
      if (prescription.downloadedByPatient === true) {
        setNotification({
          message: "This prescription has already been downloaded. You can only download it once.",
          isVisible: true,
        })
        return
      }

      // Show loading notification
      setNotification({
        message: "Generating PDF...",
        isVisible: true,
      })

      // Fetch doctor info if needed
      let prescriptionData = prescription
      if (!prescription.doctorInfo && prescription.doctorId) {
        const doctorInfo = await fetchDoctorInfo(prescription.doctorId)
        if (doctorInfo) {
          prescriptionData = {
            ...prescription,
            doctorInfo,
          }
        }
      }

      // Create hidden container for PDF generation (positioned off-screen but visible to html2canvas)
      const hiddenContainer = document.createElement('div')
      hiddenContainer.id = 'pdf-generation-container'
      hiddenContainer.style.position = 'absolute'
      hiddenContainer.style.left = '-9999px'
      hiddenContainer.style.top = '0px'
      hiddenContainer.style.width = '400px'
      hiddenContainer.style.height = 'auto'
      hiddenContainer.style.backgroundColor = '#ffffff'
      hiddenContainer.style.zIndex = '-9999'
      document.body.appendChild(hiddenContainer)

      // Import React and components dynamically
      const React = await import('react')
      const { createRoot } = await import('react-dom/client')
      const { PrescriptionPreviewTemplate } = await import('@/components/prescription-preview-templates')

      const formatDate = (date) => {
        const prescriptionDate = prescriptionData.startDate || prescriptionData.createdAt || date
        const dateObj = prescriptionDate?.seconds 
          ? new Date(prescriptionDate.seconds * 1000)
          : prescriptionDate?.toDate
          ? prescriptionDate.toDate()
          : new Date(prescriptionDate || date)
        const month = String(dateObj.getMonth() + 1).padStart(2, "0")
        const day = String(dateObj.getDate()).padStart(2, "0")
        const year = dateObj.getFullYear()
        return `${month}/${day}/${year}`
      }

      // Render preview component in hidden container
      const root = createRoot(hiddenContainer)
      // Store root reference for cleanup
      hiddenContainer._reactRoot = root
      root.render(
        React.createElement('div', {
          className: 'p-6 bg-white relative max-w-lg mx-auto',
          'data-prescription-preview': true
        },
        React.createElement(PrescriptionPreviewTemplate, {
          template: prescriptionData.template || "classic",
          formData: {
            patientName: prescriptionData.patientName || patientInfo?.name || user?.displayName || "",
            patientAddress: prescriptionData.patientAddress || patientInfo?.address || "",
            patientAge: prescriptionData.patientAge || String(patientInfo?.age || calculateAge(patientInfo?.dateOfBirth) || ""),
            patientGender: prescriptionData.patientGender || patientInfo?.gender || "",
            medications: prescriptionData.medications || [],
            notes: prescriptionData.notes || "",
            signature: prescriptionData.signature || null,
          },
          doctorInfo: {
            name: prescriptionData.doctorInfo?.name || prescriptionData.doctorName || "",
            specialty: prescriptionData.doctorInfo?.specialty || prescriptionData.doctorSpecialty || "",
            licenseNumber: prescriptionData.doctorInfo?.licenseNumber || prescriptionData.doctorLicenseNumber || "",
            clinicAddress: prescriptionData.doctorInfo?.clinicAddress || prescriptionData.doctorInfo?.officeAddress || "",
            contactNumber: prescriptionData.doctorInfo?.contactNumber || prescriptionData.doctorInfo?.phone || "",
            email: prescriptionData.doctorInfo?.email || "",
            province: prescriptionData.doctorInfo?.province || "",
            healthOffice: prescriptionData.doctorInfo?.healthOffice || "",
          },
          formatDate,
          isMobile: false,
        }))
      )

      // Wait for React to render - use longer timeout for React hydration
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Find the preview element
      let previewElement = hiddenContainer.querySelector('[data-prescription-preview]')
      
      // If still not found, try finding any div inside
      if (!previewElement) {
        await new Promise(resolve => setTimeout(resolve, 500))
        previewElement = hiddenContainer.querySelector('[data-prescription-preview]') || hiddenContainer.querySelector('div')
      }
      
      if (!previewElement || !previewElement.innerHTML.trim()) {
        root.unmount()
        document.body.removeChild(hiddenContainer)
        setNotification({
          message: "Preview content not found. Please try again.",
          isVisible: true,
        })
        return
      }

      // Wait for all images to fully load
      const images = previewElement.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            // Timeout after 5 seconds
            setTimeout(() => reject(new Error('Image load timeout')), 5000)
          })
        })
      )

      // Remove blur from signature images before capturing
      const signatureImages = previewElement.querySelectorAll('[data-signature-blur="true"]')
      const originalFilters = []
      signatureImages.forEach((img) => {
        originalFilters.push(img.style.filter)
        img.style.filter = 'none' // Remove blur for PDF
      })

      // Wait a bit for CSS changes to take effect
      await new Promise(resolve => setTimeout(resolve, 100))

      // Import html2canvas and jsPDF dynamically
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      // Move container to a position where html2canvas can capture it but user can't see it
      // Use very negative position but ensure it's rendered
      hiddenContainer.style.position = 'fixed'
      hiddenContainer.style.left = '-2000px'
      hiddenContainer.style.top = '0px'
      hiddenContainer.style.width = '400px'
      hiddenContainer.style.visibility = 'visible' // Must be visible for html2canvas
      hiddenContainer.style.opacity = '1'
      
      // Force a reflow to ensure rendering
      void hiddenContainer.offsetHeight
      
      // Wait a bit more for layout to stabilize
      await new Promise(resolve => setTimeout(resolve, 300))

      // Capture the preview element as canvas
      const canvas = await html2canvas(previewElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowWidth: 400,
        windowHeight: previewElement.scrollHeight || 800,
        onclone: (clonedDoc, element) => {
          // Remove blur from cloned document
          const clonedImages = clonedDoc.querySelectorAll('[data-signature-blur="true"]')
          clonedImages.forEach((img) => {
            img.style.filter = 'none'
          })
        },
      })

      // Clean up hidden container
      root.unmount()
      document.body.removeChild(hiddenContainer)

      // Validate canvas data
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Failed to capture preview content')
      }

      // Calculate PDF dimensions
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const imgData = canvas.toDataURL('image/png', 1.0)

      // Validate image data
      if (!imgData || imgData === 'data:,') {
        throw new Error('Failed to generate image data')
      }

      // Create PDF - use A5 size (148mm x 210mm) or adjust based on content
      const pdfWidth = 148 // A5 width in mm
      const pdfHeight = (imgHeight * pdfWidth) / imgWidth // Maintain aspect ratio
      
      const pdf = new jsPDF({
        orientation: pdfHeight > pdfWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
      })

      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')

      // Generate filename
      const patientName = prescription.patientName || patientInfo?.name || "patient"
      const date = prescription.startDate || prescription.createdAt || new Date()
      const dateStr = date?.seconds 
        ? new Date(date.seconds * 1000).toISOString().split("T")[0]
        : new Date(date).toISOString().split("T")[0]

      // Save PDF
      pdf.save(`prescription_${patientName.replace(/\s+/g, "_")}_${dateStr}.pdf`)

      // Update local state IMMEDIATELY (before database call) to disable button
      const downloadTimestamp = new Date().toISOString()
      setPrescriptions(prevPrescriptions => 
        prevPrescriptions.map(p => 
          p.id === prescription.id 
            ? { ...p, downloadedByPatient: true, downloadedAt: downloadTimestamp }
            : p
        )
      )
      
      // Update selected prescription if it's the same
      if (selectedPrescription?.id === prescription.id) {
        setSelectedPrescription(prev => ({
          ...prev,
          downloadedByPatient: true,
          downloadedAt: downloadTimestamp,
        }))
      }

      // Mark prescription as downloaded in database (non-blocking)
      // Use fire-and-forget approach so button disables immediately
      Promise.resolve().then(async () => {
        try {
          const { updateDoc, doc } = await import('firebase/firestore')
          const { db } = await import('@/lib/firebase')
          const prescriptionRef = doc(db, 'prescriptions', prescription.id)
          await updateDoc(prescriptionRef, {
            downloadedByPatient: true,
            downloadedAt: downloadTimestamp,
          })
        } catch (error) {
          console.error("Error marking prescription as downloaded:", error)
          // Silently fail - state is already updated
        }
      })

      setNotification({
        message: "PDF downloaded successfully",
        isVisible: true,
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      
      // Clean up any remaining hidden containers
      const hiddenContainer = document.getElementById('pdf-generation-container')
      if (hiddenContainer) {
        try {
          const root = hiddenContainer._reactRoot
          if (root) {
            root.unmount()
          }
        } catch (e) {
          // Ignore cleanup errors
        }
        try {
          if (hiddenContainer.parentNode) {
            document.body.removeChild(hiddenContainer)
          }
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      
      setNotification({
        message: "Error generating PDF. Please try again.",
        isVisible: true,
      })
    }
  }

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case "active":
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
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

  // Create download button for header
  const downloadButton = (
    <button
      onClick={() => prescriptions.length > 0 && handleDownloadPDF(prescriptions[0])}
      disabled={prescriptions.length === 0 || loading}
      className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-soft-amber shadow-sm transition-all hover:bg-amber-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 animate-fadeIn"
    >
      <Download className="mr-2 h-4 w-4" />
      Download Latest
    </button>
  )

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Dashboard Header Banner with page-specific content */}
      <DashboardHeaderBanner
        userRole="patient"
        title="My Prescriptions"
        subtitle="View and download your prescriptions"
        actionButton={downloadButton}
        showMetrics={false}
      />

      {/* Search and Filters */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray" />
          <input
            type="text"
            placeholder="Search by doctor or medication..."
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
                localStorage.setItem("prescriptions_viewMode", newMode)
              }
            }}
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
                setIsClosingFilters(true)
                setTimeout(() => {
                  setShowFilters(false)
                  setIsClosingFilters(false)
                }, 300)
              } else {
                setShowFilters(true)
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2.5 text-sm font-medium text-graphite shadow-sm transition-all hover:bg-amber-50 hover:border-amber-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 relative"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(filterStatus !== "all" || filterDoctor !== "all") && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-soft-amber to-amber-500 text-xs font-bold text-white shadow-md">1</span>
            )}
          </button>
        </div>
      </div>

      {/* Filters with smooth animation */}
      {showFilters && (
        <div
          className={`rounded-lg border border-amber-200 bg-white p-4 shadow-sm transition-all duration-300 ${
            isClosingFilters ? "opacity-0 max-h-0 overflow-hidden -translate-y-2" : "opacity-100 max-h-96 translate-y-0"
          }`}
        >
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:space-x-4 sm:space-y-0">
            <div className="flex-1 space-y-2">
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
            <div className="flex-1 space-y-2">
              <label htmlFor="filterDoctor" className="text-sm font-medium text-graphite">Doctor</label>
              <select
                id="filterDoctor"
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
                className="w-full rounded-md border border-earth-beige bg-white py-2 px-3 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              >
                <option value="all">All</option>
                {Array.from(new Map(prescriptions.map((p) => [p.doctorId, p.doctorName])).entries()).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                setFilterStatus("all")
                setFilterDoctor("all")
                setSearchTerm("")
              }}
              className="inline-flex items-center rounded-md border border-earth-beige bg-white px-4 py-2 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Prescriptions Grid/List View with smooth toggle */}
      <div key={viewMode} className="space-y-6 animate-fadeIn">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-soft-amber border-t-transparent"></div>
            <span className="ml-3 text-drift-gray">Loading prescriptions...</span>
          </div>
        ) : filteredPrescriptions.length > 0 ? (
          <>
            {viewMode === "grid" && filterStatus === "all" && !searchTerm ? (
              <>
                {filteredPrescriptions.some((p) => p.status === "active") && (
          <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-graphite">Active Prescriptions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedPrescriptions.filter((p)=>p.status==="active").map((prescription) => {
              const statusInfo = getStatusInfo(prescription.status)
              const date = new Date(prescription.createdAt)
                        const formattedDate = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                        // existing grid card markup here (same as below)
              return (
                <div
                  key={prescription.id}
                            className="overflow-hidden rounded-xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50">
                      <Pill className="h-5 w-5 text-soft-amber" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {prescription.medications[0].name}
                            {prescription.medications.length > 1 && (
                                        <span className="ml-1 text-xs text-gray-500">
                                +{prescription.medications.length - 1}
                              </span>
                            )}
                          </h3>
                          <span
                                      className={`inline-flex rounded-full ${statusInfo.color} px-2 py-0.5 text-[10px] font-medium ${statusInfo.textColor} mt-1`}
                          >
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>

                              <div className="space-y-2 mb-4">
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium">Dosage:</span> {prescription.medications[0].dosage}
                                </p>
                                <p className="text-xs text-gray-600">
                                  <span className="font-medium">Frequency:</span> {prescription.medications[0].frequency}
                                </p>
                                {prescription.medications[0].duration && (
                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Duration:</span> {prescription.medications[0].duration}
                                  </p>
                                )}
                                {prescription.notes && (
                                  <p className="text-[10px] text-gray-500 line-clamp-2">
                                    <span className="font-medium text-gray-600">Notes:</span> {prescription.notes}
                                  </p>
                                )}
                      </div>

                              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-amber-200/50">
                                <ProfileImage userId={prescription.doctorId} role="doctor" size="xs" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">{prescription.doctorName}</p>
                                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formattedDate}</span>
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
                    <button
                      onClick={() => handleDownloadPDF(prescription)}
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
                              </div>
                  </div>
                </div>
              )
            })}
                    </div>
                  </div>
                )}
                {filteredPrescriptions.some((p) => p.status === "expired") && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-graphite">Expired Prescriptions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedPrescriptions.filter((p)=>p.status==="expired").map((prescription) => {
                        const statusInfo = getStatusInfo(prescription.status)
                        const date = new Date(prescription.createdAt)
                        const formattedDate = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
                        return (
                          <div key={prescription.id} className="overflow-hidden rounded-xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]">
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50">
                                    <Pill className="h-5 w-5 text-soft-amber" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-sm truncate">{prescription.medications[0].name}</h3>
                                    <span className={`inline-flex rounded-full ${statusInfo.color} px-2 py-0.5 text-[10px] font-medium ${statusInfo.textColor} mt-1`}>{statusInfo.label}</span>
                                  </div>
                                </div>
                              </div>
                              {/* meta/notes/actions same as above */}
                              <div className="space-y-2 mb-4">
                                <p className="text-xs text-gray-600"><span className="font-medium">Dosage:</span> {prescription.medications[0].dosage}</p>
                                <p className="text-xs text-gray-600"><span className="font-medium">Frequency:</span> {prescription.medications[0].frequency}</p>
                                {prescription.notes && (<p className="text-[10px] text-gray-500 line-clamp-2"><span className="font-medium text-gray-600">Notes:</span> {prescription.notes}</p>)}
                              </div>
                              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-amber-200/50">
                                <ProfileImage userId={prescription.doctorId} role="doctor" size="xs" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">{prescription.doctorName}</p>
                                  <div className="flex items-center gap-1 text-[10px] text-gray-500"><Calendar className="h-3 w-3" /><span>{formattedDate}</span></div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleViewPrescription(prescription)} className="flex-1 rounded-lg border-2 border-amber-200/50 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition-all hover:bg-amber-50 hover:border-amber-300">Preview</button>
                                <button onClick={() => handleDownloadPDF(prescription)} disabled={prescription.downloadedByPatient === true} className={`flex-1 inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${prescription.downloadedByPatient === true ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-soft-amber to-amber-500 text-white hover:from-amber-500 hover:to-amber-600"}`}>
                                  <Download className="mr-1 h-3.5 w-3.5" />
                                  {prescription.downloadedByPatient === true ? "Downloaded" : "PDF"}
                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
              </div>
            )}
              </>
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                {paginatedPrescriptions.map((prescription) => {
                  const statusInfo = getStatusInfo(prescription.status)
                  const date = new Date(prescription.createdAt)
                  const formattedDate = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })

                  if (viewMode === "grid") {
                    return (
                      <div
                        key={prescription.id}
                        className="overflow-hidden rounded-xl border-2 border-amber-200/50 bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50">
                                <Pill className="h-5 w-5 text-soft-amber" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-sm truncate">
                                  {prescription.medications[0].name}
                                  {prescription.medications.length > 1 && (
                                    <span className="ml-1 text-xs text-gray-500">
                                      +{prescription.medications.length - 1}
                                    </span>
                                  )}
                                </h3>
                                <span className={`inline-flex rounded-full ${statusInfo.color} px-2 py-0.5 text-[10px] font-medium ${statusInfo.textColor} mt-1`}>{statusInfo.label}</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <p className="text-xs text-gray-600"><span className="font-medium">Dosage:</span> {prescription.medications[0].dosage}</p>
                            <p className="text-xs text-gray-600"><span className="font-medium">Frequency:</span> {prescription.medications[0].frequency}</p>
                            {prescription.medications[0].duration && (
                              <p className="text-xs text-gray-600"><span className="font-medium">Duration:</span> {prescription.medications[0].duration}</p>
                            )}
                            {prescription.notes && (
                              <p className="text-[10px] text-gray-500 line-clamp-2"><span className="font-medium text-gray-600">Notes:</span> {prescription.notes}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-amber-200/50">
                            <ProfileImage userId={prescription.doctorId} role="doctor" size="xs" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{prescription.doctorName}</p>
                              <div className="flex items-center gap-1 text-[10px] text-gray-500"><Calendar className="h-3 w-3" /><span>{formattedDate}</span></div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button onClick={() => handleViewPrescription(prescription)} className="flex-1 rounded-lg border-2 border-amber-200/50 bg-white px-3 py-2 text-xs font-semibold text-gray-900 transition-all hover:bg-amber-50 hover:border-amber-300">Preview</button>
                            <button onClick={() => handleDownloadPDF(prescription)} disabled={prescription.downloadedByPatient === true} className={`flex-1 inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${prescription.downloadedByPatient === true ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-gradient-to-r from-soft-amber to-amber-500 text-white hover:from-amber-500 hover:to-amber-600"}`}>
                              <Download className="mr-1 h-3.5 w-3.5" />
                              {prescription.downloadedByPatient === true ? "Downloaded" : "PDF"}
                </button>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // List view item
                  return (
                    <div
                      key={prescription.id}
                      className="group relative overflow-hidden rounded-xl border border-earth-beige bg-white shadow-sm transition-all hover:shadow-md hover:border-amber-200/80"
                    >
                      <div className="p-3 sm:p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-soft-amber/20 to-amber-50 flex-shrink-0">
                            <Pill className="h-5 w-5 text-soft-amber" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-graphite truncate">{prescription.medications[0].name}</h3>
                              <span className={`inline-flex rounded-full ${statusInfo.color} px-2 py-0.5 text-[10px] font-medium ${statusInfo.textColor}`}>{statusInfo.label}</span>
                            </div>
                            <div className="mt-0.5 text-xs text-drift-gray truncate">
                              {prescription.medications[0].dosage}, {prescription.medications[0].frequency}
                              {prescription.medications[0].duration && ` • ${prescription.medications[0].duration}`}
                            </div>
                          </div>
                          <div className="hidden sm:flex items-center gap-3 text-xs text-drift-gray">
                            <div className="flex items-center">
                              <ProfileImage userId={prescription.doctorId} role="doctor" size="xs" className="mr-1.5" />
                              <span className="truncate max-w-[140px]">{prescription.doctorName}</span>
                            </div>
                            <div className="flex items-center whitespace-nowrap">
                              <Calendar className="mr-1.5 h-3.5 w-3.5" />
                              <span>{formattedDate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-earth-beige/60 pt-3">
                          {prescription.notes ? (
                            <p className="text-[11px] text-gray-600 line-clamp-1"><span className="font-medium text-gray-700">Notes:</span> {prescription.notes}</p>
                          ) : (
                            <div className="h-0.5" />
                          )}

                          <div className="sm:hidden flex items-center justify-between text-[11px] text-drift-gray">
                            <div className="flex items-center">
                              <ProfileImage userId={prescription.doctorId} role="doctor" size="xs" className="mr-1" />
                              <span className="truncate max-w-[140px]">{prescription.doctorName}</span>
                            </div>
                            <div className="flex items-center ml-3">
                              <Calendar className="mr-1 h-3.5 w-3.5" />
                              <span>{formattedDate}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:justify-end">
                            <button onClick={() => handleViewPrescription(prescription)} className="rounded-lg border border-earth-beige bg-white px-3 py-1.5 text-[11px] font-medium text-graphite transition-colors hover:bg-pale-stone">Preview</button>
                            <button onClick={() => handleDownloadPDF(prescription)} disabled={prescription.downloadedByPatient === true} className={`inline-flex items-center rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors ${prescription.downloadedByPatient === true ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-soft-amber text-white hover:bg-amber-600"}`}>
                              <Download className="mr-1 h-3.5 w-3.5" />
                              {prescription.downloadedByPatient === true ? "Downloaded" : "PDF"}
                </button>
              </div>
          </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-pale-stone bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pale-stone">
              <FileText className="h-8 w-8 text-drift-gray" />
            </div>
            <h3 className="mb-1 text-lg font-medium text-graphite">No Prescriptions Found</h3>
            <p className="mb-4 text-drift-gray">
              {searchTerm || filterStatus !== "all"
                ? "No prescriptions match your search criteria. Try adjusting your filters."
                : "You don't have any prescriptions yet."}
            </p>
          </div>
        )}
      </div>

      {/* Prescription Preview Modal */}
      {showPrescriptionModal && selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 animate-fadeIn" data-modal-backdrop>
          <div className="relative w-full max-w-xs sm:max-w-sm max-h-[95vh] flex flex-col rounded-lg bg-white shadow-xl overflow-hidden" data-modal-content>
            {/* Modal header - no close button */}
            <div className="flex items-center justify-center border-b border-pale-stone px-2 py-1.5 flex-shrink-0">
              <h3 className="text-[10px] sm:text-xs font-medium text-graphite">Prescription Preview</h3>
            </div>

            {/* Prescription preview - using PrescriptionPreviewTemplate */}
            <div className="p-1.5 sm:p-2 overflow-y-auto flex-1 min-h-0">
              <div className="overflow-hidden rounded-lg border-2 border-gray-200 bg-white shadow-lg relative">
                <div className="p-3 sm:p-4 bg-white relative max-w-full mx-auto" data-prescription-preview>
                  <PrescriptionPreviewTemplate
                    template={selectedPrescription.template || "classic"}
                    isModal={true}
                    formData={{
                      // Use saved prescription data - exact same as doctor's live preview
                      patientName: selectedPrescription.patientName || patientInfo?.name || user?.displayName || "",
                      patientAddress: selectedPrescription.patientAddress || patientInfo?.address || "",
                      patientAge: selectedPrescription.patientAge || String(patientInfo?.age || calculateAge(patientInfo?.dateOfBirth) || ""),
                      patientGender: selectedPrescription.patientGender || patientInfo?.gender || "",
                      medications: selectedPrescription.medications || [],
                      notes: selectedPrescription.notes || "",
                      signature: selectedPrescription.signature || null,
                    }}
                    doctorInfo={{
                      // Use saved doctor info from prescription or fetch
                      name: selectedPrescription.doctorInfo?.name || selectedPrescription.doctorName || "",
                      specialty: selectedPrescription.doctorInfo?.specialty || selectedPrescription.doctorSpecialty || "",
                      licenseNumber: selectedPrescription.doctorInfo?.licenseNumber || selectedPrescription.doctorLicenseNumber || "",
                      clinicAddress: selectedPrescription.doctorInfo?.clinicAddress || selectedPrescription.doctorInfo?.officeAddress || "",
                      contactNumber: selectedPrescription.doctorInfo?.contactNumber || selectedPrescription.doctorInfo?.phone || "",
                      email: selectedPrescription.doctorInfo?.email || "",
                      province: selectedPrescription.doctorInfo?.province || "",
                      healthOffice: selectedPrescription.doctorInfo?.healthOffice || "",
                    }}
                    formatDate={(date) => {
                      // Use prescription date exactly as saved (startDate or createdAt)
                      const prescriptionDate = selectedPrescription.startDate || selectedPrescription.createdAt || date
                      const dateObj = prescriptionDate?.seconds 
                        ? new Date(prescriptionDate.seconds * 1000)
                        : prescriptionDate?.toDate
                        ? prescriptionDate.toDate()
                        : new Date(prescriptionDate || date)
                      // Format same as doctor's preview: MM/DD/YYYY
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
                className="rounded-md border border-earth-beige bg-white px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium text-graphite shadow-sm transition-colors hover:bg-pale-stone"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      <SuccessNotification
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={() => setNotification({ ...notification, isVisible: false })}
      />
    </div>
  )
}
