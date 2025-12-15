"use client"

import { useState, useEffect } from "react"
import { X, AlertCircle, Check } from "lucide-react"
import { completeUserAppointment } from "@/app/actions/appointment-actions"

export function CompleteAppointmentModal({ isOpen, onClose, appointment, onComplete }) {
  const [isVisible, setIsVisible] = useState(false)
  const [diagnosis, setDiagnosis] = useState("")
  const [recommendations, setRecommendations] = useState("")
  const [prescriptions, setPrescriptions] = useState("")
  const [followUp, setFollowUp] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setDiagnosis("")
      setRecommendations("")
      setPrescriptions("")
      setFollowUp("")
      setNotes("")
      setError("")
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle closing with animation
  const handleClose = () => {
    if (isSubmitting) return

    const backdrop = document.getElementById("complete-backdrop")
    const modalContent = document.getElementById("complete-content")

    if (backdrop) backdrop.style.animation = "fadeOut 0.3s ease-in-out forwards"
    if (modalContent) modalContent.style.animation = "scaleOut 0.3s ease-in-out forwards"

    setTimeout(() => {
      onClose()
    }, 280)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!diagnosis.trim()) {
      setError("Please provide a diagnosis")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("appointmentId", appointment.id)
      formData.append("diagnosis", diagnosis)
      formData.append("recommendations", recommendations)
      formData.append("prescriptions", prescriptions)
      formData.append("followUp", followUp)
      formData.append("notes", notes)

      const response = await completeUserAppointment(formData)

      if (response.success) {
        const summary = {
          diagnosis,
          recommendations,
          prescriptions: prescriptions.split("\n").filter((p) => p.trim()),
          followUp,
          notes,
        }

        if (onComplete) {
          onComplete(appointment, summary)
        }

        handleClose()
      } else {
        setError(response.error || "Failed to complete appointment")
      }
    } catch (err) {
      console.error("Error completing appointment:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen && !isVisible) return null
  if (!appointment) return null

  return (
    <>
      {/* Backdrop with animation */}
      <div
        id="complete-backdrop"
        className="fixed inset-0 z-50 bg-black/50 transition-opacity"
        onClick={handleClose}
        style={{ animation: "fadeIn 0.3s ease-in-out" }}
      />

      {/* Modal with animation */}
      <div
        id="complete-content"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg"
        style={{ animation: "scaleIn 0.3s ease-in-out" }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-graphite">Complete Appointment</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-1 text-drift-gray hover:bg-pale-stone hover:text-soft-amber transition-colors duration-200"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="mt-4">
          <div className="rounded-lg bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Appointment Details</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Patient: {appointment.patientName || appointment.patient}</p>
                  <p>Date: {new Date(appointment.date).toLocaleDateString()}</p>
                  <p>Time: {appointment.time}</p>
                  <p>Type: {appointment.type}</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">
              <div className="flex">
                <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="diagnosis" className="block text-sm font-medium text-graphite">
                Diagnosis *
              </label>
              <textarea
                id="diagnosis"
                rows={2}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Enter patient diagnosis"
                required
                className="mt-1 block w-full rounded-md border border-earth-beige p-2 text-sm text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              />
            </div>

            <div>
              <label htmlFor="recommendations" className="block text-sm font-medium text-graphite">
                Recommendations
              </label>
              <textarea
                id="recommendations"
                rows={2}
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Enter treatment recommendations"
                className="mt-1 block w-full rounded-md border border-earth-beige p-2 text-sm text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              />
            </div>

            <div>
              <label htmlFor="prescriptions" className="block text-sm font-medium text-graphite">
                Prescriptions
              </label>
              <textarea
                id="prescriptions"
                rows={3}
                value={prescriptions}
                onChange={(e) => setPrescriptions(e.target.value)}
                placeholder="Enter prescriptions (one per line)"
                className="mt-1 block w-full rounded-md border border-earth-beige p-2 text-sm text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              />
              <p className="mt-1 text-xs text-drift-gray">Enter each prescription on a new line</p>
            </div>

            <div>
              <label htmlFor="followUp" className="block text-sm font-medium text-graphite">
                Follow-up
              </label>
              <input
                id="followUp"
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="e.g., 2 weeks, 1 month, as needed"
                className="mt-1 block w-full rounded-md border border-earth-beige p-2 text-sm text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-graphite">
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes or observations"
                className="mt-1 block w-full rounded-md border border-earth-beige p-2 text-sm text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-md border border-earth-beige bg-white px-4 py-2 text-sm font-medium text-graphite transition-colors duration-200 hover:bg-pale-stone focus:outline-none focus:ring-2 focus:ring-earth-beige focus:ring-offset-2 disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70"
              >
                {isSubmitting ? "Completing..." : "Complete Appointment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
