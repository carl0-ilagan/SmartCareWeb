"use client"

import { useState, useEffect } from "react"
import { MessageSquare, User, Calendar, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { deleteDoctorNote } from "@/lib/record-utils"
import ProfileImage from "./profile-image"

export function DoctorNotesModal({ isOpen, onClose, record }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const notesPerPage = 3
  const { user, userRole } = useAuth()
  const [deletingKey, setDeletingKey] = useState("")

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsClosing(false)
    }
  }, [isOpen])

  // Handle closing with animation
  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsVisible(false)
    }, 300)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ""
    return new Date(dateString).toLocaleString()
  }

  // Filter notes: if doctor, only show their own notes; patient sees all
  const allNotes = record?.doctorNotes || []
  const visibleNotes = userRole === "doctor" && user?.uid
    ? allNotes.filter((n) => n.doctorId === user.uid)
    : allNotes

  // Calculate pagination
  const totalNotes = visibleNotes.length || 0
  const totalPages = Math.ceil(totalNotes / notesPerPage)
  const startIndex = (currentPage - 1) * notesPerPage
  const endIndex = Math.min(startIndex + notesPerPage, totalNotes)
  const currentNotes = visibleNotes.slice(startIndex, endIndex) || []

  // Handle pagination
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (!isOpen && !isVisible) return null

  return (
    <>
      {/* Backdrop with animation */}
      <div
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        } ${isClosing ? "opacity-0" : ""}`}
        onClick={handleClose}
      />

      {/* Modal with animation */}
      <div
        className={`fixed left-1/2 top-1/2 z-[110] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        } ${isClosing ? "opacity-0 scale-95" : ""}`}
      >
        <div className="bg-gradient-to-br from-soft-amber/10 to-yellow-50 p-3 relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-soft-amber/20 text-soft-amber">
              <MessageSquare className="h-4 w-4" />
            </div>
            <h2 className="text-sm md:text-base font-bold text-graphite">Doctor Notes</h2>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/20 rounded-full -ml-8 -mb-8" />
          {/* No X close button by request */}
        </div>
        {/* Close button removed for consistency; tap outside to close */}

        {record && (
          <div className="p-3 border-b border-amber-200/40">
            <p className="text-sm font-semibold text-graphite">{record.name}</p>
            <p className="text-xs text-drift-gray">Type: {record.type} • Date: {new Date(record.date).toLocaleDateString()}</p>
          </div>
        )}
        {totalNotes > 0 ? (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide p-4">
            {currentNotes.map((note, index) => (
              <div
                key={index}
                className="rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-3 shadow-sm hover:border-soft-amber/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start">
                  <div className="mr-3 flex-shrink-0">
                    <ProfileImage
                      userId={note.doctorId}
                      alt={note.doctorName || "Doctor"}
                      size="md"
                      role="doctor"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium text-graphite">{note.doctorName || "Doctor"}</p>
                      <div className="flex items-center text-xs text-drift-gray mt-1 sm:mt-0">
                        <Calendar className="mr-1 h-3 w-3" />
                        <span className="mr-2">{formatDate(note.createdAt)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-graphite text-sm leading-relaxed">{note.note}</p>
                  </div>
                  {userRole === "doctor" && user?.uid === note.doctorId && (
                    <button
                      className="ml-2 inline-flex items-center gap-1 rounded-md border border-red-200 text-red-600 px-2 py-1 text-xs hover:bg-red-50 disabled:opacity-50"
                      disabled={!!deletingKey}
                      onClick={async () => {
                        const key = note.doctorId + "|" + note.createdAt
                        setDeletingKey(key)
                        try {
                          await deleteDoctorNote(record.id, note.doctorId, note.createdAt)
                          // Optimistically remove from UI
                          const idx = (record.doctorNotes || []).findIndex((n) => n.doctorId === note.doctorId && n.createdAt === note.createdAt)
                          if (idx > -1) {
                            record.doctorNotes.splice(idx, 1)
                          }
                          // Adjust pagination if necessary
                          if ((currentPage - 1) * notesPerPage >= (record.doctorNotes || []).length && currentPage > 1) {
                            setCurrentPage(currentPage - 1)
                          }
                        } catch (e) {
                          console.error(e)
                        } finally {
                          setDeletingKey("")
                        }
                      }}
                      title="Delete your note"
                    >
                      {deletingKey ? (
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0A12 12 0 000 12h4z"></path></svg>
                      ) : (
                        <><Trash2 className="h-3.5 w-3.5" /><span>Delete</span></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-amber-200 pt-3 mt-2 px-4">
                <div className="text-xs text-drift-gray">
                  Showing {startIndex + 1}-{endIndex} of {totalNotes} notes
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className={`rounded-md p-1 ${
                      currentPage === 1
                        ? "text-drift-gray/40 cursor-not-allowed"
                        : "text-graphite hover:bg-amber-50 hover:text-soft-amber"
                    }`}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`rounded-md p-1 ${
                      currentPage === totalPages
                        ? "text-drift-gray/40 cursor-not-allowed"
                        : "text-graphite hover:bg-amber-50 hover:text-soft-amber"
                    }`}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <MessageSquare className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="mb-1 text-lg font-medium text-gray-800">No Notes Yet</h3>
            <p className="text-gray-500">There are no doctor notes for this record yet.</p>
          </div>
        )}
      </div>
    </>
  )
}
