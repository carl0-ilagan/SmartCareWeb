"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import {
  Bell,
  Check,
  Filter,
  Search,
  Trash2,
  Calendar,
  MessageSquare,
  User,
  FileText,
  Plus,
  X,
  RefreshCw,
  CheckCircle,
  Share2,
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

export default function DoctorNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all") // all, unread, read
  const [typeFilter, setTypeFilter] = useState("all") // all, appointment, message, patient, record
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
              patientUpdates: true,
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
            patientUpdates: true,
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
            case "patient":
              return settings.patientUpdates
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
            type: "appointment",
            action: "add",
            title: "New Appointment",
            message: "John Doe has scheduled an appointment for tomorrow at 10:00 AM.",
            time: new Date(2023, 5, 15, 9, 30),
            read: false,
            patientName: "John Doe",
            patientId: "patient123",
          },
          {
            id: 2,
            type: "appointment",
            action: "cancel",
            title: "Appointment Cancelled",
            message: "Sarah Johnson has cancelled her appointment scheduled for today.",
            time: new Date(2023, 5, 14, 14, 15),
            read: false,
            patientName: "Sarah Johnson",
            patientId: "patient456",
          },
          {
            id: 3,
            type: "record",
            action: "share",
            title: "Record Shared",
            message: "Michael Brown has shared his medical records with you.",
            time: new Date(2023, 5, 13, 11, 45),
            read: false,
            patientName: "Michael Brown",
            patientId: "patient789",
          },
          {
            id: 4,
            type: "message",
            action: "send",
            title: "New Message",
            message: "You have a new message from Emily Wilson regarding her medication.",
            time: new Date(2023, 5, 12, 16, 30),
            read: true,
            patientName: "Emily Wilson",
            patientId: "patient101",
          },
          {
            id: 5,
            type: "appointment",
            action: "complete",
            title: "Appointment Completed",
            message: "Your appointment with Robert Davis has been marked as completed.",
            time: new Date(2023, 5, 10, 9, 0),
            read: true,
            patientName: "Robert Davis",
            patientId: "patient202",
          },
          {
            id: 6,
            type: "appointment",
            action: "reschedule",
            title: "Appointment Rescheduled",
            message: "Jennifer Lee has rescheduled her appointment to next week.",
            time: new Date(2023, 5, 9, 13, 20),
            read: true,
            patientName: "Jennifer Lee",
            patientId: "patient303",
          },
          {
            id: 7,
            type: "appointment",
            action: "delete",
            title: "Appointment Deleted",
            message: "The appointment with Thomas Wilson has been deleted from the system.",
            time: new Date(2023, 5, 8, 10, 0),
            read: true,
            patientName: "Thomas Wilson",
            patientId: "patient404",
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
      notification.patientName?.toLowerCase().includes(searchLower)
    ) {
      matchesSearch = true
    }

    return matchesReadFilter && matchesTypeFilter && matchesSearch
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const getNotificationIcon = (notification) => {
    const { type, action } = notification

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
        default:
          return (
            <div className="rounded-full bg-soft-amber/20 p-2">
              <Calendar className="h-5 w-5 text-soft-amber" />
            </div>
          )
      }
    }

    if (type === "record") {
      switch (action) {
        case "share":
          return (
            <div className="rounded-full bg-purple-100 p-2">
              <Share2 className="h-5 w-5 text-purple-500" />
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

    if (type === "message") {
      return (
        <div className="rounded-full bg-blue-100 p-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
        </div>
      )
    }

    if (type === "patient") {
      return (
        <div className="rounded-full bg-green-100 p-2">
          <User className="h-5 w-5 text-green-500" />
        </div>
      )
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
      case "patient":
        return "Patients"
      case "record":
        return "Records"
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

      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 p-6 text-white shadow-md mb-6">
        {/* Decorative elements */}
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-32 right-16 h-48 w-48 rounded-full bg-white/5"></div>

        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white md:text-3xl">Notifications</h1>
          <p className="mt-1 text-white/90">Stay updated with your patient activities and appointments</p>
        </div>
      </div>

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
                      setTypeFilter("patient")
                      setShowTypeFilterMenu(false)
                    }}
                    className={`block w-full px-4 py-2 text-left text-sm ${
                      typeFilter === "patient" ? "bg-pale-stone text-soft-amber" : "text-graphite hover:bg-pale-stone"
                    }`}
                  >
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-green-500" />
                      Patients
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
                      Records
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-drift-gray">{format(notification.time, "MMM d, yyyy 'at' h:mm a")}</p>
                    {notification.patientId && (
                      <Link
                        href={`/doctor/patients/${notification.patientId}`}
                        className="text-xs font-medium text-soft-amber hover:underline"
                      >
                        View Patient
                      </Link>
                    )}
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
