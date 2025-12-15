"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Upload,
  AlertCircle,
  FileText,
  ImageIcon,
  FileCheck,
  FileSpreadsheet,
  FileIcon as FilePdf,
} from "lucide-react"
import {
  isFileSizeValid,
  isFileTypeAllowed,
  fileToBase64,
  uploadMedicalRecord,
  MAX_FILE_SIZE,
  getFileTypeCategory,
} from "@/lib/record-utils"

export function UploadMedicalRecordModal({ isOpen, onClose, userId, onSuccess }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [recordName, setRecordName] = useState("")
  const [recordType, setRecordType] = useState("")
  const [recordDate, setRecordDate] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const isClosingRef = useRef(false)
  const modalRef = useRef(null)

  // Theme to match PatientRecordModal/Appointment modals
  const theme = {
    headerBg: "bg-gradient-to-br from-soft-amber/10 to-yellow-50",
    buttonBg: "bg-gradient-to-r from-soft-amber to-amber-500",
    buttonHover: "hover:from-amber-500 hover:to-amber-600",
    focusRing: "focus:ring-soft-amber",
    borderColor: "border-amber-200",
    accentColor: "text-soft-amber",
    iconBg: "bg-soft-amber/20 text-soft-amber",
    focusBorder: "focus:border-soft-amber",
  }

  // Record types
  const recordTypes = ["Lab Result", "Imaging", "Prescription", "Visit Note", "Vaccination", "Insurance"]

  // Handle modal visibility with animation and ensure close lock resets
  useEffect(() => {
    if (isOpen) {
      // Opening: make visible and clear any stale closing lock
      setIsVisible(true)
      setIsClosing(false)
      // Reset the closing ref immediately and again after a brief delay
      isClosingRef.current = false
      const resetTimer = setTimeout(() => {
        isClosingRef.current = false
      }, 400)
      return () => clearTimeout(resetTimer)
    } else {
      // Closing: hide after animation and then release the lock shortly after
      const hideTimer = setTimeout(() => {
        setIsVisible(false)
        setIsClosing(false)
      }, 300)
      const unlockTimer = setTimeout(() => {
        isClosingRef.current = false
      }, 600)
      return () => {
        clearTimeout(hideTimer)
        clearTimeout(unlockTimer)
      }
    }
  }, [isOpen])

  // Handle closing with animation (consistent behavior)
  const handleCloseWithAnimation = useCallback((e) => {
    if (loading || isClosingRef.current || isClosing) {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation?.()
      }
      return
    }
    isClosingRef.current = true
    if (e) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation?.()
    }
    setIsClosing(true)
    try {
      onClose()
    } catch (err) {
      console.error("Error closing modal:", err)
      setIsClosing(false)
      isClosingRef.current = false
    }

    // Reset form after closing
    setFile(null)
    setPreview(null)
    setRecordName("")
    setRecordType("")
    setRecordDate("")
    setNotes("")
    setError("")
    setUploadProgress(0)
  }, [onClose, loading, isClosing])

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    processFile(selectedFile)
  }

  // Process the selected file
  const processFile = (selectedFile) => {
    if (!selectedFile) return

    // Check file size
    if (!isFileSizeValid(selectedFile)) {
      setError(`File size exceeds the maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
      return
    }

    // Check file type
    if (!isFileTypeAllowed(selectedFile)) {
      setError("File type not allowed. Please upload a PDF, image, or document file.")
      return
    }

    setFile(selectedFile)
    setError("")

    // Auto-suggest record name from file name
    if (!recordName) {
      const fileName = selectedFile.name.split(".")[0]
      setRecordName(fileName.charAt(0).toUpperCase() + fileName.slice(1))
    }

    // Auto-suggest record type based on file type
    if (!recordType) {
      const fileCategory = getFileTypeCategory(selectedFile)
      if (fileCategory === "Image") setRecordType("Imaging")
      else if (fileCategory === "PDF") setRecordType("Lab Result")
      else if (fileCategory === "Document") setRecordType("Visit Note")
    }

    // Create preview for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target.result)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      setError("Please select a file to upload.")
      return
    }

    if (!recordName) {
      setError("Please enter a name for the record.")
      return
    }

    if (!recordType) {
      setError("Please select or enter a record type.")
      return
    }

    if (!recordDate) {
      setError("Please enter a date for the record.")
      return
    }

    try {
      setLoading(true)
      setError("")
      setUploadProgress(10)

      // Convert file to base64
      const fileData = await fileToBase64(file)
      setUploadProgress(50)

      // Upload record to Firestore
      await uploadMedicalRecord(userId, {
        name: recordName,
        type: recordType,
        fileType: file.type,
        fileData: fileData,
        fileSize: file.size,
        date: recordDate,
        notes: notes,
      })

      setUploadProgress(100)

      // Notify parent component of success
      if (onSuccess) onSuccess()

      // Close modal
      handleCloseWithAnimation()
    } catch (error) {
      console.error("Error uploading record:", error)
      setError(`Failed to upload record: ${error.message || "Please try again."}`)
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  // Get file icon based on file type
  const getFileIcon = () => {
    if (!file) return <Upload className="h-12 w-12 text-drift-gray" />
    if (file.type.startsWith("image/")) return <ImageIcon className="h-12 w-12 text-soft-amber" />
    if (file.type === "application/pdf") return <FilePdf className="h-12 w-12 text-red-500" />
    if (file.type.includes("spreadsheet") || file.type.includes("excel"))
      return <FileSpreadsheet className="h-12 w-12 text-green-600" />
    return <FileText className="h-12 w-12 text-soft-amber" />
  }

  if ((!isOpen && !isVisible) || (!isOpen && isClosingRef.current)) return null

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-4 bg-black/60 backdrop-blur-xl ${isClosing ? "animate-fade-out" : "animate-fade-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""}`}
        onClick={(e) => {
          if (!isOpen || isClosing || isClosingRef.current || loading) {
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
          if (!isOpen || isClosing || isClosingRef.current || loading) {
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
            if (!isOpen || isClosing || isClosingRef.current || loading) {
              e.preventDefault()
              e.stopPropagation()
              return
            }
            e.stopPropagation()
            e.stopImmediatePropagation?.()
          }}
          onMouseDown={(e) => {
            if (!isOpen || isClosing || isClosingRef.current || loading) {
              e.preventDefault()
              e.stopPropagation()
              return
            }
            e.stopPropagation()
          }}
        >
          <style jsx>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            @keyframes modalIn { from { opacity: 0; transform: scale(0.9) translateY(-20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            @keyframes modalOut { from { opacity: 1; transform: scale(1) translateY(0); } to { opacity: 0; transform: scale(0.9) translateY(20px); } }
            .animate-fade-in { animation: fadeIn 0.3s ease-out; }
            .animate-fade-out { animation: fadeOut 0.3s ease-out; }
            .animate-modal-in { animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
            .animate-modal-out { animation: modalOut 0.3s ease-in; }
          `}</style>

          {/* Header */}
          <div className={`${theme.headerBg} p-2 sm:p-2.5 md:p-3 lg:p-3 relative overflow-hidden flex-shrink-0`}>
            <div className="relative z-10 flex items-center gap-2 sm:gap-2.5">
              <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-full ${theme.iconBg} flex-shrink-0`}>
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              </div>
              <h2 className="text-xs sm:text-sm md:text-base lg:text-base font-bold text-graphite">Upload Medical Record</h2>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full -ml-10 -mb-10"></div>
          </div>

          {/* Content */}
          <div className="p-2.5 sm:p-3 md:p-3.5 lg:p-4 overflow-hidden flex-1 min-h-0 flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <div className="flex-1 overflow-hidden min-h-0 space-y-2 sm:space-y-2.5 md:space-y-3">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-3 sm:p-4 mb-2 sm:mb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-3">
                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs sm:text-sm font-medium text-red-800 mb-1">Error</h3>
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* File Upload */}
            <div className="space-y-1.5 mb-3 lg:mb-4">
              <label className="block text-xs sm:text-sm font-semibold text-graphite">Record File</label>
                {!file ? (
                  <div
                  className={`flex items-center justify-center rounded-lg border border-dashed ${dragActive ? "border-soft-amber bg-amber-50" : "border-earth-beige bg-white hover:border-gray-300"} p-4 sm:p-5 transition-colors duration-200`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <label className="flex cursor-pointer flex-col items-center">
                      <Upload className="mb-2 h-8 w-8 text-drift-gray" />
                      <span className="mb-1 text-xs sm:text-sm font-medium text-graphite">Drag and drop or click to upload</span>
                      <span className="text-[10px] sm:text-xs text-drift-gray">PDF, Images, or Documents (max 10MB)</span>
                      <input type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
                    </label>
                  </div>
                ) : (
                <div className="rounded-lg border border-earth-beige bg-white p-3">
                    <div className="flex items-center">
                      {preview ? (
                        <img src={preview || "/placeholder.svg"} alt="Preview" className="mr-4 h-16 w-16 rounded-md object-cover" />
                      ) : (
                        <div className="mr-4 flex h-16 w-16 items-center justify-center rounded-md bg-pale-stone">
                          {getFileIcon()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-graphite truncate">{file.name}</p>
                        <p className="text-xs sm:text-sm text-drift-gray truncate">{(file.size / 1024).toFixed(1)} KB • {file.type}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null)
                          setPreview(null)
                        }}
                      className="rounded-lg border-2 border-earth-beige bg-white px-2 py-1 text-xs font-semibold text-graphite shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber transition-all disabled:opacity-50"
                        disabled={loading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-3.5">
              <div className="space-y-1.5">
                <label htmlFor="recordName" className="block text-xs sm:text-sm font-semibold text-graphite">Record Name</label>
                <input
                  type="text"
                  id="recordName"
                  value={recordName}
                  onChange={(e) => setRecordName(e.target.value)}
                  className={`w-full rounded-lg border border-earth-beige bg-white py-1.5 sm:py-2 px-3 text-xs sm:text-sm text-graphite placeholder:text-drift-gray/60 focus:outline-none focus:ring-1 transition-colors duration-200 hover:border-soft-amber/50 hover:shadow-sm ${theme.focusBorder} ${theme.focusRing}`}
                  placeholder="e.g., Blood Test Results"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="recordType" className="block text-xs sm:text-sm font-semibold text-graphite">Record Type</label>
                <input
                  id="recordType"
                  list="recordTypeOptions"
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value)}
                  className={`w-full rounded-lg border border-earth-beige bg-white py-1.5 sm:py-2 pl-3 pr-9 text-xs sm:text-sm text-graphite placeholder:text-drift-gray/60 focus:outline-none focus:ring-1 transition-colors duration-200 hover:border-soft-amber/50 hover:shadow-sm ${theme.focusBorder} ${theme.focusRing} appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e')] bg-no-repeat bg-right-2 bg-[length:14px_14px] cursor-text`}
                  style={{ backgroundPosition: 'right 8px center' }}
                  placeholder="Type or select a record type"
                  required
                  disabled={loading}
                />
                <datalist id="recordTypeOptions">
                  {recordTypes.map((type) => (
                    <option key={type} value={type} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:gap-2.5">
              <div className="space-y-1.5">
                <label htmlFor="recordDate" className="block text-xs sm:text-sm font-semibold text-graphite">Record Date</label>
                <input
                  type="date"
                  id="recordDate"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className={`w-full rounded-lg border border-earth-beige bg-white py-1.5 sm:py-2 px-3 text-xs sm:text-sm text-graphite focus:outline-none focus:ring-1 transition-all duration-300 ease-in-out hover:border-soft-amber/50 hover:shadow-sm ${theme.focusBorder} ${theme.focusRing} cursor-pointer`}
                  required
                  disabled={loading}
                  max={new Date().toISOString().split("T")[0]}
                  style={{ colorScheme: 'light' }}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="notes" className="block text-xs sm:text-sm font-semibold text-graphite">Notes (Optional)</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className={`w-full rounded-lg border border-earth-beige bg-white py-1.5 sm:py-2 px-3 text-xs sm:text-sm text-graphite placeholder:text-drift-gray/60 focus:outline-none focus:ring-1 transition-colors duration-200 hover:border-soft-amber/50 hover:shadow-sm ${theme.focusBorder} ${theme.focusRing}`}
                  placeholder="Add any additional notes about this record"
                  disabled={loading}
                />
              </div>
            </div>

            {loading && (
              <div className="rounded-lg border border-earth-beige bg-white p-3 shadow-sm">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-drift-gray">Uploading...</span>
                  <span className="text-soft-amber font-semibold">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-pale-stone rounded-full h-2 mt-2">
                  <div className="bg-soft-amber h-2 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>
            {/* Action Buttons - Always visible at bottom */}
            <div className="pt-1.5 sm:pt-2 md:pt-2 lg:pt-2.5 flex-shrink-0 border-t border-amber-200/30 mt-auto">
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
                  e.stopImmediatePropagation?.()
                }}
                disabled={loading || isClosing || isClosingRef.current}
                className="flex-1 sm:flex-none rounded-lg border-2 border-soft-amber/60 bg-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-soft-amber shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !file || !recordName || !recordType || !recordDate || isClosing || isClosingRef.current}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-soft-amber to-amber-500 shadow-lg hover:from-amber-500 hover:to-amber-600 hover:shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  <>
                    <FileCheck className="h-4 w-4" />
                    Upload Record
                  </>
                )}
              </button>
              </div>
            </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
