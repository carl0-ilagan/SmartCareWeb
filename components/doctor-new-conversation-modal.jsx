"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Loader2, MessageSquare, ArrowLeft } from "lucide-react"
import { getAvailablePatients, createConversation, checkExistingConversation } from "@/lib/message-utils"
import { useAuth } from "@/contexts/auth-context"
import { useMobile } from "@/hooks/use-mobile"
import ProfileImage from "./profile-image"

export default function DoctorNewConversationModal({ isOpen, onClose, onConversationCreated }) {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [message, setMessage] = useState("")
  const [creating, setCreating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const modalRef = useRef(null)
  const isMobile = useMobile()
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      loadPatients()
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  const handleClose = () => {
    if (creating) return // Prevent closing while creating
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      setSelectedPatient(null)
      setMessage("")
      setSearchTerm("")
    }, 300)
  }

  const loadPatients = async () => {
    try {
      setLoading(true)
      const patientsList = await getAvailablePatients()
      setPatients(patientsList)
    } catch (error) {
      console.error("Error loading patients:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter((patient) =>
    patient.displayName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient)
  }

  const handleCreateConversation = async () => {
    if (!selectedPatient || !message.trim() || !user) return

    try {
      setCreating(true)

      // Check if conversation already exists
      const existingConvoId = await checkExistingConversation([user.uid, selectedPatient.id])

      if (existingConvoId) {
        onConversationCreated(existingConvoId)
        onClose()
        return
      }

      // Create new conversation
      const conversationId = await createConversation([user.uid, selectedPatient.id], message)

      onConversationCreated(conversationId)
      onClose()
    } catch (error) {
      console.error("Error creating conversation:", error)
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen && !isClosing) return null

  return (
    <>
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
            transform: scale(0.95) translateY(-10px);
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
            transform: scale(0.95) translateY(10px);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-fade-out {
          animation: fadeOut 0.3s ease-out;
        }
        .animate-modal-in {
          animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-modal-out {
          animation: modalOut 0.3s ease-in;
        }
      `}</style>

      <div
        className={`fixed inset-0 z-50 ${isMobile ? '' : 'flex items-center justify-center'} p-4 bg-black/60 backdrop-blur-sm ${
          isClosing ? "animate-fade-out" : "animate-fade-in"
        }`}
        onClick={handleClose}
      >
        <div
          ref={modalRef}
          className={`fixed z-50 ${isMobile ? 'inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-3xl' : 'left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl'} bg-white shadow-2xl overflow-hidden flex flex-col ${
            isMobile ? (isClosing ? '' : 'animate-slide-up') : (isClosing ? "animate-modal-out" : "animate-modal-in")
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle - Mobile only */}
          {isMobile && (
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-12 h-1.5 bg-drift-gray/30 rounded-full"></div>
            </div>
          )}

          {/* Header with gradient */}
          <div className={`${isMobile ? 'bg-white border-b border-pale-stone px-4 py-4' : 'bg-gradient-to-br from-soft-amber/10 to-yellow-50 border-b border-amber-200/50 p-6'} flex-shrink-0`}>
            <div className="flex items-center gap-3">
              {!isMobile && (
                <div className="rounded-xl bg-gradient-to-br from-soft-amber to-amber-500 p-2.5 shadow-lg">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
              )}
              <h2 className={`${isMobile ? 'text-xl' : 'text-xl sm:text-2xl'} font-bold text-graphite`}>New Conversation</h2>
            </div>
        </div>

          {/* Content */}
          <div className={`flex-1 overflow-y-auto ${isMobile ? 'bg-pale-stone/30' : 'bg-white'} ${isMobile ? 'px-4 py-4' : 'p-6'} scrollbar-hide`}>
        {selectedPatient ? (
          // Step 2: Write first message
          <div>
            <div className="flex items-center mb-4 pb-4 border-b border-pale-stone">
              <button
                onClick={() => setSelectedPatient(null)}
                className="mr-3 p-1.5 rounded-full hover:bg-pale-stone transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-drift-gray" />
              </button>
              <div className="mr-3 h-12 w-12 overflow-hidden rounded-full ring-2 ring-soft-amber/20">
                <ProfileImage
                  src={selectedPatient.photoURL}
                  alt={selectedPatient.displayName || "Patient"}
                  className="h-full w-full"
                  role="patient"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-graphite">{selectedPatient.displayName}</h3>
                {selectedPatient.dob && (
                  <p className="text-sm text-drift-gray">Age: {calculateAge(selectedPatient.dob)}</p>
                )}
                {selectedPatient.isOnline && (
                  <span className="inline-flex items-center text-xs text-green-600 mt-1">
                    <span className="mr-1 h-2 w-2 rounded-full bg-green-600"></span>
                    Online
                  </span>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-graphite mb-2">
                First Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message..."
                className="w-full rounded-lg border border-earth-beige bg-white py-3 px-4 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 min-h-[120px] resize-none transition-all"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={creating}
                className="px-5 py-2.5 rounded-lg border border-earth-beige bg-white text-graphite text-sm font-medium transition-all duration-200 hover:bg-pale-stone hover:border-soft-amber disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConversation}
                disabled={!message.trim() || creating}
                className="px-5 py-2.5 rounded-lg bg-soft-amber text-white text-sm font-medium transition-all duration-200 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4" />
                    <span>Start Conversation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          // Step 1: Select a patient
          <div>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-drift-gray" />
              <input
                type="text"
                placeholder="Search patients by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-earth-beige bg-white py-2.5 pl-11 pr-4 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-2 focus:ring-soft-amber/20 transition-all"
              />
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-soft-amber" />
                </div>
              ) : filteredPatients.length > 0 ? (
                <ul className="divide-y divide-pale-stone">
                  {filteredPatients.map((patient) => (
                    <li key={patient.id}>
                      <button
                        onClick={() => handleSelectPatient(patient)}
                        className="flex w-full items-center gap-3 p-3 text-left transition-all duration-150 hover:bg-pale-stone/50 rounded-lg"
                      >
                        <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-soft-amber/20 flex-shrink-0">
                          <ProfileImage
                            src={patient.photoURL}
                            alt={patient.displayName || "Patient"}
                            className="h-full w-full"
                            role="patient"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-graphite truncate">{patient.displayName}</p>
                          {patient.dob && <p className="text-xs text-drift-gray">Age: {calculateAge(patient.dob)}</p>}
                          {patient.isOnline && (
                            <span className="inline-flex items-center text-xs text-green-600 mt-1">
                              <span className="mr-1 h-2 w-2 rounded-full bg-green-600"></span>
                              Online
                            </span>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-drift-gray mb-1">
                  {searchTerm ? "No patients found matching your search" : "No patients available"}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="text-sm text-soft-amber hover:underline mt-2"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </>
  )
}

// Helper function to calculate age from date of birth
function calculateAge(dob) {
  if (!dob) return "N/A"

  const birthDate = new Date(dob)
  const today = new Date()

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}
