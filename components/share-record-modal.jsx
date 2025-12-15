"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Search, UserPlus, Check, AlertCircle, Share2 } from "lucide-react"
import { getConnectedDoctorsForPatient, shareRecordWithDoctor, unshareRecordWithDoctor } from "@/lib/record-utils"
import { useAuth } from "@/contexts/auth-context"
import ProfileImage from "./profile-image"

export function ShareRecordModal({ isOpen, onClose, record }) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [doctors, setDoctors] = useState([])
  const [sharedDoctors, setSharedDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const isClosingRef = useRef(false)
  const modalRef = useRef(null)
  const [activeTab, setActiveTab] = useState("all") // "all" or "shared"

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
      // Reset state before closing
      setSearchTerm("")
      setError("")
      setSuccess("")
      onClose()
    } catch (error) {
      console.error("Error calling onClose:", error)
      setIsClosing(false)
      isClosingRef.current = false
    }
  }, [onClose, isClosing, isOpen])

  // Load doctors and shared doctors
  useEffect(() => {
    if (!isOpen || !record) return

    const loadData = async () => {
      try {
        setLoading(true)
        setError("")

        // Get connected doctors only (with appointment history)
        const connectedDoctors = await getConnectedDoctorsForPatient(user?.uid)
        setDoctors(connectedDoctors)

        // Get doctors this record is shared with
        // Check if the record has sharedWith property
        if (record.sharedWith && Array.isArray(record.sharedWith)) {
          // If the record already has the sharedWith array, use it to get doctor details
          const sharedDoctorIds = record.sharedWith
          const sharedDoctorsList = []

          for (const doctorId of sharedDoctorIds) {
            const doctorInfo = connectedDoctors.find((d) => d.id === doctorId)
            if (doctorInfo) {
              sharedDoctorsList.push(doctorInfo)
            }
          }

          setSharedDoctors(sharedDoctorsList)
        } else {
          // If no sharedWith property, set empty array
          setSharedDoctors([])
        }
      } catch (error) {
        console.error("Error loading doctors:", error)
        setError("Failed to load doctors. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isOpen, record])

  // Ensure actionable state resets on open
  useEffect(() => {
    if (isOpen) {
      setSharing(false)
    }
  }, [isOpen])

  // Handle sharing record with a doctor
  const handleShareRecord = async (doctorId, doctorName) => {
    try {
      setSharing(true)
      setError("")
      setSuccess("")

      // Check if already shared
      if (sharedDoctors.some((doctor) => doctor.id === doctorId)) {
        setError(`This record is already shared with Dr. ${doctorName}`)
        setSharing(false)
        return
      }

      // Share record
      await shareRecordWithDoctor(record.id, doctorId, user?.displayName || "Patient")

      // Update shared doctors list
      const doctorToAdd = doctors.find((d) => d.id === doctorId)
      if (doctorToAdd) {
        setSharedDoctors([...sharedDoctors, doctorToAdd])
      }

      setSuccess(`Record successfully shared with Dr. ${doctorName}`)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (error) {
      console.error("Error sharing record:", error)
      setError(error.message || "Failed to share record. Please try again.")
    } finally {
      setSharing(false)
    }
  }

  // Handle unsharing record with a doctor
  const handleUnshareRecord = async (doctorId, doctorName) => {
    try {
      setSharing(true)
      setError("")
      setSuccess("")

      // Unshare record
      await unshareRecordWithDoctor(record.id, doctorId)

      // Update shared doctors list
      const updatedSharedDoctors = sharedDoctors.filter((doctor) => doctor.id !== doctorId)
      setSharedDoctors(updatedSharedDoctors)

      setSuccess(`Record access revoked from Dr. ${doctorName}`)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("")
      }, 3000)
    } catch (error) {
      console.error("Error unsharing record:", error)
      setError("Failed to revoke access. Please try again.")
    } finally {
      setSharing(false)
    }
  }

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
                <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 lg:h-4 lg:w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xs sm:text-sm md:text-base lg:text-base font-bold text-graphite">
                  Share Medical Record
                </h2>
                {record && (
                  <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray mt-0.5 truncate">
                    {record.name || "Record"}
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
            {record && (
              <div className="mb-2 sm:mb-3 rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2 sm:p-2.5 md:p-3 shadow-sm">
                <p className="text-xs sm:text-sm md:text-base font-semibold text-graphite mb-1">{record.name}</p>
                <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray">
                  Type: {record.type} • Date: {new Date(record.date).toLocaleDateString()}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-2 sm:mb-3 rounded-lg border border-red-200/50 bg-red-50/80 backdrop-blur-sm p-2 sm:p-2.5 md:p-3 shadow-sm animate-fadeIn">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-xs md:text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-2 sm:mb-3 rounded-lg border border-green-200/50 bg-green-50/80 backdrop-blur-sm p-2 sm:p-2.5 md:p-3 shadow-sm animate-fadeIn">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-xs md:text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-amber-200/50 mb-2 sm:mb-3">
              <button
                className={`px-3 py-1.5 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm transition-colors ${
                  activeTab === "all"
                    ? "text-soft-amber border-b-2 border-soft-amber"
                    : "text-drift-gray hover:text-graphite"
                }`}
                onClick={() => setActiveTab("all")}
              >
                All Doctors
              </button>
              <button
                className={`px-3 py-1.5 sm:px-4 sm:py-2 font-semibold text-xs sm:text-sm transition-colors ${
                  activeTab === "shared"
                    ? "text-soft-amber border-b-2 border-soft-amber"
                    : "text-drift-gray hover:text-graphite"
                }`}
                onClick={() => setActiveTab("shared")}
              >
                Shared With ({sharedDoctors.length})
              </button>
            </div>

            {/* Search (only show in All Doctors tab) */}
            {activeTab === "all" && (
              <div className="relative mb-2 sm:mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray" />
                <input
                  type="text"
                  placeholder="Search doctors by name or specialty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 bg-white py-1.5 sm:py-2 pl-10 pr-3 text-xs sm:text-sm text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber transition-all shadow-sm hover:shadow-md"
                />
              </div>
            )}

            {/* Doctor List */}
            <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
              <div className="flex-1 overflow-y-auto scrollbar-hide pr-1">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-soft-amber mb-2"></div>
                      <p className="text-xs sm:text-sm text-drift-gray">Loading doctors...</p>
                    </div>
                  </div>
                ) : activeTab === "all" ? (
                  // All Doctors Tab
                  filteredDoctors.length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {filteredDoctors.map((doctor) => {
                        const isShared = sharedDoctors.some((d) => d.id === doctor.id)
                        return (
                          <div
                            key={doctor.id}
                            className="flex items-center justify-between rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2 sm:p-2.5 md:p-3 shadow-sm hover:border-soft-amber/50 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <div className="flex-shrink-0 mr-2 sm:mr-3">
                                <ProfileImage
                                  userId={doctor.id}
                                  alt={doctor.name || "Doctor"}
                                  size="sm"
                                  className="sm:hidden"
                                  role="doctor"
                                />
                                <ProfileImage
                                  userId={doctor.id}
                                  alt={doctor.name || "Doctor"}
                                  size="md"
                                  className="hidden sm:block"
                                  role="doctor"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm md:text-base font-semibold text-graphite truncate">{doctor.name}</p>
                                <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray truncate">
                                  {doctor.specialty ? doctor.specialty : doctor.email}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                isShared
                                  ? handleUnshareRecord(doctor.id, doctor.name)
                                  : handleShareRecord(doctor.id, doctor.name)
                              }
                              disabled={sharing}
                              className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold transition-all shadow-sm hover:shadow-md relative overflow-hidden ${
                                isShared
                                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300"
                                  : `${theme.buttonBg} text-white ${theme.buttonHover}`
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {sharing ? (
                                <span className="inline-flex items-center gap-2"><svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0A12 12 0 000 12h4z"></path></svg>{isShared ? 'Revoking...' : 'Sharing...'}</span>
                              ) : isShared ? (
                                <span className="whitespace-nowrap">Revoke</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                  <UserPlus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                  <span className="hidden sm:inline">Share</span>
                                </span>
                              )}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-drift-gray">
                      <p className="text-xs sm:text-sm">{searchTerm ? "No doctors match your search" : "No doctors found"}</p>
                    </div>
                  )
                ) : // Shared With Tab
                sharedDoctors.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {sharedDoctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className="flex items-center justify-between rounded-lg border border-amber-200/50 bg-white/80 backdrop-blur-sm p-2 sm:p-2.5 md:p-3 shadow-sm hover:border-soft-amber/50 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex-shrink-0 mr-2 sm:mr-3">
                            <ProfileImage
                              userId={doctor.id}
                              alt={doctor.name || "Doctor"}
                              size="sm"
                              className="sm:hidden"
                              role="doctor"
                            />
                            <ProfileImage
                              userId={doctor.id}
                              alt={doctor.name || "Doctor"}
                              size="md"
                              className="hidden sm:block"
                              role="doctor"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm md:text-base font-semibold text-graphite truncate">{doctor.name}</p>
                            <p className="text-[10px] sm:text-xs md:text-sm text-drift-gray truncate">
                              {doctor.specialty ? doctor.specialty : doctor.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnshareRecord(doctor.id, doctor.name)}
                          disabled={sharing}
                          className="flex-shrink-0 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          Revoke
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-drift-gray">
                    <p className="text-xs sm:text-sm">You haven't shared this record with any doctors yet</p>
                  </div>
                )}
              </div>
            </div>
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
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
