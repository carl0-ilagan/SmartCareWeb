"use client"

import { useState, useEffect } from "react"
import { X, Edit, Check, Printer } from "lucide-react"
import { calculateAge, formatDate } from "@/lib/prescription-utils"
import { SignaturePad } from "./signature-pad"
import { generatePrescriptionPDF } from "@/lib/pdf-utils"

export function PrescriptionTemplate({
  isOpen,
  onClose,
  prescription,
  doctorInfo,
  patientInfo,
  onSave,
  onPrint,
  isEditable = false,
  showSignature = false,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [template, setTemplate] = useState({
    medications: [],
    signature: null,
  })
  const [showPreview, setShowPreview] = useState(false)

  // Calculate patient age
  const patientAge = patientInfo?.dateOfBirth ? calculateAge(patientInfo.dateOfBirth) : patientInfo?.age || ""

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setIsEditing(false)
      }, 300)
      return () => clearTimeout(timer)
    }

    // Always update template when prescription changes
    if (prescription) {
      setTemplate({
        ...prescription,
        medications: prescription.medications || [
          {
            name: "",
            dosage: "",
            frequency: "",
            duration: "",
            instructions: "",
          },
        ],
        signature: prescription.signature || null,
      })
    }
  }, [isOpen, prescription])

  if (!isOpen && !isVisible && !showPreview) return null

  // Handle closing with animation
  const handleClose = () => {
    if (!isOpen) return

    const backdrop = document.getElementById("prescription-template-backdrop")
    const modalContent = document.getElementById("prescription-template-content")

    if (backdrop) backdrop.style.animation = "fadeOut 0.3s ease-in-out forwards"
    if (modalContent) modalContent.style.animation = "scaleOut 0.3s ease-in-out forwards"

    setTimeout(() => {
      onClose()
    }, 280)
  }

  const handleSaveTemplate = () => {
    onSave(template)
    setIsEditing(false)
  }

  const handlePrint = () => {
    generatePrescriptionPDF({
      doctorInfo,
      patientInfo,
      prescription: template,
    })
  }

  const handleAddMedication = () => {
    setTemplate({
      ...template,
      medications: [
        ...template.medications,
        {
          name: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
        },
      ],
    })
  }

  const handleRemoveMedication = (index) => {
    const updatedMedications = [...template.medications]
    updatedMedications.splice(index, 1)
    setTemplate({
      ...template,
      medications: updatedMedications,
    })
  }

  const handleMedicationChange = (index, field, value) => {
    const updatedMedications = [...template.medications]
    updatedMedications[index] = {
      ...updatedMedications[index],
      [field]: value,
    }
    setTemplate({
      ...template,
      medications: updatedMedications,
    })
  }

  const handleSignatureChange = (signatureData) => {
    setTemplate({
      ...template,
      signature: signatureData,
    })
  }

  const togglePreview = () => {
    setShowPreview(!showPreview)
  }

  // Render the preview-only version
  if (showPreview) {
    return (
      <div className="w-full">
        <div className="mb-4 flex justify-end">
          <button
            onClick={togglePreview}
            className="rounded-md border border-earth-beige bg-white px-3 py-1 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone"
          >
            Hide Preview
          </button>
        </div>

        <div className="mb-6 overflow-hidden rounded-lg border border-earth-beige bg-white shadow-sm">
          <div className="p-6">
            <div className="relative border-b border-gray-300 pb-4 text-center">
              <div className="absolute left-0 top-0 text-2xl font-bold italic text-soft-amber">Rx</div>
              <div className="doctor-info">
                <div className="text-lg font-bold">Dr. {doctorInfo?.name || "Doctor Name"}</div>
                <div className="text-sm">
                  {doctorInfo?.specialty || "Specialty"} | PRC #{doctorInfo?.licenseNumber || "License"}
                </div>
                <div className="text-sm">{doctorInfo?.clinicAddress || "Clinic Address"}</div>
                <div className="text-sm">Contact No.: {doctorInfo?.contactNumber || "Contact Number"}</div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div>Date: {formatDate(new Date())}</div>
              <div>Patient Name: {patientInfo?.name || "_______________________"}</div>
              <div>
                Age: {patientAge || "____"} &nbsp;&nbsp; Sex: {patientInfo?.gender || "____"}
              </div>
            </div>

            <div className="mt-6">
              <div className="text-lg font-bold text-soft-amber">Rx:</div>

              <div className="mt-2 space-y-4">
                {prescription.medications && prescription.medications.length > 0 ? (
                  prescription.medications.map((med, index) => (
                    <div key={index} className="ml-4">
                      <div>
                        <span className="font-bold">{index + 1}.</span> {med.name || "(No medication name)"}
                      </div>
                      <div className="ml-4">
                        {med.dosage || "(No dosage)"}, {med.frequency || "(No frequency)"},{" "}
                        {med.duration || "(No duration)"}
                      </div>
                      {med.instructions && <div className="ml-4 italic text-drift-gray">({med.instructions})</div>}
                    </div>
                  ))
                ) : (
                  <div className="ml-4 text-drift-gray italic">(No medications added yet)</div>
                )}
              </div>
            </div>

            <div className="mt-10 space-y-1 pt-10">
              {prescription.signature ? (
                <div className="mb-2">
                  <img
                    src={prescription.signature || "/placeholder.svg"}
                    alt="Doctor's Signature"
                    className="max-h-20"
                  />
                </div>
              ) : (
                <div className="mb-4 border-b border-gray-400 w-48"></div>
              )}
              <div>Dr. {doctorInfo?.name || "Doctor Name"}</div>
              <div>License No.: PRC {doctorInfo?.licenseNumber || "License Number"}</div>
              <div>PTR No.: {doctorInfo?.ptrNumber || "PTR Number"}</div>
              <div>S2 No.: {doctorInfo?.s2Number || "S2 Number"}</div>
            </div>

            <div className="mt-8 border-t border-gray-300 pt-2 text-center text-xs text-gray-500">
              This prescription is electronically generated via Smart Care Health System
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render the modal version
  return (
    <>
      {/* Backdrop with animation */}
      <div
        id="prescription-template-backdrop"
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={handleClose}
        style={{ animation: "fadeIn 0.3s ease-in-out" }}
      />

      {/* Modal with animation */}
      <div
        id="prescription-template-content"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-lg"
        style={{ animation: "scaleIn 0.3s ease-in-out" }}
      >
        <div className="flex items-center justify-between border-b border-pale-stone p-4">
          <h2 className="text-xl font-semibold text-graphite">
            {isEditing ? "Edit Prescription Template" : "Prescription Preview"}
          </h2>
          <div className="flex space-x-2">
            {isEditable && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="rounded-full p-2 text-drift-gray transition-colors hover:bg-pale-stone hover:text-soft-amber"
              >
                <Edit className="h-5 w-5" />
                <span className="sr-only">Edit</span>
              </button>
            )}
            {isEditing ? (
              <button
                onClick={handleSaveTemplate}
                className="rounded-full p-2 text-drift-gray transition-colors hover:bg-pale-stone hover:text-soft-amber"
              >
                <Check className="h-5 w-5" />
                <span className="sr-only">Save</span>
              </button>
            ) : (
              <button
                onClick={handlePrint}
                className="rounded-full p-2 text-drift-gray transition-colors hover:bg-pale-stone hover:text-soft-amber"
              >
                <Printer className="h-5 w-5" />
                <span className="sr-only">Print</span>
              </button>
            )}
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-drift-gray transition-colors hover:bg-pale-stone hover:text-soft-amber"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {/* Prescription Template */}
          <div className="mx-auto w-full max-w-xl rounded-lg border border-pale-stone bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="relative border-b border-pale-stone pb-4 text-center">
              <div className="absolute left-0 top-0 text-3xl font-bold italic text-soft-amber">Rx</div>
              <h3 className="text-lg font-bold text-graphite">Dr. {doctorInfo?.name || "Doctor Name"}</h3>
              <p className="text-sm text-drift-gray">
                {doctorInfo?.specialty || "Specialty"} | PRC #{doctorInfo?.licenseNumber || "License"}
              </p>
              <p className="text-sm text-drift-gray">{doctorInfo?.clinicAddress || "Clinic Address"}</p>
              <p className="text-sm text-drift-gray">{doctorInfo?.contactNumber || "Contact Number"}</p>
            </div>

            {/* Date */}
            <div className="mt-4 text-sm text-graphite">
              <p>Date: {formatDate(new Date())}</p>
            </div>

            {/* Patient Info */}
            <div className="mt-4 space-y-2 text-sm text-graphite">
              <p>Patient Name: {patientInfo?.name || "_______________________"}</p>
              <p>
                Age: {patientAge || "____"} &nbsp;&nbsp; Sex: {patientInfo?.gender || "____"}
              </p>
            </div>

            {/* Medications */}
            <div className="mt-6">
              <h4 className="mb-2 text-base font-semibold text-graphite">Rx:</h4>

              {isEditing ? (
                <div className="space-y-4">
                  {template.medications.map((med, index) => (
                    <div key={index} className="rounded-lg border border-pale-stone p-3">
                      <div className="flex justify-between">
                        <h5 className="mb-2 font-medium text-graphite">Medication {index + 1}</h5>
                        {template.medications.length > 1 && (
                          <button
                            onClick={() => handleRemoveMedication(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-xs text-drift-gray">Medication Name</label>
                          <input
                            type="text"
                            value={med.name || ""}
                            onChange={(e) => handleMedicationChange(index, "name", e.target.value)}
                            className="w-full rounded-md border border-earth-beige p-2 text-sm text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                            placeholder="Medication name"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="mb-1 block text-xs text-drift-gray">Dosage</label>
                            <input
                              type="text"
                              value={med.dosage || ""}
                              onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                              className="w-full rounded-md border border-earth-beige p-2 text-sm text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                              placeholder="e.g., 500mg"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-drift-gray">Frequency</label>
                            <input
                              type="text"
                              value={med.frequency || ""}
                              onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)}
                              className="w-full rounded-md border border-earth-beige p-2 text-sm text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                              placeholder="e.g., 3x daily"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-drift-gray">Duration</label>
                            <input
                              type="text"
                              value={med.duration || ""}
                              onChange={(e) => handleMedicationChange(index, "duration", e.target.value)}
                              className="w-full rounded-md border border-earth-beige p-2 text-sm text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                              placeholder="e.g., 7 days"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-drift-gray">Special Instructions</label>
                          <input
                            type="text"
                            value={med.instructions || ""}
                            onChange={(e) => handleMedicationChange(index, "instructions", e.target.value)}
                            className="w-full rounded-md border border-earth-beige p-2 text-sm text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                            placeholder="Special instructions"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleAddMedication}
                    className="mt-2 w-full rounded-md border border-dashed border-earth-beige p-2 text-sm text-drift-gray hover:border-soft-amber hover:text-soft-amber"
                  >
                    + Add Another Medication
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {template.medications.map((med, index) => (
                    <div key={index} className="ml-4 space-y-1">
                      <p className="text-sm text-graphite">
                        {index + 1}. {med.name || "__________________________________________"}
                      </p>
                      <p className="ml-4 text-sm text-graphite">
                        {med.dosage ? `${med.dosage}, ` : ""}
                        {med.frequency ? `${med.frequency}, ` : ""}
                        {med.duration || "__________________________________________"}
                      </p>
                      {med.instructions && <p className="ml-4 text-sm italic text-drift-gray">({med.instructions})</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Signature */}
            <div className="mt-8 border-t border-pale-stone pt-4 text-sm text-graphite">
              {showSignature && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-graphite">Doctor's Signature</label>
                  <SignaturePad onChange={handleSignatureChange} initialSignature={template.signature} />
                </div>
              )}

              {!showSignature && (
                <>
                  {template.signature ? (
                    <div className="mb-2">
                      <img
                        src={template.signature || "/placeholder.svg"}
                        alt="Doctor's Signature"
                        className="max-h-20"
                      />
                    </div>
                  ) : (
                    <p className="mb-4">Signature: _______________________</p>
                  )}
                </>
              )}

              <p>License No.: PRC {doctorInfo?.licenseNumber || "License Number"}</p>
              <p>PTR No.: {doctorInfo?.ptrNumber || "PTR Number"}</p>
              <p>S2 No.: {doctorInfo?.s2Number || "S2 Number"}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 border-t border-pale-stone p-4">
          <button
            onClick={handleClose}
            className="rounded-md border border-earth-beige bg-white px-4 py-2 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone"
          >
            Cancel
          </button>
          {isEditing ? (
            <button
              onClick={handleSaveTemplate}
              className="rounded-md bg-soft-amber px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
            >
              Save Template
            </button>
          ) : (
            <button
              onClick={handlePrint}
              className="rounded-md bg-soft-amber px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
            >
              Print Prescription
            </button>
          )}
        </div>
      </div>
    </>
  )
}
