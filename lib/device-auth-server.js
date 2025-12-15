// Server-side device authentication functions for API routes

import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { serverDb } from "@/lib/firebase-server"

/**
 * Get login request by ID (server-side)
 * @param {string} requestId - Request ID (format: uid_deviceId)
 * @returns {Promise<object|null>}
 */
export async function getLoginRequestServer(requestId) {
  try {
    const requestRef = doc(serverDb, "loginRequests", requestId)
    const requestSnap = await getDoc(requestRef)

    if (requestSnap.exists()) {
      return { id: requestSnap.id, ...requestSnap.data() }
    }

    return null
  } catch (error) {
    console.error("Error getting login request:", error)
    return null
  }
}

/**
 * Approve login request and mark device as trusted (server-side)
 * @param {string} requestId - Request ID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function approveLoginRequestServer(requestId) {
  try {
    const request = await getLoginRequestServer(requestId)

    if (!request) {
      return { success: false, error: "Login request not found" }
    }

    if (request.status !== "pending") {
      return { success: false, error: `Request already ${request.status}` }
    }

    // Check if expired
    if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
      return { success: false, error: "Login request has expired" }
    }

    const { uid, deviceId, deviceMetadata, ipAddress } = request

    // Mark device as trusted
    const deviceRef = doc(serverDb, "users", uid, "devices", deviceId)
    await setDoc(
      deviceRef,
      {
        trusted: true,
        approvedAt: serverTimestamp(),
        deviceMetadata: deviceMetadata || {},
        ipAddress: ipAddress || "Unknown",
        lastUsed: serverTimestamp(),
      },
      { merge: true }
    )

    // Update login request status
    const requestRef = doc(serverDb, "loginRequests", requestId)
    await updateDoc(requestRef, {
      status: "approved",
      approvedAt: serverTimestamp(),
    })

    return { success: true, error: null }
  } catch (error) {
    console.error("Error approving login request:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Deny login request (server-side)
 * @param {string} requestId - Request ID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function denyLoginRequestServer(requestId) {
  try {
    const requestRef = doc(serverDb, "loginRequests", requestId)
    const requestSnap = await getDoc(requestRef)

    if (!requestSnap.exists()) {
      return { success: false, error: "Login request not found" }
    }

    await updateDoc(requestRef, {
      status: "denied",
      deniedAt: serverTimestamp(),
    })

    return { success: true, error: null }
  } catch (error) {
    console.error("Error denying login request:", error)
    return { success: false, error: error.message }
  }
}

