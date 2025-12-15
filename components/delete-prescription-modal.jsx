"use client"

import { useState, useEffect } from "react"
import { X, AlertTriangle } from "lucide-react"

export function DeletePrescriptionModal({ isOpen, onClose, prescription, onDelete }) {
  const [isVisible, setIsVisible] = useState(false)

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen && !isVisible) return null

  // Handle closing with animation
  const handleClose = () => {
    const backdrop = document.getElementById("delete-prescription-modal-backdrop")
    const modalContent = document.getElementById("delete-prescription-modal-content")

    if (backdrop) backdrop.style.animation = "fadeOut 0.3s ease-in-out forwards"
    if (modalContent) modalContent.style.animation = "scaleOut 0.3s ease-in-out forwards"

    setTimeout(() => {
      onClose()
    }, 280)
  }

  const handleDelete = () => {
    onDelete(prescription.id)
    handleClose()
  }

  return (
    <>
      {/* Backdrop with animation */}
      <div
        id="delete-prescription-modal-backdrop"
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={handleClose}
        style={{ animation: "fadeIn 0.3s ease-in-out" }}
      />

      {/* Modal with animation */}
      <div
        id="delete-prescription-modal-content"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg"
        style={{ animation: "scaleIn 0.3s ease-in-out" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-graphite">Confirm Deletion</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-drift-gray transition-colors duration-200 hover:bg-pale-stone hover:text-soft-amber"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </div>

          <p className="mb-4 text-center text-graphite">
            Are you sure you want to delete this prescription for {prescription?.medication || "this medication"}? This
            action cannot be undone.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
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
      </div>
    </>
  )
}
