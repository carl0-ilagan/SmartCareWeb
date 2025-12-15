import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { sendNotification } from "./notification-utils"
import { sendEmailNotification } from "./email-service"
import { arrayUnion } from "firebase/firestore"

// Maximum distance (in km) that can be traveled in an hour
const MAX_TRAVEL_SPEED = 800 // ~500 miles per hour (airplane speed)

// Maximum number of failed login attempts before flagging
const MAX_FAILED_ATTEMPTS = 5

// Time window for failed login attempts (in milliseconds)
const FAILED_ATTEMPT_WINDOW = 15 * 60 * 1000 // 15 minutes

// Function to check if a login is suspicious
export async function checkSuspiciousLogin(userId, ipAddress, deviceInfo) {
  try {
    // Default to not suspicious
    const result = {
      isSuspicious: false,
      reasons: [],
      threatScore: 0,
    }

    // Skip check if no userId or ipAddress
    if (!userId || !ipAddress || ipAddress === "Unknown" || ipAddress === "Fetching...") {
      return result
    }

    // Get user's trusted devices and locations
    const trustedDevicesDoc = await getDoc(doc(db, "users", userId, "trusted", "devices"))
    const trustedLocationsDoc = await getDoc(doc(db, "users", userId, "trusted", "locations"))

    const trustedDevices = trustedDevicesDoc.exists() ? trustedDevicesDoc.data().names || [] : []
    const trustedLocations = trustedLocationsDoc.exists() ? trustedLocationsDoc.data().ips || [] : []

    // Check if this is a new device
    const isNewDevice = !trustedDevices.includes(deviceInfo.deviceName)

    // Check if this is a new location
    const isNewLocation = !trustedLocations.includes(ipAddress)

    // If both device and location are trusted, it's not suspicious
    if (!isNewDevice && !isNewLocation) {
      return result
    }

    // If it's a new device or location, mark as suspicious
    if (isNewDevice) {
      result.isSuspicious = true
      result.reasons.push("New device")
      result.threatScore += 30
    }

    if (isNewLocation) {
      result.isSuspicious = true
      result.reasons.push("New location")
      result.threatScore += 30
    }

    // Get recent login history
    const sessionsRef = collection(db, "sessions")
    const q = query(sessionsRef, where("userId", "==", userId), where("ipAddress", "!=", ipAddress))

    try {
      const querySnapshot = await getDocs(q)

      // If there are recent logins from different locations
      if (!querySnapshot.empty) {
        // This is a different location than previous logins
        result.isSuspicious = true
        result.reasons.push("Multiple locations")
        result.threatScore += 20
      }
    } catch (error) {
      console.error("Error checking session history:", error)
      // Don't fail the whole check if this part fails
    }

    return result
  } catch (error) {
    console.error("Error in suspicious login check:", error)
    // Default to not suspicious on error
    return {
      isSuspicious: false,
      reasons: ["Error in check"],
      threatScore: 0,
    }
  }
}

// Get user's trusted data (locations, devices, login hours)
async function getTrustedData(userId) {
  try {
    // Check if user document exists first
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return {
        locations: [],
        devices: [],
        loginHours: Array.from({ length: 24 }, (_, i) => i), // All hours by default
      }
    }

    // Now try to get trusted data
    const trustedRef = collection(db, "users", userId, "trusted")
    const querySnapshot = await getDocs(trustedRef)

    // Default trusted data
    const trustedData = {
      locations: [],
      devices: [],
      loginHours: Array.from({ length: 24 }, (_, i) => i), // All hours by default
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      if (doc.id === "locations" && Array.isArray(data.ips)) {
        trustedData.locations = data.ips
      } else if (doc.id === "devices" && Array.isArray(data.names)) {
        trustedData.devices = data.names
      } else if (doc.id === "loginHours" && Array.isArray(data.hours)) {
        trustedData.loginHours = data.hours
      }
    })

    return trustedData
  } catch (error) {
    console.error("Error getting trusted data:", error)
    return {
      locations: [],
      devices: [],
      loginHours: Array.from({ length: 24 }, (_, i) => i), // All hours by default
    }
  }
}

// Log a suspicious login
async function logSuspiciousLogin(userId, ipAddress, deviceInfo, reasons, threatScore) {
  try {
    // Check if there's already a suspicious login with the same IP and device
    const suspiciousLoginsRef = collection(db, "suspiciousLogins")
    const q = query(
      suspiciousLoginsRef,
      where("userId", "==", userId),
      where("ipAddress", "==", ipAddress),
      where("deviceInfo.deviceName", "==", deviceInfo.deviceName),
      orderBy("timestamp", "desc"),
      limit(1),
    )

    const querySnapshot = await getDocs(q)

    // If there's already a suspicious login with the same IP and device, don't log it again
    if (!querySnapshot.empty) {
      return
    }

    const suspiciousLoginData = {
      userId,
      ipAddress,
      deviceInfo,
      reasons,
      threatScore,
      timestamp: serverTimestamp(),
      status: "unverified", // unverified, verified, rejected
    }

    await addDoc(collection(db, "suspiciousLogins"), suspiciousLoginData)

    // Also add to user's notifications
    const notificationData = {
      userId,
      type: "security",
      action: "suspicious_login",
      title: "Suspicious Login Detected",
      message: `Unusual login detected from ${deviceInfo.deviceName} at IP ${ipAddress}`,
      details: {
        reasons,
        threatScore,
        ipAddress,
        deviceName: deviceInfo.deviceName,
      },
      createdAt: serverTimestamp(),
      read: false,
    }

    await addDoc(collection(db, "notifications"), notificationData)
  } catch (error) {
    console.error("Error logging suspicious login:", error)
  }
}

// Get recent failed login attempts
async function getRecentFailedLoginAttempts(userId) {
  try {
    const cutoffTime = new Date(Date.now() - FAILED_ATTEMPT_WINDOW)

    const failedLoginsRef = collection(db, "failedLogins")
    const q = query(
      failedLoginsRef,
      where("userId", "==", userId),
      where("timestamp", ">=", cutoffTime),
      orderBy("timestamp", "desc"),
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.size
  } catch (error) {
    console.error("Error getting failed login attempts:", error)
    return 0
  }
}

// Function to log failed login attempts
export async function logFailedLoginAttempt(userId, email, ipAddress) {
  try {
    await addDoc(collection(db, "failedLogins"), {
      userId: userId || "unknown",
      email,
      ipAddress,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
    })
  } catch (error) {
    console.error("Error logging failed login:", error)
  }
}

// Get suspicious logins for a user
export async function getSuspiciousLogins(userId) {
  try {
    // Check if user document exists first
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      return []
    }

    const suspiciousLoginsRef = collection(db, "suspiciousLogins")
    const q = query(suspiciousLoginsRef, where("userId", "==", userId), orderBy("timestamp", "desc"), limit(10))

    const querySnapshot = await getDocs(q)
    const suspiciousLogins = []

    querySnapshot.forEach((doc) => {
      suspiciousLogins.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return suspiciousLogins
  } catch (error) {
    console.error("Error getting suspicious logins:", error)
    return []
  }
}

// Mark a suspicious login as verified or rejected
export async function updateSuspiciousLoginStatus(loginId, status) {
  try {
    await updateDoc(doc(db, "suspiciousLogins", loginId), {
      status,
      verifiedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("Error updating suspicious login status:", error)
    return false
  }
}

// Trust a device and location for the user so future logins won't be flagged
export async function trustDeviceAndLocation(userId, deviceName, ipAddress) {
  try {
    if (!userId) return false
    if (deviceName) {
      await updateDoc(doc(db, "users", userId, "trusted", "devices"), { names: arrayUnion(deviceName) })
    }
    if (ipAddress) {
      await updateDoc(doc(db, "users", userId, "trusted", "locations"), { ips: arrayUnion(ipAddress) })
    }
    return true
  } catch (error) {
    // If docs don't exist yet, create them
    try {
      if (deviceName) {
        await updateDoc(doc(db, "users", userId, "trusted", "devices"), { names: arrayUnion(deviceName) })
      }
    } catch {
      await addDoc(collection(db, "users", userId, "trusted"), {}) // ensure subcollection
      // Create explicit docs
      if (deviceName) {
        await updateDoc(doc(db, "users", userId, "trusted", "devices"), { names: arrayUnion(deviceName) }).catch(async () => {
          await setDoc(doc(db, "users", userId, "trusted", "devices"), { names: [deviceName] })
        })
      }
    }
    try {
      if (ipAddress) {
        await updateDoc(doc(db, "users", userId, "trusted", "locations"), { ips: arrayUnion(ipAddress) })
      }
    } catch {
      await setDoc(doc(db, "users", userId, "trusted", "locations"), { ips: ipAddress ? [ipAddress] : [] }, { merge: true })
    }
    return true
  }
}

// Create suspicious login record and notify user (bypass notification settings for security)
export async function createSuspiciousLoginAndNotify({ userId, sessionId, ipAddress, deviceInfo, userEmail }) {
  try {
    // Skip if an unverified suspicious login already exists for this session
    if (sessionId) {
      const existingQ = query(
        collection(db, "suspiciousLogins"),
        where("userId", "==", userId),
        where("sessionId", "==", sessionId),
        where("status", "==", "unverified"),
        limit(1)
      )
      const existingSnap = await getDocs(existingQ)
      if (!existingSnap.empty) {
        return existingSnap.docs[0].id
      }
    }

    const suspiciousLoginData = {
      userId,
      sessionId,
      ipAddress,
      deviceInfo,
      reasons: ["New device or location"],
      threatScore: 60,
      timestamp: serverTimestamp(),
      status: "unverified",
    }

    const docRef = await addDoc(collection(db, "suspiciousLogins"), suspiciousLoginData)

    // In-app notification (bypass settings for security)
    await sendNotification(userId, {
      title: "Suspicious Login Detected",
      message: `We noticed a login from ${deviceInfo?.deviceName || "Unknown device"} at IP ${ipAddress}. Please verify if this was you.`,
      type: "security",
      actionLink: "/dashboard/settings", // user can review from settings
      actionText: "Review",
      metadata: {
        suspiciousLoginId: docRef.id,
        sessionId,
        ipAddress,
        deviceName: deviceInfo?.deviceName || "Unknown",
        pushEnabled: true,
        emailEnabled: true,
      },
    }, { bypassSettings: true })

    // Email notification (bypass settings for security)
    if (userEmail) {
      const subject = "Security Alert: Suspicious Login"
      const body = `We detected a login to your SmartCare account from ${deviceInfo?.deviceName || "an unknown device"} at IP ${ipAddress}.

If this was you, you can safely ignore this email. If not, please review your Login Sessions and revoke unfamiliar sessions.`
      await sendEmailNotification(userEmail, subject, body, userId, true)
    }

    return docRef.id
  } catch (error) {
    console.error("Error creating suspicious login and notifying:", error)
    return null
  }
}

// Calculate distance between two points using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1)
  const dLon = deg2rad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  return distance
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}

// Get geolocation data for an IP address
async function getIpGeolocation(ip) {
  try {
    // Check if it's a private IP
    if (ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip === "Unknown") {
      return {
        latitude: 37.7749, // San Francisco
        longitude: -122.4194,
        country: "United States",
        city: "Local Network",
      }
    }

    // For demo purposes, generate "realistic" coordinates based on IP hash
    // This is NOT for production use - just to demonstrate the concept
    const hash = hashCode(ip)

    // Generate latitude between -90 and 90
    const latitude = (hash % 180) - 90

    // Generate longitude between -180 and 180
    const longitude = ((hash * 31) % 360) - 180

    return {
      latitude,
      longitude,
      country: `Country-${hash % 10}`,
      city: `City-${hash % 100}`,
    }
  } catch (error) {
    console.error("Error getting IP geolocation:", error)
    return null
  }
}

// Simple string hash function
function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}
