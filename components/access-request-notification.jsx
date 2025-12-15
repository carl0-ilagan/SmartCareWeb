"use client"

import { useState } from "react"
import { Shield, Check, X, AlertTriangle } from "lucide-react"
import {
  doc,
  updateDoc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
  setDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { sendNotification } from "@/lib/notification-utils"

export function AccessRequestNotification({ notification, onAction }) {
  const [isLoading, setIsLoading] = useState(false)
  const [actionTaken, setActionTaken] = useState(null) // "approved" or "denied"

  const { adminId, adminName, dataType, reason, requestedAt } = notification.metadata || {}

  const handleAction = async (action) => {
    if (isLoading || actionTaken) return

    setIsLoading(true)

    try {
      // Get the user ID from the notification
      const userId = notification.userId

      // Find the access request in the database
      const requestsRef = collection(db, "accessRequests")
      const requestsQuery = await getDocs(
        query(
          requestsRef,
          where("patientId", "==", userId),
          where("adminId", "==", adminId),
          where("dataType", "==", dataType),
          where("status", "==", "pending"),
        ),
      )

      // Update all matching requests
      const updatePromises = []
      requestsQuery.forEach((doc) => {
        updatePromises.push(
          updateDoc(doc.ref, {
            status: action === "approve" ? "granted" : "denied",
            respondedAt: serverTimestamp(),
          }),
        )
      })

      await Promise.all(updatePromises)

      // Update user settings to grant access if approved
      if (action === "approve") {
        const settingsRef = doc(db, "userSettings", userId)
        const settingsDoc = await getDoc(settingsRef)

        if (settingsDoc.exists()) {
          const settings = settingsDoc.data()
          const privacy = settings.privacy || {}

          // Update the appropriate privacy setting
          const updatedPrivacy = {
            ...privacy,
            [`allowAdminView${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`]: true,
          }

          await updateDoc(settingsRef, {
            privacy: updatedPrivacy,
          })
        } else {
          // Create settings document if it doesn't exist
          await setDoc(settingsRef, {
            privacy: {
              [`allowAdminView${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`]: true,
            },
          })
        }
      }

      // Log the access response
      await addDoc(collection(db, "accessLogs"), {
        patientId: userId,
        adminId: adminId,
        adminName: adminName,
        dataType: dataType,
        status: action === "approve" ? "granted" : "denied",
        reason: reason,
        responseTimestamp: serverTimestamp(),
      })

      // Notify the admin of the decision
      await sendNotification(adminId, {
        title: `Access ${action === "approve" ? "Granted" : "Denied"}: ${dataType}`,
        message: `Your request to access ${userId}'s ${dataType} has been ${action === "approve" ? "approved" : "denied"}.`,
        type: "access_response",
        metadata: {
          patientId: userId,
          dataType,
          status: action === "approve" ? "granted" : "denied",
        },
      })

      // Update local state
      setActionTaken(action === "approve" ? "approved" : "denied")

      // Call the parent callback if provided
      if (onAction) {
        onAction(notification.id, action === "approve" ? "granted" : "denied")
      }
    } catch (error) {
      console.error(`Error ${action === "approve" ? "approving" : "denying"} access request:`, error)
      alert(`Failed to ${action === "approve" ? "approve" : "deny"} the access request. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  // Format the requested date
  const formatDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div
      className={`rounded-lg border p-4 mb-4 transition-all duration-300 ${
        actionTaken === "approved"
          ? "bg-green-50 border-green-200"
          : actionTaken === "denied"
            ? "bg-red-50 border-red-200"
            : "bg-amber-50 border-amber-200"
      }`}
    >
      <div className="flex items-start">
        <div
          className={`rounded-full p-2 mr-3 ${
            actionTaken === "approved" ? "bg-green-100" : actionTaken === "denied" ? "bg-red-100" : "bg-amber-100"
          }`}
        >
          {actionTaken === "approved" ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : actionTaken === "denied" ? (
            <X className="h-5 w-5 text-red-600" />
          ) : (
            <Shield className="h-5 w-5 text-amber-600" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-graphite">
              {actionTaken === "approved"
                ? "Access Granted"
                : actionTaken === "denied"
                  ? "Access Denied"
                  : "Access Request"}
            </h3>
            <span className="text-xs text-drift-gray">{formatDate(requestedAt)}</span>
          </div>

          <p className="text-sm text-drift-gray mt-1">
            <span className="font-medium">{adminName}</span> has requested access to your {dataType}.
          </p>

          <div className="mt-2 bg-white/50 rounded p-2 text-sm">
            <p className="font-medium text-graphite text-xs mb-1">Reason for request:</p>
            <p className="text-drift-gray">{reason}</p>
          </div>

          {!actionTaken && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => handleAction("approve")}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </>
                )}
              </button>

              <button
                onClick={() => handleAction("deny")}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center px-3 py-1.5 bg-white border border-red-300 text-red-600 text-sm rounded-md hover:bg-red-50 transition-colors"
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-1" />
                    Deny
                  </>
                )}
              </button>
            </div>
          )}

          {actionTaken && (
            <div
              className={`mt-3 p-2 rounded-md text-sm ${
                actionTaken === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              <div className="flex items-center">
                {actionTaken === "approved" ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    <span>You've granted access to your {dataType}.</span>
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-1.5" />
                    <span>You've denied access to your {dataType}.</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`mt-2 pt-2 border-t ${
          actionTaken === "approved"
            ? "border-green-200"
            : actionTaken === "denied"
              ? "border-red-200"
              : "border-amber-200"
        }`}
      >
        <p className="text-xs text-drift-gray flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {actionTaken
            ? "The admin has been notified of your decision."
            : "Responding to this request will notify the admin of your decision."}
        </p>
      </div>
    </div>
  )
}
