import { serverDb } from "./firebase-server"
import { collection, doc, setDoc } from "firebase/firestore"

/**
 * Ensures that required collections exist in Firestore
 */
export async function ensureCollectionsExist() {
  try {
    console.log("Ensuring required collections exist...")

    // Ensure system_metrics collection exists by adding a placeholder document
    const metricsCollectionRef = collection(serverDb, "system_metrics")
    const placeholderDocRef = doc(metricsCollectionRef, "placeholder")

    await setDoc(placeholderDocRef, {
      type: "placeholder",
      description: "This document ensures the system_metrics collection exists",
      createdAt: new Date(),
    })

    console.log("Collections verified successfully")
    return true
  } catch (error) {
    console.error("Error ensuring collections exist:", error)
    return false
  }
}
