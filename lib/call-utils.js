import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "./firebase"

// Create a new call
export const createCall = async (initiatorId, receiverId, callType, conversationId = null) => {
  try {
    // Check if there's already an active call for either user
    const initiatorActiveCall = await getDoc(doc(db, "activeCall", initiatorId))
    const receiverActiveCall = await getDoc(doc(db, "activeCall", receiverId))

    if (initiatorActiveCall.exists()) {
      console.warn("Initiator already has an active call")
      return initiatorActiveCall.data().callId
    }

    if (receiverActiveCall.exists()) {
      console.warn("Receiver already has an active call")
      return null // Don't create a new call if receiver is busy
    }

    const callData = {
      createdAt: serverTimestamp(),
      participants: [initiatorId, receiverId],
      type: callType, // "video" or "voice"
      status: "ringing",
      initiator: initiatorId,
      endedAt: null,
      duration: 0,
      messages: [],
      conversationId: conversationId, // Add conversation ID if provided
    }

    const callRef = await addDoc(collection(db, "calls"), callData)

    // Create an active call reference for both users
    await setDoc(doc(db, "activeCall", receiverId), {
      callId: callRef.id,
      participants: [initiatorId, receiverId],
      initiator: initiatorId,
      type: callType,
      createdAt: serverTimestamp(),
      conversationId: conversationId,
    })

    // Also create an active call reference for the initiator
    await setDoc(doc(db, "activeCall", initiatorId), {
      callId: callRef.id,
      participants: [initiatorId, receiverId],
      initiator: initiatorId,
      type: callType,
      createdAt: serverTimestamp(),
      conversationId: conversationId,
    })

    return callRef.id
  } catch (error) {
    console.error("Error creating call:", error)
    throw error
  }
}

// Accept a call
export const acceptCall = async (callId) => {
  try {
    await updateDoc(doc(db, "calls", callId), {
      status: "accepted",
      acceptedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("Error accepting call:", error)
    throw error
  }
}

// Reject a call
export const rejectCall = async (callId) => {
  try {
    await updateDoc(doc(db, "calls", callId), {
      status: "rejected",
      endedAt: serverTimestamp(),
    })
    return true
  } catch (error) {
    console.error("Error rejecting call:", error)
    throw error
  }
}

// End a call
export const endCall = async (callId, duration, participants = []) => {
  try {
    await updateDoc(doc(db, "calls", callId), {
      status: "ended",
      endedAt: serverTimestamp(),
      duration: duration || 0,
    })

    // Clean up active call references for all participants
    if (participants && participants.length > 0) {
      const cleanupPromises = participants.map((userId) =>
        deleteDoc(doc(db, "activeCall", userId)).catch((err) =>
          console.warn(`Failed to delete active call for ${userId}:`, err),
        ),
      )
      await Promise.all(cleanupPromises)
    }

    return true
  } catch (error) {
    console.error("Error ending call:", error)
    throw error
  }
}

// Add a message to a call
export const addCallMessage = async (callId, senderId, content) => {
  try {
    const callDoc = await getDoc(doc(db, "calls", callId))

    if (!callDoc.exists()) {
      throw new Error("Call not found")
    }

    const callData = callDoc.data()
    const messages = callData.messages || []

    const newMessage = {
      sender: senderId,
      content,
      timestamp: new Date().toISOString(),
    }

    await updateDoc(doc(db, "calls", callId), {
      messages: [...messages, newMessage],
    })

    return true
  } catch (error) {
    console.error("Error adding call message:", error)
    throw error
  }
}

// Get call history for a user
export const getCallHistory = async (userId) => {
  try {
    const q = query(
      collection(db, "calls"),
      where("participants", "array-contains", userId),
      orderBy("createdAt", "desc"),
    )

    const querySnapshot = await getDocs(q)
    const calls = []

    querySnapshot.forEach((doc) => {
      calls.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    return calls
  } catch (error) {
    console.error("Error getting call history:", error)
    throw error
  }
}

// Get call details
export const getCallDetails = async (callId) => {
  try {
    const callDoc = await getDoc(doc(db, "calls", callId))

    if (!callDoc.exists()) {
      throw new Error("Call not found")
    }

    return {
      id: callDoc.id,
      ...callDoc.data(),
    }
  } catch (error) {
    console.error("Error getting call details:", error)
    throw error
  }
}
