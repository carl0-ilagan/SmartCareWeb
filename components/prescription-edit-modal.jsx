"use client"

import { useEffect, useState } from "react"
import { Calendar, X } from "lucide-react"

export function PrescriptionEditModal({ isOpen, onClose, prescription, onSave, onDelete }) {
  const [isVisible, setIsVisible] = useState(false)
  const [formData, setFormData] = useState({
    medication: "",
    dosage: "",
    frequency: "",
    startDate: "",
    endDate: "",
    notes: "",
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      if (prescription) {
        setFormData({
          medication: prescription.medication || "",
          dosage: prescription.dosage || "",
          frequency: prescription.frequency || "",
          startDate: prescription.startDate || "",
          endDate: prescription.endDate || "",
          notes: prescription.notes || "",
        })
      }
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setShowDeleteConfirm(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, prescription])

  if (!isOpen && !isVisible) return null

  // Handle closing with animation
  const handleClose = () => {
    const backdrop = document.getElementById("prescription-edit-modal-backdrop")
    const modalContent = document.getElementById("prescription-edit-modal-content")

    if (backdrop) backdrop.style.animation = "fadeOut 0.3s ease-in-out forwards"
    if (modalContent) modalContent.style.animation = "scaleOut 0.3s ease-in-out forwards"

    setTimeout(() => {
      onClose()
    }, 280)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ ...prescription, ...formData })
    handleClose()
  }

  const handleDelete = () => {
    onDelete(prescription.id)
    handleClose()
  }

  return (
    <>
      {/* Backdrop with animation */}
      <div
        id="prescription-edit-modal-backdrop"
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={handleClose}
        style={{ animation: "fadeIn 0.3s ease-in-out" }}
      />

      {/* Modal with animation */}
      <div
        id="prescription-edit-modal-content"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg"
        style={{ animation: "scaleIn 0.3s ease-in-out" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-graphite">
            {showDeleteConfirm ? "Confirm Deletion" : "Edit Prescription"}
          </h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-drift-gray transition-colors duration-200 hover:bg-pale-stone hover:text-soft-amber"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {showDeleteConfirm ? (
          <div className="mt-4">
            <p className="mb-4 text-graphite">
              Are you sure you want to delete this prescription for {prescription?.medication}? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md border border-earth-beige bg-white px-4 py-2 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="medication" className="block text-sm font-medium text-graphite">
                Medication
              </label>
              <input
                type="text"
                id="medication"
                name="medication"
                value={formData.medication}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border border-earth-beige p-2 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dosage" className="block text-sm font-medium text-graphite">
                  Dosage
                </label>
                <input
                  type="text"
                  id="dosage"
                  name="dosage"
                  value={formData.dosage}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border border-earth-beige p-2 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                />
              </div>
              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-graphite">
                  Frequency
                </label>
                <input
                  type="text"
                  id="frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border border-earth-beige p-2 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-graphite">
                  Start Date
                </label>
                <div className="relative mt-1">
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-md border border-earth-beige p-2 pl-10 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                  />
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray" />
                </div>
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-graphite">
                  End Date
                </label>
                <div className="relative mt-1">
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate || ""}
                    onChange={handleInputChange}
                    className="block w-full rounded-md border border-earth-beige p-2 pl-10 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                  />
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-drift-gray" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-graphite">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="mt-1 block w-full rounded-md border border-earth-beige p-2 text-graphite focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              />
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-200"
              >
                Delete
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md border border-earth-beige bg-white px-4 py-2 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-soft-amber px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  )
}
