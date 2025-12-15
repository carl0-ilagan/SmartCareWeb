"use client"

import { useEffect, useState } from "react"
import { Download, User, X, AlertCircle } from "lucide-react"

export function PrescriptionDetailModal({ isOpen, onClose, prescription, onDownload }) {
  const [isVisible, setIsVisible] = useState(false)
  const [doctorInfo, setDoctorInfo] = useState(null)
  const [patientInfo, setPatientInfo] = useState(null)
  const [isExpired, setIsExpired] = useState(false)

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)

      // If we have doctor and patient IDs, fetch their information
      if (prescription) {
        fetchDoctorAndPatientInfo(prescription)
        checkPrescriptionExpiration(prescription)
      }
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, prescription])

  // Check if prescription is expired
  const checkPrescriptionExpiration = (prescription) => {
    if (!prescription) return

    // Check if prescription has an end date and if it's in the past
    if (prescription.endDate) {
      const endDate = new Date(prescription.endDate)
      const today = new Date()
      setIsExpired(endDate < today || prescription.status === "expired" || prescription.status === "inactive")
    } else if (prescription.status === "expired" || prescription.status === "inactive") {
      setIsExpired(true)
    } else {
      setIsExpired(false)
    }
  }

  // Fetch doctor and patient information
  const fetchDoctorAndPatientInfo = async (prescription) => {
    if (!prescription) return

    try {
      const { getUserProfile } = await import("@/lib/firebase-utils")

      // Fetch doctor info if we have doctorId
      if (prescription.doctorId) {
        const doctorData = await getUserProfile(prescription.doctorId)
        if (doctorData) {
          setDoctorInfo({
            name: doctorData.displayName || prescription.doctorName || "Doctor",
            specialty: doctorData.specialty || "General Practitioner",
            licenseNumber: doctorData.licenseNumber || "License",
            clinicAddress: doctorData.officeAddress || "Clinic Address",
            contactNumber: doctorData.phone || doctorData.contactNumber || "Contact Number",
            ptrNumber: doctorData.ptrNumber || "PTR Number",
            s2Number: doctorData.s2Number || "S2 Number",
          })
        }
      }

      // Fetch patient info if we have patientId
      if (prescription.patientId) {
        const patientData = await getUserProfile(prescription.patientId)
        if (patientData) {
          setPatientInfo({
            name: patientData.displayName || prescription.patientName || "Patient",
            age: patientData.age || calculateAge(patientData.dateOfBirth || patientData.dob) || "N/A",
            gender: patientData.gender || "Not specified",
            dateOfBirth: patientData.dateOfBirth || patientData.dob,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching user information:", error)
    }
  }

  // Calculate age from birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) return null

    try {
      const today = new Date()
      const birthDate = new Date(birthdate)

      // Check if the date is valid
      if (isNaN(birthDate.getTime())) return null

      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDifference = today.getMonth() - birthDate.getMonth()

      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      return age.toString()
    } catch (error) {
      console.error("Error calculating age:", error)
      return null
    }
  }

  if (!isOpen && !isVisible) return null

  // Handle closing with animation
  const handleClose = () => {
    const backdrop = document.getElementById("prescription-detail-modal-backdrop")
    const modalContent = document.getElementById("prescription-detail-modal-content")

    if (backdrop) backdrop.style.animation = "fadeOut 0.3s ease-in-out forwards"
    if (modalContent) modalContent.style.animation = "scaleOut 0.3s ease-in-out forwards"

    setTimeout(() => {
      onClose()
    }, 280)
  }

  if (!prescription) return null

  // Update the handleDownload function in the component
  const handleDownload = () => {
    if (onDownload && !isExpired) {
      onDownload(prescription)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  return (
    <>
      {/* Backdrop with animation */}
      <div
        id="prescription-detail-modal-backdrop"
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={handleClose}
        style={{ animation: "fadeIn 0.3s ease-in-out" }}
      />

      {/* Modal with animation */}
      <div
        id="prescription-detail-modal-content"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg"
        style={{ animation: "scaleIn 0.3s ease-in-out" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-graphite">Prescription Details</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-drift-gray transition-colors duration-200 hover:bg-pale-stone hover:text-soft-amber"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {isExpired && (
          <div className="mt-4 rounded-md bg-amber-50 p-2 border border-amber-200">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
              <p className="text-sm text-amber-700">This prescription has expired and is no longer valid for use.</p>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-pale-stone">
              <User className="h-full w-full p-2 text-drift-gray" />
            </div>
            <div>
              <p className="font-medium text-graphite">
                {patientInfo?.name || prescription.patient || prescription.patientName || "Patient"}
              </p>
              <p className="text-sm text-drift-gray">
                Age: {patientInfo?.age || prescription.patientAge || "N/A"} | Gender:{" "}
                {patientInfo?.gender || prescription.patientGender || "Not specified"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-pale-stone bg-pale-stone/30 p-4">
            {prescription.medications && prescription.medications.length > 0 ? (
              <div className="space-y-4">
                {prescription.medications.map((med, index) => (
                  <div key={index} className="border-b border-pale-stone pb-3 last:border-0 last:pb-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-drift-gray">Medication</p>
                        <p className="font-medium text-graphite">{med.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-drift-gray">Dosage</p>
                        <p className="font-medium text-graphite">{med.dosage}</p>
                      </div>
                      <div>
                        <p className="text-sm text-drift-gray">Frequency</p>
                        <p className="font-medium text-graphite">{med.frequency}</p>
                      </div>
                      <div>
                        <p className="text-sm text-drift-gray">Duration</p>
                        <p className="font-medium text-graphite">{med.duration}</p>
                      </div>
                    </div>
                    {med.instructions && (
                      <div className="mt-2">
                        <p className="text-sm text-drift-gray">Instructions</p>
                        <p className="text-graphite">{med.instructions}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-drift-gray">Medication</p>
                  <p className="font-medium text-graphite">{prescription.medication}</p>
                </div>
                <div>
                  <p className="text-sm text-drift-gray">Dosage</p>
                  <p className="font-medium text-graphite">{prescription.dosage}</p>
                </div>
                <div>
                  <p className="text-sm text-drift-gray">Frequency</p>
                  <p className="font-medium text-graphite">{prescription.frequency}</p>
                </div>
                <div>
                  <p className="text-sm text-drift-gray">Status</p>
                  <p className={`font-medium capitalize ${isExpired ? "text-amber-600" : "text-green-600"}`}>
                    {isExpired ? "Expired" : prescription.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-drift-gray">Start Date</p>
                  <p className="font-medium text-graphite">
                    {prescription.startDate ? formatDate(prescription.startDate) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-drift-gray">End Date</p>
                  <p className="font-medium text-graphite">
                    {prescription.endDate ? formatDate(prescription.endDate) : "No end date"}
                  </p>
                </div>
              </div>
            )}

            {prescription.notes && (
              <div className="mt-4">
                <p className="text-sm text-drift-gray">Notes</p>
                <p className="text-graphite">{prescription.notes}</p>
              </div>
            )}

            {prescription.signature && (
              <div className="mt-4">
                <p className="text-sm text-drift-gray">Doctor's Signature</p>
                <img
                  src={prescription.signature || "/placeholder.svg"}
                  alt="Doctor's Signature"
                  className="mt-1 max-h-16"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleDownload}
              disabled={isExpired}
              className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isExpired
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-soft-amber text-white hover:bg-amber-600"
              }`}
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
