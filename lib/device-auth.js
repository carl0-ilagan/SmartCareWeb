// Device authentication and trust management

import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getOrCreateDeviceId, getCompleteDeviceMetadata } from "@/lib/device-utils"

/**
 * Check if device is trusted for a user
 * @param {string} userId - User ID
 * @param {string} deviceId - Device ID
 * @returns {Promise<{isTrusted: boolean, deviceData: object|null}>}
 */
export async function checkDeviceTrust(userId, deviceId) {
  try {
    if (!userId || !deviceId) {
      return { isTrusted: false, deviceData: null }
    }

    const deviceRef = doc(db, "users", userId, "devices", deviceId)
    const deviceSnap = await getDoc(deviceRef)

    if (deviceSnap.exists()) {
      const deviceData = deviceSnap.data()
      return {
        isTrusted: deviceData.trusted === true,
        deviceData: deviceData,
      }
    }

    return { isTrusted: false, deviceData: null }
  } catch (error) {
    console.error("Error checking device trust:", error)
    return { isTrusted: false, deviceData: null }
  }
}

/**
 * Create a login request for untrusted device
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} deviceId - Device ID
 * @param {object} deviceMetadata - Device metadata
 * @param {string} ipAddress - IP address
 * @returns {Promise<{success: boolean, requestId: string|null}>}
 */
export async function createLoginRequest(userId, email, deviceId, deviceMetadata, ipAddress) {
  try {
    const requestId = `${userId}_${deviceId}`
    const requestRef = doc(db, "loginRequests", requestId)

    // Check if request already exists
    const existingRequest = await getDoc(requestRef)
    if (existingRequest.exists()) {
      const data = existingRequest.data()
      if (data.status === "pending") {
        return { success: true, requestId, alreadyExists: true }
      }
    }

    const requestData = {
      uid: userId,
      email: email,
      deviceId: deviceId,
      status: "pending",
      timestamp: serverTimestamp(),
      deviceMetadata: deviceMetadata,
      ipAddress: ipAddress || "Unknown",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes expiry
    }

    await setDoc(requestRef, requestData)

    return { success: true, requestId }
  } catch (error) {
    console.error("Error creating login request:", error)
    return { success: false, requestId: null }
  }
}

/**
 * Get login request by ID
 * @param {string} requestId - Request ID (format: uid_deviceId)
 * @returns {Promise<object|null>}
 */
export async function getLoginRequest(requestId) {
  try {
    const requestRef = doc(db, "loginRequests", requestId)
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
 * Approve login request and mark device as trusted
 * @param {string} requestId - Request ID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function approveLoginRequest(requestId) {
  try {
    const request = await getLoginRequest(requestId)

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
    const deviceRef = doc(db, "users", uid, "devices", deviceId)
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
    const requestRef = doc(db, "loginRequests", requestId)
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
 * Deny login request
 * @param {string} requestId - Request ID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function denyLoginRequest(requestId) {
  try {
    const requestRef = doc(db, "loginRequests", requestId)
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

/**
 * Get pending login request for user and device
 * @param {string} userId - User ID
 * @param {string} deviceId - Device ID
 * @returns {Promise<object|null>}
 */
export async function getPendingLoginRequest(userId, deviceId) {
  try {
    const requestId = `${userId}_${deviceId}`
    const request = await getLoginRequest(requestId)

    // Return request if it exists (pending, approved, or denied)
    // This allows the waiting page to check the status
    if (request) {
      return request
    }

    return null
  } catch (error) {
    console.error("Error getting pending login request:", error)
    return null
  }
}

/**
 * Register device after approval
 * @param {string} userId - User ID
 * @param {string} deviceId - Device ID
 * @param {object} deviceMetadata - Device metadata
 * @param {string} ipAddress - IP address
 * @returns {Promise<{success: boolean}>}
 */
export async function registerTrustedDevice(userId, deviceId, deviceMetadata, ipAddress) {
  try {
    const deviceRef = doc(db, "users", userId, "devices", deviceId)

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

    return { success: true }
  } catch (error) {
    console.error("Error registering trusted device:", error)
    return { success: false }
  }
}

/**
 * Trust a device from a session (convert session to trusted device)
 * @param {string} userId - User ID
 * @param {object} session - Session object with device info
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function trustDeviceFromSession(userId, session) {
  try {
    // Extract device info from session
    const deviceName = session.deviceName || "Unknown Device"
    const ipAddress = session.ipAddress || "Unknown"
    
    // Parse device name to extract browser and OS
    // Format is usually "Browser on OS" (e.g., "Chrome on Windows")
    const deviceParts = deviceName.split(" on ")
    const browser = deviceParts[0] || "Unknown"
    const os = deviceParts[1] || "Unknown"
    
    // Create device metadata from session
    const deviceMetadata = {
      browser: browser,
      os: os,
      deviceType: session.deviceType || "desktop",
      screenWidth: session.deviceType === "mobile" ? 375 : 1920,
      screenHeight: session.deviceType === "mobile" ? 667 : 1080,
      userAgent: session.userAgent || navigator?.userAgent || "Unknown",
      timezone: Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || "UTC",
    }
    
    // Generate a unique device ID based on session info
    // Use a combination of device name and IP to create a stable device ID
    // This ensures the same device gets the same ID even if session changes
    const deviceIdBase = `${deviceName}_${ipAddress}`.replace(/[^a-zA-Z0-9_]/g, "_")
    const deviceId = `session_${deviceIdBase}_${userId.substring(0, 8)}`
    
    // Register as trusted device
    const result = await registerTrustedDevice(userId, deviceId, deviceMetadata, ipAddress)
    
    if (result.success) {
      return { success: true, error: null, deviceId }
    } else {
      return { success: false, error: "Failed to register device" }
    }
  } catch (error) {
    console.error("Error trusting device from session:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if a session's device is already trusted
 * @param {string} userId - User ID
 * @param {object} session - Session object
 * @returns {Promise<boolean>}
 */
export async function isSessionDeviceTrusted(userId, session) {
  try {
    // Generate the same device ID that would be used in trustDeviceFromSession
    const deviceName = session.deviceName || "Unknown Device"
    const ipAddress = session.ipAddress || "Unknown"
    const deviceIdBase = `${deviceName}_${ipAddress}`.replace(/[^a-zA-Z0-9_]/g, "_")
    const deviceId = `session_${deviceIdBase}_${userId.substring(0, 8)}`
    
    const deviceTrust = await checkDeviceTrust(userId, deviceId)
    return deviceTrust.isTrusted
  } catch (error) {
    console.error("Error checking if session device is trusted:", error)
    return false
  }
}

/**
 * Get user's trusted devices
 * @param {string} userId - User ID
 * @returns {Promise<Array>}
 */
export async function getTrustedDevices(userId) {
  try {
    const devicesRef = collection(db, "users", userId, "devices")
    const devicesSnap = await getDocs(devicesRef)

    const devices = []
    devicesSnap.forEach((doc) => {
      devices.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return devices.filter((device) => device.trusted === true)
  } catch (error) {
    console.error("Error getting trusted devices:", error)
    return []
  }
}

/**
 * Remove trusted device
 * @param {string} userId - User ID
 * @param {string} deviceId - Device ID
 * @returns {Promise<{success: boolean}>}
 */
export async function removeTrustedDevice(userId, deviceId) {
  try {
    const deviceRef = doc(db, "users", userId, "devices", deviceId)
    await deleteDoc(deviceRef)
    return { success: true }
  } catch (error) {
    console.error("Error removing trusted device:", error)
    return { success: false }
  }
}

