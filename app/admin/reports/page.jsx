"use client"

import { useState, useEffect } from "react"
import {
  Download,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Calendar,
  FileText,
  Server,
  HardDrive,
  Clock,
} from "lucide-react"
import { AdminHeaderBanner } from "@/components/admin-header-banner"
import { exportDatabaseBackup, downloadBackupAsJSON } from "@/lib/backup-utils"
import { collection, getCountFromServer } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generationSuccess, setGenerationSuccess] = useState(false)
  const [backupStats, setBackupStats] = useState({
    totalCollections: 0,
    totalDocuments: 0,
    lastBackup: null,
  })
  const [collectionStats, setCollectionStats] = useState([])

  // Load collection statistics
  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true)

        const collections = [
          "users",
          "appointments",
          "medicalRecords",
          "prescriptions",
          "conversations",
          "messages",
          "notifications",
          "activityLogs",
          "feedback",
          "system_metrics",
          "report_types",
          "reports",
        ]

        const stats = []
        let totalDocs = 0

        for (const colName of collections) {
          try {
            const colRef = collection(db, colName)
            const snapshot = await getCountFromServer(colRef)
            const count = snapshot.data().count
            totalDocs += count
            stats.push({ name: colName, count })
          } catch (err) {
            console.error(`Error counting ${colName}:`, err)
            stats.push({ name: colName, count: 0 })
          }
        }

        setCollectionStats(stats)
        setBackupStats((prev) => ({
          ...prev,
          totalCollections: collections.length,
          totalDocuments: totalDocs,
        }))

        // Check for last backup from localStorage
        const lastBackup = localStorage.getItem("lastDatabaseBackup")
        if (lastBackup) {
          setBackupStats((prev) => ({
            ...prev,
            lastBackup: new Date(lastBackup),
          }))
        }

        setError(null)
      } catch (err) {
        console.error("Error loading stats:", err)
        setError("Failed to load database statistics.")
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  const handleGenerateBackup = async () => {
    try {
      setIsGenerating(true)
      setGenerationSuccess(false)
      setError(null)

      console.log("Starting database backup...")
      
      // Export all collections
      const backupData = await exportDatabaseBackup()

      // Download as JSON file
      const filename = downloadBackupAsJSON(backupData)

      // Save backup timestamp
      localStorage.setItem("lastDatabaseBackup", new Date().toISOString())
      setBackupStats((prev) => ({
        ...prev,
        lastBackup: new Date(),
      }))

      setGenerationSuccess(true)
      console.log(`Backup downloaded: ${filename}`)

      // Hide success message after 5 seconds
      setTimeout(() => {
        setGenerationSuccess(false)
      }, 5000)
    } catch (err) {
      console.error("Error generating backup:", err)
      setError("Failed to generate database backup. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const formatDate = (date) => {
    if (!date) return "Never"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Banner stats
  const bannerStats = [
    {
      label: "Collections",
      value: backupStats.totalCollections.toString(),
      icon: <Database className="h-4 w-4 text-white/70" />,
    },
    {
      label: "Total Documents",
      value: backupStats.totalDocuments.toLocaleString(),
      icon: <FileText className="h-4 w-4 text-white/70" />,
    },
    {
      label: "Last Backup",
      value: backupStats.lastBackup ? formatDate(backupStats.lastBackup) : "Never",
      icon: <Clock className="h-4 w-4 text-white/70" />,
    },
    {
      label: "Status",
      value: isGenerating ? "Generating..." : "Ready",
      icon: isGenerating ? (
        <RefreshCw className="h-4 w-4 text-white/70 animate-spin" />
      ) : (
        <CheckCircle className="h-4 w-4 text-white/70" />
      ),
    },
  ]

        return (
    <div className="w-full">
      <AdminHeaderBanner
        title="Database Backup"
        subtitle="Export and download your entire database as JSON"
        stats={bannerStats}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backup Section */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
                    <div>
              <h2 className="text-xl font-semibold text-graphite mb-2 flex items-center">
                <Database className="h-6 w-6 mr-2 text-amber-600" />
                Database Backup
              </h2>
              <p className="text-sm text-gray-600">
                Download a complete backup of your database in JSON format
              </p>
            </div>
          </div>

          {/* Backup Info */}
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">What's Included</h3>
                <p className="text-sm text-amber-800 mb-2">
                  This backup includes all collections and documents from your Firestore database:
                </p>
                <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
                  <li>All user accounts (patients, doctors, admins)</li>
                  <li>Appointments and scheduling data</li>
                  <li>Medical records and prescriptions</li>
                  <li>Messages and conversations</li>
                  <li>System logs and activity</li>
                  <li>All other collections</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {generationSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-sm text-green-800 font-medium">
                  Database backup downloaded successfully!
                </p>
                </div>
              </div>
            )}

          {/* Backup Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleGenerateBackup}
              disabled={isGenerating || isLoading}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm transition-all duration-200 font-medium"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  <span>Generating Backup...</span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  <span>Download Database Backup</span>
                </>
              )}
            </button>
          </div>

          {/* Backup Instructions */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-graphite mb-2 text-sm">Backup Instructions</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Click the "Download Database Backup" button above</li>
              <li>Wait for the backup to generate (this may take a few moments)</li>
              <li>The backup will automatically download as a JSON file</li>
              <li>Store the backup file in a secure location</li>
              <li>The file contains all your database data in JSON format</li>
            </ol>
          </div>
        </div>

        {/* Collection Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-graphite mb-4 flex items-center">
            <Server className="h-5 w-5 mr-2 text-amber-600" />
            Collection Statistics
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {collectionStats.map((stat) => (
                <div
                  key={stat.name}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {stat.name.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span className="text-sm font-bold text-amber-600">
                      {stat.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          backupStats.totalDocuments > 0
                            ? (stat.count / backupStats.totalDocuments) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Total Summary */}
          <div className="mt-6 p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total Documents</span>
              <span className="text-lg font-bold text-amber-700">
                {backupStats.totalDocuments.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-graphite mb-4 flex items-center">
          <HardDrive className="h-5 w-5 mr-2 text-amber-600" />
          Backup Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">File Format</h3>
            <p className="text-sm text-gray-600">
              The backup is exported as a JSON file containing all collections and documents. The
              file structure includes metadata such as export date, version, and collection
              summaries.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Data Safety</h3>
            <p className="text-sm text-gray-600">
              All Firestore Timestamps are converted to ISO 8601 format for compatibility. The
              backup is a complete snapshot of your database at the time of export.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
