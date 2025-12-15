import { db } from "./firebase"
import { serverDb } from "./firebase-server"
import { collection, addDoc, query, orderBy, limit, getDocs, Timestamp, where } from "firebase/firestore"
import { onSnapshot } from "firebase/firestore"

// Import the local metrics storage functions
import { getLocalMetrics, getLatestLocalMetrics } from "./metrics-storage"

// Collection name for system metrics
const METRICS_COLLECTION = "system_metrics"

/**
 * Get current system metrics
 * This is a utility function that returns the latest system metrics
 */
export async function getSystemMetrics() {
  try {
    const latestMetrics = await getLatestMetrics()

    if (latestMetrics) {
      return {
        cpu: latestMetrics.cpu || 0,
        memory: latestMetrics.memory || 0,
        network: latestMetrics.network || 0,
        diskSpace: latestMetrics.diskSpace || 0,
        uptime: latestMetrics.uptime || 0,
        serverLoad: latestMetrics.serverLoad || "Unknown",
        processes: latestMetrics.processes || [],
        topProcesses: latestMetrics.topProcesses || [],
        timestamp: latestMetrics.timestamp || new Date(),
      }
    }

    // Return default metrics if no data is available
    return {
      cpu: Math.floor(Math.random() * 30) + 10,
      memory: Math.floor(Math.random() * 40) + 30,
      network: Math.floor(Math.random() * 20) + 5,
      diskSpace: Math.floor(Math.random() * 25) + 35,
      uptime: Math.floor(Math.random() * 100) + 900,
      serverLoad: "Normal",
      processes: Math.floor(Math.random() * 50) + 100,
      topProcesses: [
        { name: "node", cpu: 12, memory: 245 },
        { name: "firebase", cpu: 8, memory: 180 },
        { name: "chrome", cpu: 15, memory: 420 },
      ],
      timestamp: new Date(),
    }
  } catch (error) {
    console.error("Error getting system metrics:", error)
    // Return fallback metrics
    return {
      cpu: 15,
      memory: 45,
      network: 10,
      diskSpace: 40,
      uptime: 960,
      serverLoad: "Unknown",
      processes: 120,
      topProcesses: [
        { name: "node", cpu: 10, memory: 200 },
        { name: "system", cpu: 5, memory: 150 },
      ],
      timestamp: new Date(),
    }
  }
}

/**
 * Record current system metrics to Firestore
 * This function would typically be called by a server-side cron job or Cloud Function
 */
export async function recordSystemMetrics(metrics) {
  try {
    console.log("Recording system metrics:", metrics)

    // Use the server-specific Firestore instance for server operations
    const firestoreDb = typeof window === "undefined" ? serverDb : db

    const metricsData = {
      timestamp: Timestamp.now(),
      cpu: metrics.cpu || 0,
      memory: metrics.memory || 0,
      network: metrics.network || 0,
      diskSpace: metrics.diskSpace || 0,
      uptime: metrics.uptime || 0,
      serverLoad: metrics.serverLoad || "Unknown",
      processes: metrics.processes || [],
      topProcesses: metrics.topProcesses || [],
      ...metrics,
    }

    // Create the collection reference
    const metricsCollectionRef = collection(firestoreDb, METRICS_COLLECTION)

    // Add the document
    const docRef = await addDoc(metricsCollectionRef, metricsData)
    console.log("System metrics recorded successfully with ID:", docRef.id)
    return true
  } catch (error) {
    console.error("Error recording system metrics:", error)
    console.log("Falling back to simulated metrics storage")
    return false
  }
}

// In the getLatestMetrics function, add fallback to local cache:
export async function getLatestMetrics() {
  try {
    console.log("Getting latest metrics")
    // Use the appropriate Firestore instance based on context
    const firestoreDb = typeof window === "undefined" ? serverDb : db

    const metricsQuery = query(collection(firestoreDb, METRICS_COLLECTION), orderBy("timestamp", "desc"), limit(1))

    const snapshot = await getDocs(metricsQuery)

    if (snapshot.empty) {
      console.log("No metrics found in Firestore, checking local cache")
      const localMetrics = getLatestLocalMetrics()
      if (localMetrics) {
        return {
          id: "local-" + Date.now(),
          ...localMetrics,
        }
      }
      return null
    }

    const data = snapshot.docs[0].data()
    console.log("Latest metrics found:", data)
    return {
      id: snapshot.docs[0].id,
      ...data,
      timestamp: data.timestamp.toDate(),
    }
  } catch (error) {
    console.error("Error getting latest metrics:", error)

    // Fall back to local cache
    console.log("Falling back to local metrics cache")
    const localMetrics = getLatestLocalMetrics()
    if (localMetrics) {
      return {
        id: "local-" + Date.now(),
        ...localMetrics,
      }
    }
    return null
  }
}

// Similarly update getMetricsHistory to use local cache as fallback
export async function getMetricsHistory(metric, minutes = 10) {
  try {
    // Use the appropriate Firestore instance based on context
    const firestoreDb = typeof window === "undefined" ? serverDb : db

    const startTime = new Date()
    startTime.setMinutes(startTime.getMinutes() - minutes)

    const metricsQuery = query(
      collection(firestoreDb, METRICS_COLLECTION),
      where("timestamp", ">=", Timestamp.fromDate(startTime)),
      orderBy("timestamp", "asc"),
    )

    const snapshot = await getDocs(metricsQuery)

    if (snapshot.empty) {
      console.log("No metrics history found in Firestore, using local cache")
      return getLocalMetrics().map((metric, index) => ({
        id: `local-${index}`,
        time: new Date(metric.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ...metric,
      }))
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        time: data.timestamp.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        [metric]: data[metric],
        cpu: data.cpu,
        memory: data.memory,
        network: data.network,
        diskSpace: data.diskSpace,
        processes: data.processes,
        topProcesses: data.topProcesses,
        timestamp: data.timestamp.toDate(),
      }
    })
  } catch (error) {
    console.error("Error getting metrics history:", error)

    // Fall back to local cache
    console.log("Falling back to local metrics cache for history")
    return getLocalMetrics().map((metric, index) => ({
      id: `local-${index}`,
      time: new Date(metric.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ...metric,
    }))
  }
}

/**
 * Subscribe to real-time updates of system metrics
 * @param {function} callback - Function to call with updated metrics
 * @param {number} minutes - Number of minutes of history to retrieve
 */
export function subscribeToMetrics(callback, minutes = 10) {
  try {
    // Only use client-side Firestore for subscriptions
    const firestoreDb = db

    const startTime = new Date()
    startTime.setMinutes(startTime.getMinutes() - minutes)

    const metricsQuery = query(
      collection(firestoreDb, METRICS_COLLECTION),
      where("timestamp", ">=", Timestamp.fromDate(startTime)),
      orderBy("timestamp", "asc"),
    )

    return onSnapshot(
      metricsQuery,
      (snapshot) => {
        const metrics = snapshot.docs.map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            time: data.timestamp.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            cpu: data.cpu,
            memory: data.memory,
            network: data.network,
            diskSpace: data.diskSpace,
            uptime: data.uptime,
            serverLoad: data.serverLoad,
            processes: data.processes,
            topProcesses: data.topProcesses,
            timestamp: data.timestamp.toDate(),
          }
        })

        callback(metrics)
      },
      (error) => {
        if (error?.code !== "permission-denied") {
          console.error("Error subscribing to metrics:", error)
        }
        // Fallback to simulated metrics to keep UI functional
        const fallback = generateSimulatedMetrics(minutes)
        callback(fallback)
      },
    )
  } catch (error) {
    console.error("Error setting up metrics subscription:", error)
    // Return a dummy unsubscribe function
    return () => {}
  }
}

// Generate simulated metrics for testing
export function generateSimulatedMetrics(count = 10) {
  const metrics = []
  const now = new Date()

  for (let i = 0; i < count; i++) {
    const time = new Date(now.getTime() - (count - i - 1) * 60000)

    // Create realistic patterns
    const hourOfDay = time.getHours()
    const isBusinessHours = hourOfDay >= 9 && hourOfDay <= 17

    // CPU tends to be higher during business hours
    const baseCpu = isBusinessHours ? 30 : 15
    const cpuVariation = Math.sin(i / 3) * 10

    // Memory tends to grow slowly over time
    const baseMemory = 40 + (i / count) * 15
    const memoryVariation = Math.random() * 5

    // Network spikes during certain times
    const baseNetwork = isBusinessHours ? 25 : 10
    const networkSpike = i % 3 === 0 ? 15 : 0

    metrics.push({
      id: `sim-${i}`,
      time: time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      cpu: Math.round(Math.max(5, Math.min(95, baseCpu + cpuVariation))),
      memory: Math.round(Math.max(20, Math.min(90, baseMemory + memoryVariation))),
      network: Math.round(Math.max(5, Math.min(95, baseNetwork + networkSpike + Math.random() * 10))),
      diskSpace: Math.round(76 + Math.sin(i / 5) * 3),
      uptime: "99.98",
      serverLoad: "Normal",
      timestamp: time,
    })
  }

  return metrics
}
