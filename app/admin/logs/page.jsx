"use client"

import { useState, useEffect } from "react"
import {
  Search,
  Download,
  AlertCircle,
  Info,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  User,
  UserCog,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  Filter,
  X,
} from "lucide-react"
import { AdminHeaderBanner } from "@/components/admin-header-banner"
import { auth, db } from "@/lib/firebase"
import { collection, getDocs, query, where, orderBy, limit, startAfter, getDoc, doc } from "firebase/firestore"
import ProfileImage from "@/components/profile-image"

const PaginationControls = ({ currentPage, totalPages, onPageChange, isLoading }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isLoading}
        className="px-3 py-1 rounded-md bg-pale-stone hover:bg-earth-beige disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span>
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isLoading}
        className="px-3 py-1 rounded-md bg-pale-stone hover:bg-earth-beige disabled:opacity-50"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function LogsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [logType, setLogType] = useState("all")
  const [userRole, setUserRole] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    patient: 0,
    doctor: 0,
    admin: 0,
    system: 0,
  })
  const [lastVisible, setLastVisible] = useState(null)
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const [userCache, setUserCache] = useState({})
  const [emailCache, setEmailCache] = useState({})

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [pageSnapshots, setPageSnapshots] = useState({})
  const [userRoleDropdownOpen, setUserRoleDropdownOpen] = useState(false)
  const [logTypeDropdownOpen, setLogTypeDropdownOpen] = useState(false)
  const [dateRangeDropdownOpen, setDateRangeDropdownOpen] = useState(false)

  // Add admin profile state similar to feedback page
  const [adminProfile, setAdminProfile] = useState({
    photoURL: "/admin-interface.png", // Default fallback image
    displayName: "Admin",
  })

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setUserRoleDropdownOpen(false)
        setLogTypeDropdownOpen(false)
        setDateRangeDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Number of logs to fetch per page
  const LOGS_PER_PAGE = 10

  // Get admin profile - copied from feedback page
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        // First try to get from current auth
        const currentUser = auth.currentUser

        if (currentUser) {
          // If we have auth user but no photo, try to get from Firestore
          if (!currentUser.photoURL) {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid))
            if (userDoc.exists() && userDoc.data().photoURL) {
              setAdminProfile({
                photoURL: userDoc.data().photoURL,
                displayName: currentUser.displayName || userDoc.data().displayName || "Admin",
              })
              return
            }
          } else {
            // We have auth user with photo
            setAdminProfile({
              photoURL: currentUser.photoURL,
              displayName: currentUser.displayName || "Admin",
            })
            return
          }
        }

        // If we reach here, we couldn't get a photo, so keep the default
      } catch (error) {
        console.error("Error fetching admin profile:", error)
        // Keep the default values on error
      }
    }

    fetchAdminProfile()
  }, [])

  useEffect(() => {
    fetchLogs(1)
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => {
    if (!isLoading) {
      setCurrentPage(1)
      setPageSnapshots({})
      fetchLogs(1)
    }
  }, [dateRange, logType, userRole])

  // Function to fetch user details by email
  const fetchUserByEmail = async (email) => {
    try {
      // Check if we already have this email in cache
      if (emailCache[email]) {
        return emailCache[email]
      }

      const usersRef = collection(db, "users")
      const q = query(usersRef, where("email", "==", email), limit(1))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0]
        const userData = userDoc.data()

        const user = {
          id: userDoc.id,
          name: userData.displayName || userData.name || email.split("@")[0],
          email: email,
          photoURL: userData.photoURL || null,
          role: userData.role || "unknown",
        }

        // Update both caches
        setUserCache((prev) => ({
          ...prev,
          [userDoc.id]: user,
        }))

        setEmailCache((prev) => ({
          ...prev,
          [email]: user,
        }))

        return user
      }

      // If no user found, create a basic user object
      const defaultUser = {
        id: null,
        name: email.split("@")[0],
        email: email,
        photoURL: null,
        role: "unknown",
      }

      // Cache this result too to avoid repeated lookups
      setEmailCache((prev) => ({
        ...prev,
        [email]: defaultUser,
      }))

      return defaultUser
    } catch (error) {
      console.error("Error fetching user by email:", error)
      return {
        id: null,
        name: email.split("@")[0],
        email: email,
        photoURL: null,
        role: "unknown",
      }
    }
  }

  // Function to fetch admin details - updated to use adminProfile
  const fetchAdminDetails = async (adminId) => {
    // If adminId is "admin", return current admin profile
    if (adminId === "admin") {
      return {
        id: "admin",
        name: adminProfile.displayName,
        email: "admin@smartcare.com",
        photoURL: adminProfile.photoURL,
        role: "admin",
      }
    }

    try {
      // Try to fetch from users collection
      const userRef = doc(db, "users", adminId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        return {
          id: adminId,
          name: userData.displayName || userData.name || "Admin User",
          email: userData.email || "admin@smartcare.com",
          photoURL: userData.photoURL || adminProfile.photoURL,
          role: "admin",
        }
      }

      // If not found, return default admin profile
      return {
        id: adminId,
        name: adminProfile.displayName,
        email: "admin@smartcare.com",
        photoURL: adminProfile.photoURL,
        role: "admin",
      }
    } catch (error) {
      console.error("Error fetching admin details:", error)
      return {
        id: adminId,
        name: adminProfile.displayName,
        email: "admin@smartcare.com",
        photoURL: adminProfile.photoURL,
        role: "admin",
      }
    }
  }

  // Function to fetch user details
  const fetchUserDetails = async (userId) => {
    // Check if we already have this user in cache
    if (userCache[userId]) {
      return userCache[userId]
    }

    // If userId is an email, fetch by email
    if (userId && userId.includes("@")) {
      return await fetchUserByEmail(userId)
    }

    // If userId is "admin", fetch admin details
    if (userId === "admin") {
      return await fetchAdminDetails(userId)
    }

    try {
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        // Ensure we have a valid photoURL
        const photoURL = userData.photoURL || null

        // Update cache
        const user = {
          id: userId,
          name: userData.displayName || userData.name || "Unknown User",
          email: userData.email || null,
          photoURL: photoURL,
          role: userData.role || "unknown",
        }

        setUserCache((prev) => ({
          ...prev,
          [userId]: user,
        }))

        // Also cache by email if available
        if (userData.email) {
          setEmailCache((prev) => ({
            ...prev,
            [userData.email]: user,
          }))
        }

        return user
      }
      return null
    } catch (error) {
      console.error("Error fetching user details:", error)
      return null
    }
  }

  // Function to enhance log details with user information
  const enhanceLogDetails = async (logs) => {
    const enhancedLogs = []

    for (const log of logs) {
      const enhancedLog = { ...log }
      let enhancedDetails = log.details || ""
      const involvedUsers = []

      // Process the main user of the log
      if (log.user) {
        try {
          let userData

          if (log.user === "admin" || log.userRole === "admin") {
            userData = await fetchAdminDetails(log.user)
          } else if (log.user.includes("@")) {
            userData = await fetchUserByEmail(log.user)
          } else if (log.user !== "system") {
            userData = await fetchUserDetails(log.user)
          }

          if (userData) {
            enhancedLog.userData = userData
            involvedUsers.push(userData)
          }
        } catch (error) {
          console.error("Error processing user:", error)
        }
      }

      // Extract user IDs and names from the details
      const userIdRegex = /\b([a-zA-Z0-9]{20,28})\b/g
      const patientRegex = /patient(?:\s*(?:ID|id)?:?\s*|\s+)([a-zA-Z0-9]{20,28})/gi
      const patientNameRegex = /patient(?:\s*(?:ID:)?\s*|\s+)$$([^)]+)$$/gi
      const doctorRegex = /doctor(?:\s*(?:ID|id)?:?\s*|\s+)([a-zA-Z0-9]{20,28})/gi
      const doctorNameRegex = /doctor(?:\s*(?:ID:)?\s*|\s+)$$([^)]+)$$/gi
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
      const nameRegex = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g

      // Find all patient IDs
      let match
      while ((match = patientRegex.exec(enhancedDetails)) !== null) {
        const patientId = match[1]
        try {
          const patientData = await fetchUserDetails(patientId)
          if (patientData) {
            enhancedLog.patientData = patientData
            involvedUsers.push(patientData)

            // Replace the ID with the name
            enhancedDetails = enhancedDetails.replace(
              new RegExp(`patient(?:\\s*(?:ID|id)?:?\\s*|\\s+)${patientId}`, "gi"),
              `patient ${patientData.name}`,
            )
          }
        } catch (error) {
          console.error("Error processing patient:", error)
        }
      }

      // Find all doctor IDs
      while ((match = doctorRegex.exec(enhancedDetails)) !== null) {
        const doctorId = match[1]
        try {
          const doctorData = await fetchUserDetails(doctorId)
          if (doctorData) {
            enhancedLog.doctorData = doctorData
            involvedUsers.push(doctorData)

            // Replace the ID with the name
            enhancedDetails = enhancedDetails.replace(
              new RegExp(`doctor(?:\\s*(?:ID|id)?:?\\s*|\\s+)${doctorId}`, "gi"),
              `Doctor ${doctorData.name}`,
            )
          }
        } catch (error) {
          console.error("Error processing doctor:", error)
        }
      }

      // Find patient names in parentheses
      while ((match = patientNameRegex.exec(enhancedDetails)) !== null) {
        const patientName = match[1]
        try {
          // Try to find the user by name
          const usersRef = collection(db, "users")
          const q = query(usersRef, where("displayName", "==", patientName), where("role", "==", "patient"), limit(1))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]
            const userData = userDoc.data()
            const patientData = {
              id: userDoc.id,
              name: userData.displayName || userData.name || patientName,
              email: userData.email || null,
              photoURL: userData.photoURL || null,
              role: "patient",
            }

            involvedUsers.push(patientData)

            // Update cache
            setUserCache((prev) => ({
              ...prev,
              [userDoc.id]: patientData,
            }))

            if (userData.email) {
              setEmailCache((prev) => ({
                ...prev,
                [userData.email]: patientData,
              }))
            }
          }
        } catch (error) {
          console.error("Error processing patient name:", error)
        }
      }

      // Find doctor names in parentheses
      while ((match = doctorNameRegex.exec(enhancedDetails)) !== null) {
        const doctorName = match[1]
        try {
          // Try to find the user by name
          const usersRef = collection(db, "users")
          const q = query(usersRef, where("displayName", "==", doctorName), where("role", "==", "doctor"), limit(1))
          const querySnapshot = await getDocs(q)

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]
            const userData = userDoc.data()
            const doctorData = {
              id: userDoc.id,
              name: userData.displayName || userData.name || doctorName,
              email: userData.email || null,
              photoURL: userData.photoURL || null,
              role: "doctor",
            }

            involvedUsers.push(doctorData)

            // Update cache
            setUserCache((prev) => ({
              ...prev,
              [userDoc.id]: doctorData,
            }))

            if (userData.email) {
              setEmailCache((prev) => ({
                ...prev,
                [userData.email]: doctorData,
              }))
            }
          }
        } catch (error) {
          console.error("Error processing doctor name:", error)
        }
      }

      // Find emails in the details
      while ((match = emailRegex.exec(enhancedDetails)) !== null) {
        const email = match[0]
        try {
          const userData = await fetchUserByEmail(email)
          if (userData && !involvedUsers.some((u) => u.email === email)) {
            involvedUsers.push(userData)

            // Replace the email with the name
            enhancedDetails = enhancedDetails.replace(new RegExp(`\\b${email}\\b`, "g"), userData.name)
          }
        } catch (error) {
          console.error("Error processing email:", error)
        }
      }

      // Find names in the details
      while ((match = nameRegex.exec(enhancedDetails)) !== null) {
        const name = match[0]
        try {
          // Check if this name is already in our involved users
          if (!involvedUsers.some((u) => u.name === name)) {
            // Try to find the user by name
            const usersRef = collection(db, "users")
            const q = query(usersRef, where("displayName", "==", name), limit(1))
            const querySnapshot = await getDocs(q)

            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0]
              const userData = userDoc.data()
              const userInfo = {
                id: userDoc.id,
                name: userData.displayName || userData.name || name,
                email: userData.email || null,
                photoURL: userData.photoURL || null,
                role: userData.role || "unknown",
              }

              involvedUsers.push(userInfo)

              // Update cache
              setUserCache((prev) => ({
                ...prev,
                [userDoc.id]: userInfo,
              }))

              if (userData.email) {
                setEmailCache((prev) => ({
                  ...prev,
                  [userData.email]: userInfo,
                }))
              }
            }
          }
        } catch (error) {
          console.error("Error processing name:", error)
        }
      }

      // Find any remaining user IDs
      const processedIds = new Set(involvedUsers.map((u) => u.id).filter(Boolean))
      let idMatch
      while ((idMatch = userIdRegex.exec(enhancedDetails)) !== null) {
        const userId = idMatch[0]
        if (!processedIds.has(userId)) {
          try {
            const userData = await fetchUserDetails(userId)
            if (userData) {
              involvedUsers.push(userData)
              processedIds.add(userId)

              // Replace the ID with the name
              const displayName = userData.role === "doctor" ? `Dr. ${userData.name}` : userData.name
              enhancedDetails = enhancedDetails.replace(new RegExp(`\\b${userId}\\b`, "g"), displayName)
            }
          } catch (error) {
            console.error("Error processing user ID:", error)
          }
        }
      }

      // Special handling for feedback logs
      if (log.action && log.action.toLowerCase().includes("feedback")) {
        // Extract names from feedback logs
        const feedbackFromRegex = /feedback from (\w+) ([A-Za-z ]+)/i
        const feedbackMatch = feedbackFromRegex.exec(enhancedDetails)

        if (feedbackMatch) {
          const role = feedbackMatch[1].toLowerCase()
          const name = feedbackMatch[2]

          try {
            // Try to find the user by name and role
            const usersRef = collection(db, "users")
            const q = query(usersRef, where("displayName", "==", name), where("role", "==", role), limit(1))
            const querySnapshot = await getDocs(q)

            if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0]
              const userData = userDoc.data()
              const userInfo = {
                id: userDoc.id,
                name: userData.displayName || userData.name || name,
                email: userData.email || null,
                photoURL: userData.photoURL || null,
                role: role,
              }

              if (!involvedUsers.some((u) => u.id === userDoc.id)) {
                involvedUsers.push(userInfo)
              }

              // Update cache
              setUserCache((prev) => ({
                ...prev,
                [userDoc.id]: userInfo,
              }))

              if (userData.email) {
                setEmailCache((prev) => ({
                  ...prev,
                  [userData.email]: userInfo,
                }))
              }
            }
          } catch (error) {
            console.error("Error processing feedback user:", error)
          }
        }
      }

      // Special handling for medical record logs
      if (
        log.action &&
        (log.action.toLowerCase().includes("medical record") ||
          enhancedDetails.toLowerCase().includes("medical record"))
      ) {
        // Try to extract any additional information
        const recordRegex = /record(?:\s*(?:for|by|with)\s*|\s+)([a-zA-Z0-9]{20,28})/gi

        while ((match = recordRegex.exec(enhancedDetails)) !== null) {
          const userId = match[1]
          if (!processedIds.has(userId)) {
            try {
              const userData = await fetchUserDetails(userId)
              if (userData) {
                involvedUsers.push(userData)
                processedIds.add(userId)

                // Replace the ID with the name
                const displayName = userData.role === "doctor" ? `Dr. ${userData.name}` : userData.name
                enhancedDetails = enhancedDetails.replace(
                  new RegExp(`record(?:\\s*(?:for|by|with)\\s*|\\s+)${userId}`, "gi"),
                  `record ${userData.role === "doctor" ? "by" : "for"} ${displayName}`,
                )
              }
            } catch (error) {
              console.error("Error processing medical record user:", error)
            }
          }
        }
      }

      // Update the log with enhanced details
      enhancedLog.details = enhancedDetails
      enhancedLog.involvedUsers = involvedUsers

      enhancedLogs.push(enhancedLog)
    }

    return enhancedLogs
  }

  const fetchLogs = async (page = 1) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log(`Fetching logs for page ${page} from Firestore...`)
      setDebugInfo(`Attempting to fetch logs for page ${page} from Firestore...`)

      // Create base query
      const logsRef = collection(db, "logs")
      const queryConstraints = []

      // Add ordering (must be first for pagination to work)
      queryConstraints.push(orderBy("timestamp", "desc"))

      // Add type filter if selected
      if (logType !== "all") {
        queryConstraints.push(where("type", "==", logType))
      }

      // Add user role filter if selected
      if (userRole !== "all") {
        queryConstraints.push(where("userRole", "==", userRole))
      }

      // Add date range filter if selected
      if (dateRange !== "all") {
        const now = new Date()
        const startDate = new Date()

        switch (dateRange) {
          case "today":
            startDate.setHours(0, 0, 0, 0)
            break
          case "yesterday":
            startDate.setDate(startDate.getDate() - 1)
            startDate.setHours(0, 0, 0, 0)
            break
          case "week":
            startDate.setDate(startDate.getDate() - 7)
            break
          case "month":
            startDate.setMonth(startDate.getMonth() - 1)
            break
        }

        queryConstraints.push(where("timestamp", ">=", startDate))
      }

      // Add pagination
      queryConstraints.push(limit(LOGS_PER_PAGE))

      // If we're not on the first page and we have a snapshot for the previous page
      if (page > 1 && pageSnapshots[page - 1]) {
        queryConstraints.push(startAfter(pageSnapshots[page - 1]))
      } else if (page > 1 && !pageSnapshots[page - 1]) {
        // If we're trying to access a page we don't have a snapshot for
        // We need to build up to it by fetching all previous pages
        let currentSnapshot = null

        for (let i = 1; i < page; i++) {
          if (pageSnapshots[i]) {
            currentSnapshot = pageSnapshots[i]
            continue
          }

          const prevQueryConstraints = [...queryConstraints.filter((c) => c.type !== "startAfter")]
          if (currentSnapshot) {
            prevQueryConstraints.push(startAfter(currentSnapshot))
          }

          const prevQuery = query(logsRef, ...prevQueryConstraints)
          const prevSnapshot = await getDocs(prevQuery)

          if (prevSnapshot.empty) {
            // If we get an empty result, we've reached the end
            setCurrentPage(i - 1)
            setTotalPages(i - 1)
            setIsLoading(false)
            return
          }

          currentSnapshot = prevSnapshot.docs[prevSnapshot.docs.length - 1]
          setPageSnapshots((prev) => ({ ...prev, [i]: currentSnapshot }))
        }

        if (currentSnapshot) {
          queryConstraints.push(startAfter(currentSnapshot))
        }
      }

      // Create and execute query
      const finalQuery = query(logsRef, ...queryConstraints)
      console.log("Executing Firestore query...")

      const querySnapshot = await getDocs(finalQuery)
      console.log(`Fetched ${querySnapshot.docs.length} logs from Firestore`)
      setDebugInfo(`Successfully fetched ${querySnapshot.docs.length} logs for page ${page} from Firestore`)

      // Process results
      const fetchedLogs = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        fetchedLogs.push({
          id: doc.id,
          ...data,
          // Convert Firestore timestamp to JS Date if it exists
          timestamp: data.timestamp?.toDate().toISOString() || new Date().toISOString(),
        })
      })

      // Save the last document for pagination
      if (querySnapshot.docs.length > 0) {
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]
        setPageSnapshots((prev) => ({ ...prev, [page]: lastDoc }))
      }

      // Check if there are more pages
      const hasNextPage = querySnapshot.docs.length === LOGS_PER_PAGE

      // Update total pages if we found a new page
      if (hasNextPage && page >= totalPages) {
        setTotalPages(page + 1)
      } else if (!hasNextPage && page >= totalPages) {
        setTotalPages(page)
      }

      // Fetch stats on initial load or refresh
      if (page === 1) {
        await fetchLogStats()
      }

      // Enhance logs with user details
      const enhancedLogs = await enhanceLogDetails(fetchedLogs)

      // Update state with fetched logs
      setLogs(enhancedLogs)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error fetching logs:", error)
      setError(`Error fetching logs: ${error.message}. Please check your Firestore configuration and permissions.`)
      setDebugInfo(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLogStats = async () => {
    try {
      // Get total count
      const totalQuery = query(collection(db, "logs"))
      const totalSnapshot = await getDocs(totalQuery)
      const total = totalSnapshot.size

      // Get counts by user role
      const roles = ["patient", "doctor", "admin", "system"]
      const roleCounts = {}

      for (const role of roles) {
        const roleQuery = query(collection(db, "logs"), where("userRole", "==", role))
        const roleSnapshot = await getDocs(roleQuery)
        roleCounts[role] = roleSnapshot.size
      }

      setStats({
        total,
        ...roleCounts,
      })
    } catch (error) {
      console.error("Error fetching log stats:", error)
    }
  }

  const handleRefresh = () => {
    // Reset pagination state
    setCurrentPage(1)
    setTotalPages(1)
    setPageSnapshots({})
    fetchLogs(1)
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages + 1 || newPage === currentPage) return
    fetchLogs(newPage)
  }

  const getLogIcon = (type) => {
    switch (type) {
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getUserRoleIcon = (role) => {
    switch (role) {
      case "patient":
        return <User className="h-5 w-5 text-blue-500" />
      case "doctor":
        return <UserCog className="h-5 w-5 text-green-500" />
      case "admin":
        return <Shield className="h-5 w-5 text-purple-500" />
      default:
        return <Info className="h-5 w-5 text-gray-500" />
    }
  }

  // Apply all filters to logs
  const filteredLogs = logs.filter((log) => {
    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        log.action?.toLowerCase().includes(searchLower) ||
        log.details?.toLowerCase().includes(searchLower) ||
        log.user?.toLowerCase().includes(searchLower) ||
        log.userData?.name?.toLowerCase().includes(searchLower) ||
        log.userData?.email?.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Apply log type filter
    if (logType !== "all" && log.type !== logType) {
      return false
    }

    // Apply user role filter
    if (userRole !== "all" && log.userRole !== userRole) {
      return false
    }

    // Apply date range filter
    if (dateRange !== "all") {
      const logDate = new Date(log.timestamp)
      const now = new Date()
      const startDate = new Date()

      switch (dateRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0)
          if (logDate < startDate) return false
          break
        case "yesterday":
          startDate.setDate(startDate.getDate() - 1)
          startDate.setHours(0, 0, 0, 0)
          const yesterdayEnd = new Date(startDate)
          yesterdayEnd.setHours(23, 59, 59, 999)
          if (logDate < startDate || logDate > yesterdayEnd) return false
          break
        case "week":
          startDate.setDate(startDate.getDate() - 7)
          if (logDate < startDate) return false
          break
        case "month":
          startDate.setMonth(startDate.getMonth() - 1)
          if (logDate < startDate) return false
          break
      }
    }

    return true
  })

  const exportLogs = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Timestamp,User,Role,Action,Details,IP Address,Type\n"

    filteredLogs.forEach((log) => {
      const timestamp = new Date(log.timestamp).toLocaleString()
      const row = [
        `"${timestamp}"`,
        `"${log.userData?.name || log.user || ""}"`,
        `"${log.userRole || ""}"`,
        `"${log.action || ""}"`,
        `"${log.details || ""}"`,
        `"${log.ip || ""}"`,
        `"${log.type || ""}"`,
      ].join(",")
      csvContent += row + "\n"
    })

    // Create download link and trigger download immediately
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `smartcare_logs_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full">
      <AdminHeaderBanner
        title="System Logs"
        subtitle="Monitor activities and user actions"
        stats={[
          {
            label: "Total Logs",
            value: stats.total.toString(),
            icon: <FileText className="h-4 w-4 text-white/70" />,
          },
          {
            label: "Patient",
            value: (stats.patient || 0).toString(),
            icon: <User className="h-4 w-4 text-white/70" />,
          },
          {
            label: "Doctor",
            value: (stats.doctor || 0).toString(),
            icon: <UserCog className="h-4 w-4 text-white/70" />,
          },
          {
            label: "Admin",
            value: (stats.admin || 0).toString(),
            icon: <Shield className="h-4 w-4 text-white/70" />,
          },
        ]}
      />

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <div className="relative">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3">
            {/* User Role Dropdown */}
            <div className="w-full sm:w-auto dropdown-container">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserRoleDropdownOpen(!userRoleDropdownOpen)}
                  className="w-full sm:w-48 pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 flex items-center justify-between transition-colors hover:border-amber-500 shadow-sm"
              >
                  <div className="flex items-center">
                    <Filter className="h-5 w-5 text-gray-400 mr-2 absolute left-3" />
                    <span className="text-gray-700 ml-2">
                      {userRole === "all"
                        ? "All Users"
                        : userRole === "patient"
                          ? "Patients"
                          : userRole === "doctor"
                            ? "Doctors"
                            : userRole === "admin"
                              ? "Admins"
                              : "System"}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      userRoleDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`absolute left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto transition-all duration-200 ease-out origin-top ${
                    userRoleDropdownOpen
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  {[
                    { value: "all", label: "All Users" },
                    { value: "patient", label: "Patients" },
                    { value: "doctor", label: "Doctors" },
                    { value: "admin", label: "Admins" },
                    { value: "system", label: "System" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setUserRole(option.value)
                        setUserRoleDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        userRole === option.value
                          ? "bg-amber-500 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Log Type Dropdown */}
            <div className="w-full sm:w-auto dropdown-container">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLogTypeDropdownOpen(!logTypeDropdownOpen)}
                  className="w-full sm:w-48 pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 flex items-center justify-between transition-colors hover:border-amber-500 shadow-sm"
              >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-2 absolute left-3" />
                    <span className="text-gray-700 ml-2">
                      {logType === "all"
                        ? "All Types"
                        : logType === "info"
                          ? "Information"
                          : logType === "success"
                            ? "Success"
                            : logType === "warning"
                              ? "Warning"
                              : "Error"}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      logTypeDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`absolute left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto transition-all duration-200 ease-out origin-top ${
                    logTypeDropdownOpen
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  {[
                    { value: "all", label: "All Types" },
                    { value: "info", label: "Information" },
                    { value: "success", label: "Success" },
                    { value: "warning", label: "Warning" },
                    { value: "error", label: "Error" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setLogType(option.value)
                        setLogTypeDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        logType === option.value
                          ? "bg-amber-500 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Range Dropdown */}
            <div className="w-full sm:w-auto dropdown-container">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDateRangeDropdownOpen(!dateRangeDropdownOpen)}
                  className="w-full sm:w-48 pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 flex items-center justify-between transition-colors hover:border-amber-500 shadow-sm"
              >
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2 absolute left-3" />
                    <span className="text-gray-700 ml-2">
                      {dateRange === "all"
                        ? "All Time"
                        : dateRange === "today"
                          ? "Today"
                          : dateRange === "yesterday"
                            ? "Yesterday"
                            : dateRange === "week"
                              ? "Last 7 Days"
                              : "Last 30 Days"}
                    </span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      dateRangeDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`absolute left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto transition-all duration-200 ease-out origin-top ${
                    dateRangeDropdownOpen
                      ? "opacity-100 scale-100 pointer-events-auto"
                      : "opacity-0 scale-95 pointer-events-none"
                  }`}
                >
                  {[
                    { value: "all", label: "All Time" },
                    { value: "today", label: "Today" },
                    { value: "yesterday", label: "Yesterday" },
                    { value: "week", label: "Last 7 Days" },
                    { value: "month", label: "Last 30 Days" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setDateRange(option.value)
                        setDateRangeDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        dateRange === option.value
                          ? "bg-amber-500 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
            >
              <RefreshCw className={`h-5 w-5 mr-2 text-gray-600 ${isLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={exportLogs}
              disabled={filteredLogs.length === 0}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-md hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200 font-medium"
            >
              <Download className="h-5 w-5 mr-2" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {debugInfo && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-blue-500 mr-2" />
            <p className="text-blue-700">{debugInfo}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Logs Display */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <RefreshCw className="h-5 w-5 text-amber-600 animate-spin mr-2" />
                      <span className="text-gray-600">Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-600 font-medium mb-2">No logs found</p>
                      <p className="text-gray-500 text-sm mb-4">
                        {stats.total === 0
                          ? "There are no logs in the Firestore 'logs' collection."
                          : "No logs match your current filter criteria."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <ProfileImage
                            src={log.userData?.photoURL}
                            alt={log.userData?.name || "User"}
                            className="h-10 w-10 rounded-full"
                            role={log.userRole || "patient"}
                          />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {log.userData?.name || log.user || "System"}
                          </p>
                          {log.userData?.email && <p className="text-xs text-gray-500">{log.userData.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getUserRoleIcon(log.userRole)}
                        <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                          {log.userRole || "system"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getLogIcon(log.type)}
                        <span className="ml-2 text-sm font-medium text-gray-900">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <p>{log.details}</p>

                        {/* Show involved users if available */}
                        {log.involvedUsers && log.involvedUsers.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {log.involvedUsers.map((user, idx) => (
                              <div
                                key={user.id || idx}
                                className={`flex items-center px-2 py-1 rounded-full ${
                                  user.role === "doctor"
                                    ? "bg-green-50"
                                    : user.role === "patient"
                                      ? "bg-blue-50"
                                      : user.role === "admin"
                                        ? "bg-purple-50"
                                        : "bg-gray-50"
                                }`}
                              >
                                <div className="h-6 w-6 rounded-full overflow-hidden mr-1">
                                  <ProfileImage
                                    src={user.photoURL}
                                    alt={user.name || "User"}
                                    className="h-full w-full"
                                    role={user.role || "patient"}
                                  />
                                </div>
                                <span
                                  className={`text-xs ${
                                    user.role === "doctor"
                                      ? "text-green-700"
                                      : user.role === "patient"
                                        ? "text-blue-700"
                                        : user.role === "admin"
                                          ? "text-purple-700"
                                          : "text-gray-700"
                                  }`}
                                >
                                  {user.role === "doctor" ? "Dr. " : ""}
                                  {user.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-5 w-5 text-amber-600 animate-spin mr-2" />
              <span className="text-gray-600">Loading logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium mb-2">No logs found</p>
              <p className="text-gray-500 text-sm text-center px-4">
                {stats.total === 0
                  ? "There are no logs in the Firestore 'logs' collection."
                  : "No logs match your current filter criteria."}
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <ProfileImage
                        src={log.userData?.photoURL}
                        alt={log.userData?.name || "User"}
                        className="h-12 w-12 rounded-full"
                        role={log.userRole || "patient"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {log.userData?.name || log.user || "System"}
                      </p>
                      {log.userData?.email && (
                        <p className="text-xs text-gray-500 truncate">{log.userData.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getUserRoleIcon(log.userRole)}
                    {getLogIcon(log.type)}
                  </div>
                </div>

                {/* Role and Type Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                    {log.userRole || "system"}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      log.type === "error"
                        ? "bg-red-100 text-red-700"
                        : log.type === "warning"
                          ? "bg-amber-100 text-amber-700"
                          : log.type === "success"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {log.type || "info"}
                  </span>
                </div>

                {/* Action */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900">{log.action}</p>
                </div>

                {/* Details */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600 line-clamp-2">{log.details}</p>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>

                {/* Involved Users */}
                {log.involvedUsers && log.involvedUsers.length > 0 && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Involved Users:</p>
                    <div className="flex flex-wrap gap-2">
                      {log.involvedUsers.map((user, idx) => (
                        <div
                          key={user.id || idx}
                          className={`flex items-center px-2 py-1 rounded-full ${
                            user.role === "doctor"
                              ? "bg-green-50"
                              : user.role === "patient"
                                ? "bg-blue-50"
                                : user.role === "admin"
                                  ? "bg-purple-50"
                                  : "bg-gray-50"
                          }`}
                        >
                          <div className="h-5 w-5 rounded-full overflow-hidden mr-1.5">
                            <ProfileImage
                              src={user.photoURL}
                              alt={user.name || "User"}
                              className="h-full w-full"
                              role={user.role || "patient"}
                            />
                          </div>
                          <span
                            className={`text-xs ${
                              user.role === "doctor"
                                ? "text-green-700"
                                : user.role === "patient"
                                  ? "text-blue-700"
                                  : user.role === "admin"
                                    ? "text-purple-700"
                                    : "text-gray-700"
                            }`}
                          >
                            {user.role === "doctor" ? "Dr. " : ""}
                            {user.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-center p-4 border-t border-gray-200">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
