import { db } from "./firebase"
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp,
  getDoc,
  startAfter,
  limit,
} from "firebase/firestore"

// Import the logging utilities at the top of the file
import { logUserActivity } from "./admin-utils"
import { logPatientActivity } from "./patient-utils"
import { logDoctorActivity } from "./doctor-utils"

// Add new feedback
export const addFeedback = async (feedbackData) => {
  try {
    const feedbackRef = collection(db, "feedback")
    const newFeedback = {
      ...feedbackData,
      createdAt: serverTimestamp(),
      status: "pending",
    }
    const docRef = await addDoc(feedbackRef, newFeedback)

    // Log the feedback submission
    if (feedbackData.userRole === "patient") {
      await logPatientActivity(
        "Feedback Submitted",
        `Patient submitted ${feedbackData.type} feedback with rating ${feedbackData.rating}`,
        { id: feedbackData.userId, email: feedbackData.userEmail },
      )
    } else if (feedbackData.userRole === "doctor") {
      await logDoctorActivity(
        "Feedback Submitted",
        `Doctor submitted ${feedbackData.type} feedback with rating ${feedbackData.rating}`,
        { id: feedbackData.userId, email: feedbackData.userEmail },
      )
    }

    // Return with formatted date for immediate display
    return {
      id: docRef.id,
      ...newFeedback,
      date: new Date().toISOString().split("T")[0],
    }
  } catch (error) {
    console.error("Error adding feedback:", error)
    throw error
  }
}

// Get user feedback
export const getUserFeedback = async (userId) => {
  try {
    const feedbackRef = collection(db, "feedback")
    const q = query(feedbackRef, where("userId", "==", userId), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().createdAt?.toDate().toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
    }))
  } catch (error) {
    console.error("Error getting user feedback:", error)
    throw error
  }
}

// Delete feedback
export const deleteFeedback = async (feedbackId) => {
  try {
    // Get the feedback document to log who deleted it
    const feedbackRef = doc(db, "feedback", feedbackId)
    const feedbackDoc = await getDoc(feedbackRef)

    if (!feedbackDoc.exists()) {
      throw new Error("Feedback document does not exist")
    }

    const feedbackData = feedbackDoc.data()

    // Proceed with deletion
    await deleteDoc(feedbackRef)

    // Log the deletion
    if (feedbackData.userRole === "patient") {
      await logPatientActivity("Feedback Deleted", `Patient deleted their feedback`, {
        id: feedbackData.userId,
        email: feedbackData.userEmail,
      })
    } else if (feedbackData.userRole === "doctor") {
      await logDoctorActivity("Feedback Deleted", `Doctor deleted their feedback`, {
        id: feedbackData.userId,
        email: feedbackData.userEmail,
      })
    }

    return true
  } catch (error) {
    console.error("Error deleting feedback:", error)

    // Provide more specific error message
    if (error.code === "permission-denied") {
      throw new Error(
        "You don't have permission to delete this feedback. Please contact support if this is unexpected.",
      )
    }

    throw error
  }
}

// Modify the getAllFeedback function to support pagination
export const getAllFeedback = async (pageSize = 10, lastDoc = null) => {
  try {
    const feedbackRef = collection(db, "feedback")
    let q = query(feedbackRef, orderBy("createdAt", "desc"))

    // If we have a last document, start after it
    if (lastDoc) {
      q = query(feedbackRef, orderBy("createdAt", "desc"), startAfter(lastDoc), limit(pageSize))
    } else {
      q = query(feedbackRef, orderBy("createdAt", "desc"), limit(pageSize))
    }

    const querySnapshot = await getDocs(q)

    // Get the last visible document for pagination
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]

    const feedback = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().createdAt?.toDate().toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
    }))

    return {
      feedback,
      lastVisible,
      hasMore: querySnapshot.docs.length === pageSize,
    }
  } catch (error) {
    console.error("Error getting all feedback:", error)
    throw error
  }
}

// Respond to feedback (admin only)
export const respondToFeedback = async (feedbackId, response, respondedBy = null) => {
  try {
    const feedbackRef = doc(db, "feedback", feedbackId)

    // Get the feedback document to include in the log
    const feedbackDoc = await getDoc(feedbackRef)
    const feedbackData = feedbackDoc.data()

    await updateDoc(feedbackRef, {
      response,
      status: "responded",
      respondedAt: serverTimestamp(),
      // Track which admin responded when available
      ...(respondedBy ? { respondedBy } : {}),
    })

    // Log the admin response
    await logUserActivity(
      "Feedback Response",
      `Admin responded to feedback from ${feedbackData.userRole} ${feedbackData.userName}`,
      { id: "admin", email: "admin" },
      "admin",
    )

    // Get the updated document
    const updatedDoc = await getDoc(feedbackRef)
    return {
      id: updatedDoc.id,
      ...updatedDoc.data(),
      date: updatedDoc.data().createdAt?.toDate().toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
    }
  } catch (error) {
    console.error("Error responding to feedback:", error)
    throw error
  }
}

// Get all doctors for dropdown
export const getAllDoctors = async () => {
  try {
    const doctorsRef = collection(db, "users")
    const q = query(doctorsRef, where("role", "==", "doctor"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting doctors:", error)
    // Return empty array instead of throwing error
    return []
  }
}
