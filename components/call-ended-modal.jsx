"use client"

import { useState } from "react"
import { Phone, Video, Clock, Calendar, X, User } from "lucide-react"

export default function CallEndedModal({ isOpen, callData, onClose }) {
  const [feedback, setFeedback] = useState("")
  const [rating, setRating] = useState(0)

  if (!isOpen || !callData) return null

  // Format call duration
  const formatDuration = (seconds) => {
    if (!seconds) return "0:00"

    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Format call date
  const formatDate = (timestamp) => {
    if (!timestamp) return ""

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  // Format call time
  const formatTime = (timestamp) => {
    if (!timestamp) return ""

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Determine if the current user was the caller
  const isCaller = callData.currentUserName === callData.callerName

  // Get the other participant's name and photo
  const otherParticipantName = isCaller ? callData.receiverName : callData.callerName
  const otherParticipantPhoto = isCaller ? callData.receiverPhoto : callData.callerPhoto

  // Handle submitting feedback
  const handleSubmitFeedback = (e) => {
    e.preventDefault()

    // Here you would typically save the feedback to your database
    console.log("Feedback:", { rating, feedback })

    // Close the modal
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-graphite">Call Ended</h2>
          <button onClick={onClose} className="rounded-full p-1 text-drift-gray hover:bg-pale-stone">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex items-center">
          <div className="mr-4 h-16 w-16 overflow-hidden rounded-full bg-pale-stone">
            {otherParticipantPhoto ? (
              <img
                src={otherParticipantPhoto || "/placeholder.svg"}
                alt={otherParticipantName}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-full w-full p-3 text-drift-gray" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-medium text-graphite">{otherParticipantName}</h3>
            <div className="flex items-center text-soft-amber">
              {callData.callType === "video" ? (
                <>
                  <Video className="mr-1 h-4 w-4" />
                  <span>Video Call</span>
                </>
              ) : (
                <>
                  <Phone className="mr-1 h-4 w-4" />
                  <span>Voice Call</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-pale-stone/30 p-3">
          <div>
            <p className="text-xs text-drift-gray">Date</p>
            <div className="flex items-center text-sm text-graphite">
              <Calendar className="mr-1 h-3 w-3" />
              <span>{formatDate(callData.startTime)}</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-drift-gray">Time</p>
            <div className="flex items-center text-sm text-graphite">
              <Clock className="mr-1 h-3 w-3" />
              <span>{formatTime(callData.startTime)}</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-drift-gray">Duration</p>
            <p className="text-sm text-graphite">{formatDuration(callData.duration)}</p>
          </div>

          <div>
            <p className="text-xs text-drift-gray">Status</p>
            <p className="text-sm text-graphite capitalize">{callData.status}</p>
          </div>
        </div>

        <form onSubmit={handleSubmitFeedback} className="mt-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-drift-gray">Rate this call</label>
            <div className="mt-1 flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`h-8 w-8 rounded-full ${
                    rating >= star ? "bg-soft-amber text-white" : "bg-pale-stone text-drift-gray"
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="feedback" className="block text-sm font-medium text-drift-gray">
              Feedback (optional)
            </label>
            <textarea
              id="feedback"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mt-1 w-full rounded-md border border-earth-beige bg-white p-2 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
              placeholder="Share your thoughts about this call..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-earth-beige bg-white px-4 py-2 text-sm font-medium text-graphite transition-colors hover:bg-pale-stone"
            >
              Skip
            </button>

            <button
              type="submit"
              className="rounded-md bg-soft-amber px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
