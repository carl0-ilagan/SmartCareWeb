"use client"

import { useState, useEffect } from "react"
import { Monitor, Smartphone, Trash2, CheckCircle2, Clock, Globe, AlertCircle, CheckSquare, Square } from "lucide-react"
import { getTrustedDevices, removeTrustedDevice } from "@/lib/device-auth"
import { getOrCreateDeviceId } from "@/lib/device-utils"
import { formatDistanceToNow } from "date-fns"

export function TrustedDevicesList({ userId, onDeviceRemoved }) {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState(null)
  const [selectedDevices, setSelectedDevices] = useState(new Set())
  const [removingMultiple, setRemovingMultiple] = useState(false)
  const currentDeviceId = getOrCreateDeviceId()

  useEffect(() => {
    if (!userId) return

    const fetchDevices = async () => {
      try {
        setLoading(true)
        const trustedDevices = await getTrustedDevices(userId)
        setDevices(trustedDevices)
      } catch (error) {
        console.error("Error fetching trusted devices:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDevices()
  }, [userId])

  const handleRemoveDevice = async (deviceId) => {
    if (!confirm("Are you sure you want to remove this trusted device? You will need to approve it again on next login.")) {
      return
    }

    try {
      setRemovingId(deviceId)
      await removeTrustedDevice(userId, deviceId)
      setDevices((prev) => prev.filter((d) => d.id !== deviceId))
      setSelectedDevices((prev) => {
        const newSet = new Set(prev)
        newSet.delete(deviceId)
        return newSet
      })
      if (onDeviceRemoved) onDeviceRemoved()
    } catch (error) {
      console.error("Error removing device:", error)
      alert("Failed to remove device. Please try again.")
    } finally {
      setRemovingId(null)
    }
  }

  const handleToggleSelect = (deviceId) => {
    setSelectedDevices((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(deviceId)) {
        newSet.delete(deviceId)
      } else {
        newSet.add(deviceId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    const nonCurrentDevices = devices.filter((d) => d.id !== currentDeviceId).map((d) => d.id)
    if (selectedDevices.size === nonCurrentDevices.length) {
      setSelectedDevices(new Set())
    } else {
      setSelectedDevices(new Set(nonCurrentDevices))
    }
  }

  const handleRemoveSelected = async () => {
    if (selectedDevices.size === 0) return

    const count = selectedDevices.size
    if (!confirm(`Are you sure you want to remove ${count} trusted device${count > 1 ? "s" : ""}? They will need approval again on next login.`)) {
      return
    }

    try {
      setRemovingMultiple(true)
      const removePromises = Array.from(selectedDevices).map((deviceId) => removeTrustedDevice(userId, deviceId))
      await Promise.all(removePromises)

      setDevices((prev) => prev.filter((d) => !selectedDevices.has(d.id)))
      setSelectedDevices(new Set())
      if (onDeviceRemoved) onDeviceRemoved()
    } catch (error) {
      console.error("Error removing devices:", error)
      alert("Failed to remove some devices. Please try again.")
    } finally {
      setRemovingMultiple(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (devices.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">No Trusted Devices</p>
            <p className="text-xs text-blue-700">
              When you log in from a new device, you'll receive an email to approve it. Once approved, it will appear here.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const nonCurrentDevices = devices.filter((d) => d.id !== currentDeviceId)
  const allSelected = nonCurrentDevices.length > 0 && selectedDevices.size === nonCurrentDevices.length

  return (
    <div className="space-y-3">
      {/* Bulk Actions */}
      {devices.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-earth-beige">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 text-sm text-graphite hover:text-amber-600 transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4 text-amber-600" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>Select All ({nonCurrentDevices.length})</span>
            </button>
          </div>
          {selectedDevices.size > 0 && (
            <button
              onClick={handleRemoveSelected}
              disabled={removingMultiple}
              className="px-3 py-1.5 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remove Selected ({selectedDevices.size})
            </button>
          )}
        </div>
      )}

      {devices.map((device) => {
        const isCurrentDevice = device.id === currentDeviceId
        const deviceMetadata = device.deviceMetadata || {}
        const browser = deviceMetadata.browser || "Unknown"
        const os = deviceMetadata.os || "Unknown"
        const isMobile = deviceMetadata.screenWidth && deviceMetadata.screenWidth < 768

        // Handle Firestore Timestamp conversion
        let approvedAt = null
        let lastUsed = null
        
        if (device.approvedAt) {
          if (device.approvedAt.toDate) {
            approvedAt = device.approvedAt.toDate()
          } else if (device.approvedAt instanceof Date) {
            approvedAt = device.approvedAt
          } else if (device.approvedAt.seconds) {
            approvedAt = new Date(device.approvedAt.seconds * 1000)
          }
        }
        
        if (device.lastUsed) {
          if (device.lastUsed.toDate) {
            lastUsed = device.lastUsed.toDate()
          } else if (device.lastUsed instanceof Date) {
            lastUsed = device.lastUsed
          } else if (device.lastUsed.seconds) {
            lastUsed = new Date(device.lastUsed.seconds * 1000)
          }
        }

        return (
          <div
            key={device.id}
            className={`p-4 rounded-lg border ${
              isCurrentDevice
                ? "bg-green-50 border-green-200"
                : "bg-white border-earth-beige"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Selection Checkbox */}
              {!isCurrentDevice && (
                <button
                  onClick={() => handleToggleSelect(device.id)}
                  className="mt-1 flex-shrink-0"
                >
                  {selectedDevices.has(device.id) ? (
                    <CheckSquare className="h-5 w-5 text-amber-600" />
                  ) : (
                    <Square className="h-5 w-5 text-drift-gray hover:text-amber-600" />
                  )}
                </button>
              )}
              {isCurrentDevice && <div className="w-5 flex-shrink-0" />}

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {isMobile ? (
                    <Smartphone className="h-4 w-4 text-drift-gray" />
                  ) : (
                    <Monitor className="h-4 w-4 text-drift-gray" />
                  )}
                  <span className="text-sm font-medium text-graphite">
                    {browser} on {os}
                  </span>
                  {isCurrentDevice && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                      Current Device
                    </span>
                  )}
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>

                <div className="space-y-1 text-xs text-drift-gray ml-6">
                  {approvedAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Approved: {formatDistanceToNow(approvedAt, { addSuffix: true })}</span>
                    </div>
                  )}
                  {lastUsed && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Last used: {formatDistanceToNow(lastUsed, { addSuffix: true })}</span>
                    </div>
                  )}
                  {device.ipAddress && (
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span>IP: {device.ipAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              {!isCurrentDevice && (
                <button
                  onClick={() => handleRemoveDevice(device.id)}
                  disabled={removingId === device.id}
                  className="ml-4 p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                  title="Remove trusted device"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

