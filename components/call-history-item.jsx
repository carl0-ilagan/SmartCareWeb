"use client"

import { useState } from "react"
import { Phone, Video, Clock, Calendar, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import Link from "next/link"

export default function CallHistoryItem({ call, currentUserId, otherUser, userRole }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Determine if the current user initiated the call
  const isOutgoing = call.initiator === currentUserId

  // Format call duration
  const formatDuration = (seconds) => {
    if (!seconds) return "0:00"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Format call date
  const formatCallDate = (timestamp) => {
    if (!timestamp) return ""

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return "Today, " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday, " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays < 7) {
      return (
        date.toLocaleDateString([], { weekday: "long" }) +
        ", " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      )
    } else {
      return date.toLocaleDateString() + ", " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  }

  // Get call status text
  const getCallStatusText = () => {
    if (call.status === "rejected") {
      return isOutgoing ? "Call declined" : "Call missed"
    } else if (call.status === "ended" && call.duration > 0) {
      return `Call duration: ${formatDuration(call.duration)}`
    } else {
      return "Call not completed"
    }
  }

  // Get call path for initiating a new call
  const getCallPath = () => {
    if (!otherUser || !otherUser.id) return "#"

    const basePath = userRole === "doctor" ? "/doctor/calls/" : "/dashboard/calls/"
    const callType = call.type === "video" ? "video/" : "voice/"

    return basePath + callType + otherUser.id
  }

  return (
    <div className="border-b border-pale-stone py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Call type icon */}
          <div className={`mr-3 rounded-full p-2 ${isOutgoing ? "bg-green-100" : "bg-blue-100"}`}>
            {call.type === "video" ? (
              <Video className={`h-5 w-5 ${isOutgoing ? "text-green-600" : "text-blue-600"}`} />
            ) : (
              <Phone className={`h-5 w-5 ${isOutgoing ? "text-green-600" : "text-blue-600"}`} />
            )}
          </div>

          {/* Call info */}
          <div>
            <div className="flex items-center">
              <span className="font-medium text-graphite">{otherUser?.displayName || "Unknown User"}</span>
              {isOutgoing ? (
                <ArrowUpRight className="ml-1 h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownLeft className="ml-1 h-4 w-4 text-blue-600" />
              )}
            </div>
            <div className="flex items-center text-xs text-drift-gray">
              <Clock className="mr-1 h-3 w-3" />
              <span>{getCallStatusText()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          {/* Call date */}
          <div className="mr-3 text-right text-xs text-drift-gray">
            <div className="flex items-center justify-end">
              <Calendar className="mr-1 h-3 w-3" />
              <span>{formatCallDate(call.createdAt)}</span>
            </div>
          </div>

          {/* Call again button */}
          <Link href={getCallPath()} className="rounded-full bg-soft-amber p-2 text-white hover:bg-amber-600">
            {call.type === "video" ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          </Link>
        </div>
      </div>

      {/* Expandable details */}
      {isExpanded && (
        <div className="mt-2 rounded-md bg-pale-stone/30 p-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-medium">Call ID:</span> {call.id.substring(0, 8)}...
            </div>
            <div>
              <span className="font-medium">Type:</span> {call.type} call
            </div>
            <div>
              <span className="font-medium">Started:</span> {formatCallDate(call.createdAt)}
            </div>
            <div>
              <span className="font-medium">Ended:</span> {formatCallDate(call.endedAt) || "N/A"}
            </div>
            <div>
              <span className="font-medium">Status:</span> {call.status}
            </div>
            <div>
              <span className="font-medium">Duration:</span> {formatDuration(call.duration)}
            </div>
          </div>
        </div>
      )}

      {/* Toggle details button */}
      <button onClick={() => setIsExpanded(!isExpanded)} className="mt-1 text-xs text-soft-amber hover:underline">
        {isExpanded ? "Hide details" : "Show details"}
      </button>
    </div>
  )
}
