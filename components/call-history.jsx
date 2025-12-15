"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getCallHistoryWithPagination } from "@/lib/call-service"
import { Phone, Video, ArrowUpRight, ArrowDownLeft, Clock, Calendar, Loader2 } from "lucide-react"

export default function CallHistory() {
  const { user } = useAuth()
  const [calls, setCalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadInitialCalls = async () => {
      try {
        setLoading(true)
        const callHistory = await getCallHistoryWithPagination(user.uid)
        setCalls(callHistory)
        setHasMore(callHistory.length === 10) // If we got 10 calls, there might be more
      } catch (error) {
        console.error("Error loading call history:", error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialCalls()
  }, [user])

  const loadMoreCalls = async () => {
    if (!user || !calls.length || loadingMore) return

    try {
      setLoadingMore(true)
      const lastCall = calls[calls.length - 1]
      const moreCalls = await getCallHistoryWithPagination(user.uid, lastCall)

      if (moreCalls.length === 0) {
        setHasMore(false)
      } else {
        setCalls([...calls, ...moreCalls])
        setHasMore(moreCalls.length === 10)
      }
    } catch (error) {
      console.error("Error loading more calls:", error)
    } finally {
      setLoadingMore(false)
    }
  }

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

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-soft-amber" />
      </div>
    )
  }

  if (calls.length === 0) {
    return (
      <div className="rounded-lg border border-pale-stone bg-white p-4 text-center">
        <Phone className="mx-auto h-10 w-10 text-drift-gray" />
        <p className="mt-2 text-drift-gray">No call history found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-graphite">Recent Calls</h3>

      <div className="divide-y divide-pale-stone rounded-lg border border-pale-stone bg-white">
        {calls.map((call) => (
          <div key={call.id} className="flex items-center justify-between p-3">
            <div className="flex items-center">
              <div className="mr-3 rounded-full bg-pale-stone p-2">
                {call.callType === "video" ? (
                  <Video className="h-5 w-5 text-drift-gray" />
                ) : (
                  <Phone className="h-5 w-5 text-drift-gray" />
                )}
              </div>

              <div>
                <div className="flex items-center">
                  <p className="font-medium text-graphite">
                    {call.role === "caller" ? call.receiverName : call.callerName}
                  </p>
                  {call.role === "caller" ? (
                    <ArrowUpRight className="ml-1 h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownLeft className="ml-1 h-4 w-4 text-blue-500" />
                  )}
                </div>

                <div className="flex items-center text-xs text-drift-gray">
                  <Calendar className="mr-1 h-3 w-3" />
                  <span>{formatDate(call.startTime)}</span>
                  <Clock className="ml-2 mr-1 h-3 w-3" />
                  <span>{formatTime(call.startTime)}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div
                className={`text-sm ${call.status === "declined" || call.status === "missed" ? "text-red-500" : "text-drift-gray"}`}
              >
                {call.status === "accepted"
                  ? "Completed"
                  : call.status === "declined"
                    ? "Declined"
                    : call.status === "missed"
                      ? "Missed"
                      : call.status}
              </div>

              {call.duration > 0 && (
                <div className="text-xs text-drift-gray">Duration: {formatDuration(call.duration)}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMoreCalls}
            disabled={loadingMore}
            className="flex items-center rounded-md bg-pale-stone px-4 py-2 text-sm text-drift-gray hover:bg-soft-amber/20"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  )
}
