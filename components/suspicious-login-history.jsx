"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Shield, Info } from "lucide-react"
import { getSuspiciousLogins, updateSuspiciousLoginStatus, trustDeviceAndLocation } from "@/lib/security-utils"
import { doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { X } from "lucide-react"
import { SuccessNotification } from "@/components/success-notification"

export function SuspiciousLoginHistory({ userId }) {
  const [suspiciousLogins, setSuspiciousLogins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [acting, setActing] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "", type: "success" })
  const [filter, setFilter] = useState("active") // active | denied
  const [page, setPage] = useState(1)
  const pageSize = 5

  // Reset to first page whenever filter changes
  useEffect(() => {
    setPage(1)
  }, [filter])

  useEffect(() => {
    const fetchSuspiciousLogins = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const logins = await getSuspiciousLogins(userId)
        setSuspiciousLogins(logins)
      } catch (error) {
        console.error("Error fetching suspicious logins:", error)
        setError("Unable to load suspicious login history")
      } finally {
        setLoading(false)
      }
    }

    fetchSuspiciousLogins()
  }, [userId])

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="h-6 w-6 border-2 border-soft-amber border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-pale-stone rounded-md text-center">
        <Info className="h-5 w-5 text-soft-amber mx-auto mb-2" />
        <p className="text-sm text-drift-gray">{error}</p>
      </div>
    )
  }

  if (suspiciousLogins.length === 0) {
    return (
      <div className="p-4 bg-pale-stone rounded-md text-center">
        <Shield className="h-5 w-5 text-green-600 mx-auto mb-2" />
        <p className="text-sm text-drift-gray">No suspicious login activity detected</p>
      </div>
    )
  }

  const filtered = suspiciousLogins.filter((l) => (filter === "active" ? l.status === "unverified" : l.status === "rejected"))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const clearByStatus = async (statusToClear) => {
    try {
      const toClear = suspiciousLogins.filter((l) => l.status === statusToClear)
      if (toClear.length === 0) return
      await Promise.all(
        toClear.map(async (item) => {
          if (item.sessionId) {
            try { await deleteDoc(doc(db, "sessions", item.sessionId)) } catch {}
          }
          try { await deleteDoc(doc(db, "suspiciousLogins", item.id)) } catch {}
        })
      )
      setToast({ show: true, message: `Cleared ${statusToClear === 'unverified' ? 'active' : 'denied'} suspicious activity`, type: "success" })
      // Refresh list
      const logins = await getSuspiciousLogins(userId)
      setSuspiciousLogins(logins)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-drift-gray">Recent Suspicious Activity</p>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs border border-earth-beige rounded px-2 py-1 bg-white text-graphite"
          >
            <option value="active">Active</option>
            <option value="denied">Denied</option>
          </select>
          <button
            onClick={() => clearByStatus('unverified')}
            className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
            disabled={suspiciousLogins.filter(l => l.status === 'unverified').length === 0}
          >
            Clear Active
          </button>
          <button
            onClick={() => clearByStatus('rejected')}
            className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
            disabled={suspiciousLogins.filter(l => l.status === 'rejected').length === 0}
          >
            Clear Denied
          </button>
        </div>
      </div>
      {paged.map((login) => {
        // Determine risk level
        const riskLevel = login.threatScore >= 75 ? "High Risk" : login.threatScore >= 50 ? "Medium Risk" : "Low Risk"
        const riskColor =
          login.threatScore >= 75 ? "text-red-600" : login.threatScore >= 50 ? "text-amber-600" : "text-yellow-600"

        // Format date
        const date = login.timestamp?.toDate ? login.timestamp.toDate() : new Date()
        const formattedDate = new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }).format(date)

        return (
          <button key={login.id} onClick={() => setSelected(login)} className="w-full text-left p-3 border border-earth-beige rounded-md bg-white hover:border-amber-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <AlertTriangle className={`h-4 w-4 ${riskColor} mt-0.5 mr-2 flex-shrink-0`} />
                <div>
                  <p className="text-sm font-medium text-graphite">Suspicious Login</p>
                  <p className="text-xs text-drift-gray">{formattedDate}</p>
                  <p className={`text-xs font-medium ${riskColor} mt-1`}>{riskLevel}</p>
                  <p className="text-xs text-drift-gray mt-1">{login.deviceInfo?.deviceName || "Unknown device"}</p>
                  <p className="text-xs text-drift-gray">{login.ipAddress || "Unknown location"}</p>
                  {login.reasons && login.reasons.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs text-drift-gray">Reasons: {login.reasons.join(", ")}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </button>
        )
      })}

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="flex justify-end items-center gap-2 pt-1">
          <button
            className="px-2 py-1 text-xs rounded border border-earth-beige disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="text-xs text-drift-gray">Page {page} of {totalPages}</span>
          <button
            className="px-2 py-1 text-xs rounded border border-earth-beige disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      )}

      {/* Verification Modal (opens only when user clicks an item) */}
      {selected && (
        <div className={`fixed inset-0 z-[110] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xl`} style={{ animation: "fadeIn 0.25s ease-out" }}>
          <style jsx>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(-8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
            @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.6) } 70% { box-shadow: 0 0 0 12px rgba(251, 191, 36, 0) } 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0) } }
          `}</style>
          <div className={`w-full max-w-md mx-auto rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-gradient-to-br from-soft-amber/10 to-yellow-50`} style={{ animation: "modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
            <div className="p-3 border-b border-amber-200/40 relative">
              <h4 className="text-base font-bold text-graphite text-center">Verify this login</h4>
            </div>
            <div className="p-4 bg-white">
              <div className="flex items-center justify-center mb-3">
                <div className="h-12 w-12 rounded-full bg-soft-amber/20 text-soft-amber flex items-center justify-center" style={{ animation: "pulseRing 1.6s infinite" }}>
                  {/* simple shield lock emoji replacement with text icon */}
                  <span className="text-lg">🔒</span>
                </div>
              </div>
              <p className="text-sm text-graphite mb-2">We noticed a login from a new device or location.</p>
              <p className="text-sm text-drift-gray">Device: {selected?.deviceInfo?.deviceName || "Unknown"}</p>
              <p className="text-sm text-drift-gray">IP: {selected?.ipAddress || "Unknown"}</p>
              <p className="text-xs text-drift-gray mt-2">If this was you, confirm to continue. If not, we'll revoke that session immediately.</p>
            </div>
            <div className="p-3 border-t border-amber-200/30 bg-white">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  className="flex-1 sm:flex-none rounded-lg border-2 border-soft-amber/60 bg-white px-4 py-2 text-sm font-semibold text-soft-amber shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber hover:shadow-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
                  disabled={acting}
                  onClick={async () => {
                    setActing(true)
                    try {
                      await updateSuspiciousLoginStatus(selected.id, "rejected")
                      if (selected.sessionId) {
                        try { await deleteDoc(doc(db, "sessions", selected.sessionId)) } catch {}
                      }
                      setToast({ show: true, message: "Login denied successfully", type: "error" })
                      // Move item to denied in local state
                      setSuspiciousLogins((prev) => prev.map((l) => l.id === selected.id ? { ...l, status: "rejected" } : l))
                    } catch {}
                    setActing(false)
                    setSelected(null)
                  }}
                >
                  {acting ? (
                    <span className="inline-flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0A12 12 0 000 12h4z"></path></svg>Processing...</span>
                  ) : (
                    "This wasn't me"
                  )}
                </button>
                <button
                  type="button"
                  className="flex-1 sm:flex-none rounded-lg px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-soft-amber to-amber-500 shadow-lg hover:from-amber-500 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
                  disabled={acting}
                  onClick={async () => {
                    setActing(true)
                    try {
                      await updateSuspiciousLoginStatus(selected.id, "verified")
                      if (selected.sessionId) {
                        const sref = doc(db, "sessions", selected.sessionId)
                        const snap = await getDoc(sref)
                        if (snap.exists()) {
                          await updateDoc(sref, { trusted: true })
                        }
                      }
                      // Add to trusted lists to avoid future flags
                      await trustDeviceAndLocation(userId, selected?.deviceInfo?.deviceName, selected?.ipAddress)
                      setToast({ show: true, message: "Login approved successfully", type: "success" })
                      // Remove from active list locally by marking verified
                      setSuspiciousLogins((prev) => prev.map((l) => l.id === selected.id ? { ...l, status: "verified" } : l))
                    } catch {}
                    setActing(false)
                    setSelected(null)
                  }}
                >
                  {acting ? (
                    <span className="inline-flex items-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0A12 12 0 000 12h4z"></path></svg>Processing...</span>
                  ) : (
                    "This was me"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <SuccessNotification
          message={toast.message}
          type={toast.type}
          isVisible={toast.show}
          onClose={() => setToast({ show: false, message: "", type: toast.type })}
          position="top-right"
          duration={3000}
        />
      )}
    </div>
  )
}
