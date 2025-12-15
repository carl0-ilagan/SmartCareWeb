"use client"

import { useState, useEffect } from "react"
import {
  Bell,
  Check,
  Filter,
  Search,
  Trash2,
  Pill,
  Calendar,
  MessageSquare,
  FileText,
  Plus,
  X,
  RefreshCw,
  CheckCircle,
  Edit,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import NoNotificationsAnimation from "@/components/no-notifications-animation"
import { SuccessNotification } from "@/components/success-notification"
import { DashboardHeaderBanner } from "@/components/dashboard-header-banner"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, unread, read
  const [typeFilter, setTypeFilter] = useState("all") // all, appointment, message, prescription, record
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const [showTypeFilterMenu, setShowTypeFilterMenu] = useState(false)
  const [userSettings, setUserSettings] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const { user } = useAuth()

  // Fetch user settings
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) return

      try {
        const settingsDoc = await getDoc(doc(db, "userSettings", user.uid))
        if (settingsDoc.exists()) {
          setUserSettings(settingsDoc.data())
        } else {
          // Default settings if none exist
          setUserSettings({
            notifications: {
              appointments: true,
              messages: true,
              prescriptions: true,
              reminders: true,
              marketing: false,
            },
          })
        }
      } catch (error) {
        console.error("Error fetching user settings:", error)
        // Set default settings on error
        setUserSettings({
          notifications: {
            appointments: true,
            messages: true,
            prescriptions: true,
            reminders: true,
            marketing: false,
          },
        })
      }
    }

    fetchUserSettings()
  }, [user])

  // Fetch notifications based on user settings
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || !userSettings) return

      try {
        const notificationsRef = collection(db, "notifications")
        const q = query(notificationsRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"))

        const querySnapshot = await getDocs(q)
        let notificationData = querySnapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            time: data.createdAt ? data.createdAt.toDate() : new Date(),
          }
        })

        // Filter notifications based on user settings
        notificationData = notificationData.filter((notification) => {
          const settings = userSettings.notifications

          switch (notification.type) {
            case "appointment":
              return settings.appointments
            case "message":
              return settings.messages
            case "prescription":
              return settings.prescriptions
            case "marketing":
              return settings.marketing
            default:
              return true
          }
        })

        setNotifications(notificationData)
      } catch (error) {
        console.error("Error fetching notifications:", error)
        // Fallback to sample data
        setNotifications([
          {
            id: 1,
            type: "prescription",
            action: "add",
            title: "New Prescription",
            message: "Dr. Sarah Johnson has added a new prescription for you.",
            time: new Date(2023, 5, 15, 9, 30),
            read: false,
            doctorName: "Dr. Sarah Johnson",
            doctorId: "doctor123",
          },
          {
            id: 2,
            type: "message",
            action: "send",
            title: "New Message",
            message: "You have a new message from Dr. Michael Chen regarding your recent visit.",
            time: new Date(2023, 5, 14, 14, 15),
            read: false,
            doctorName: "Dr. Michael Chen",
            doctorId: "doctor456",
          },
          {
            id: 3,
            type: "appointment",
            action: "approve",
            title: "Appointment Approved",
            message: "Your appointment with Dr. Emily Rodriguez has been approved.",
            time: new Date(2023, 5, 13, 11, 45),
            read: false,
            doctorName: "Dr. Emily Rodriguez",
            doctorId: "doctor789",
          },
          {
            id: 4,
            type: "record",
            action: "note",
            title: "Medical Record Note",
            message: "Dr. Robert Davis has added notes to your medical record.",
            time: new Date(2023, 5, 12, 16, 30),
            read: true,
            doctorName: "Dr. Robert Davis",
            doctorId: "doctor101",
          },
          {
            id: 5,
            type: "appointment",
            action: "reschedule",
            title: "Appointment Rescheduled",
            message: "Your appointment with Dr. Jennifer Lee has been rescheduled to next week.",
            time: new Date(2023, 5, 10, 9, 0),
            read: true,
            doctorName: "Dr. Jennifer Lee",
            doctorId: "doctor202",
          },
          {
            id: 6,
            type: "appointment",
            action: "cancel",
            title: "Appointment Cancelled",
            message: "Your appointment with Dr. Thomas Wilson has been cancelled.",
            time: new Date(2023, 5, 9, 13, 20),
            read: true,
            doctorName: "Dr. Thomas Wilson",
            doctorId: "doctor303",
          },
          {
            id: 7,
            type: "appointment",
            action: "complete",
            title: "Appointment Completed",
            message: "Your appointment with Dr. Lisa Brown has been marked as completed.",
            time: new Date(2023, 5, 8, 10, 0),
            read: true,
            doctorName: "Dr. Lisa Brown",
            doctorId: "doctor404",
          },
          {
            id: 8,
            type: "appointment",
            action: "add",
            title: "New Appointment",
            message: "You have scheduled a new appointment with Dr. David Kim for next Monday.",
            time: new Date(2023, 5, 7, 15, 45),
            read: true,
            doctorName: "Dr. David Kim",
            doctorId: "doctor505",
          },
          {
            id: 9,
            type: "appointment",
            action: "delete",
            title: "Appointment Deleted",
            message: "Your appointment with Dr. Jessica Martinez has been deleted from the system.",
            time: new Date(2023, 5, 6, 9, 30),
            read: true,
            doctorName: "Dr. Jessica Martinez",
            doctorId: "doctor606",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    if (userSettings) {
      fetchNotifications()
    }
  }, [user, userSettings])

  const markAsRead = async (id) => {
    try {
      // Update in Firestore
      const notificationRef = doc(db, "notifications", id)
      await updateDoc(notificationRef, { read: true })

      // Update local state
      setNotifications(
        notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Update in Firestore - batch update
      const batch = writeBatch(db)
      notifications.forEach((notification) => {
        if (!notification.read) {
          const notificationRef = doc(db, "notifications", notification.id)
          batch.update(notificationRef, { read: true })
        }
      })
      await batch.commit()

      // Update local state
      setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const deleteNotification = async (id) => {
    try {
      setDeleteLoading(true)
      // Delete from Firestore
      await deleteDoc(doc(db, "notifications", id))

      // Update local state
      setNotifications(notifications.filter((notification) => notification.id !== id))
      setDeleteConfirm(null)

      // Show success notification
      setSuccessMessage("Notification deleted successfully")
      setShowSuccess(true)
    } catch (error) {
      console.error("Error deleting notification:", error)
      setSuccessMessage("Error deleting notification")
      setShowSuccess(true)
    } finally {
      setDeleteLoading(false)
    }
  }

  const clearAllNotifications = async () => {
    try {
      // Delete all from Firestore - batch delete
      const batch = writeBatch(db)
      notifications.forEach((notification) => {
        const notificationRef = doc(db, "notifications", notification.id)
        batch.delete(notificationRef)
      })
      await batch.commit()

      // Update local state
      setNotifications([])

      // Show success notification
      setSuccessMessage("All notifications cleared successfully")
      setShowSuccess(true)
    } catch (error) {
      console.error("Error clearing notifications:", error)
      setSuccessMessage("Error clearing notifications")
      setShowSuccess(true)
    }
  }

  // Fixed filter function
  const filteredNotifications = notifications.filter((notification) => {
    // Read/unread filter
    let matchesReadFilter = false
    if (filter === "all") {
      matchesReadFilter = true
    } else if (filter === "unread" && notification.read === false) {
      matchesReadFilter = true
    } else if (filter === "read" && notification.read === true) {
      matchesReadFilter = true
    }

    // Type filter - ensure we're checking the exact type
    let matchesTypeFilter = false
    if (typeFilter === "all") {
      matchesTypeFilter = true
    } else if (typeFilter === notification.type) {
      matchesTypeFilter = true
    }

    // Search filter - case insensitive search across multiple fields
    const searchLower = searchQuery.toLowerCase()
    let matchesSearch = false
    if (searchQuery === "") {
      matchesSearch = true
    } else if (
      notification.title?.toLowerCase().includes(searchLower) ||
      notification.message?.toLowerCase().includes(searchLower) ||
      notification.doctorName?.toLowerCase().includes(searchLower)
    ) {
      matchesSearch = true
    }

    return matchesReadFilter && matchesTypeFilter && matchesSearch
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const getNotificationIcon = (notification) => {
    const { type, action } = notification

    if (type === "prescription") {
      switch (action) {
        case "add":
          return (
            <div className="rounded-full bg-green-100 p-2">
              <Plus className="h-5 w-5 text-green-500" />
            </div>
          )
        default:
          return (
            <div className="rounded-full bg-green-100 p-2">
              <Pill className="h-5 w-5 text-green-500" />
            </div>
          )
      }
    }

    if (type === "appointment") {
      switch (action) {
        case "add":
          return (
            <div className="rounded-full bg-soft-amber/20 p-2">
              <Plus className="h-5 w-5 text-soft-amber" />
            </div>
          )
        case "delete":
          return (
            <div className="rounded-full bg-red-100 p-2">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
          )
        case "cancel":
          return (
            <div className="rounded-full bg-red-100 p-2">
              <X className="h-5 w-5 text-red-500" />
            </div>
          )
        case "reschedule":
          return (
            <div className="rounded-full bg-blue-100 p-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
            </div>
          )
        case "complete":
          return (
            <div className="rounded-full bg-green-100 p-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          )
        case "approve":
          return (
            <div className="rounded-full bg-green-100 p-2">
              <Check className="h-5 w-5 text-green-500" />
            </div>
          )
        default:
          return (
            <div className="rounded-full bg-soft-amber/20 p-2">
              <Calendar className="h-5 w-5 text-soft-amber" />
            </div>
          )
      }
    }

    if (type === "message") {
      return (
        <div className="rounded-full bg-blue-100 p-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
        </div>
      )
    }

    if (type === "record") {
      switch (action) {
        case "note":
          return (
            <div className="rounded-full bg-purple-100 p-2">
              <Edit className="h-5 w-5 text-purple-500" />
            </div>
          )
        default:
          return (
            <div className="rounded-full bg-purple-100 p-2">
              <FileText className="h-5 w-5 text-purple-500" />
            </div>
          )
      }
    }

    return (
      <div className="rounded-full bg-gray-100 p-2">
        <Bell className="h-5 w-5 text-gray-500" />
      </div>
    )
  }

  const getTypeFilterLabel = () => {
    switch (typeFilter) {
      case "all":
        return "All Types"
      case "appointment":
        return "Appointments"
      case "message":
        return "Messages"
      case "prescription":
        return "Prescriptions"
      case "record":
        return "Medical Records"
      default:
        return "All Types"
    }
  }

  if (loading || !userSettings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-soft-amber"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4">
      {/* Success Notification */}
      <SuccessNotification
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
        isValidation={successMessage.includes("Error")}
      />

      {/* Dashboard Header Banner with page-specific content */}
      <DashboardHeaderBanner
        userRole="patient"
        title="Notifications"
        subtitle="Stay updated with your healthcare activities"
        showMetrics={false}
        actionButton={
          unreadCount > 0 ? (
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-white">
              <span className="font-medium">
                {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
              </span>
            </div>
          ) : null
        }
      />

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <Bell className="h-6 w-6 text-soft-amber mr-2" />
          <h2 className="text-xl font-semibold text-graphite">Activity Feed</h2>
          {unreadCount > 0 && (
            <span className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-soft-amber text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center justify-center rounded-md border border-soft-amber px-4 py-2 text-sm font-medium text-soft-amber hover:bg-soft-amber/10 transition-colors"
            >
              <Check className="mr-2 h-4 w-4" />
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="flex items-center justify-center rounded-md border border-red-500 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border border-pale-stone bg-white p-2 pl-10 text-sm text-graphite focus:border-soft-amber focus:ring-soft-amber"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <button
              onClick={() => {
                setShowFilterMenu(!showFilterMenu)
                setShowTypeFilterMenu(false)
              }}
              className="flex items-center justify-center rounded-md border border-pale-stone bg-white px-4 py-2 text-sm font-medium text-graphite hover:bg-pale-stone transition-colors"
            >
              <Filter className="mr-2 h-4 w-4" />
              {filter === "all" ? "All" : filter === "unread" ? "Unread" : "Read"}
            </button>
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-pale-stone bg-white shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setFilter("all")
                      setShowFilterMenu(false)
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      filter === "all" ? "bg-pale-stone text-soft-amber" : "text-graphite hover:bg-pale-stone"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      setFilter("unread")
                      setShowFilterMenu(false)
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      filter === "unread" ? "bg-pale-stone text-soft-amber" : "text-graphite hover:bg-pale-stone"
                    }`}
                  >
                    Unread
                  </button>
                  <button
                    onClick={() => {
                      setFilter("read")
                      setShowFilterMenu(false)
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      filter === "read" ? "bg-pale-stone text-soft-amber" : "text-graphite hover:bg-pale-stone"
                    }`}
                  >
                    Read
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => {
                setShowTypeFilterMenu(!showTypeFilterMenu)
                setShowFilterMenu(false)
              }}
              className="flex items-center justify-center rounded-md border border-pale-stone bg-white px-4 py-2 text-sm font-medium text-graphite hover:bg-pale-stone transition-colors"
            >
              <Bell className="mr-2 h-4 w-4" />
              {getTypeFilterLabel()}
            </button>
            {showTypeFilterMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border border-pale-stone bg-white shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setTypeFilter("all")
                      setShowTypeFilterMenu(false)
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      typeFilter === "all" ? "bg-pale-stone text-soft-amber" : "text-graphite hover:bg-pale-stone"
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => {
                      setTypeFilter("appointment")
                      setShowTypeFilterMenu(false)
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      typeFilter === "appointment"
                        ? "bg-pale-stone text-soft-amber"
                        : "text-graphite hover:bg-pale-stone"
                    }`}
                  >
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-soft-amber" />
                      Appointments
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setTypeFilter("message")
                      setShowTypeFilterMenu(false)
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      typeFilter === "message" ? "bg-pale-stone text-soft-amber" : "text-graphite hover:bg-pale-stone"
                    }`}
                  >
                    <div className="flex items-center">
                      <MessageSquare className="mr-2 h-4 w-4 text-blue-500" />
                      Messages
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setTypeFilter("prescription")
                      setShowTypeFilterMenu(false)
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      typeFilter === "prescription"
                        ? "bg-pale-stone text-soft-amber"
                        : "text-graphite hover:bg-pale-stone"
                    }`}
                  >
                    <div className="flex items-center">
                      <Pill className="mr-2 h-4 w-4 text-green-500" />
                      Prescriptions
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setTypeFilter("record")
                      setShowTypeFilterMenu(false)
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      typeFilter === "record" ? "bg-pale-stone text-soft-amber" : "text-graphite hover:bg-pale-stone"
                    }`}
                  >
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-purple-500" />
                      Medical Records
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {filteredNotifications.length > 0 ? (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`relative rounded-lg border ${
                notification.read ? "border-pale-stone bg-white" : "border-soft-amber/30 bg-soft-amber/5"
              } p-4 shadow-sm transition-all hover:shadow-md animate-fadeIn`}
            >
              <div className="flex items-start">
                <div className="mr-4 mt-1 flex-shrink-0">{getNotificationIcon(notification)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-graphite">{notification.title}</h3>
                    <span className="text-xs text-drift-gray">
                      {formatDistanceToNow(notification.time, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-drift-gray mb-2">{notification.message}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-drift-gray">{format(notification.time, "MMM d, yyyy 'at' h:mm a")}</p>
                    <div className="flex items-center gap-2">
                      {notification.doctorName && (
                        <span className="text-xs font-medium text-soft-amber">{notification.doctorName}</span>
                      )}
                      {notification.type === "call_invite" && notification.actionLink && (
                        <button
                          onClick={async (e) => {
                            try {
                              const callId = notification.metadata?.callId
                              if (!callId) {
                                window.location.assign("/dashboard/appointments")
                                return
                              }
                              const callRef = doc(db, "calls", callId)
                              const snap = await getDoc(callRef)
                              if (!snap.exists()) {
                                window.location.assign("/dashboard/appointments")
                                return
                              }
                              const data = snap.data() || {}
                              const isActive = data.status === "pending" || data.status === "active"
                              const notRevoked = !data.revokedBy
                              if (isActive && notRevoked) {
                                window.location.assign(notification.actionLink)
                              } else {
                                window.location.assign("/dashboard/appointments")
                              }
                            } catch {
                              window.location.assign("/dashboard/appointments")
                            }
                          }}
                          className="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                        >
                          Join Room
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Moved delete button to the right side */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex space-x-1">
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      markAsRead(notification.id)
                    }}
                    className="rounded p-1 text-drift-gray hover:bg-pale-stone hover:text-soft-amber transition-colors"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                {deleteConfirm === notification.id ? (
                  <div className="flex items-center bg-red-50 p-1 rounded-md">
                    <span className="text-xs text-red-600 mr-2">Delete?</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1 mr-1"
                      aria-label="Confirm delete"
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white rounded-full"></div>
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setDeleteConfirm(null)
                      }}
                      className="text-white bg-gray-400 hover:bg-gray-500 rounded-full p-1"
                      aria-label="Cancel delete"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDeleteConfirm(notification.id)
                    }}
                    className="rounded p-1 text-drift-gray hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {!notification.read && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2">
                  <div className="h-2 w-2 rounded-full bg-soft-amber"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-pale-stone bg-white py-12 animate-fadeIn">
          <NoNotificationsAnimation />
          <p className="mt-4 text-drift-gray">No notifications to display</p>
          {(searchQuery || filter !== "all" || typeFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("")
                setFilter("all")
                setTypeFilter("all")
              }}
              className="mt-2 text-soft-amber hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
