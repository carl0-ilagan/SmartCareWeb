"use client"

import { useEffect, useRef, useState } from "react"
import { RefreshCw, Server, Shield, HardDrive, Activity, AlertCircle, Cpu, Database, Network, TrendingUp, CheckCircle2, XCircle, Clock, OctagonAlert, Globe2, ChevronDown, Wrench, Loader2, Mail, AlertTriangle, Power } from "lucide-react"
import { AdminHeaderBanner } from "@/components/admin-header-banner"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { generateSimulatedMetrics, subscribeToMetrics } from "@/lib/system-metrics"
import { collection, getDocs, limit, orderBy, query, where, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { sendNotification } from "@/lib/notification-utils"

export default function SettingsPage() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [errorLogs, setErrorLogs] = useState([])
  const [errorFilter, setErrorFilter] = useState("all")
  const [errorFilterOpen, setErrorFilterOpen] = useState(false)
  
  // Maintenance mode states
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [maintenanceLoading, setMaintenanceLoading] = useState(true)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [maintenanceAction, setMaintenanceAction] = useState("enable") // "enable" or "disable"
  const [sendingEmails, setSendingEmails] = useState(false)
  const [maintenanceSuccess, setMaintenanceSuccess] = useState("")
  
  const [systemStatus, setSystemStatus] = useState({
    serverLoad: "Unknown",
    uptime: "99.9%",
    diskSpace: "0%",
    processes: 0,
    cpu: 0,
    memory: 0,
    network: 0,
    lastUpdated: null,
  })
  const [metricsHistory, setMetricsHistory] = useState([])
  const [currentMetric, setCurrentMetric] = useState("cpu")
  const unsubscribeRef = useRef(null)

  useEffect(() => {
    startRealtimeMetrics()
    fetchErrors()
    fetchMaintenanceStatus()
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch maintenance mode status
  const fetchMaintenanceStatus = async () => {
    try {
      setMaintenanceLoading(true)
      const settingsDoc = await getDoc(doc(db, "settings", "maintenance"))
      if (settingsDoc.exists()) {
        setMaintenanceMode(settingsDoc.data().enabled || false)
      }
    } catch (err) {
      console.error("Error fetching maintenance status:", err)
    } finally {
      setMaintenanceLoading(false)
    }
  }

  // Toggle maintenance mode
  const handleMaintenanceToggle = async () => {
    const newStatus = maintenanceAction === "enable"
    
    try {
      setSendingEmails(true)
      
      // Update maintenance status in Firestore
      await setDoc(doc(db, "settings", "maintenance"), {
        enabled: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid || null,
        updatedByName: user?.displayName || "Admin",
      })
      
      // Send email and in-app notifications to all users
      try {
        const usersSnapshot = await getDocs(
          query(collection(db, "users"), where("role", "in", ["patient", "doctor"]))
        )
        
        const notificationPromises = usersSnapshot.docs.map(async (userDoc) => {
          const userData = userDoc.data()
          const userId = userDoc.id
          
          // Send in-app notification
          try {
            await sendNotification(userId, {
              title: newStatus 
                ? "System Under Maintenance" 
                : "Maintenance Complete",
              message: newStatus
                ? "Smart Care is currently undergoing scheduled maintenance. Access is temporarily restricted. We'll notify you when maintenance is complete."
                : "Great news! Smart Care maintenance has been completed successfully. You can now access the system normally.",
              type: newStatus ? "warning" : "success",
            })
          } catch (notifErr) {
            console.warn(`Failed to send notification to ${userId}:`, notifErr)
          }
          
          // Send email notification
          if (userData.email) {
            const subject = newStatus 
              ? "Smart Care - Scheduled Maintenance" 
              : "Smart Care - Maintenance Complete"
            const message = newStatus
              ? `Dear ${userData.displayName || "User"},\n\nSmart Care is currently undergoing scheduled maintenance. During this time, you may not be able to access the system.\n\nWe apologize for any inconvenience and will notify you once maintenance is complete.\n\nThank you for your patience.\n\nBest regards,\nSmart Care Team`
              : `Dear ${userData.displayName || "User"},\n\nGreat news! Smart Care maintenance has been completed successfully.\n\nThe system is now ready to use again. You can access all features normally.\n\nThank you for your patience during the maintenance period.\n\nBest regards,\nSmart Care Team`
            
            try {
              await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: userData.email, subject, text: message }),
              })
            } catch (emailErr) {
              console.warn(`Failed to send email to ${userData.email}:`, emailErr)
            }
          }
        })
        
        await Promise.allSettled(notificationPromises)
      } catch (notifErr) {
        console.warn("Error sending maintenance notifications:", notifErr)
      }
      
      setMaintenanceMode(newStatus)
      setShowMaintenanceModal(false)
      setMaintenanceSuccess(
        newStatus 
          ? "Maintenance mode enabled. Users have been notified via email."
          : "Maintenance mode disabled. Users have been notified via email."
      )
      
      // Clear success message after 5 seconds
      setTimeout(() => setMaintenanceSuccess(""), 5000)
    } catch (err) {
      console.error("Error toggling maintenance mode:", err)
      setError("Failed to update maintenance mode. Please try again.")
    } finally {
      setSendingEmails(false)
    }
  }

  const openMaintenanceModal = (action) => {
    setMaintenanceAction(action)
    setShowMaintenanceModal(true)
  }

  // Handle escape key to close modal
  useEffect(() => {
    if (!showMaintenanceModal) return
    
    const handleEscape = (e) => {
      if (e.key === "Escape" && !sendingEmails) {
        setShowMaintenanceModal(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [showMaintenanceModal, sendingEmails])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showMaintenanceModal) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [showMaintenanceModal])

  const startRealtimeMetrics = async () => {
    setIsLoading(true)
    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current?.()
    }
    const unsub = subscribeToMetrics((metric, history) => {
      const serverLoad = metric?.serverLoad || determineServerLoad(metric?.cpu || 0)
      setSystemStatus({
        serverLoad,
        uptime: `${metric?.uptime || 99.9}%`,
        diskSpace: `${Math.round(metric?.diskSpace || 0)}%`,
        processes: metric?.processes || 0,
        cpu: Math.round(metric?.cpu || 0),
        memory: Math.round(metric?.memory || 0),
        network: Math.round(metric?.network || 0),
        lastUpdated: new Date(),
      })

      if (history && history.length > 0) {
        setMetricsHistory(
          history.slice(-10).map((m) => ({
            time: m.time || new Date(m.timestamp || new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            cpu: Math.round(m.cpu || 0),
            memory: Math.round(m.memory || 0),
            network: Math.round(m.network || 0),
          }))
        )
      } else {
        // fallback to simulated
        const simulated = generateSimulatedMetrics(10).map((m) => ({
          time: m.time,
          cpu: m.cpu,
          memory: m.memory,
          network: m.network,
        }))
        setMetricsHistory(simulated)
      }

      setIsLoading(false)
      setIsRefreshing(false)
    }, 10)
    // store unsubscribe
    unsubscribeRef.current = unsub
  }

  const fetchStatus = async () => {
    try {
      setError("")
      setIsLoading(true)
      const res = await fetch("/api/system-metrics")
      const data = await res.json()

      if (!data.success || !data.metrics) {
        throw new Error("No metrics data available")
      }

      const metric = data.metrics
      const serverLoad = metric.serverLoad || determineServerLoad(metric.cpu || 0)
      
      setSystemStatus({
        serverLoad,
        uptime: `${metric.uptime || 99.9}%`,
        diskSpace: `${Math.round(metric.diskSpace || 0)}%`,
        processes: metric.processes || 0,
        cpu: Math.round(metric.cpu || 0),
        memory: Math.round(metric.memory || 0),
        network: Math.round(metric.network || 0),
        lastUpdated: new Date(),
      })

      // Fetch metrics history for charts; seed with latest if history missing
      await fetchMetricsHistory(metric)
    } catch (err) {
      console.error("Error fetching system metrics:", err)
      setError("Unable to fetch system status right now.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const fetchMetricsHistory = async (latestMetric) => {
    try {
      const res = await fetch("/api/system-metrics?history=true")
      const data = await res.json()
      
      if (data.success && data.history) {
        const formatted = data.history.map((m, i) => ({
          time: new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          cpu: Math.round(m.cpu || 0),
          memory: Math.round(m.memory || 0),
          network: Math.round(m.network || 0),
        }))
        const sliced = formatted.slice(-10)
        if (sliced.length > 0) {
          setMetricsHistory(sliced)
          return
        }
      }

      // If no history returned, fallback to latest metric if available
      if (latestMetric) {
        setMetricsHistory([
          {
            time: new Date(latestMetric.timestamp || new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            cpu: Math.round(latestMetric.cpu || 0),
            memory: Math.round(latestMetric.memory || 0),
            network: Math.round(latestMetric.network || 0),
          },
        ])
        return
      }

      // Final fallback: simulated metrics
      const simulated = generateSimulatedMetrics(10).map((m) => ({
        time: m.time,
        cpu: m.cpu,
        memory: m.memory,
        network: m.network,
      }))
      setMetricsHistory(simulated)
    } catch (err) {
      console.error("Error fetching metrics history:", err)
      // Fallback to simulated metrics if API fails
      const simulated = generateSimulatedMetrics(10).map((m) => ({
        time: m.time,
        cpu: m.cpu,
        memory: m.memory,
        network: m.network,
      }))
      setMetricsHistory(simulated)
    }
  }

  const fetchErrors = async () => {
    try {
      const logsRef = collection(db, "activityLogs")
      const q = query(
        logsRef,
        where("type", "in", ["error", "warning", "security", "vulnerability"]),
        orderBy("timestamp", "desc"),
        limit(15)
      )
      const snap = await getDocs(q)
      const items = snap.docs.map((doc) => {
        const data = doc.data()
        const severity = (data.type || "error").toLowerCase()
        return {
          id: doc.id,
          message: data.message || data.action || "Unknown error",
          page: data.page || data.path || "Unknown page",
          side: data.role || data.userRole || "unknown",
          severity,
          time: data.timestamp?.toDate?.() || new Date(),
        }
      })
      setErrorLogs(items)
    } catch (err) {
      console.error("Error fetching error logs:", err)
    }
  }

  const errorFilterOptions = [
    { value: "all", label: "All Sides" },
    { value: "patient", label: "Patient" },
    { value: "doctor", label: "Doctor" },
    { value: "admin", label: "Admin" },
    { value: "system", label: "System" },
  ]

  const renderSeverityPill = (severity) => {
    const sev = severity || "error"
    const map = {
      error: "bg-red-50 text-red-700 border-red-200",
      security: "bg-amber-50 text-amber-700 border-amber-200",
      vulnerability: "bg-amber-50 text-amber-700 border-amber-200",
      warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    }
    const cls = map[sev] || "bg-red-50 text-red-700 border-red-200"
    return <span className={`px-2 py-0.5 rounded-full text-[11px] border ${cls}`}>{sev}</span>
  }

  const determineServerLoad = (cpu) => {
    if (cpu > 80) return "High"
    if (cpu > 50) return "Moderate"
    if (cpu < 20) return "Low"
    return "Normal"
  }

  const getMetricColor = (value) => {
    if (value > 80) return "#ef4444" // red
    if (value > 60) return "#f59e0b" // amber
    return "#10b981" // green
  }

  const getStatusColor = (status) => {
    if (status === "High") return "text-red-600"
    if (status === "Moderate") return "text-amber-600"
    if (status === "Low") return "text-blue-600"
    return "text-green-600"
  }

  const getStatusIcon = (status) => {
    if (status === "High") return <XCircle className="h-5 w-5 text-red-600" />
    if (status === "Moderate") return <AlertCircle className="h-5 w-5 text-amber-600" />
    return <CheckCircle2 className="h-5 w-5 text-green-600" />
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    startRealtimeMetrics()
  }

  const bannerStats = [
    {
      label: "Server Load",
      value: systemStatus.serverLoad,
    },
    {
      label: "System Uptime",
      value: systemStatus.uptime,
    },
    {
      label: "Disk Usage",
      value: systemStatus.diskSpace,
    },
    {
      label: "Active Processes",
      value: systemStatus.processes,
    },
  ]

  return (
    <div className="page-transition-enter w-full">
      <AdminHeaderBanner
        title="System Settings"
        subtitle="Monitor and manage system status and performance"
        stats={bannerStats}
      />
      
      {/* Refresh Button */}
      <div className="mb-6 flex justify-end">
            <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Status"}
            </button>
      </div>

      {/* Maintenance Mode Toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-earth-beige/50 py-4 px-4 sm:py-5 sm:px-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 flex-shrink-0">
              <Power className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-semibold text-graphite mb-0.5 sm:mb-1">
                Maintenance Mode
              </h2>
              <p className="text-xs sm:text-sm text-drift-gray leading-relaxed">
                {maintenanceMode 
                  ? "System is currently under maintenance. Patient and doctor access is restricted."
                  : "Enable maintenance mode to restrict patient and doctor access during system updates."
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {maintenanceSuccess && (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="text-xs font-medium whitespace-nowrap">{maintenanceSuccess}</span>
              </div>
            )}
            {maintenanceLoading ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-amber-600 flex-shrink-0" />
            ) : (
              <button
                onClick={() => openMaintenanceModal(maintenanceMode ? "disable" : "enable")}
                className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 flex-shrink-0 ${
                  maintenanceMode ? "bg-red-600" : "bg-gray-300"
                }`}
                aria-label={maintenanceMode ? "Disable maintenance mode" : "Enable maintenance mode"}
              >
                <span
                  className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                    maintenanceMode ? "translate-x-5 sm:translate-x-6" : "translate-x-0.5 sm:translate-x-0.5"
                  }`}
                />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* System Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 transition-all duration-300 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white group-hover:scale-110 shadow-sm">
              <Cpu className="h-6 w-6" />
            </div>
            {getStatusIcon(systemStatus.serverLoad)}
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-drift-gray mb-1">CPU Usage</p>
            <p className="text-3xl font-bold text-graphite mb-1">
              {isLoading ? "—" : `${systemStatus.cpu}%`}
            </p>
            <div className="h-2 w-full bg-pale-stone rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${systemStatus.cpu}%`,
                  backgroundColor: getMetricColor(systemStatus.cpu),
                }}
              />
            </div>
          </div>
              </div>

        <div className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 transition-all duration-300 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white group-hover:scale-110 shadow-sm">
              <Database className="h-6 w-6" />
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
              <div>
            <p className="text-xs font-medium uppercase text-drift-gray mb-1">Memory Usage</p>
            <p className="text-3xl font-bold text-graphite mb-1">
              {isLoading ? "—" : `${systemStatus.memory}%`}
            </p>
            <div className="h-2 w-full bg-pale-stone rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${systemStatus.memory}%`,
                  backgroundColor: getMetricColor(systemStatus.memory),
                }}
                />
              </div>
          </div>
              </div>

        <div className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 transition-all duration-300 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white group-hover:scale-110 shadow-sm">
              <HardDrive className="h-6 w-6" />
            </div>
            <AlertCircle className={`h-5 w-5 ${parseInt(systemStatus.diskSpace) > 80 ? "text-red-600" : parseInt(systemStatus.diskSpace) > 60 ? "text-amber-600" : "text-green-600"}`} />
          </div>
              <div>
            <p className="text-xs font-medium uppercase text-drift-gray mb-1">Disk Space</p>
            <p className="text-3xl font-bold text-graphite mb-1">
              {isLoading ? "—" : systemStatus.diskSpace}
            </p>
            <div className="h-2 w-full bg-pale-stone rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: systemStatus.diskSpace,
                  backgroundColor: getMetricColor(parseInt(systemStatus.diskSpace)),
                }}
              />
            </div>
          </div>
            </div>

        <div className="group relative overflow-hidden rounded-xl border border-amber-200/50 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-sm transition-all duration-300 hover:border-amber-400 hover:shadow-lg hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 transition-all duration-300 group-hover:from-amber-500 group-hover:to-amber-600 group-hover:text-white group-hover:scale-110 shadow-sm">
              <Network className="h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-drift-gray mb-1">Network I/O</p>
            <p className="text-3xl font-bold text-graphite mb-1">
              {isLoading ? "—" : `${systemStatus.network}%`}
            </p>
            <div className="h-2 w-full bg-pale-stone rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${systemStatus.network}%`,
                  backgroundColor: getMetricColor(systemStatus.network),
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* System Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-earth-beige/50 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-graphite mb-1">System Performance</h2>
            <p className="text-sm text-drift-gray">Real-time metrics over the last 10 minutes</p>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            {["cpu", "memory", "network"].map((metric) => (
              <button
                key={metric}
                onClick={() => setCurrentMetric(metric)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  currentMetric === metric
                    ? "bg-amber-500 text-white"
                    : "bg-pale-stone text-drift-gray hover:bg-amber-100"
                }`}
              >
                {metric.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="h-64 w-full">
            {metricsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metricsHistory}>
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
                    formatter={(value) => [`${Math.round(value)}%`, currentMetric.toUpperCase()]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey={currentMetric}
                    stroke={getMetricColor(systemStatus[currentMetric])}
                    fill={`${getMetricColor(systemStatus[currentMetric])}30`}
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
        )}
      </div>

      {/* System Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-earth-beige/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-graphite flex items-center gap-2">
              <Server className="h-5 w-5 text-amber-600" />
              System Status
            </h2>
            {systemStatus.lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-drift-gray">
                <Clock className="h-3 w-3" />
                <span>{systemStatus.lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-br from-white to-pale-stone/30 border border-earth-beige/30">
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-graphite mb-1">Server Load</p>
                  <p className="text-xs text-drift-gray">Current system load</p>
                </div>
              </div>
              <span className={`text-lg font-bold ${getStatusColor(systemStatus.serverLoad)} flex-shrink-0 ml-4`}>
                {isLoading ? "—" : systemStatus.serverLoad}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-br from-white to-pale-stone/30 border border-earth-beige/30">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-graphite mb-1">System Uptime</p>
                  <p className="text-xs text-drift-gray">Service availability</p>
                </div>
              </div>
              <span className="text-lg font-bold text-green-600 flex-shrink-0 ml-4">
                {isLoading ? "—" : systemStatus.uptime}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-br from-white to-pale-stone/30 border border-earth-beige/30">
              <div className="flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-graphite mb-1">Active Processes</p>
                  <p className="text-xs text-drift-gray">Running processes</p>
                </div>
              </div>
              <span className="text-lg font-bold text-graphite flex-shrink-0 ml-4">
                {isLoading ? "—" : systemStatus.processes}
              </span>
            </div>
          </div>
        </div>

        {/* Resource Usage */}
        <div className="bg-white rounded-xl shadow-sm border border-earth-beige/50 p-6">
          <h2 className="text-lg font-semibold text-graphite mb-6 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            Resource Usage
          </h2>
          
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-medium text-graphite">CPU</span>
                <span className="text-sm font-bold text-graphite">{isLoading ? "—" : `${systemStatus.cpu}%`}</span>
              </div>
              <div className="h-3 w-full bg-pale-stone rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${systemStatus.cpu}%`,
                    backgroundColor: getMetricColor(systemStatus.cpu),
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-medium text-graphite">Memory</span>
                <span className="text-sm font-bold text-graphite">{isLoading ? "—" : `${systemStatus.memory}%`}</span>
              </div>
              <div className="h-3 w-full bg-pale-stone rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${systemStatus.memory}%`,
                    backgroundColor: getMetricColor(systemStatus.memory),
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-medium text-graphite">Disk</span>
                <span className="text-sm font-bold text-graphite">{isLoading ? "—" : systemStatus.diskSpace}</span>
              </div>
              <div className="h-3 w-full bg-pale-stone rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: systemStatus.diskSpace,
                    backgroundColor: getMetricColor(parseInt(systemStatus.diskSpace)),
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-medium text-graphite">Network</span>
                <span className="text-sm font-bold text-graphite">{isLoading ? "—" : `${systemStatus.network}%`}</span>
              </div>
              <div className="h-3 w-full bg-pale-stone rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${systemStatus.network}%`,
                    backgroundColor: getMetricColor(systemStatus.network),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Confirmation Modal */}
      {showMaintenanceModal && (
        <>
          <style jsx>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            @keyframes modalOut { from { opacity: 1; transform: scale(1) translateY(0); } to { opacity: 0; transform: scale(0.95) translateY(10px); } }
            .animate-fade-in { animation: fadeIn 0.3s ease-out; }
            .animate-fade-out { animation: fadeOut 0.3s ease-out; }
            .animate-modal-in { animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
            .animate-modal-out { animation: modalOut 0.3s ease-in; }
          `}</style>
          
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => !sendingEmails && setShowMaintenanceModal(false)}
          >
            <div 
              className="w-full max-w-md mx-auto rounded-2xl bg-white shadow-2xl overflow-hidden animate-modal-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with gradient background */}
              <div className={`bg-gradient-to-br ${
                maintenanceAction === "enable" 
                  ? "from-red-50 to-orange-50 border-b border-red-100" 
                  : "from-green-50 to-emerald-50 border-b border-green-100"
              } p-6 sm:p-8 relative overflow-hidden`}>
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-4">
                    <div className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full border-4 ${
                      maintenanceAction === "enable"
                        ? "bg-red-500/10 border-red-500/20"
                        : "bg-green-500/10 border-green-500/20"
                    }`}>
                      {maintenanceAction === "enable" ? (
                        <AlertTriangle className={`h-8 w-8 sm:h-10 sm:w-10 ${
                          maintenanceAction === "enable" ? "text-red-600" : "text-green-600"
                        }`} />
                      ) : (
                        <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                      )}
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-graphite text-center mb-2">
                    {maintenanceAction === "enable" ? "Enable Maintenance Mode?" : "Disable Maintenance Mode?"}
                  </h2>
                  <p className="text-xs sm:text-sm md:text-base text-drift-gray text-center">
                    {maintenanceAction === "enable" 
                      ? "Restrict access for all patients and doctors" 
                      : "Restore normal access for all users"}
                  </p>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"></div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 md:p-8">
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-amber-900 mb-1">
                          {maintenanceAction === "enable" ? "System Access Restriction" : "System Access Restoration"}
                        </p>
                        <p className="text-xs text-amber-700 leading-relaxed">
                          {maintenanceAction === "enable" ? (
                            <>
                              This will restrict access to the system for all patients and doctors. They will see a maintenance page instead of the application.
                              <br /><br />
                              All users will be notified via email and in-app notifications.
                            </>
                          ) : (
                            <>
                              This will restore normal access for all patients and doctors.
                              <br /><br />
                              All users will be notified via email and in-app notifications that maintenance is complete.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-xs sm:text-sm md:text-base text-drift-gray">
                    <strong className="text-graphite font-semibold">Are you sure you want to proceed?</strong>
                  </p>
                  
                  <div className="pt-2 sm:pt-4">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => setShowMaintenanceModal(false)}
                        disabled={sendingEmails}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-earth-beige bg-white px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-graphite hover:bg-pale-stone transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleMaintenanceToggle}
                        disabled={sendingEmails}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                          maintenanceAction === "enable"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {sendingEmails ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                            <span>{maintenanceAction === "enable" ? "Enabling..." : "Disabling..."}</span>
                          </>
                        ) : (
                          <>
                            <Power className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span>{maintenanceAction === "enable" ? "Enable" : "Disable"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-center text-xs text-drift-gray mt-2 sm:mt-4 italic">
                    Click outside to cancel
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Error Monitor */}
      <div className="bg-white rounded-xl shadow-sm border border-earth-beige/50 p-6 mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-graphite flex items-center gap-2">
              <OctagonAlert className="h-5 w-5 text-red-600" />
              Recent Errors
            </h2>
            <p className="text-xs text-drift-gray">Latest error/security events (page & side)</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setErrorFilterOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-earth-beige bg-white px-3 py-2 text-xs font-medium text-graphite shadow-sm transition hover:border-amber-500 hover:text-amber-700"
            >
              <span>{errorFilterOptions.find((o) => o.value === errorFilter)?.label || "All Sides"}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div
              className={`absolute right-0 z-10 mt-1 w-36 origin-top rounded-lg border border-earth-beige bg-white shadow-md transition-all duration-200 ease-out ${
                errorFilterOpen
                  ? "scale-100 opacity-100 translate-y-0 pointer-events-auto"
                  : "scale-95 opacity-0 -translate-y-1 pointer-events-none"
              }`}
            >
              {errorFilterOptions.map((option) => (
              <button
                  key={option.value}
                  onClick={() => {
                    setErrorFilter(option.value)
                    setErrorFilterOpen(false)
                  }}
                  className={`block w-full px-3 py-2 text-left text-xs capitalize transition-colors ${
                    errorFilter === option.value ? "bg-amber-50 text-amber-700" : "hover:bg-cream"
                }`}
              >
                  {option.label}
              </button>
            ))}
            </div>
          </div>
        </div>

        {errorLogs.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-sm text-drift-gray">No recent errors</div>
        ) : (
          <div className="space-y-3">
            {errorLogs
              .filter((log) => errorFilter === "all" || (log.side || "").toLowerCase() === errorFilter)
              .map((log) => (
                <div
                  key={log.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-earth-beige/40 bg-pale-stone/20 px-3 py-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-red-100 p-2 text-red-600">
                      <OctagonAlert className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-graphite">{log.message}</p>
                      <p className="text-xs text-drift-gray flex items-center gap-2 mt-1">
                        <Globe2 className="h-3 w-3" />
                        <span>Page: {log.page}</span>
                        {renderSeverityPill(log.severity)}
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px]">
                          Side: {log.side}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-drift-gray">
                    {log.time?.toLocaleTimeString?.([], { hour: "2-digit", minute: "2-digit" }) || ""}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
