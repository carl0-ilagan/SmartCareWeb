"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { updateSuspiciousLoginStatus } from "@/lib/security-utils"
import { WelcomeModal } from "@/components/welcome-modal"

export default function SuspiciousLoginWatcher({ userId }) {
  const [pending, setPending] = useState(null)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (!userId) return
    const ref = collection(db, "suspiciousLogins")
    const q = query(ref, where("userId", "==", userId), where("status", "==", "unverified"), orderBy("timestamp", "desc"), limit(1))
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const d = snap.docs[0]
        setPending({ id: d.id, ...d.data() })
      } else {
        setPending(null)
      }
    })
    return () => unsub()
  }, [userId])

  if (!pending) return null

  const handleDecision = async (approved) => {
    const id = pending.id
    const sessionId = pending.sessionId
    try {
      if (approved) {
        await updateSuspiciousLoginStatus(id, "verified")
        // Mark session as trusted
        if (sessionId) {
          const sref = doc(db, "sessions", sessionId)
          const snap = await getDoc(sref)
          if (snap.exists()) {
            await updateDoc(sref, { trusted: true })
          }
        }
        setPending(null)
        setShowWelcome(true)
      } else {
        await updateSuspiciousLoginStatus(id, "rejected")
        // Revoke the suspicious session immediately
        if (sessionId) {
          try { await deleteDoc(doc(db, "sessions", sessionId)) } catch {}
        }
        setPending(null)
      }
    } catch (e) {
      console.error("Error handling suspicious decision:", e)
      setPending(null)
    }
  }

  return (
    <>
      {/* Modal styled similar to appointment modal */}
      <div className={`fixed inset-0 z-[110] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xl animate-fade-in`}>
        <div className={`w-full max-w-md mx-auto rounded-2xl shadow-2xl overflow-hidden flex flex-col bg-gradient-to-br from-soft-amber/10 to-yellow-50 animate-modal-in`}>
          <div className="p-3 border-b border-amber-200/40">
            <h4 className="text-base font-bold text-graphite text-center">Verify this login</h4>
          </div>
          <div className="p-4 bg-white">
            <p className="text-sm text-graphite mb-2">We noticed a login from a new device or location.</p>
            <p className="text-sm text-drift-gray">Device: {pending?.deviceInfo?.deviceName || "Unknown"}</p>
            <p className="text-sm text-drift-gray">IP: {pending?.ipAddress || "Unknown"}</p>
            <p className="text-xs text-drift-gray mt-2">If this was you, confirm to continue. If not, we'll revoke that session immediately.</p>
          </div>
          <div className="p-3 border-t border-amber-200/30 bg-white">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                className="flex-1 sm:flex-none rounded-lg border-2 border-soft-amber/60 bg-white px-4 py-2 text-sm font-semibold text-soft-amber shadow-sm hover:bg-soft-amber/10 hover:border-soft-amber hover:shadow-md focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
                onClick={() => handleDecision(false)}
              >
                This wasn't me
              </button>
              <button
                type="button"
                className="flex-1 sm:flex-none rounded-lg px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-soft-amber to-amber-500 shadow-lg hover:from-amber-500 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-soft-amber focus:ring-offset-2"
                onClick={() => handleDecision(true)}
              >
                This was me
              </button>
            </div>
          </div>
        </div>
      </div>

      {showWelcome && (
        <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} userType="patient" userName="" />
      )}
    </>
  )
}


