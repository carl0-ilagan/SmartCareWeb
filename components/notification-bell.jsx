"use client"

import { useState, useRef, useEffect } from "react"
import { Bell } from "lucide-react"
import { NotificationDropdown } from "./notification-dropdown"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const dropdownRef = useRef(null)
  const { user } = useAuth()
  const [hasAccessRequests, setHasAccessRequests] = useState(false)
  const [notifications, setNotifications] = useState([]) // Added notifications state

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Get unread notification count - real-time
  useEffect(() => {
    if (!user || !user.uid) return

    try {
      const notificationsRef = collection(db, "notifications")
      const q = query(
        notificationsRef,
        where("userId", "==", user.uid),
        where("read", "==", false),
        orderBy("createdAt", "desc"),
      )

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const newCount = querySnapshot.size
          const newNotifications = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          setNotifications(newNotifications)

          // If we have more unread notifications than before, show animation
          if (newCount > unreadCount && unreadCount > 0) {
            setHasNewNotification(true)
            setTimeout(() => setHasNewNotification(false), 3000)
          }

          setUnreadCount(newCount)
        },
        (error) => {
          console.error("Error getting unread count:", error)
        },
      )

      return () => unsubscribe()
    } catch (error) {
      console.error("Error setting up notification listener:", error)
    }
  }, [user, unreadCount])

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      // Check if there are any access request notifications
      const accessRequests = notifications.filter(
        (notification) => notification.type === "access_request" && !notification.read,
      )
      setHasAccessRequests(accessRequests.length > 0)
    } else {
      setHasAccessRequests(false)
    }
  }, [notifications])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-1 text-drift-gray hover:bg-pale-stone hover:text-soft-amber focus:outline-none transition-colors"
        aria-label="Notifications"
      >
        <Bell
          className={`h-6 w-6 ${hasAccessRequests ? "text-amber-500" : "text-drift-gray"} ${hasNewNotification ? "animate-bell" : ""}`}
        />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs text-white ${
              hasAccessRequests ? "bg-amber-500" : "bg-soft-amber"
            }`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && <NotificationDropdown />}
      <style jsx global>{`
        @keyframes bell-ring {
          0%,
          100% {
            transform: rotate(0);
          }
          10%,
          30%,
          50% {
            transform: rotate(10deg);
          }
          20%,
          40%,
          60% {
            transform: rotate(-10deg);
          }
          70% {
            transform: rotate(5deg);
          }
          80% {
            transform: rotate(-5deg);
          }
          90% {
            transform: rotate(2deg);
          }
        }

        .animate-bell {
          animation: bell-ring 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
