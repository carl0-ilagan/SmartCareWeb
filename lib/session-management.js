import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
  serverTimestamp,
  updateDoc,
  getDoc,
  addDoc,
  limit,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { checkSuspiciousLogin, createSuspiciousLoginAndNotify } from "./security-utils"
import { getDoc as getDocDirect, doc as docRefDirect } from "firebase/firestore"

// Get user's active sessions
export async function getUserSessions(userId) {
  try {
    // Create a reference to the sessions collection
    const sessionsRef = collection(db, "sessions")

    // Query for sessions belonging to this user
    const q = query(sessionsRef, where("userId", "==", userId), orderBy("lastActive", "desc"))

    // Execute the query
    const querySnapshot = await getDocs(q)

    // Get the current session token from localStorage
    const currentSessionToken = localStorage.getItem("sessionToken")

    // Process results and de-duplicate by device+IP, keeping the most recent
    const keyToSession = new Map()
    querySnapshot.forEach((docSnap) => {
      const sessionData = docSnap.data()
      const normalizedIp = sessionData.ipAddress === "Fetching..." ? "Unknown" : sessionData.ipAddress
      const key = `${sessionData.deviceName || "Unknown"}|${normalizedIp || "Unknown"}`

      const candidate = {
        id: docSnap.id,
        ...sessionData,
        ipAddress: normalizedIp,
        isCurrentSession: sessionData.sessionToken === currentSessionToken,
      }

      const existing = keyToSession.get(key)
      if (!existing) {
        keyToSession.set(key, candidate)
      } else {
        // Keep the one with the latest lastActive (fallback to createdAt)
        const getTs = (s) => (s.lastActive?.toMillis?.() ? s.lastActive.toMillis() : (s.lastActive ? new Date(s.lastActive).getTime() : 0))
        const getCreated = (s) => (s.createdAt?.toMillis?.() ? s.createdAt.toMillis() : (s.createdAt ? new Date(s.createdAt).getTime() : 0))
        const existingTs = getTs(existing) || getCreated(existing)
        const candidateTs = getTs(candidate) || getCreated(candidate)
        const preferred = candidateTs >= existingTs ? candidate : existing
        // If either is current session, prefer the current one regardless of timestamp
        const finalChoice = preferred.isCurrentSession ? preferred : (existing.isCurrentSession ? existing : preferred)
        keyToSession.set(key, finalChoice)
      }
    })

    // Sort by lastActive desc
    const sessions = Array.from(keyToSession.values()).sort((a, b) => {
      const getTs = (s) => (s.lastActive?.toMillis?.() ? s.lastActive.toMillis() : (s.lastActive ? new Date(s.lastActive).getTime() : 0))
      return (getTs(b) || 0) - (getTs(a) || 0)
    })

    return sessions
  } catch (error) {
    console.error("Error getting user sessions:", error)
    return []
  }
}

// Revoke (delete) a specific session
export async function revokeSession(sessionId) {
  try {
    // Get the session first to check if it exists and belongs to the user
    const sessionDoc = await getDoc(doc(db, "sessions", sessionId))

    if (!sessionDoc.exists()) {
      throw new Error("Session not found")
    }

    // Delete the session
    await deleteDoc(doc(db, "sessions", sessionId))
    return true
  } catch (error) {
    console.error("Error revoking session:", error)
    throw error
  }
}

// Revoke all sessions except the current one
export async function revokeAllOtherSessions(userId) {
  try {
    // Get the current session token
    const currentSessionToken = localStorage.getItem("sessionToken")

    if (!currentSessionToken) {
      throw new Error("No current session found")
    }

    // Get all sessions for this user
    const sessionsRef = collection(db, "sessions")
    const q = query(sessionsRef, where("userId", "==", userId))

    const querySnapshot = await getDocs(q)

    // Delete all sessions except the current one
    const batch = []
    querySnapshot.forEach((doc) => {
      const sessionData = doc.data()
      if (sessionData.sessionToken !== currentSessionToken) {
        batch.push(deleteDoc(doc.ref))
      }
    })

    // Execute all deletions
    await Promise.all(batch)

    return true
  } catch (error) {
    console.error("Error revoking other sessions:", error)
    throw error
  }
}

// Update session's last active timestamp
export async function updateSessionActivity(sessionId) {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (sessionSnap.exists()) {
      await updateDoc(sessionRef, {
      lastActive: serverTimestamp(),
      });
      return true;
    } else {
      console.warn(`Attempted to update non-existent session: ${sessionId}`);
      return false; // Indicate that the session was not found
    }
  } catch (error) {
    console.error("Error updating session activity:", error);
    return false;
  }
}

// Format session time for display
export function formatSessionTime(timestamp) {
  if (!timestamp) return "Unknown"

  try {
    // Convert Firebase timestamp to JavaScript Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)

    // Check if the date is today
    const now = new Date()
    const isToday =
      date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()

    // Format the time
    const timeOptions = { hour: "numeric", minute: "numeric", hour12: true }
    const formattedTime = date.toLocaleTimeString(undefined, timeOptions)

    if (isToday) {
      // Calculate minutes ago
      const minutesAgo = Math.floor((now - date) / (1000 * 60))

      if (minutesAgo < 1) {
        return "Just now"
      } else if (minutesAgo < 60) {
        return `${minutesAgo} minute${minutesAgo === 1 ? "" : "s"} ago`
      } else {
        return formattedTime
      }
    } else {
      // Format the date
      const dateOptions = { month: "short", day: "numeric" }
      const formattedDate = date.toLocaleDateString(undefined, dateOptions)

      return `${formattedDate}, ${formattedTime}`
    }
  } catch (error) {
    console.error("Error formatting session time:", error)
    return "Unknown"
  }
}

// Function to create or update a user session
export async function createOrUpdateSession(userId, userEmail) {
  try {
    // Generate a unique session token
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem("sessionToken", sessionToken)

    // Get device and browser information
    const ua = navigator.userAgent || ""
    const isEdge = ua.includes("Edg/") || ua.includes("Edge/")
    const isFirefox = ua.includes("Firefox/")
    const isSafari = !ua.includes("Chrom") && ua.includes("Safari/")
    const isChrome = ua.includes("Chrome/") && !isEdge
    const browser = isEdge ? "Edge" : isChrome ? "Chrome" : isFirefox ? "Firefox" : isSafari ? "Safari" : "Unknown Browser"

    const deviceInfo = {
      browser,
      os: navigator.userAgent.includes("Windows")
        ? "Windows"
        : navigator.userAgent.includes("Mac")
          ? "macOS"
          : navigator.userAgent.includes("Linux")
            ? "Linux"
            : navigator.userAgent.includes("Android")
              ? "Android"
              : navigator.userAgent.includes("iPhone") || navigator.userAgent.includes("iPad")
                ? "iOS"
                : "Unknown OS",
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    }

    // Get IP address using a reliable service
    let ipAddress = "Unknown"
    try {
      // Try multiple IP services in case one fails
      const ipServices = ["https://api.ipify.org?format=json", "https://ipinfo.io/json", "https://api.ip.sb/jsonip"]

      // Try each service until one works
      for (const service of ipServices) {
        try {
          const response = await fetch(service)
          if (response.ok) {
            const data = await response.json()
            ipAddress = data.ip
            break
          }
        } catch (e) {
          console.log(`IP service ${service} failed, trying next...`)
        }
      }
    } catch (error) {
      console.error("Error fetching IP:", error)
    }

    // Create the session in Firestore
    const sessionData = {
      userId: userId,
      userEmail: userEmail,
      deviceName: `${deviceInfo.browser} on ${deviceInfo.os}`,
      deviceType: deviceInfo.isMobile ? "mobile" : "desktop",
      ipAddress: ipAddress,
      lastActive: serverTimestamp(),
      createdAt: serverTimestamp(),
      sessionToken: sessionToken,
    }

    // Check for existing session with same device and IP
    const sessionsRef = collection(db, "sessions")
    const q = query(
      sessionsRef,
      where("userId", "==", userId),
      where("deviceName", "==", sessionData.deviceName),
      where("ipAddress", "==", ipAddress),
    )

    let querySnapshot = await getDocs(q)

    let sessionId
    let isTrusted = false

    let existingSession = false
    if (!querySnapshot.empty) {
      // Update existing session
      const existingDoc = querySnapshot.docs[0]
      sessionId = existingDoc.id
      const existingData = existingDoc.data()
      isTrusted = existingData?.trusted === true
      existingSession = true
      await updateDoc(doc(db, "sessions", sessionId), {
        lastActive: serverTimestamp(),
        sessionToken: sessionToken,
      })
    } else {
      // Try find by IP only as a fallback (browser string can change)
      if (ipAddress && ipAddress !== "Unknown") {
        const byIpQ = query(sessionsRef, where("userId", "==", userId), where("ipAddress", "==", ipAddress))
        const byIpSnap = await getDocs(byIpQ)
        if (!byIpSnap.empty) {
          const existingDoc = byIpSnap.docs[0]
          sessionId = existingDoc.id
          const existingData = existingDoc.data()
          isTrusted = existingData?.trusted === true
          existingSession = true
          await updateDoc(doc(db, "sessions", sessionId), {
            lastActive: serverTimestamp(),
            sessionToken: sessionToken,
            deviceName: sessionData.deviceName, // update to latest detected label
          })
        }
      }

      if (!existingSession) {
        // Before creating a new session, do one more check:
        // Look for any recent session (within last 10 minutes) for this user+IP
        // This helps catch cases where device name might have changed slightly
        if (ipAddress && ipAddress !== "Unknown") {
          const recentByIpQ = query(
            sessionsRef,
            where("userId", "==", userId),
            where("ipAddress", "==", ipAddress),
            orderBy("lastActive", "desc"),
            limit(1)
          )
          const recentByIpSnap = await getDocs(recentByIpQ)
          
          if (!recentByIpSnap.empty) {
            const recentSession = recentByIpSnap.docs[0]
            const recentSessionData = recentSession.data()
            if (recentSessionData.lastActive) {
              const lastActiveTime = recentSessionData.lastActive.toMillis ? recentSessionData.lastActive.toMillis() : recentSessionData.lastActive
              const now = Date.now()
              const timeSinceLastActive = now - lastActiveTime
              
              // If there was activity within the last 10 minutes, update that session instead
              if (timeSinceLastActive < 10 * 60 * 1000) {
                sessionId = recentSession.id
                isTrusted = recentSessionData?.trusted === true
                existingSession = true
                await updateDoc(doc(db, "sessions", sessionId), {
                  lastActive: serverTimestamp(),
                  sessionToken: sessionToken,
                  deviceName: sessionData.deviceName, // update to latest detected label
                })
              }
            }
          }
        }
        
        // Only create new session if we still don't have one
        if (!existingSession) {
          const sessionRef = await addDoc(collection(db, "sessions"), sessionData)
          sessionId = sessionRef.id
        }
      }
    }

    // Set up heartbeat to update lastActive
    setupSessionHeartbeat(sessionId)

    // Check for suspicious login ONLY if 2FA is explicitly enabled
    // IMPORTANT: This is separate from device approval - this is for suspicious login detection
    // ONLY for truly NEW sessions (not updates), and only if not already trusted
    try {
      const settingsSnap = await getDocDirect(docRefDirect(db, "userSettings", userId))
      // STRICT CHECK: Only enable suspicious login check if twoFactor is explicitly true
      const twoFactorEnabled = settingsSnap.exists() 
        ? settingsSnap.data()?.security?.twoFactor === true 
        : false
      
      // Only check for suspicious login if:
      // 1. 2FA is enabled
      // 2. Session is not trusted
      // 3. This is a NEW session (not an existing one being updated)
      // 4. IP address is valid
      if (twoFactorEnabled && !isTrusted && !existingSession && ipAddress && ipAddress !== "Unknown") {
        // Check if there's already an unverified suspicious login for this device+IP combination
        const suspiciousLoginsRef = collection(db, "suspiciousLogins")
        const existingSuspiciousQ = query(
          suspiciousLoginsRef,
          where("userId", "==", userId),
          where("ipAddress", "==", ipAddress),
          where("deviceInfo.deviceName", "==", sessionData.deviceName),
          where("status", "==", "unverified"),
          limit(1)
        )
        const existingSuspiciousSnap = await getDocs(existingSuspiciousQ)
        
        // If there's already an unverified suspicious login for this device+IP, skip
        if (!existingSuspiciousSnap.empty) {
          console.log("[Suspicious Login] Already have unverified suspicious login for this device+IP, skipping")
          return {
            id: sessionId,
            ...sessionData,
          }
        }
        
        // Check if session was created very recently (within last 1 minute)
        // This helps distinguish new logins from page refreshes
        // If session is older than 1 minute, it's likely not a new login
        const sessionDoc = await getDoc(doc(db, "sessions", sessionId))
        if (sessionDoc.exists()) {
          const sessionDataFromDb = sessionDoc.data()
          const createdAt = sessionDataFromDb.createdAt
          if (createdAt) {
            const createdAtTime = createdAt.toMillis ? createdAt.toMillis() : createdAt
            const now = Date.now()
            const timeSinceCreation = now - createdAtTime
            
            // If session was created more than 1 minute ago, it's likely not a new login
            // (could be a refresh or session update that we missed)
            if (timeSinceCreation > 60 * 1000) {
              console.log("[Suspicious Login] Session is older than 1 minute, likely not a new login, skipping")
              return {
                id: sessionId,
                ...sessionData,
              }
            }
          }
        }
        
        const deviceInfoForCheck = { deviceName: sessionData.deviceName }
        const check = await checkSuspiciousLogin(userId, ipAddress, deviceInfoForCheck)
        if (check?.isSuspicious) {
          await createSuspiciousLoginAndNotify({
            userId,
            sessionId,
            ipAddress,
            deviceInfo: deviceInfoForCheck,
            userEmail,
          })
        }
      }
    } catch (e) {
      console.error("Error running suspicious login flow:", e)
    }

    return {
      id: sessionId,
      ...sessionData,
    }
  } catch (error) {
    console.error("Error creating session:", error)
    // Don't throw - this is a non-critical operation
    return {
      id: "unknown",
      deviceName: "Unknown device",
      deviceType: "unknown",
      ipAddress: "Unknown",
    }
  }
}

// Function to keep the session alive
function setupSessionHeartbeat(sessionId) {
  // Update lastActive every 5 minutes
  const heartbeatInterval = setInterval(
    async () => {
      try {
        const auth = (await import("@/lib/firebase")).auth;

        if (!auth.currentUser) {
          console.log("User logged out, clearing session heartbeat.");
          clearInterval(heartbeatInterval);
          return;
        }

        const sessionRef = doc(db, "sessions", sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (sessionSnap.exists()) {
          await updateDoc(sessionRef, {
          lastActive: serverTimestamp(),
          });
          // console.log(`Session heartbeat updated for ${sessionId}`); // Optional: uncomment for debugging
        } else {
          console.warn(`Session document not found during heartbeat: ${sessionId}. Clearing heartbeat.`);
          clearInterval(heartbeatInterval);
        }
      } catch (error) {
        if (error?.code !== "permission-denied") {
          console.error("Error updating session heartbeat:", error);
        }
        clearInterval(heartbeatInterval); // Stop heartbeat on any error to avoid spam
      }
    },
    5 * 60 * 1000,
  ); // 5 minutes

  // Store the interval ID to clear it on logout
  window.sessionHeartbeat = heartbeatInterval;

  // Also update on page visibility changes
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState === "visible") {
      try {
        const auth = (await import("@/lib/firebase")).auth;

        if (!auth.currentUser) {
           console.log("User logged out, skipping visibility update.");
           return;
        }

        const sessionRef = doc(db, "sessions", sessionId);
        const sessionSnap = await getDoc(sessionRef);

        if (sessionSnap.exists()) {
          await updateDoc(sessionRef, {
            lastActive: serverTimestamp(),
          });
           // console.log(`Session visibility update for ${sessionId}`); // Optional: uncomment for debugging
        } else {
          console.warn(`Session document not found during visibility change: ${sessionId}. No update performed.`);
          // No need to clear interval here, heartbeat will handle it.
        }

      } catch (error) {
        if (error?.code !== "permission-denied") {
          console.error("Error updating session on visibility change:", error);
        }
      }
    }
  });
}
