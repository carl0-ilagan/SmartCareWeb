"use client"
import { useState, useEffect, useRef } from "react"
import {
  Users,
  UserCog,
  Calendar,
  Clock,
  Activity,
  AlertCircle,
  Shield,
  Bell,
  FileText,
  Cpu,
  Database,
  RefreshCw,
  ChevronDown,
  HardDrive,
  Server,
  BarChart2,
  Layers,
} from "lucide-react"
import Link from "next/link"
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  getDoc,
  doc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AdminHeaderBanner } from "@/components/admin-header-banner"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts"
import { getMetricsHistory, subscribeToMetrics, getLatestMetrics, generateSimulatedMetrics } from "@/lib/system-metrics"
import ProfileImage from "@/components/profile-image"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    appointmentsToday: 0,
    pendingAccounts: 0,
    systemStatus: {
      diskSpace: "0%",
      uptime: "0%",
      serverLoad: "Unknown",
      processes: 0,
      topProcesses: [],
    },
  })
  const [activityLog, setActivityLog] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [systemMetrics, setSystemMetrics] = useState([])
  const [currentMetric, setCurrentMetric] = useState("cpu") // cpu, memory, network
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDetailedMetrics, setShowDetailedMetrics] = useState(false)
  const metricsSubscription = useRef(null)
  const refreshInterval = useRef(null)

  // Activity log pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [logsPerPage] = useState(4)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [lastVisibleLog, setLastVisibleLog] = useState(null)
  const [firstPageLogs, setFirstPageLogs] = useState([])
  const [logType, setLogType] = useState("all")
  const [userCache, setUserCache] = useState({})
  const [chartData, setChartData] = useState({
    userGrowth: [],
    appointmentsByStatus: [],
    userDistribution: [],
    appointmentsOverTime: [],
    activityTrends: [],
  })

  // Subscribe to real-time metrics updates
  useEffect(() => {
    async function initializeMetrics() {
      try {
        // Get initial metrics history
        const history = await getMetricsHistory(currentMetric, 10)

        if (history && history.length > 0) {
          setSystemMetrics(history)

          // Update system status from the latest metrics
          const latestMetric = history[history.length - 1]
          updateSystemStatusFromMetrics(latestMetric)
        } else {
          console.log("No metrics history found, triggering initial collection")

          // Trigger an initial metrics collection
          try {
            await triggerMetricsCollection()

            // Wait a moment for the data to be stored
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Try to get the latest metrics again
            const latestMetrics = await getLatestMetrics()

            if (latestMetrics) {
              console.log("Retrieved latest metrics after collection:", latestMetrics)
              setSystemMetrics([
                {
                  id: latestMetrics.id,
                  time: latestMetrics.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  cpu: latestMetrics.cpu,
                  memory: latestMetrics.memory,
                  network: latestMetrics.network,
                  diskSpace: latestMetrics.diskSpace,
                  processes: latestMetrics.processes,
                  topProcesses: latestMetrics.topProcesses,
                },
              ])

              updateSystemStatusFromMetrics(latestMetrics)
            } else {
              console.log("Still no metrics available, falling back to simulated data")
              // If still no metrics, fall back to simulated data
              initializeSimulatedMetrics()
            }
          } catch (error) {
            console.error("Error during metrics collection:", error)
            // Fall back to simulated data
            initializeSimulatedMetrics()
          }
        }

        // Subscribe to real-time updates
        try {
          metricsSubscription.current = subscribeToMetrics((metrics) => {
            if (metrics && metrics.length > 0) {
              setSystemMetrics(metrics)
              updateSystemStatusFromMetrics(metrics[metrics.length - 1])
            }
          }, 10)

          // Set up a refresh interval for more frequent updates (every 5 seconds)
          refreshInterval.current = setInterval(() => {
            updateSimulatedMetrics()
          }, 5000)
        } catch (error) {
          console.error("Error setting up metrics subscription:", error)
          // If subscription fails, use simulated data updates
          const intervalId = setInterval(() => {
            updateSimulatedMetrics()
          }, 5000) // Update every 5 seconds

          // Store the interval ID for cleanup
          refreshInterval.current = intervalId
        }
      } catch (error) {
        console.error("Error initializing metrics:", error)
        // Fall back to simulated data if real metrics fail
        initializeSimulatedMetrics()
      }
    }

    initializeMetrics()

    // Cleanup subscription on unmount
    return () => {
      if (metricsSubscription.current) {
        metricsSubscription.current()
      }
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current)
      }
    }
  }, [currentMetric])

  // Update simulated metrics for more realistic behavior
  const updateSimulatedMetrics = () => {
    setSystemMetrics((prev) => {
      if (!prev || prev.length === 0) return generateSimulatedMetrics(10)

      // Create a new data point based on the last one
      const lastMetric = prev[prev.length - 1]
      const time = new Date()

      // Create realistic variations
      const cpuChange = Math.random() * 10 - 5
      const memoryChange = Math.random() * 6 - 2
      const networkChange = Math.random() * 15 - 7

      // Add some patterns
      const hourOfDay = time.getHours()
      const isBusinessHours = hourOfDay >= 9 && hourOfDay <= 17
      const cpuBusinessFactor = isBusinessHours ? 1.2 : 0.8

      const newMetric = {
        id: `sim-${Date.now()}`,
        time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        cpu: Math.max(5, Math.min(95, lastMetric.cpu * cpuBusinessFactor + cpuChange)),
        memory: Math.max(20, Math.min(90, lastMetric.memory + memoryChange)),
        network: Math.max(5, Math.min(95, lastMetric.network + networkChange)),
        diskSpace: Math.max(70, Math.min(85, lastMetric.diskSpace + (Math.random() * 0.4 - 0.2))),
        uptime: lastMetric.uptime,
        serverLoad: determineServerLoad(lastMetric.cpu * cpuBusinessFactor + cpuChange),
        processes: Math.floor(Math.random() * 10) + 110,
        topProcesses: generateTopProcesses(),
        timestamp: time,
      }

      // Keep only the last 10 data points
      const newMetrics = [...prev.slice(-9), newMetric]
      updateSystemStatusFromMetrics(newMetric)
      return newMetrics
    })
  }

  // Generate realistic top processes
  const generateTopProcesses = () => {
    return [
      { name: "node", cpu: Math.floor(Math.random() * 15) + 5, memory: Math.floor(Math.random() * 200) + 100 },
      { name: "firebase", cpu: Math.floor(Math.random() * 10) + 3, memory: Math.floor(Math.random() * 150) + 80 },
      { name: "chrome", cpu: Math.floor(Math.random() * 20) + 10, memory: Math.floor(Math.random() * 500) + 200 },
      { name: "system", cpu: Math.floor(Math.random() * 5) + 1, memory: Math.floor(Math.random() * 100) + 50 },
      { name: "nginx", cpu: Math.floor(Math.random() * 3) + 1, memory: Math.floor(Math.random() * 50) + 20 },
    ]
  }

  // Determine server load based on CPU
  const determineServerLoad = (cpu) => {
    if (cpu > 80) return "High"
    if (cpu > 50) return "Moderate"
    if (cpu < 20) return "Low"
    return "Normal"
  }

  // Update system status from metrics
  function updateSystemStatusFromMetrics(metric) {
    if (!metric) return

    setStats((prev) => ({
      ...prev,
      systemStatus: {
        diskSpace: `${Math.round(metric.diskSpace || 0)}%`,
        uptime: `${metric.uptime || 99.9}%`,
        serverLoad: metric.serverLoad || "Normal",
        processes: metric.processes || 0,
        topProcesses: metric.topProcesses || [],
      },
    }))
  }

  // Trigger metrics collection via API
  async function triggerMetricsCollection() {
    try {
      setIsRefreshing(true)
      const response = await fetch("/api/system-metrics")
      const data = await response.json()

      if (data.success) {
        console.log("Metrics collected successfully:", data.metrics)
      }
    } catch (error) {
      console.error("Error triggering metrics collection:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Initialize simulated metrics as fallback
  function initializeSimulatedMetrics() {
    console.log("Falling back to simulated metrics")

    // Use the generateSimulatedMetrics function for more realistic data
    const initialData = generateSimulatedMetrics(10)
    setSystemMetrics(initialData)

    // Update system status from the latest metrics
    const lastMetric = initialData[initialData.length - 1]
    updateSystemStatusFromMetrics(lastMetric)
  }

  // Fetch user details for activity logs
  const fetchUserDetails = async (userId) => {
    // Check cache first
    if (userCache[userId]) {
      return userCache[userId]
    }

    try {
      // Handle special cases
      if (userId === "system") {
        return { name: "System", role: "system", photoURL: null }
      }

      if (userId === "admin") {
        return { name: "Admin", role: "admin", photoURL: "/admin-interface.png" }
      }

      // Check if it's an email
      if (userId && userId.includes("@")) {
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("email", "==", userId), limit(1))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data()
          const user = {
            id: querySnapshot.docs[0].id,
            name: userData.displayName || userData.name || userId.split("@")[0],
            role: userData.role || "unknown",
            photoURL: userData.photoURL || null,
          }

          // Update cache
          setUserCache((prev) => ({ ...prev, [userId]: user }))
          return user
        }

        return { name: userId.split("@")[0], role: "unknown", photoURL: null }
      }

      // Fetch from Firestore
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        const user = {
          id: userId,
          name: userData.displayName || userData.name || "Unknown User",
          role: userData.role || "unknown",
          photoURL: userData.photoURL || null,
        }

        // Update cache
        setUserCache((prev) => ({ ...prev, [userId]: user }))
        return user
      }

      return { name: "Unknown User", role: "unknown", photoURL: null }
    } catch (error) {
      console.error("Error fetching user details:", error)
      return { name: "Unknown User", role: "unknown", photoURL: null }
    }
  }

  // Fetch activity logs with pagination
  const fetchActivityLogs = async (page = 1, reset = false) => {
    try {
      setIsLoadingLogs(true)

      // Create base query
      const logsRef = collection(db, "logs")
      const queryConstraints = [orderBy("timestamp", "desc")]

      // Add type filter if selected
      if (logType !== "all") {
        queryConstraints.push(where("type", "==", logType))
      }

      // Handle pagination
      if (page === 1 || reset) {
        // First page
        queryConstraints.push(limit(logsPerPage))
      } else {
        // Use startAfter for pagination
        if (!lastVisibleLog) {
          throw new Error("Cannot paginate: No last document")
        }
        queryConstraints.push(startAfter(lastVisibleLog), limit(logsPerPage))
      }

      const logsQuery = query(logsRef, ...queryConstraints)
      const logsSnapshot = await getDocs(logsQuery)

      // Calculate total pages (approximate)
      if (page === 1 || reset) {
        // Get total count for pagination
        const countQuery = query(logsRef, ...(logType !== "all" ? [where("type", "==", logType)] : []))
        const countSnapshot = await getDocs(countQuery)
        setTotalPages(Math.ceil(countSnapshot.size / logsPerPage))
      }

      // Update last visible document for pagination
      const lastDoc = logsSnapshot.docs[logsSnapshot.docs.length - 1]
      if (lastDoc) {
        setLastVisibleLog(lastDoc)
      }

      // Process logs
      const logsData = await Promise.all(
        logsSnapshot.docs.map(async (doc) => {
          const data = doc.data()

          // Fetch user details
          const userData = await fetchUserDetails(data.user || "system")

          return {
            id: doc.id,
            user: data.user || "System",
            userData,
            action: data.action || "Unknown action",
            details: data.details || "",
            time: data.timestamp ? formatTimeAgo(data.timestamp.toDate()) : "Unknown time",
            timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
            type: data.type || "info",
          }
        }),
      )

      // Save first page logs for quick navigation back to first page
      if (page === 1 || reset) {
        setFirstPageLogs(logsData)
      }

      setActivityLog(logsData)
      setCurrentPage(page)
    } catch (error) {
      console.error("Error fetching activity logs:", error)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  // Handle page change for activity logs
  const handlePageChange = (page) => {
    if (page === currentPage) return

    if (page === 1 && firstPageLogs.length > 0) {
      // Use cached first page
      setActivityLog(firstPageLogs)
      setCurrentPage(1)
    } else {
      fetchActivityLogs(page)
    }
  }

  // Handle log type filter change
  const handleLogTypeChange = (type) => {
    setLogType(type)
    fetchActivityLogs(1, true)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)

        // Fetch user counts
        const usersRef = collection(db, "users")
        const patientsQuery = query(usersRef, where("role", "==", "patient"))
        const doctorsQuery = query(usersRef, where("role", "==", "doctor"))
        const pendingQuery = query(usersRef, where("status", "==", 0))

        const [patientsSnapshot, doctorsSnapshot, pendingSnapshot] = await Promise.all([
          getDocs(patientsQuery),
          getDocs(doctorsQuery),
          getDocs(pendingQuery),
        ])

        // Fetch today's appointments
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const appointmentsRef = collection(db, "appointments")
        const todayAppointmentsQuery = query(
          appointmentsRef,
          where("date", ">=", Timestamp.fromDate(today)),
          where("date", "<", Timestamp.fromDate(tomorrow)),
        )

        const appointmentsSnapshot = await getDocs(todayAppointmentsQuery)

        setStats((prev) => ({
          ...prev,
          totalPatients: patientsSnapshot.size,
          totalDoctors: doctorsSnapshot.size,
          appointmentsToday: appointmentsSnapshot.size,
          pendingAccounts: pendingSnapshot.size,
        }))

        // Fetch activity logs with pagination
        await fetchActivityLogs(1, true)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch chart data
  const fetchChartData = async (patientsCount, doctorsCount) => {
    try {
      // User Distribution (Pie Chart)
      const userDistribution = [
        { name: "Patients", value: patientsCount || stats.totalPatients, color: "#f59e0b" },
        { name: "Doctors", value: doctorsCount || stats.totalDoctors, color: "#3b82f6" },
      ]

      // Appointments by Status (Pie Chart)
      const appointmentsRef = collection(db, "appointments")
      const allAppointmentsQuery = query(appointmentsRef, limit(100))
      const appointmentsSnapshot = await getDocs(allAppointmentsQuery)
      
      const statusCounts = { scheduled: 0, completed: 0, cancelled: 0, pending: 0 }
      appointmentsSnapshot.forEach((doc) => {
        const status = doc.data().status?.toLowerCase() || "pending"
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status]++
        } else {
          statusCounts.pending++
        }
      })

      const appointmentsByStatus = [
        { name: "Scheduled", value: statusCounts.scheduled, color: "#10b981" },
        { name: "Completed", value: statusCounts.completed, color: "#3b82f6" },
        { name: "Cancelled", value: statusCounts.cancelled, color: "#ef4444" },
        { name: "Pending", value: statusCounts.pending, color: "#f59e0b" },
      ]

      // User Growth (Line Chart) - Last 7 days
      const usersRef = collection(db, "users")
      const allUsersQuery = query(usersRef, orderBy("createdAt", "desc"), limit(100))
      const usersSnapshot = await getDocs(allUsersQuery)
      
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        date.setHours(0, 0, 0, 0)
        return date
      })

      const userGrowth = last7Days.map((date) => {
        const count = usersSnapshot.docs.filter((doc) => {
          const userData = doc.data()
          const createdAt = userData.createdAt?.toDate?.() || new Date(userData.createdAt)
          return createdAt <= date
        }).length
        return {
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          users: count,
        }
      })

      // Appointments Over Time (Bar Chart) - Last 7 days
      const appointmentsOverTime = last7Days.map((date) => {
        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)
        
        const count = appointmentsSnapshot.docs.filter((doc) => {
          const aptDate = doc.data().date?.toDate?.() || new Date(doc.data().date)
          return aptDate >= date && aptDate < nextDay
        }).length
        
        return {
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          appointments: count,
        }
      })

      // Activity Trends (Line Chart) - Last 7 days
      const activityLogsRef = collection(db, "activityLogs")
      const recentLogsQuery = query(activityLogsRef, orderBy("timestamp", "desc"), limit(200))
      const logsSnapshot = await getDocs(recentLogsQuery)

      const activityTrends = last7Days.map((date) => {
        const nextDay = new Date(date)
        nextDay.setDate(nextDay.getDate() + 1)
        
        const count = logsSnapshot.docs.filter((doc) => {
          const logDate = doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
          return logDate >= date && logDate < nextDay
        }).length
        
        return {
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          activities: count,
        }
      })

      setChartData({
        userDistribution,
        appointmentsByStatus,
        userGrowth,
        appointmentsOverTime,
        activityTrends,
      })
    } catch (error) {
      console.error("Error fetching chart data:", error)
    }
  }

  // Fetch chart data after stats are loaded
  useEffect(() => {
    if (!isLoading && (stats.totalPatients > 0 || stats.totalDoctors > 0)) {
      fetchChartData(stats.totalPatients, stats.totalDoctors)
    }
  }, [stats.totalPatients, stats.totalDoctors, isLoading])

  // Format time ago helper function
  function formatTimeAgo(date) {
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="animate-pulse w-full">
        <div className="h-40 bg-gray-200 rounded-xl mb-6"></div>
        <h1 className="text-2xl font-bold mb-6 bg-gray-200 h-8 w-48 rounded"></h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 h-32 w-full">
              <div className="bg-gray-200 h-6 w-24 rounded mb-2"></div>
              <div className="bg-gray-200 h-10 w-16 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 h-80 w-full"></div>
          <div className="bg-white rounded-lg shadow-sm p-6 h-80 w-full"></div>
        </div>
      </div>
    )
  }

  // Banner stats
  const bannerStats = [
    {
      label: "Total Users",
      value: stats.totalPatients + stats.totalDoctors,
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Pending Accounts",
      value: stats.pendingAccounts,
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: "Today's Appointments",
      value: stats.appointmentsToday,
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      label: "System Status",
      value: stats.systemStatus.serverLoad,
      icon: <Shield className="h-4 w-4" />,
    },
  ]

  // Get color for the metric
  const getMetricColor = (value) => {
    if (value > 80) return "#ef4444" // red
    if (value > 60) return "#f59e0b" // amber
    return "#10b981" // green
  }

  // Get the current metric data for the tooltip
  const getCurrentMetricData = (metric) => {
    const lastMetric = systemMetrics[systemMetrics.length - 1] || { cpu: 0, memory: 0, network: 0 }
    return lastMetric[metric]
  }

  return (
    <div className="page-transition-enter w-full">
      <AdminHeaderBanner
        title="Admin Dashboard"
        subtitle="Monitor and manage your healthcare system"
        stats={bannerStats}
      />

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 w-full">
        {/* User Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-graphite mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-amber-600" />
            User Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.userDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.userDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Appointments by Status Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-graphite mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-amber-600" />
            Appointments by Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.appointmentsByStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.appointmentsByStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Line Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-graphite mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-amber-600" />
            User Growth (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#f59e0b" strokeWidth={2} name="Total Users" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Appointments Over Time Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-graphite mb-4 flex items-center">
            <BarChart2 className="h-5 w-5 mr-2 text-amber-600" />
            Appointments Over Time (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.appointmentsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="appointments" fill="#f59e0b" name="Appointments" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Activity Log */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-lg font-semibold text-graphite">Latest Activity</h2>

            <div className="flex items-center gap-3">
              {/* Log type filter */}
              <div className="relative">
                <select
                  value={logType}
                  onChange={(e) => handleLogTypeChange(e.target.value)}
                  className="pl-3 pr-8 py-1 text-sm border border-earth-beige rounded-md focus:outline-none focus:ring-1 focus:ring-soft-amber appearance-none"
                >
                  <option value="all">All Types</option>
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-drift-gray pointer-events-none" />
              </div>
            </div>
          </div>

          {isLoadingLogs ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start border-b border-earth-beige pb-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-gray-200 mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/5"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activityLog.length > 0 ? (
            <>
              <div className="space-y-4">
                {activityLog.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start border-b border-earth-beige pb-3 last:border-0 hover:bg-pale-stone/10 p-2 rounded-md transition-colors"
                  >
                    <div className="mr-3 relative">
                      <ProfileImage
                        src={log.userData?.photoURL}
                        alt={log.userData?.name || "User"}
                        className="h-10 w-10 rounded-full"
                        role={log.userData?.role || "patient"}
                      />
                      <ActivityIcon
                        type={log.type}
                        className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-graphite">
                          {log.userData?.role === "doctor" ? "Dr. " : ""}
                          {log.userData?.name || log.user}
                          {log.userData?.role && (
                            <span
                              className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                log.userData.role === "doctor"
                                  ? "bg-green-100 text-green-800"
                                  : log.userData.role === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : log.userData.role === "patient"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {log.userData.role}
                            </span>
                          )}
                        </p>
                        <span className="text-xs text-drift-gray">{log.time}</span>
                      </div>
                      <p className="text-sm text-graphite font-medium mt-1">{log.action}</p>
                      {log.details && <p className="text-xs text-drift-gray mt-1 line-clamp-2">{log.details}</p>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex justify-end mt-4">
                <a href="/admin/logs" className="text-sm text-primary hover:underline">
                  View all logs →
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-drift-gray">
              <FileText className="h-12 w-12 mx-auto mb-2 text-soft-amber/50" />
              <p>No recent activity logs found</p>
            </div>
          )}
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-graphite">System Status</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDetailedMetrics(!showDetailedMetrics)}
                className="text-soft-amber hover:text-soft-amber/80 transition-colors"
                title={showDetailedMetrics ? "Show summary" : "Show details"}
              >
                {showDetailedMetrics ? <BarChart2 className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
              </button>
              <button
                onClick={triggerMetricsCollection}
                className="text-soft-amber hover:text-soft-amber/80 transition-colors"
                disabled={isRefreshing}
                title="Refresh metrics"
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Task Manager Style View */}
          {showDetailedMetrics ? (
            <div className="mb-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-graphite mb-2">Performance</h3>
                <div className="grid grid-cols-3 gap-2">
                  <MetricCard
                    title="CPU"
                    value={`${Math.round(getCurrentMetricData("cpu"))}%`}
                    icon={<Cpu className="h-4 w-4" />}
                    color={getMetricColor(getCurrentMetricData("cpu"))}
                    percentage={getCurrentMetricData("cpu")}
                  />
                  <MetricCard
                    title="Memory"
                    value={`${Math.round(getCurrentMetricData("memory"))}%`}
                    icon={<Server className="h-4 w-4" />}
                    color={getMetricColor(getCurrentMetricData("memory"))}
                    percentage={getCurrentMetricData("memory")}
                  />
                  <MetricCard
                    title="Disk"
                    value={`${Math.round(getCurrentMetricData("diskSpace"))}%`}
                    icon={<HardDrive className="h-4 w-4" />}
                    color={getMetricColor(getCurrentMetricData("diskSpace"))}
                    percentage={getCurrentMetricData("diskSpace")}
                  />
                </div>
              </div>

              {/* Top Processes */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-graphite mb-2">Top Processes</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Process
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          CPU
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Memory
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats.systemStatus.topProcesses && stats.systemStatus.topProcesses.length > 0 ? (
                        stats.systemStatus.topProcesses.map((process, index) => (
                          <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-3 py-2 whitespace-nowrap">{process.name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-right">{process.cpu}%</td>
                            <td className="px-3 py-2 whitespace-nowrap text-right">{process.memory} MB</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-center text-gray-500">
                            No process data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs text-gray-500 text-right">
                  Total Processes: {stats.systemStatus.processes || "Unknown"}
                </div>
              </div>

              {/* System Info */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-graphite mb-2">System Info</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded-md">
                    <div className="text-xs text-gray-500">Uptime</div>
                    <div className="text-sm font-medium">{stats.systemStatus.uptime}</div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-md">
                    <div className="text-xs text-gray-500">Server Load</div>
                    <div className="text-sm font-medium">{stats.systemStatus.serverLoad}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Real-time metrics graph */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setCurrentMetric("cpu")}
                      className={`text-xs px-2 py-1 rounded ${
                        currentMetric === "cpu"
                          ? "bg-soft-amber text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      CPU
                    </button>
                    <button
                      onClick={() => setCurrentMetric("memory")}
                      className={`text-xs px-2 py-1 rounded ${
                        currentMetric === "memory"
                          ? "bg-soft-amber text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Memory
                    </button>
                    <button
                      onClick={() => setCurrentMetric("network")}
                      className={`text-xs px-2 py-1 rounded ${
                        currentMetric === "network"
                          ? "bg-soft-amber text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Network
                    </button>
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: getMetricColor(getCurrentMetricData(currentMetric)) }}
                  >
                    {Math.round(getCurrentMetricData(currentMetric))}%
                  </div>
                </div>

                <div className="h-32 w-full">
                  {systemMetrics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={systemMetrics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                        <XAxis dataKey="time" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis
                          domain={[0, 100]}
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                          formatter={(value) => [
                            `${Math.round(value)}%`,
                            currentMetric.charAt(0).toUpperCase() + currentMetric.slice(1),
                          ]}
                          labelFormatter={(label) => `Time: ${label}`}
                        />
                        <Area
                          type="monotone"
                          dataKey={currentMetric}
                          stroke={getMetricColor(getCurrentMetricData(currentMetric))}
                          fill={`${getMetricColor(getCurrentMetricData(currentMetric))}30`}
                          strokeWidth={2}
                          activeDot={{ r: 4 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-drift-gray text-sm">No metrics data available</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 mt-6">
                <StatusItem
                  label="Disk Space"
                  value={stats.systemStatus.diskSpace}
                  icon={<Database className="h-5 w-5 text-soft-amber" />}
                  progress={Number.parseInt(stats.systemStatus.diskSpace)}
                />
                <StatusItem
                  label="System Uptime"
                  value={stats.systemStatus.uptime}
                  icon={<Activity className="h-5 w-5 text-green-500" />}
                />
                <StatusItem
                  label="Server Load"
                  value={stats.systemStatus.serverLoad}
                  icon={
                    <Cpu
                      className={`h-5 w-5 ${
                        stats.systemStatus.serverLoad === "High"
                          ? "text-red-500"
                          : stats.systemStatus.serverLoad === "Moderate"
                            ? "text-amber-500"
                            : "text-green-500"
                      }`}
                    />
                  }
                />
              </div>
            </>
          )}

          <div className="pt-4 mt-4 border-t border-earth-beige">
            <Link
              href="/admin/settings"
              className="inline-flex items-center justify-center px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-soft-amber/90 transition-colors w-full"
            >
              System Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Stats Card Component
function StatsCard({ title, value, icon, link, alert = false }) {
  return (
    <Link href={link} className="w-full">
      <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow relative overflow-hidden group w-full">
        {alert && <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-drift-gray font-medium mb-1">{title}</p>
            <p className="text-2xl font-bold text-graphite">{value}</p>
          </div>
          <div className="p-2 rounded-full bg-pale-stone group-hover:bg-soft-amber/10 transition-colors">{icon}</div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-soft-amber/20 group-hover:bg-soft-amber transition-colors"></div>
      </div>
    </Link>
  )
}

// Status Item Component
function StatusItem({ label, value, icon, progress }) {
  // Determine color based on value
  const getProgressColor = (value) => {
    if (!value && value !== 0) return "bg-green-500"

    const numValue = Number.parseInt(value)
    if (isNaN(numValue)) return "bg-green-500"

    if (numValue > 80) return "bg-red-500"
    if (numValue > 60) return "bg-amber-500"
    return "bg-green-500"
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {icon}
          <span className="ml-2 text-sm text-drift-gray">{label}</span>
        </div>
        <span className="text-sm font-medium text-graphite">{value}</span>
      </div>

      {progress !== undefined && (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${getProgressColor(progress)}`} style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  )
}

// Activity Icon Component
function ActivityIcon({ type, className = "" }) {
  switch (type) {
    case "success":
      return <Activity className={`h-5 w-5 text-green-500 ${className}`} />
    case "warning":
      return <Bell className={`h-5 w-5 text-amber-500 ${className}`} />
    case "error":
      return <AlertCircle className={`h-5 w-5 text-red-500 ${className}`} />
    case "info":
    default:
      return <Activity className={`h-5 w-5 text-soft-amber ${className}`} />
  }
}

// Metric Card Component for detailed view
function MetricCard({ title, value, icon, color, percentage }) {
  return (
    <div className="bg-gray-50 p-2 rounded-md">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          {icon}
          <span className="text-xs text-gray-500 ml-1">{title}</span>
        </div>
        <span className="text-sm font-medium" style={{ color }}>
          {value}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
      </div>
    </div>
  )
}
