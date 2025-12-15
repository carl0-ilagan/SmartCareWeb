"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MessageSquare, Send, AlertCircle, Check } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { addDoctorNoteToRecord } from "@/lib/record-utils"

export function RecordNoteModal({ isOpen, onClose, record, onSuccess }) {
  const { user } = useAuth()
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const isClosingRef = useRef(false)
  const modalRef = useRef(null)

  // Theme (match PatientRecordModal / Appointment modal)
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

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsClosing(false)
    }
  }, [isOpen])

  // Handle closing with animation (same behavior as PatientRecordModal)
  const handleCloseWithAnimation = useCallback((e) => {
    if (isClosingRef.current || isClosing) {
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
    } catch (error) {
      console.error("Error calling onClose:", error)
      setIsClosing(false)
      isClosingRef.current = false
    }
    // Reset state after closing
    setNote("")
    setError("")
    setSuccess("")
  }, [onClose, isClosing])

  // Handle submitting a note
  const handleSubmitNote = async (e) => {
    e.preventDefault()

    if (!note.trim()) {
      setError("Please enter a note")
      return
    }

    if (!user || !record) {
      setError("Missing user or record information")
      return
    }

    try {
      setIsSubmitting(true)
      setError("")

      await addDoctorNoteToRecord(record.id, user.uid, user.displayName || "Doctor", note.trim())

      setSuccess("Note added successfully")
      setNote("")

      // Call the success callback if provided
      if (onSuccess && typeof onSuccess === "function") {
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        // Close modal after success if no callback
        setTimeout(() => {
          handleCloseWithAnimation()
        }, 2000)
      }
    } catch (error) {
      console.error("Error adding note:", error)
      setError(error.message || "Failed to add note. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen && !isVisible) return null

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-4 bg-black/60 backdrop-blur-xl ${isClosing ? "animate-fade-out" : "animate-fade-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""}`}
        onClick={(e) => {
          if (!isOpen || isClosing || isClosingRef.current || isSubmitting) {
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
          if (!isOpen || isClosing || isClosingRef.current || isSubmitting) {
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
            if (!isOpen || isClosing || isClosingRef.current || isSubmitting) {
              e.preventDefault()
              e.stopPropagation()
              return
            }
            e.stopPropagation()
            e.stopImmediatePropagation?.()
          }}
          onMouseDown={(e) => {
            if (!isOpen || isClosing || isClosingRef.current || isSubmitting) {
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

          {/* Header matching PatientRecordModal */}
          <div className={`${theme.headerBg} p-2 sm:p-2.5 md:p-3 lg:p-3 relative overflow-hidden flex-shrink-0`}>
            <div className="relative z-10 flex items-center gap-2 sm:gap-2.5">
              <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 items-center justify-center rounded-full ${theme.iconBg} flex-shrink-0`}>
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xs sm:text-sm md:text-base lg:text-base font-bold text-graphite">Add Medical Note</h2>
                {record && (
                  <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray mt-0.5 truncate">
                    {record.name || "Record"}
                  </p>
                )}
              </div>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full -ml-10 -mb-10"></div>
          </div>

          {/* Content */}
          <div className="p-2.5 sm:p-3 md:p-3.5 lg:p-4 overflow-hidden flex-1 min-h-0 flex flex-col">
            {error && (
              <div className="rounded-lg border border-red-200/50 bg-red-50/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm mb-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-xs md:text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-green-200/60 bg-green-50/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm mb-2">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-xs md:text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}

            {record && (
              <div className="rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm mb-2">
                <p className="text-xs sm:text-xs md:text-sm font-semibold text-graphite">{record.name}</p>
                <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray mt-0.5">
                  Type: {record.type} • Date: {record.date ? new Date(record.date).toLocaleDateString() : "N/A"}
                </p>
                <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray mt-0.5">
                  Patient: <span className="font-medium">{record.patientName || "Patient"}</span>
                </p>
              </div>
            )}

            <div className="rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2.5 sm:p-3 md:p-3 shadow-sm">
              <label htmlFor="note" className="block mb-2 text-xs sm:text-sm font-semibold text-graphite">
                Medical Note
              </label>
              <textarea
                id="note"
                rows={5}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter your medical observations or notes about this record..."
                className="w-full rounded-md border-2 border-amber-200 bg-white/90 py-2 px-3 text-graphite placeholder:text-drift-gray/70 focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/40"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Footer buttons match PatientRecordModal */}
          <div className="p-2 sm:p-2.5 md:p-3 lg:p-3 border-t border-amber-200/30 bg-white/50 backdrop-blur-sm flex-shrink-0">
            <form onSubmit={handleSubmitNote} className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-2.5">
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
                disabled={isClosing || isClosingRef.current}
                className="flex-1 sm:flex-none rounded-lg border-2 border-soft-amber/60 bg-white px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-soft-amber shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isClosing || isClosingRef.current}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg ${theme.buttonBg} px-3 py-1.5 sm:px-4 sm:py-2 md:px-4 md:py-2 text-xs sm:text-sm font-semibold text-white shadow-lg hover:shadow-xl ${theme.buttonHover} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Add Note
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
