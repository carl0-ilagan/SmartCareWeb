import { doc, getDoc } from "firebase/firestore"
import { db } from "./firebase"

// Get user details by user ID
export async function getUserDetails(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))

    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      }
    }

    return null
  } catch (error) {
    console.error("Error getting user details:", error)
    return null
  }
}

// Check if a user is busy (has an active call)
export const isUserBusy = async (userId) => {
  try {
    const activeCallDoc = await getDoc(doc(db, "activeCall", userId))
    return activeCallDoc.exists()
  } catch (error) {
    console.error("Error checking if user is busy:", error)
    return false
  }
}

// Get user role
export const getUserRole = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      return userDoc.data().role || "patient"
    }
    return "patient" // Default to patient if not found
  } catch (error) {
    console.error("Error getting user role:", error)
    return "patient"
  }
}

