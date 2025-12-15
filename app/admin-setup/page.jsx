"use client"
import { useState } from "react"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function AdminSetup() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const changeToAdmin = async () => {
    if (!user) {
      setMessage("You must be logged in to change your role")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      // Update the user's role in Firestore
      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        role: "admin",
      })

      setMessage("Role successfully changed to admin! Redirecting to admin dashboard...")

      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        router.push("/admin/dashboard")
      }, 2000)
    } catch (error) {
      console.error("Error updating role:", error)
      setMessage(`Error changing role: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pale-stone">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-graphite mb-4">Admin Setup</h1>
          <p className="text-drift-gray mb-4">Please log in to continue.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pale-stone">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-graphite mb-4">Admin Setup</h1>

        <div className="mb-6">
          <p className="text-drift-gray mb-2">Current user: {user.email}</p>
          <p className="text-drift-gray mb-4">Click the button below to change your role to admin.</p>

          <button
            onClick={changeToAdmin}
            disabled={loading}
            className="w-full bg-soft-amber hover:bg-soft-amber/90 text-white py-2 px-4 rounded-md font-medium disabled:opacity-50"
          >
            {loading ? "Changing role..." : "Change Role to Admin"}
          </button>

          {message && (
            <p className={`mt-4 text-sm ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
