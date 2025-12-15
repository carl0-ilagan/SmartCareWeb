import { doc, updateDoc, collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Update user role in Firestore
export async function updateUserRole(userId, newRole) {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      role: newRole,
    })

    // Log this action
    await logUserActivity(
      "Role Updated",
      `User role changed to ${newRole}`,
      { id: userId, role: newRole },
      "admin",
      "success",
    )

    return true
  } catch (error) {
    console.error("Error updating user role:", error)
    throw error
  }
}

// Log any user activity (patient, doctor, admin)
export async function logUserActivity(action, details, user, userRole = "system", type = "info") {
  try {
    const logsCollection = collection(db, "logs")
    await addDoc(logsCollection, {
      timestamp: serverTimestamp(),
      user: user?.email || user?.id || "system",
      userRole: userRole, // "patient", "doctor", "admin", or "system"
      action,
      details,
      ip: "client-side", // In a real app, you'd get this from the server
      type, // info, success, warning, error
    })
    console.log("Log created successfully:", action, details)
    return true
  } catch (error) {
    console.error("Error logging user activity:", error)
    return false
  }
}

// Legacy function for backward compatibility
export async function logAdminAction(action, details, user, type = "info") {
  return logUserActivity(action, details, user, "admin", type)
}

// Add this function to update existing accounts
export const updateExistingAccountsStatus = async () => {
  try {
    // Query for all users that don't have a status field
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("status", "==", null))
    const querySnapshot = await getDocs(q)

    let count = 0

    // Update each user document
    const updatePromises = []
    querySnapshot.forEach((document) => {
      const userRef = doc(db, "users", document.id)
      updatePromises.push(updateDoc(userRef, { status: 1 }))
      count++
    })

    await Promise.all(updatePromises)
    console.log(`Updated ${count} existing accounts to approved status`)

    return count
  } catch (error) {
    console.error("Error updating existing accounts:", error)
    throw error
  }
}
