"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Filter,
  Check,
  X,
  Clock,
  Calendar,
  User,
  Mail,
  AlertCircle,
  Users,
  UserCheck,
  UserX,
  ChevronDown,
} from "lucide-react"
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email-utils"
import { SuccessNotification } from "@/components/success-notification"
import { logUserActivity } from "@/lib/admin-utils"
import { AdminHeaderBanner } from "@/components/admin/admin-header-banner"

export default function PendingAccountsPage() {
  const [pendingAccounts, setPendingAccounts] = useState([])
  const [filteredAccounts, setFilteredAccounts] = useState([])
  const [displayedAccounts, setDisplayedAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [notification, setNotification] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [emailStatus, setEmailStatus] = useState(null)
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    rejected: 0,
  })

  const PAGE_SIZE = 10

  // Fetch pending accounts data using real-time listener for initial load
  useEffect(() => {
    setIsLoading(true)

    // Create query for all accounts that are not explicitly approved (status != 1)
    // This will include accounts with status=0, status=null, or no status field
    const pendingAccountsQuery = query(
      collection(db, "users"),
      where("status", "!=", 1),
      orderBy("status", "asc"),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE),
    )

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      pendingAccountsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          setLastVisible(snapshot.docs[snapshot.docs.length - 1])
        } else {
          setHasMore(false)
        }

        const accounts = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          accounts.push({
            id: doc.id,
            name: data.displayName || "Unknown",
            email: data.email || "",
            role: data.role || "patient",
            requestedDate: data.createdAt ? new Date(data.createdAt.toDate()) : new Date(),
            status: data.status === 2 ? "rejected" : "pending",
            specialty: data.specialty || "",
            avatar: data.photoURL || "/abstract-geometric-shapes.png",
          })
        })

        setPendingAccounts(accounts)
        setFilteredAccounts(accounts)
        setDisplayedAccounts(accounts)
        setIsLoading(false)
      },
      (error) => {
        console.error("Error fetching pending accounts:", error)
        setIsLoading(false)
      },
    )

    // Fetch stats
    fetchStats()

    return () => unsubscribe()
  }, [])

  // Fetch stats for the banner
  const fetchStats = async () => {
    try {
      // Get total pending accounts
      const pendingQuery = query(collection(db, "users"), where("status", "==", 0))
      const pendingSnapshot = await getDocs(pendingQuery)

      // Get total rejected accounts
      const rejectedQuery = query(collection(db, "users"), where("status", "==", 2))
      const rejectedSnapshot = await getDocs(rejectedQuery)

      // Get total accounts
      const totalQuery = query(collection(db, "users"))
      const totalSnapshot = await getDocs(totalQuery)

      setStats({
        total: totalSnapshot.size,
        pending: pendingSnapshot.size,
        rejected: rejectedSnapshot.size,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  // Load more accounts
  const loadMoreAccounts = async () => {
    if (!lastVisible || !hasMore) return

    setIsLoadingMore(true)

    try {
      const nextQuery = query(
        collection(db, "users"),
        where("status", "!=", 1),
        orderBy("status", "asc"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(PAGE_SIZE),
      )

      const snapshot = await getDocs(nextQuery)

      if (snapshot.empty) {
        setHasMore(false)
        setIsLoadingMore(false)
        return
      }

      setLastVisible(snapshot.docs[snapshot.docs.length - 1])

      const newAccounts = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        newAccounts.push({
          id: doc.id,
          name: data.displayName || "Unknown",
          email: data.email || "",
          role: data.role || "patient",
          requestedDate: data.createdAt ? new Date(data.createdAt.toDate()) : new Date(),
          status: data.status === 2 ? "rejected" : "pending",
          specialty: data.specialty || "",
          avatar: data.photoURL || "/abstract-geometric-shapes.png",
        })
      })

      setPendingAccounts((prev) => [...prev, ...newAccounts])

      // Apply current filters to the new combined set
      applyFilters([...pendingAccounts, ...newAccounts], searchTerm, roleFilter)
    } catch (error) {
      console.error("Error loading more accounts:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Apply filters to accounts
  const applyFilters = useCallback((accounts, search, role) => {
    let result = [...accounts]

    // Apply search
    if (search) {
      result = result.filter(
        (account) =>
          account.name.toLowerCase().includes(search.toLowerCase()) ||
          account.email.toLowerCase().includes(search.toLowerCase()),
      )
    }

    // Apply role filter
    if (role !== "all") {
      result = result.filter((account) => account.role === role)
    }

    setFilteredAccounts(result)
    setDisplayedAccounts(result)
  }, [])

  // Handle search and filter changes
  useEffect(() => {
    applyFilters(pendingAccounts, searchTerm, roleFilter)
  }, [searchTerm, roleFilter, pendingAccounts, applyFilters])

  // Handle account approval
  const handleApproveAccount = async () => {
    if (!selectedAccount) return

    try {
      setIsProcessing(true)
      setEmailStatus("sending")

      console.log("Starting account approval process for:", selectedAccount.email)

      // Update user status in Firestore
      await updateDoc(doc(db, "users", selectedAccount.id), {
        status: 1, // 1 = approved
      })

      console.log("User status updated in Firestore")

      // Log the approval action
      await logUserActivity(
        "Account Approved",
        `Approved ${selectedAccount.role} account for ${selectedAccount.name} (${selectedAccount.email})`,
        { id: selectedAccount.id, email: selectedAccount.email },
        "admin",
        "success",
      )

      console.log("User activity logged")

      // Send approval email - Add explicit logging
      console.log("About to call sendApprovalEmail function")
      let emailResult = { success: false }
      if (selectedAccount.email) {
        emailResult = await sendApprovalEmail(selectedAccount.email, selectedAccount.name, selectedAccount.role)
      } else {
        console.warn("No email found for selected account, skipping approval email.")
      }
      console.log("Email result:", emailResult)

      // Set email status based on result
      if (emailResult.success) {
        setEmailStatus("success")
        console.log("Email status set to success")
      } else {
        setEmailStatus("error")
        console.log("Email status set to error")
      }

      // Create notification in Firestore for the user
      const notificationRef = collection(db, "notifications")
      await addDoc(notificationRef, {
        userId: selectedAccount.id,
        type: "account",
        action: "approve",
        title: "Account Approved",
        message: "Your account has been approved. You can now access all features.",
        createdAt: serverTimestamp(),
        read: false,
      })

      console.log("Notification added to Firestore")

      // Show success notification
      setNotification({
        title: "Account Approved",
        message: `${selectedAccount.name}'s account has been approved successfully.${
          emailResult.success ? "" : " However, there was an issue sending the email notification."
        }`,
        type: "success",
      })

      console.log("Success notification set")

      // Update stats
      fetchStats()

      // Close modal after a short delay to show email status
      setTimeout(() => {
        setShowApproveModal(false)
        setSelectedAccount(null)
        setEmailStatus(null)
      }, 2000)
    } catch (error) {
      console.error("Error approving account:", error)
      setEmailStatus("error")
      setNotification({
        title: "Error",
        message: "Failed to approve account. Please try again.",
        type: "error",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle account rejection
  const handleRejectAccount = async () => {
    if (!selectedAccount) return

    try {
      setIsProcessing(true)
      setEmailStatus("sending")

      // Update user status in Firestore
      await updateDoc(doc(db, "users", selectedAccount.id), {
        status: 2, // 2 = rejected
        rejectionReason: rejectionReason || "No reason provided",
      })

      // Log the rejection action
      await logUserActivity(
        "Account Rejected",
        `Rejected ${selectedAccount.role} account for ${selectedAccount.name} (${selectedAccount.email})${
          rejectionReason ? `: ${rejectionReason}` : ""
        }`,
        { id: selectedAccount.id, email: selectedAccount.email },
        "admin",
        "warning",
      )

      // Send rejection email
      let emailResult = { success: false }
      if (selectedAccount.email) {
        emailResult = await sendRejectionEmail(
          selectedAccount.email,
          selectedAccount.name,
          selectedAccount.role,
          rejectionReason,
        )
      } else {
        console.warn("No email found for selected account, skipping rejection email.")
      }

      // Set email status based on result
      if (emailResult.success) {
        setEmailStatus("success")
      } else {
        setEmailStatus("error")
      }

      // Create notification in Firestore for the user
      const notificationRef = collection(db, "notifications")
      await addDoc(notificationRef, {
        userId: selectedAccount.id,
        type: "account",
        action: "reject",
        title: "Account Rejected",
        message: `Your account has been rejected. Reason: ${rejectionReason || "No reason provided"}`,
        createdAt: serverTimestamp(),
        read: false,
      })

      // Show success notification
      setNotification({
        title: "Account Rejected",
        message: `${selectedAccount.name}'s account has been rejected.${
          emailResult.success ? "" : " However, there was an issue sending the email notification."
        }`,
        type: "warning",
      })

      // Update stats
      fetchStats()

      // Close modal after a short delay to show email status
      setTimeout(() => {
        setShowRejectModal(false)
        setSelectedAccount(null)
        setRejectionReason("")
        setEmailStatus(null)
      }, 2000)
    } catch (error) {
      console.error("Error rejecting account:", error)
      setEmailStatus("error")
      setNotification({
        title: "Error",
        message: "Failed to reject account. Please try again.",
        type: "error",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Format date
  const formatDate = (date) => {
    const options = { year: "numeric", month: "long", day: "numeric" }
    return date.toLocaleDateString(undefined, options)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse w-full">
        <div className="h-40 bg-gray-200 rounded-xl mb-6"></div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gray-200 h-8 w-64 rounded"></h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 w-full">
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="bg-gray-200 h-10 w-full md:w-64 rounded"></div>
            <div className="bg-gray-200 h-10 w-full md:w-48 rounded"></div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  {[...Array(6)].map((_, i) => (
                    <th key={i} className="py-3 px-4 border-b border-earth-beige">
                      <div className="bg-gray-200 h-6 w-full rounded"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="py-4 px-4 border-b border-earth-beige">
                        <div className="bg-gray-200 h-6 w-full rounded"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Banner stats
  const bannerStats = [
    {
      label: "Total Accounts",
      value: stats.total,
      icon: <Users className="h-4 w-4 text-white/70" />,
    },
    {
      label: "Pending Accounts",
      value: stats.pending,
      icon: <Clock className="h-4 w-4 text-white/70" />,
    },
    {
      label: "Rejected Accounts",
      value: stats.rejected,
      icon: <UserX className="h-4 w-4 text-white/70" />,
    },
    {
      label: "Approved Accounts",
      value: stats.total - stats.pending - stats.rejected,
      icon: <UserCheck className="h-4 w-4 text-white/70" />,
    },
  ]

  return (
    <div className="w-full">
      <AdminHeaderBanner
        title="Account Management"
        subtitle="Review and manage user account requests"
        stats={bannerStats}
        className="mb-6"
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-graphite">
          Pending Account Requests{" "}
          <span className="bg-red-500 text-white text-sm px-2 py-0.5 rounded-full ml-2">{stats.pending}</span>
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 w-full">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search accounts..."
              className="w-full pl-10 pr-4 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-1 focus:ring-soft-amber"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-drift-gray" />
          </div>

          <div className="relative w-full md:w-48">
            <button
              onClick={() => setRoleDropdownOpen((prev) => !prev)}
              className="w-full inline-flex items-center justify-between pl-10 pr-3 py-2 border border-earth-beige rounded-md bg-white text-graphite text-sm font-medium shadow-sm transition hover:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
            >
              <span className="flex items-center">
                <Filter className="h-5 w-5 text-drift-gray mr-2 absolute left-3" />
                {roleFilter === "all" ? "All Roles" : roleFilter === "patient" ? "Patients" : "Doctors"}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-drift-gray transition-transform duration-200 ${roleDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`absolute left-0 right-0 mt-1 origin-top rounded-lg border border-earth-beige bg-white shadow-lg transition-all duration-200 ease-out ${
                roleDropdownOpen ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
              }`}
            >
              {[
                { value: "all", label: "All Roles" },
                { value: "patient", label: "Patients" },
                { value: "doctor", label: "Doctors" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setRoleFilter(option.value)
                    setRoleDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    roleFilter === option.value ? "bg-soft-amber text-white" : "text-graphite hover:bg-pale-stone"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Accounts - mobile cards */}
        <div className="md:hidden space-y-3">
          {displayedAccounts.length > 0 ? (
            displayedAccounts.map((account) => (
              <div
                key={account.id}
                className="border border-earth-beige rounded-lg p-4 shadow-sm bg-white flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={account.avatar || "/placeholder.svg?height=40&width=40&query=user"}
                    alt={account.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-graphite">{account.name}</p>
                    <p className="text-xs text-drift-gray break-words">{account.email}</p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      account.role === "doctor" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    <User className="h-3 w-3 mr-1" />
                    {account.role === "doctor" ? "Doctor" : "Patient"}
                  </span>
                </div>

                {account.role === "doctor" && account.specialty && (
                  <p className="text-xs text-drift-gray">Specialty: {account.specialty}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-drift-gray">
                  <Calendar className="h-4 w-4" />
                  {formatDate(account.requestedDate)}
                </div>

                <div className="flex items-center gap-2">
                  {account.status === "rejected" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <X className="h-3 w-3 mr-1" />
                      Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </span>
                  )}
                  <span className="text-xs text-drift-gray">•</span>
                  <span className="text-xs text-drift-gray">{account.role === "doctor" ? "Doctor" : "Patient"}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {account.status !== "rejected" && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedAccount(account)
                          setShowApproveModal(true)
                        }}
                        className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                        aria-label="Approve account"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAccount(account)
                          setShowRejectModal(true)
                        }}
                        className="inline-flex items-center px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                        aria-label="Reject account"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </>
                  )}
                  {account.status === "rejected" && (
                    <button
                      onClick={() => {
                        setSelectedAccount(account)
                        setShowApproveModal(true)
                      }}
                      className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
                      aria-label="Approve account"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-drift-gray py-6 border border-earth-beige rounded-lg">
              No pending accounts found matching your criteria.
            </div>
          )}
        </div>

        {/* Pending Accounts Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Name
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Email
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Role
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Requested Date
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Status
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold text-drift-gray border-b border-earth-beige">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedAccounts.length > 0 ? (
                displayedAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-pale-stone/50">
                    <td className="py-4 px-4 border-b border-earth-beige">
                      <div className="flex items-center">
                        <img
                          src={account.avatar || "/placeholder.svg?height=40&width=40&query=user"}
                          alt={account.name}
                          className="h-10 w-10 rounded-full mr-3 object-cover"
                        />
                        <span className="font-medium text-graphite">{account.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige text-drift-gray">{account.email}</td>
                    <td className="py-4 px-4 border-b border-earth-beige">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          account.role === "doctor" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {account.role === "doctor" ? (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            Doctor
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            Patient
                          </>
                        )}
                      </span>
                      {account.role === "doctor" && account.specialty && (
                        <span className="block text-xs text-drift-gray mt-1">{account.specialty}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige text-drift-gray">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-drift-gray" />
                        {formatDate(account.requestedDate)}
                      </div>
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige">
                      {account.status === "rejected" ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <X className="h-3 w-3 mr-1" />
                          Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 border-b border-earth-beige text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {account.status !== "rejected" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedAccount(account)
                                setShowApproveModal(true)
                              }}
                              className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                              aria-label="Approve account"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAccount(account)
                                setShowRejectModal(true)
                              }}
                              className="inline-flex items-center px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600"
                              aria-label="Reject account"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </>
                        )}
                        {account.status === "rejected" && (
                          <button
                            onClick={() => {
                              setSelectedAccount(account)
                              setShowApproveModal(true)
                            }}
                            className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600"
                            aria-label="Approve account"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-drift-gray border-b border-earth-beige">
                    No pending accounts found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {hasMore && displayedAccounts.length > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMoreAccounts}
              disabled={isLoadingMore}
              className="px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}

        {/* Results Summary */}
        <div className="mt-6 text-sm text-drift-gray text-center">
          Showing <span className="font-medium">{displayedAccounts.length}</span> of{" "}
          <span className="font-medium">{filteredAccounts.length}</span> accounts
          {searchTerm || roleFilter !== "all" ? " (filtered)" : ""}
        </div>
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-graphite mb-2">Approve Account</h3>
            <p className="text-drift-gray mb-4">
              Are you sure you want to approve {selectedAccount?.name}'s account as a {selectedAccount?.role}?
              {selectedAccount?.role === "doctor" && selectedAccount?.specialty && (
                <span className="block mt-2">Specialty: {selectedAccount.specialty}</span>
              )}
            </p>
            <div className="mb-4">
              <div className="flex items-center text-sm text-drift-gray mb-2">
                <Mail className="h-4 w-4 mr-2" />
                <span>An email notification will be sent to {selectedAccount?.email}</span>
              </div>

              {/* Email status indicator */}
              {emailStatus && (
                <div
                  className={`mt-2 p-2 rounded-md ${
                    emailStatus === "sending" ? "bg-yellow-50" : emailStatus === "success" ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center">
                    {emailStatus === "sending" && (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-soft-amber border-t-transparent rounded-full mr-2"></div>
                        <span className="text-sm text-yellow-700">Sending email notification...</span>
                      </>
                    )}
                    {emailStatus === "success" && (
                      <>
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-700">Email notification sent successfully!</span>
                      </>
                    )}
                    {emailStatus === "error" && (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-sm text-red-700">Failed to send email notification.</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-2 border border-earth-beige rounded-md text-drift-gray hover:bg-pale-stone"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleApproveAccount}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-graphite mb-2">Reject Account</h3>
            <p className="text-drift-gray mb-4">
              Are you sure you want to reject {selectedAccount?.name}'s account request?
            </p>
            <div className="mb-4">
              <label htmlFor="rejectionReason" className="block text-sm font-medium text-drift-gray mb-1">
                Rejection Reason (optional)
              </label>
              <textarea
                id="rejectionReason"
                rows={3}
                className="w-full px-3 py-2 border border-earth-beige rounded-md focus:outline-none focus:ring-1 focus:ring-soft-amber"
                placeholder="Provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              ></textarea>
              <div className="flex items-center text-sm text-drift-gray mt-2">
                <Mail className="h-4 w-4 mr-2" />
                <span>An email notification will be sent to {selectedAccount?.email}</span>
              </div>

              {/* Email status indicator */}
              {emailStatus && (
                <div
                  className={`mt-2 p-2 rounded-md ${
                    emailStatus === "sending" ? "bg-yellow-50" : emailStatus === "success" ? "bg-green-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center">
                    {emailStatus === "sending" && (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-soft-amber border-t-transparent rounded-full mr-2"></div>
                        <span className="text-sm text-yellow-700">Sending email notification...</span>
                      </>
                    )}
                    {emailStatus === "success" && (
                      <>
                        <Check className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-700">Email notification sent successfully!</span>
                      </>
                    )}
                    {emailStatus === "error" && (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-sm text-red-700">Failed to send email notification.</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-earth-beige rounded-md text-drift-gray hover:bg-pale-stone"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectAccount}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {notification && (
        <SuccessNotification
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}
