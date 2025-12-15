"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Bell, Menu, Mail } from "lucide-react"
import useMobile from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/auth-context"
import { LogoutConfirmation } from "@/components/logout-confirmation"
import { Logo } from "@/components/logo"
import { collection, query, where, orderBy, limit, onSnapshot, getDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import ProfileImage from "@/components/profile-image"

export function AdminTopNav({ onMenuClick, sidebarCollapsed }) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const isMobile = useMobile()
  const { user, userProfile, logout } = useAuth()
  const notificationUnsubscribe = useRef(null)

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return "Just now"
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

    return date.toLocaleDateString()
  }

  // Fetch logs from Firestore (same as System Logs page)
  useEffect(() => {
    setIsLoadingNotifications(true)
    const logsRef = collection(db, "logs")
    
    // Query for latest 5 logs, ordered by timestamp descending
    const q = query(
      logsRef,
      orderBy("timestamp", "desc"),
      limit(5)
    )

    notificationUnsubscribe.current = onSnapshot(
      q,
      async (querySnapshot) => {
        const logsData = []
        let unread = 0

        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data()
          const timestamp = data.timestamp?.toDate() || new Date()
          
          // Fetch user profile picture
          let profilePic = null
          let userName = data.user || "System"
          
          if (data.user && data.user !== "system" && data.user !== "admin") {
            try {
              const userDoc = await getDoc(doc(db, "users", data.user))
              if (userDoc.exists()) {
                const userData = userDoc.data()
                profilePic = userData.photoURL || null
                userName = userData.displayName || userData.name || data.user
              }
            } catch (error) {
              console.error("Error fetching user profile:", error)
            }
          } else if (data.user === "admin") {
            // For admin, use current admin profile
            profilePic = userProfile?.photoURL || user?.photoURL || null
            userName = userProfile?.displayName || user?.displayName || "Admin"
          }

          // Consider logs as "unread" if they're from the last hour
          const oneHourAgo = new Date()
          oneHourAgo.setHours(oneHourAgo.getHours() - 1)
          const isRecent = timestamp > oneHourAgo
          if (isRecent) unread++

          logsData.push({
            id: docSnap.id,
            message: data.action || "System activity",
            details: data.details || "",
            time: formatTimeAgo(timestamp),
            createdAt: timestamp,
            unread: isRecent,
            type: data.type || "info",
            profilePic: profilePic,
            userName: userName,
            userRole: data.userRole || "system",
          })
        }

        setNotifications(logsData)
        setUnreadCount(unread)
        setIsLoadingNotifications(false)
      },
      (error) => {
        console.error("Error fetching logs:", error)
        setIsLoadingNotifications(false)
      }
    )

    return () => {
      if (notificationUnsubscribe.current) {
        notificationUnsubscribe.current()
      }
    }
  }, [user?.uid, userProfile])

  // Toggle notifications dropdown
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }

  // Handle logout
  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  // Confirm logout
  const confirmLogout = async (force = false) => {
    const result = await logout(force)
    // If logout was prevented (PWA mode), show a message
    if (result?.prevented) {
      console.log("Logout prevented - running as PWA")
      // You can add a toast notification here if needed
    }
    setShowLogoutModal(false)
  }

  // Close dropdowns when clicking outside
  const handleClickOutside = (e) => {
    if (!e.target.closest(".dropdown-container")) {
      setShowNotifications(false)
    }
  }

  // Add click outside listener
  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Get profile photo URL from userProfile or user
  const profilePhotoURL = userProfile?.photoURL || user?.photoURL || null

  return (
    <>
      <style jsx global>{`
        .notification-dropdown-scroll::-webkit-scrollbar {
          display: none;
        }
        .notification-dropdown-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    <header
      className={`
  sticky top-0 z-20 bg-white shadow-sm w-full
  transition-all duration-300 ease-in-out mb-0
`}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left side - Menu button (mobile) and Logo - SmartCare - Role */}
        <div className="flex items-center">
          {isMobile && (
            <button onClick={onMenuClick} className="p-2 mr-2 rounded-full hover:bg-pale-stone">
              <Menu className="h-5 w-5 text-graphite" />
            </button>
          )}

          {/* Logo with smooth transition - only show when sidebar is collapsed or on mobile */}
          <div
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
              sidebarCollapsed || isMobile ? "w-auto opacity-100 max-w-[200px]" : "w-0 opacity-0 max-w-0"
            }`}
          >
            <Logo href="/admin/dashboard" showBadge={false} />
          </div>
        </div>

        {/* Right side - mail and notifications */}
        <div className="flex items-center space-x-1 md:space-x-2">
          {/* Mail Icon - Contact Form Messages */}
          <Link
            href="/admin/messages"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors relative"
            aria-label="Messages"
            title="View contact form messages"
          >
            <Mail className="h-5 w-5" />
          </Link>
          {/* Notifications */}
          <div className="relative dropdown-container">
            <button
              onClick={toggleNotifications}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>

            {/* Notifications dropdown with smooth animation */}
            <div
              className={`absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl py-2 z-30 border border-gray-200 transition-all duration-200 ease-out origin-top-right ${
                showNotifications
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <Link
                  href="/admin/logs"
                  className="text-xs text-amber-600 hover:text-amber-700 hover:underline font-medium"
                  onClick={() => setShowNotifications(false)}
                >
                    View All
                  </Link>
                </div>
              <div className="max-h-96 overflow-y-auto notification-dropdown-scroll">
                {isLoadingNotifications ? (
                  <div className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-all duration-200 ${
                        notification.unread ? "bg-amber-50/30" : ""
                      }`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Profile Picture */}
                        {notification.profilePic ? (
                          <div className="flex-shrink-0">
                            <ProfileImage
                              src={notification.profilePic}
                              alt={notification.userName}
                              className="h-10 w-10 rounded-full"
                              role={notification.userRole || "user"}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <Bell className="h-5 w-5 text-amber-600" />
                          </div>
                        )}

                        {/* Log Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900">{notification.userName}</p>
                            <span className="text-xs text-gray-500 capitalize">({notification.userRole})</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{notification.message}</p>
                          {notification.details && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">{notification.details}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>

                        {/* Unread Indicator */}
                        {notification.unread && (
                          <span className="h-2 w-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                        )}
                      </div>
                    </div>
                  ))
                )}
                </div>
              </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmation
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </header>
    </>
  )
}
