"use client"

import { useEffect, useRef } from "react"
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { sendPushNotification, requestNotificationPermission } from "@/lib/push-notification-utils"

/**
 * Notification Listener Component
 * Listens for new notifications and triggers push notifications
 * Works for both website and PWA
 */
export function NotificationListener({ userId, enabled = true }) {
  const lastNotificationRef = useRef(null)
  const hasRequestedPermission = useRef(false)
  const processedNotificationIdsRef = useRef(new Set()) // Track all processed notification IDs
  const userSettingsRef = useRef({ push: true }) // Cache user settings

  // Fetch user notification settings
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!userId) return
      
      try {
        const settingsDoc = await getDoc(doc(db, "userSettings", userId))
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data()
          userSettingsRef.current = {
            push: settings.notifications?.push !== false, // Default to true if not set
          }
          console.log("📋 User notification settings loaded:", userSettingsRef.current)
        } else {
          // Default to enabled if settings don't exist
          userSettingsRef.current = { push: true }
        }
      } catch (error) {
        console.error("Error fetching user notification settings:", error)
        // Default to enabled on error
        userSettingsRef.current = { push: true }
      }
    }

    fetchUserSettings()
  }, [userId])

  useEffect(() => {
    if (!userId || !enabled) return

    // Request notification permission once when component mounts
    if (!hasRequestedPermission.current && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        // Request permission more aggressively for better UX
        requestNotificationPermission().then(granted => {
          if (granted) {
            console.log("✅ Notification permission granted - Push notifications enabled")
          } else {
            console.log("❌ Notification permission denied")
          }
        }).catch(err => {
          console.error("Error requesting notification permission:", err)
        })
      } else if (Notification.permission === "granted") {
        console.log("✅ Notification permission already granted")
      }
      hasRequestedPermission.current = true
    }

    // Set up Firestore listener for new notifications
    const notificationsRef = collection(db, "notifications")
    
    // Use simple query without orderBy to avoid composite index requirement
    // We'll filter unread notifications and sort by createdAt in memory
    // This prevents the 400 error from missing Firestore composite index
    const q = query(
      notificationsRef,
      where("userId", "==", userId),
      limit(100) // Get enough to filter and sort in memory
    )

    console.log(`🔔 NotificationListener initialized for userId: ${userId}, enabled: ${enabled}`)

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Track if this is the first load
        const isFirstLoad = lastNotificationRef.current === null
        
        // Get all docChanges to detect NEW notifications
        const changes = snapshot.docChanges({ includeMetadataChanges: false })
        
        console.log(`📊 NotificationListener snapshot update for userId: ${userId}`, {
          isFirstLoad,
          totalDocs: snapshot.docs.length,
          changesCount: changes.length
        })
        
        // On first load, mark existing notifications as processed
        // But still check docChanges for any new notifications created during initialization
        if (isFirstLoad) {
          if (snapshot.docs.length > 0) {
            snapshot.docs.forEach(doc => {
              processedNotificationIdsRef.current.add(doc.id)
            })
            const latestDoc = snapshot.docs[0]
            lastNotificationRef.current = latestDoc.id
            console.log(`📥 NotificationListener initialized, marked ${snapshot.docs.length} existing notifications as processed`)
          } else {
            console.log(`📥 NotificationListener initialized, no existing notifications`)
          }
        }
        
        // Process "added" changes - these are NEW notifications
        changes.forEach((change) => {
          if (change.type === "added") {
            const notification = change.doc.data()
            const notificationId = change.doc.id

            // Skip if notification is read
            if (notification.read === true) {
              processedNotificationIdsRef.current.add(notificationId)
              return
            }

            // Skip if already processed
            if (processedNotificationIdsRef.current.has(notificationId)) {
              return
            }
            
            // On first load: only process if notification is NOT in the initial snapshot
            // This means it was created AFTER the listener started
            if (isFirstLoad) {
              const existsInSnapshot = snapshot.docs.some(doc => doc.id === notificationId)
              if (existsInSnapshot) {
                // Pre-existing notification - already marked as processed
                return
              }
              // This is a NEW notification - process it!
              console.log(`🔔 NEW notification detected during first load: ${notificationId}`)
            }

            // Check if push notifications are enabled for this user
            const pushEnabled = notification.metadata?.pushEnabled !== false && userSettingsRef.current.push
            
            if (!pushEnabled) {
              console.log("🔕 Push notifications disabled for user, skipping push notification:", {
                title: notification.title,
                notificationId,
                userSettings: userSettingsRef.current,
                metadata: notification.metadata
              })
              // Mark as processed but don't send push notification
              processedNotificationIdsRef.current.add(notificationId)
              lastNotificationRef.current = notificationId
              return
            }

            // Mark as processed BEFORE sending to prevent duplicate sends
            processedNotificationIdsRef.current.add(notificationId)
              lastNotificationRef.current = notificationId

            console.log("🔔🔔🔔 NEW UNREAD NOTIFICATION - Triggering push notification:", {
              title: notification.title,
              notificationId,
              userId: notification.userId,
              read: notification.read,
              createdAt: notification.createdAt,
              type: notification.type,
              pushEnabled: true
            })

            // Trigger push notification immediately (no delay for better UX)
            // Use user's profile image if available, otherwise use default icon
            const notificationIcon = notification.imageUrl || notification.metadata?.patientPhotoURL || notification.metadata?.doctorPhotoURL || "/SmartCare.png"
            const actionUrl = notification.actionLink || (userId ? "/doctor/appointments" : "/dashboard/appointments")
            
            console.log("📬 Sending push notification NOW:", {
              title: notification.title,
              message: notification.message,
              icon: notificationIcon,
              actionUrl,
              type: notification.type,
              notificationId,
              userId,
              permission: typeof window !== "undefined" && "Notification" in window ? Notification.permission : "N/A",
              hasServiceWorker: typeof navigator !== "undefined" && "serviceWorker" in navigator
            })
            
            // Send immediately - don't wait
            ;(async () => {
              try {
                // Check permission first
                if (typeof window !== "undefined" && "Notification" in window) {
                  if (Notification.permission !== "granted") {
                    console.warn("⚠️ Notification permission not granted, requesting...")
                    const permission = await requestNotificationPermission()
                    if (!permission) {
                      console.warn("⚠️ User denied notification permission - Push notifications disabled")
                      return
                    }
                    console.log("✅ Notification permission granted")
                  } else {
                    console.log("✅ Notification permission already granted")
                  }
                } else {
                  console.warn("⚠️ Notifications not supported in this browser")
                  return
                }

                const success = await sendPushNotification(notification.title || "New Notification", {
                  body: notification.message || "",
                  icon: notificationIcon, // User's profile image or default
                  badge: "/SmartCare.png",
                  tag: `notification-${notificationId}`,
                  data: {
                    url: actionUrl,
                    notificationId: notificationId,
                    imageUrl: notificationIcon, // Include in data for reference
                    type: notification.type || "info",
                  },
                })
                
                  if (success) {
                  console.log("✅✅✅ Push notification sent successfully!", {
                    title: notification.title,
                    userId,
                    notificationId,
                    timestamp: new Date().toISOString()
                  })
                  } else {
                  console.warn("⚠️ Push notification function returned false", {
                    title: notification.title,
                    userId,
                    notificationId,
                    permission: Notification?.permission || "unknown"
                  })
                  }
              } catch (error) {
                  console.error("❌ Error sending push notification:", error)
                console.error("Error details:", {
                  message: error.message,
                  stack: error.stack,
                  notificationId,
                  userId
                })
            }
            })()
          }
        })
      },
      (error) => {
        console.error("❌ Error listening to notifications:", error)
        if (error.code === "failed-precondition") {
          console.error("💡 Firestore index missing! Please create a composite index in Firestore Console:")
          console.error("   Collection: notifications")
          console.error("   Fields: userId (Ascending), read (Ascending), createdAt (Descending)")
        }
      }
    )

    return () => unsubscribe()
  }, [userId, enabled])

  // Add manual test function to window for debugging (only in development)
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      window.testPushNotification = async () => {
        console.log("🧪 Testing push notification manually...")
        const testTitle = "🧪 TEST: Smart Care Notification"
        const testBody = "If you see this notification pop-up, the system is working! Check your system notification area."
        
        try {
          // Check notification permission first
          if (Notification.permission !== "granted") {
            const permission = await Notification.requestPermission()
            if (permission !== "granted") {
              alert("⚠️ Notification permission denied. Please allow notifications in browser settings.")
              return
            }
          }
          
          const { sendPushNotification } = await import("@/lib/push-notification-utils")
          const success = await sendPushNotification(testTitle, {
            body: testBody,
            icon: "/SmartCare.png",
            badge: "/SmartCare.png",
            tag: "test-notification-" + Date.now(),
            data: {
              url: "/dashboard/appointments",
              type: "test",
            },
          })
          
          if (success) {
            console.log("✅ Test push notification sent successfully!")
            alert("✅ Test notification sent!\n\nCheck:\n1. Bottom-right corner (Windows notification tray)\n2. Top-right corner (Mac notification center)\n3. Browser notification pop-up\n\nIf you don't see it, check notification settings.")
          } else {
            console.warn("⚠️ Test push notification failed")
            alert("⚠️ Test notification failed!\n\nTroubleshooting:\n1. Check Windows: Settings > System > Notifications\n2. Check Chrome: chrome://settings/content/notifications\n3. Turn OFF 'Do Not Disturb' mode")
          }
        } catch (error) {
          console.error("❌ Error testing push notification:", error)
          alert(`❌ Error: ${error.message}\n\nCheck console for details.`)
        }
      }
      
      console.log("🧪 Test function ready: window.testPushNotification()")
      
      console.log("🧪 Manual test function added: window.testPushNotification()")
    }
  }, [])

  return null
}

