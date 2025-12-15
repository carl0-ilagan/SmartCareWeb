/**
 * Push notification utilities for client-side use
 * Works for both website and PWA
 */

/**
 * Request notification permission if not granted
 */
export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

/**
 * Check if notifications are supported and permission is granted
 */
export function canSendNotifications() {
  if (typeof window === "undefined") return false
  return "Notification" in window && Notification.permission === "granted"
}

/**
 * Send a push notification via service worker (for PWA)
 */
export async function sendServiceWorkerNotification(title, options = {}) {
  try {
    if (!("serviceWorker" in navigator)) {
      console.log("⚠️ Service worker not supported")
      return false
    }

    const registration = await navigator.serviceWorker.ready
    
    if (registration.active) {
      // Try to use showNotification if available (preferred method)
      if (registration.showNotification) {
        try {
          const notificationPromise = registration.showNotification(title, {
            body: options.body || "",
            icon: options.icon || "/SmartCare.png",
            badge: options.badge || "/SmartCare.png",
            tag: options.tag || "notification",
            data: options.data || {},
            requireInteraction: false,
            vibrate: [200, 100, 200],
            silent: false, // Ensure notification makes sound/vibration
          })
          
          await notificationPromise
          console.log("✅ Service worker showNotification called and notification should be visible now")
          
          // Verify notification was shown
          setTimeout(() => {
            console.log("📋 Notification sent via service worker - check your browser/system notifications")
            console.log("💡 If notification is not visible:")
            console.log("   1. Check browser notification settings (Chrome: chrome://settings/content/notifications)")
            console.log("   2. Check system notification settings (Windows: Settings > System > Notifications)")
            console.log("   3. Ensure 'Do Not Disturb' mode is OFF")
            console.log("   4. Try switching tabs or minimizing the browser")
          }, 100)
          
          return true
        } catch (swError) {
          console.log("⚠️ showNotification failed, trying postMessage:", swError)
        }
      }
      
      // Fallback to postMessage if showNotification is not available
      registration.active.postMessage({
        type: "PUSH_NOTIFICATION",
        payload: {
          title,
          body: options.body || "",
          icon: options.icon || "/SmartCare.png",
          badge: options.badge || "/SmartCare.png",
          tag: options.tag || "notification",
          data: options.data || {},
          requireInteraction: false,
          vibrate: [200, 100, 200],
          silent: false,
          ...options,
        },
      })
      console.log("✅ Service worker postMessage sent - service worker should show notification")
      
      // Verify message was sent
      setTimeout(() => {
        console.log("📋 Notification sent via postMessage - check your browser/system notifications")
      }, 100)
      
      return true
    } else {
      console.log("⚠️ No active service worker")
    }
  } catch (error) {
    console.error("❌ Error sending service worker notification:", error)
    console.error("Error details:", {
      message: error.message,
      stack: error.stack
    })
  }
  
  return false
}

/**
 * Send a browser notification (for website)
 */
export async function sendBrowserNotification(title, options = {}) {
  try {
    console.log("📱 sendBrowserNotification called:", { title, options })
    
    if (!canSendNotifications()) {
      console.log("⚠️ Cannot send notifications, requesting permission...")
      // Try to request permission
      const hasPermission = await requestNotificationPermission()
      if (!hasPermission) {
        console.warn("⚠️ Permission denied for browser notification")
        return false
      }
    }

    // Use Service Worker API when possible to avoid Illegal constructor
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready
      if (registration?.showNotification) {
        await registration.showNotification(title, {
          body: options.body || "",
          icon: options.icon || "/SmartCare.png",
          badge: options.badge || "/SmartCare.png",
          tag: options.tag || "notification",
          data: options.data || {},
          requireInteraction: false,
          vibrate: [200, 100, 200],
          silent: false,
        })
        return true
      } else if (registration?.active) {
        registration.active.postMessage({
          type: "PUSH_NOTIFICATION",
          payload: {
            title,
            body: options.body || "",
            icon: options.icon || "/SmartCare.png",
            badge: options.badge || "/SmartCare.png",
            tag: options.tag || "notification",
            data: options.data || {},
            requireInteraction: false,
            vibrate: [200, 100, 200],
            silent: false,
          },
        })
        return true
      }
    }
    return false
  } catch (error) {
    console.error("❌ Error sending browser notification:", error)
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return false
  }
}

/**
 * Send push notification (works for both website and PWA)
 */
export async function sendPushNotification(title, options = {}) {
  console.log("🚀 sendPushNotification called:", { title, options })
  
  try {
    // Check if notifications are supported
    if (typeof window === "undefined") {
      console.warn("⚠️ Window is undefined - cannot send notification")
      return false
    }

    if (!("Notification" in window)) {
      console.warn("⚠️ Notifications not supported in this browser")
      return false
    }

    // Ensure we have permission
    if (Notification.permission !== "granted") {
      console.log("⚠️ Notification permission not granted, requesting...")
      const hasPermission = await requestNotificationPermission()
      if (!hasPermission) {
        console.warn("⚠️ User denied notification permission")
        return false
      }
      console.log("✅ Notification permission granted")
    }

    console.log("✅ Notification permission confirmed:", Notification.permission)

    // Check if running in PWA mode (standalone)
    const isStandalone = typeof window !== "undefined" && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator.standalone === true) ||
      document.referrer.includes('android-app://')
    )
    
    console.log("📱 Running in:", isStandalone ? "PWA (Standalone)" : "Web Browser")

    // For desktop web, prioritize browser notifications
    // For PWA, prioritize service worker notifications
    if (isStandalone) {
      // PWA mode: Try service worker first, then browser as fallback
      console.log("🔧 PWA mode: Attempting service worker notification first...")
      if ("serviceWorker" in navigator) {
        try {
          const swSuccess = await sendServiceWorkerNotification(title, options)
          if (swSuccess) {
            console.log("✅✅✅ Service worker notification sent successfully (PWA)!")
            // Also try browser notification as backup
            try {
              await sendBrowserNotification(title, options)
            } catch (browserError) {
              // Ignore browser errors if service worker succeeded
            }
            return true
          }
        } catch (swError) {
          console.warn("⚠️ Service worker notification failed in PWA, trying browser...")
        }
      }
      
      // Fallback to browser notification in PWA
      try {
        const browserSuccess = await sendBrowserNotification(title, options)
        if (browserSuccess) {
          console.log("✅✅✅ Browser notification sent successfully (PWA fallback)!")
          return true
        }
      } catch (browserError) {
        console.warn("⚠️ Browser notification also failed in PWA:", browserError)
      }
    } else {
      // Web browser mode: Try browser notification first, then service worker
      console.log("🔧 Web browser mode: Attempting browser notification first...")
      try {
        const browserSuccess = await sendBrowserNotification(title, options)
        if (browserSuccess) {
          console.log("✅✅✅ Browser notification sent successfully (Web)!")
          // Also try service worker as backup
          if ("serviceWorker" in navigator) {
            try {
              await sendServiceWorkerNotification(title, options)
            } catch (swError) {
              // Ignore service worker errors if browser notification succeeded
            }
          }
          return true
        } else {
          console.warn("⚠️ Browser notification returned false in web, trying service worker...")
        }
      } catch (browserError) {
        console.warn("⚠️ Browser notification failed in web, trying service worker:", browserError)
      }
      
      // Fallback to service worker if browser notification fails
      if ("serviceWorker" in navigator) {
        try {
          console.log("🔧 Attempting service worker notification (web fallback)...")
          const swSuccess = await sendServiceWorkerNotification(title, options)
          if (swSuccess) {
            console.log("✅✅✅ Service worker notification sent successfully (Web fallback)!")
            return true
          } else {
            console.warn("⚠️ Service worker notification also failed in web")
            return false
          }
        } catch (swError) {
          console.warn("⚠️ Service worker notification failed in web:", swError)
          return false
        }
      } else {
        console.warn("⚠️ Service worker not available, browser notification already failed")
        return false
      }
    }
    
    return false
  } catch (error) {
    console.error("❌ Error in sendPushNotification:", error)
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return false
  }
}


