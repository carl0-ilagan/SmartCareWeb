import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore"
import { db } from "./firebase"

/**
 * Get user notification settings from Firestore
 * @param {string} userId - User ID to get settings for
 * @returns {Promise<{email: boolean, push: boolean}>} User notification preferences
 */
// Note: Do NOT fetch another user's settings here to avoid permission issues.
// Settings are respected in email-service (for email) and NotificationListener (for push) on the recipient's client.

// Request notification permission and send push notification
export async function sendPushNotification(title, body, data = {}) {
  try {
    if (typeof window === "undefined") return
    if (!("Notification" in window)) return

    // Ensure permission
    if (Notification.permission === "default") {
      try { await Notification.requestPermission() } catch {}
    }
    if (Notification.permission !== "granted") return

    // Use ServiceWorkerRegistration only; avoid constructing Notification directly
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready
        if (registration?.showNotification) {
          await registration.showNotification(title, {
            body,
            icon: "/SmartCare.png",
            badge: "/SmartCare.png",
            vibrate: [200, 100, 200],
            data: { url: data.url || "/", ...data },
            tag: data.tag || "appointment-notification",
            requireInteraction: false,
          })
        } else if (registration?.active) {
          registration.active.postMessage({
            type: "PUSH_NOTIFICATION",
            payload: {
              title,
              body,
              icon: "/SmartCare.png",
              badge: "/SmartCare.png",
              vibrate: [200, 100, 200],
              data: { url: data.url || "/", ...data },
              tag: data.tag || "appointment-notification",
            },
          })
        }
      } catch {}
    }
  } catch {}
}

// Send a notification to a user
// Note: In-app notifications are always created (they appear in the dropdown)
// Email and push notifications respect user settings
export async function sendNotification(userId, notification, options = {}) {
  try {
    // Always create in-app notification (appears in dropdown)
    // This respects user choice to see notifications in-app even if email/push are disabled
    const notificationRef = collection(db, "notifications")
    // Ensure metadata is a plain object without circular references
    const sanitizedMetadata = notification.metadata 
      ? Object.fromEntries(
          Object.entries(notification.metadata).filter(([key, value]) => {
            // Filter out functions, undefined, and other non-serializable values
            return typeof value !== 'function' && value !== undefined && value !== null
          })
        )
      : {}

    const newNotification = {
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type || "info",
      read: false,
      actionLink: notification.actionLink || null,
      actionText: notification.actionText || null,
      imageUrl: notification.imageUrl || null, // User profile image
      createdAt: serverTimestamp(),
      metadata: {
        ...sanitizedMetadata,
        // Do not include recipient settings here; client listener checks its own settings
      },
    }

    const docRef = await addDoc(notificationRef, newNotification)

    // Update user's notification counter
    // Note: This may fail if current user doesn't have permission to update recipient's user document
    // We'll catch the error and continue - the notification is already created
    try {
      const userRef = doc(db, "users", userId)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        await updateDoc(userRef, {
          unreadNotifications: (userDoc.data().unreadNotifications || 0) + 1,
          recentNotifications: arrayUnion({
            id: docRef.id,
            title: notification.title,
            createdAt: new Date().toISOString(),
            type: notification.type || "info",
          }),
        })
      }
    } catch (updateError) {
      // Log but don't fail - notification is already created
      // The user document update will happen when the recipient opens the app and sees their notifications
      console.warn("Could not update user notification counter (this is normal if creating notification for another user):", updateError.message)
    }

    return docRef.id
  } catch (error) {
    console.error("Error sending notification:", error)
    throw error
  }
}

// Send an access request notification to a patient
export async function sendAccessRequestNotification(patientId, adminId, adminName, dataType, reason) {
  try {
    // Get admin data for the notification
    const adminDoc = await getDoc(doc(db, "users", adminId))
    const adminData = adminDoc.exists() ? adminDoc.data() : { displayName: adminName || "Admin" }

    // Create notification
    const notification = {
      title: `Access Request: ${dataType}`,
      message: `${adminData.displayName} has requested access to your ${dataType}. Reason: ${reason}`,
      type: "access_request",
      actionLink: "/dashboard/settings/privacy",
      actionText: "Review Request",
      metadata: {
        adminId,
        adminName: adminData.displayName,
        dataType,
        reason,
        requestedAt: new Date().toISOString(),
      },
    }

    return await sendNotification(patientId, notification)
  } catch (error) {
    console.error("Error sending access request notification:", error)
    throw error
  }
}
