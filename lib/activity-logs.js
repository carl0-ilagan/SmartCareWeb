import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "./firebase"

/**
 * Log patient activity
 * @param {string} action - The action performed
 * @param {string} description - Description of the activity
 * @param {Object} metadata - Additional metadata about the activity
 */
export async function logPatientActivity(action, description, metadata = {}) {
  try {
    await addDoc(collection(db, "activity_logs"), {
      type: "patient",
      action,
      description,
      metadata,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error logging patient activity:", error)
    // Don't throw - logging should not interrupt user flow
  }
}

/**
 * Log doctor activity
 * @param {string} action - The action performed
 * @param {string} description - Description of the activity
 * @param {Object} metadata - Additional metadata about the activity
 */
export async function logDoctorActivity(action, description, metadata = {}) {
  try {
    await addDoc(collection(db, "activity_logs"), {
      type: "doctor",
      action,
      description,
      metadata,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error logging doctor activity:", error)
    // Don't throw - logging should not interrupt user flow
  }
}

/**
 * Log admin activity
 * @param {string} action - The action performed
 * @param {string} description - Description of the activity
 * @param {Object} metadata - Additional metadata about the activity
 */
export async function logAdminActivity(action, description, metadata = {}) {
  try {
    await addDoc(collection(db, "activity_logs"), {
      type: "admin",
      action,
      description,
      metadata,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error logging admin activity:", error)
    // Don't throw - logging should not interrupt user flow
  }
}

/**
 * Log system activity
 * @param {string} action - The action performed
 * @param {string} description - Description of the activity
 * @param {Object} metadata - Additional metadata about the activity
 */
export async function logSystemActivity(action, description, metadata = {}) {
  try {
    await addDoc(collection(db, "activity_logs"), {
      type: "system",
      action,
      description,
      metadata,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error logging system activity:", error)
    // Don't throw - logging should not interrupt user flow
  }
}
