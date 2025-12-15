import { collection, getDocs } from "firebase/firestore"
import { db } from "./firebase"

/**
 * Converts Firestore Timestamp to a serializable format
 */
function convertTimestamp(timestamp) {
  if (!timestamp) return null
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString()
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString()
  }
  return timestamp
}

/**
 * Recursively converts Firestore data to plain JSON
 */
function convertFirestoreData(data) {
  if (data === null || data === undefined) {
    return null
  }

  if (data.toDate) {
    return data.toDate().toISOString()
  }

  if (Array.isArray(data)) {
    return data.map(convertFirestoreData)
  }

  if (typeof data === "object") {
    const converted = {}
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        converted[key] = convertFirestoreData(data[key])
      }
    }
    return converted
  }

  return data
}

/**
 * Exports all collections from Firestore as JSON
 */
export async function exportDatabaseBackup() {
  try {
    console.log("Starting database backup export...")
    
    // List of all collections to backup
    const collectionsToBackup = [
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

    const backupData = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      collections: {},
    }

    // Export each collection
    for (const collectionName of collectionsToBackup) {
      try {
        console.log(`Exporting collection: ${collectionName}`)
        const collectionRef = collection(db, collectionName)
        const snapshot = await getDocs(collectionRef)

        const documents = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          documents.push({
            id: doc.id,
            ...convertFirestoreData(data),
          })
        })

        backupData.collections[collectionName] = {
          count: documents.length,
          documents: documents,
        }

        console.log(`Exported ${documents.length} documents from ${collectionName}`)
      } catch (error) {
        console.error(`Error exporting collection ${collectionName}:`, error)
        backupData.collections[collectionName] = {
          count: 0,
          documents: [],
          error: error.message,
        }
      }
    }

    // Add summary statistics
    backupData.summary = {
      totalCollections: collectionsToBackup.length,
      totalDocuments: Object.values(backupData.collections).reduce(
        (sum, col) => sum + (col.count || 0),
        0
      ),
      collections: Object.keys(backupData.collections).map((name) => ({
        name,
        count: backupData.collections[name].count || 0,
      })),
    }

    console.log("Database backup export completed successfully")
    return backupData
  } catch (error) {
    console.error("Error exporting database backup:", error)
    throw error
  }
}

/**
 * Downloads the backup as a JSON file
 */
export function downloadBackupAsJSON(backupData, filename = null) {
  try {
    const jsonString = JSON.stringify(backupData, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    
    // Generate filename with timestamp
    if (!filename) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      filename = `database-backup-${timestamp}.json`
    }
    
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return filename
  } catch (error) {
    console.error("Error downloading backup:", error)
    throw error
  }
}

