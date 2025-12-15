"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  X,
  Download,
  FileText,
  AlertCircle,
  Calendar,
  Clock,
  Tag,
  FileImage,
  FileIcon as FilePdf,
  FileSpreadsheet,
  MessageSquare,
} from "lucide-react"
import { DoctorNotesModal } from "./doctor-notes-modal"
import { useAuth } from "@/contexts/auth-context"

export function PatientRecordModal({ isOpen, onClose, record, loading, showDoctorNotes = false }) {
  const { user, userRole } = useAuth()
  const [error, setError] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const isClosingRef = useRef(false)
  const modalRef = useRef(null)
  const [showNotesModal, setShowNotesModal] = useState(false)

  // Color scheme - Orange/Amber (matching appointment modal)
  const themeColors = {
    headerBg: "bg-gradient-to-br from-soft-amber/10 to-yellow-50",
    buttonBg: "bg-gradient-to-r from-soft-amber to-amber-500",
    buttonHover: "hover:from-amber-500 hover:to-amber-600",
    focusRing: "focus:ring-soft-amber",
    borderColor: "border-amber-200",
    accentColor: "text-soft-amber",
    iconBg: "bg-soft-amber/20 text-soft-amber",
    focusBorder: "focus:border-soft-amber",
  }

  const theme = themeColors

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      isClosingRef.current = false
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setIsClosing(false)
        isClosingRef.current = false
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle closing with animation (bulletproof like appointment modal)
  const handleCloseWithAnimation = useCallback((e) => {
    if (isClosingRef.current || isClosing) {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
        if (e.stopImmediatePropagation) {
          e.stopImmediatePropagation()
        }
      }
      return
    }
    isClosingRef.current = true
    if (e) {
      e.preventDefault()
      e.stopPropagation()
      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation()
      }
    }
    setIsClosing(true)
    try {
      onClose()
    } catch (error) {
      console.error("Error calling onClose:", error)
      setIsClosing(false)
      isClosingRef.current = false
    }
  }, [onClose, isClosing, isOpen])

  // Handle download
  const handleDownload = () => {
    try {
      if (!record || !record.fileData) {
        setError("File data not available for download.")
        return
      }

      // Create a link element
      const link = document.createElement("a")
      link.href = record.fileData
      link.download = record.name || "medical-record"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error downloading file:", error)
      setError("Failed to download file. Please try again.")
    }
  }

  // Get file type display name
  const getFileTypeDisplay = (fileType) => {
    if (!fileType) return "Unknown"
    if (fileType.startsWith("image/")) return `Image (${fileType.split("/")[1].toUpperCase()})`
    if (fileType === "application/pdf") return "PDF Document"
    if (fileType.includes("word")) return "Word Document"
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "Spreadsheet"
    return fileType
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
    if (!fileType) return <FileText className="h-8 w-8 text-drift-gray" />
    if (fileType.startsWith("image/")) return <FileImage className="h-8 w-8 text-soft-amber" />
    if (fileType === "application/pdf") return <FilePdf className="h-8 w-8 text-red-500" />
    if (fileType.includes("spreadsheet") || fileType.includes("excel"))
      return <FileSpreadsheet className="h-8 w-8 text-green-600" />
    return <FileText className="h-8 w-8 text-blue-500" />
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Open doctor notes modal
  const openDoctorNotes = () => {
    setShowNotesModal(true)
  }

  // If viewing doctor notes, render that modal and close this record modal afterward
  if (showNotesModal) {
    return (
      <DoctorNotesModal
        isOpen={true}
        record={record}
        onClose={() => {
          setShowNotesModal(false)
          // Ensure the parent record modal is fully closed when notes modal closes
          try { onClose() } catch {}
        }}
      />
    )
  }

  if ((!isOpen && !isVisible) || (!isOpen && isClosingRef.current)) return null

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-4 bg-black/60 backdrop-blur-xl ${isClosing ? "animate-fade-out" : "animate-fade-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""}`}
        onClick={(e) => {
          if (!isOpen || isClosing || isClosingRef.current) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
          if (e.target !== e.currentTarget) {
            e.stopPropagation()
            return
          }
          handleCloseWithAnimation(e)
        }}
        onMouseDown={(e) => {
          if (!isOpen || isClosing || isClosingRef.current) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
          if (e.target === e.currentTarget) {
            // Allow backdrop clicks
          } else {
            e.stopPropagation()
          }
        }}
        style={{ backdropFilter: 'blur(16px)' }}
      >
        <div
          ref={modalRef}
          className={`w-full max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] sm:max-h-[82vh] lg:max-h-[78vh] flex flex-col ${isClosing ? "animate-modal-out" : "animate-modal-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""} ${theme.headerBg}`}
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (!isOpen || isClosing || isClosingRef.current) {
              e.preventDefault()
              e.stopPropagation()
              return
            }
            e.stopPropagation()
            e.stopImmediatePropagation?.()
          }}
          onMouseDown={(e) => {
            if (!isOpen || isClosing || isClosingRef.current) {
              e.preventDefault()
              e.stopPropagation()
              return
            }
            e.stopPropagation()
          }}
        >
          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes fadeOut {
              from {
                opacity: 1;
              }
              to {
                opacity: 0;
              }
            }
            @keyframes modalIn {
              from {
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            @keyframes modalOut {
              from {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
              to {
                opacity: 0;
                transform: scale(0.9) translateY(20px);
              }
            }
            .animate-fade-in {
              animation: fadeIn 0.3s ease-out;
            }
            .animate-fade-out {
              animation: fadeOut 0.3s ease-out;
            }
            .animate-modal-in {
              animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .animate-modal-out {
              animation: modalOut 0.3s ease-in;
            }
          `}</style>
          <style jsx global>{`
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {/* Header with gradient background - matching appointment modal */}
          <div className={`${theme.headerBg} p-2 sm:p-2.5 md:p-3 lg:p-3 relative overflow-hidden flex-shrink-0`}>
            <div className="relative z-10 flex items-center gap-2 sm:gap-2.5">
              <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full ${theme.iconBg} flex-shrink-0`}>
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 lg:h-4 lg:w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xs sm:text-sm md:text-base lg:text-base font-bold text-graphite">
                  Medical Record
                </h2>
                {record && (
                  <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray mt-0.5 truncate">
                    {record.name || "Record Details"}
                  </p>
                )}
              </div>
            </div>

            {/* Decorative circles - matching appointment modal */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full -ml-10 -mb-10"></div>
          </div>

          {/* Content - matching appointment modal style */}
          <div className="p-2.5 sm:p-3 md:p-3.5 lg:p-4 overflow-hidden flex-1 min-h-0 flex flex-col">
            {loading ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-soft-amber mb-4"></div>
                  <p className="text-sm text-drift-gray">Loading record...</p>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200/50 bg-red-50/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-xs md:text-sm text-red-700">{error}</p>
                </div>
              </div>
            ) : record ? (
              <div className="flex-1 overflow-hidden min-h-0 space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-2.5">
                {/* Record Name and Type */}
                <div className="rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
                  <h3 className="text-xs sm:text-sm md:text-base font-semibold text-graphite mb-2">
                    {record.name || "Unnamed Record"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-soft-amber/20 to-amber-50 border border-soft-amber/30 text-soft-amber`}>
                      {record.type || "Medical Record"}
                    </span>
                  </div>
                </div>

                {/* Date and Upload Date - Grid layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  <div className="flex items-start gap-2 sm:gap-2.5 rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
                    <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 items-center justify-center rounded-lg ${theme.iconBg} flex-shrink-0`}>
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite">Record Date</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray mt-0.5">
                        {record.date ? formatDate(record.date) : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-2.5 rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
                    <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 items-center justify-center rounded-lg ${theme.iconBg} flex-shrink-0`}>
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite">Uploaded</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray mt-0.5">
                        {record.uploadedDate ? formatDate(record.uploadedDate) : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* File Type and Size - Same line on mobile */}
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  <div className="flex items-start gap-2 sm:gap-2.5 rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
                    <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 items-center justify-center rounded-lg ${theme.iconBg} flex-shrink-0`}>
                      <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite">File Type</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray mt-0.5 truncate">
                        {getFileTypeDisplay(record.fileType)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-2.5 rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
                    <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 items-center justify-center rounded-lg ${theme.iconBg} flex-shrink-0`}>
                      <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 text-soft-amber" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite">File Size</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray mt-0.5">
                        {formatFileSize(record.fileSize)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {record.notes && (
                  <div className="rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
                    <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite mb-1">📝 Notes</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray leading-relaxed">{record.notes}</p>
                  </div>
                )}

                {/* File Preview/Display */}
                <div className="rounded-lg border border-amber-200/50 bg-gradient-to-br from-pale-stone to-amber-50/50 p-2.5 sm:p-3 md:p-3 shadow-sm min-h-[200px] sm:min-h-[300px] flex items-center justify-center">
                  {record.fileData ? (
                    record.fileType?.startsWith("image/") ? (
                      <img
                        src={record.fileData || "/placeholder.svg"}
                        alt={record.name}
                        className="max-h-[250px] sm:max-h-[400px] max-w-full rounded-lg object-contain"
                      />
                    ) : record.fileType === "application/pdf" ? (
                      <div className="flex h-full w-full flex-col items-center justify-center">
                        <FilePdf className="mb-2 h-12 w-12 sm:h-16 sm:w-16 text-red-500" />
                        <p className="text-center text-xs sm:text-sm text-drift-gray px-4">
                          PDF document preview not available. Please download to view.
                        </p>
                      </div>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center">
                        {getFileIcon(record.fileType)}
                        <p className="text-center text-xs sm:text-sm text-drift-gray mt-2 px-4">
                          Preview not available for this file type. Please download to view.
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center">
                      <FileText className="mb-2 h-12 w-12 sm:h-16 sm:w-16 text-drift-gray" />
                      <p className="text-center text-xs sm:text-sm text-drift-gray">No preview available</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-drift-gray">Record not found</p>
              </div>
            )}
          </div>

          {/* Footer with buttons - matching appointment modal style */}
          <div className="p-2 sm:p-2.5 md:p-3 lg:p-3 border-t border-amber-200/30 bg-white/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  e.stopImmediatePropagation?.()
                  if (!isClosingRef.current && !isClosing) {
                    handleCloseWithAnimation(e)
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (e.stopImmediatePropagation) {
                    e.stopImmediatePropagation()
                  }
                }}
                disabled={isClosing || isClosingRef.current}
                className="flex-1 sm:flex-none rounded-lg border-2 border-soft-amber/60 bg-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-soft-amber shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Close
              </button>

              {record && record.fileData && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.stopImmediatePropagation?.()
                    if (!isClosingRef.current && !isClosing) {
                      handleDownload()
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (e.stopImmediatePropagation) {
                      e.stopImmediatePropagation()
                    }
                  }}
                  disabled={isClosing || isClosingRef.current || !record.fileData}
                  className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg ${theme.buttonBg} px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg hover:shadow-xl ${theme.buttonHover} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed`}
                >
                  <Download className="h-4 w-4" />
                  Download Record
                </button>
              )}

              {showDoctorNotes && record?.doctorNotes && record.doctorNotes.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.stopImmediatePropagation?.()
                    if (!isClosingRef.current && !isClosing) {
                      openDoctorNotes()
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (e.stopImmediatePropagation) {
                      e.stopImmediatePropagation()
                    }
                  }}
                  disabled={isClosing || isClosingRef.current}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg border-2 border-amber-200 bg-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-graphite shadow-sm hover:bg-amber-50 hover:border-soft-amber/50 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="h-4 w-4 text-soft-amber" />
                  View Doctor Notes ({record.doctorNotes.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Notes Modal */}
      <DoctorNotesModal isOpen={showNotesModal} onClose={() => setShowNotesModal(false)} record={record} />
    </>
  )
}
