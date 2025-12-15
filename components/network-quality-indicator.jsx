"use client"

import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"

const NetworkQualityIndicator = ({ peerConnection }) => {
  const [quality, setQuality] = useState("unknown") // unknown, excellent, good, poor
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!peerConnection) return

    let intervalId

    const getConnectionStats = async () => {
      try {
        const stats = await peerConnection.getStats()
        let totalPacketsLost = 0
        let totalPacketsSent = 0
        let totalPacketsReceived = 0
        let roundTripTime = 0
        let hasRTT = false

        stats.forEach((report) => {
          if (report.type === "outbound-rtp") {
            totalPacketsSent += report.packetsSent || 0
            totalPacketsLost += report.packetsLost || 0
          } else if (report.type === "inbound-rtp") {
            totalPacketsReceived += report.packetsReceived || 0
            totalPacketsLost += report.packetsLost || 0
          } else if (report.type === "candidate-pair" && report.state === "succeeded") {
            if (report.currentRoundTripTime) {
              roundTripTime = report.currentRoundTripTime * 1000 // Convert to ms
              hasRTT = true
            }
          }
        })

        // Calculate packet loss percentage
        const totalPackets = totalPacketsSent + totalPacketsReceived
        const packetLossPercentage = totalPackets > 0 ? (totalPacketsLost / totalPackets) * 100 : 0

        // Determine connection quality
        let quality = "unknown"
        if (hasRTT) {
          if (roundTripTime < 150 && packetLossPercentage < 2) {
            quality = "excellent"
          } else if (roundTripTime < 300 && packetLossPercentage < 5) {
            quality = "good"
          } else {
            quality = "poor"
          }
        } else if (
          peerConnection.iceConnectionState === "connected" ||
          peerConnection.iceConnectionState === "completed"
        ) {
          quality = "good" // Default to good if connected but no RTT data
        }

        setQuality(quality)
        setStats({
          packetLossPercentage: packetLossPercentage.toFixed(1),
          roundTripTime: roundTripTime.toFixed(0),
          connectionState: peerConnection.iceConnectionState,
        })
      } catch (error) {
        console.error("Error getting connection stats:", error)
      }
    }

    // Get stats immediately and then every 2 seconds
    getConnectionStats()
    intervalId = setInterval(getConnectionStats, 2000)

    return () => {
      clearInterval(intervalId)
    }
  }, [peerConnection])

  // If connection state is unknown, don't show anything
  if (quality === "unknown") {
    return null
  }

  // Determine color and icon based on quality
  let color = "bg-gray-500"
  let textColor = "text-gray-100"
  let icon = <Wifi className="h-4 w-4" />

  if (quality === "excellent") {
    color = "bg-green-500"
    textColor = "text-green-100"
  } else if (quality === "good") {
    color = "bg-yellow-500"
    textColor = "text-yellow-100"
  } else if (quality === "poor") {
    color = "bg-red-500"
    textColor = "text-red-100"
    icon = <WifiOff className="h-4 w-4" />
  }

  return (
    <div className={`flex items-center rounded-full ${color} px-2 py-1`}>
      <span className={`mr-1 ${textColor}`}>{icon}</span>
      <span className={`text-xs font-medium ${textColor}`}>{quality.charAt(0).toUpperCase() + quality.slice(1)}</span>
    </div>
  )
}

export default NetworkQualityIndicator
