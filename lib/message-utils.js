import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  limit as firestoreLimit,
  startAfter,
  deleteDoc,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "./firebase"
import { fileToBase64, isFileSizeValid, getFileTypeCategory, compressImage } from "./file-utils"

// Update the createConversation function to fix the issue with doctor-initiated conversations
// Replace the entire createConversation function with this improved version:

// Function to create a new conversation
export const createConversation = async (participants, firstMessage) => {
  try {
    if (!participants || participants.length < 2) {
      throw new Error("At least two participants are required to create a conversation")
    }

    // Sort participants to ensure consistent order
    const sortedParticipants = [...participants].sort()

    // First check if a conversation already exists between these participants
    const existingConversationId = await checkExistingConversation(sortedParticipants, true)
    if (existingConversationId) {
      // If conversation exists, just send a message to it
      await sendMessage(existingConversationId, participants[0], firstMessage, "text")
      return existingConversationId
    }

    // Create new conversation with participant details
    const participantDetails = {}
    for (const participantId of sortedParticipants) {
      try {
        const userDoc = await getDoc(doc(db, "users", participantId))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          // Only include fields that exist in the user document
          participantDetails[participantId] = {
            displayName: userData.displayName || "",
            photoURL: userData.photoURL || null,
            role: userData.role || "patient",
          }

          // Only add specialty if it exists (for doctors)
          if (userData.specialty) {
            participantDetails[participantId].specialty = userData.specialty
          }

          // Only add dob if it exists (for patients)
          if (userData.dob) {
            participantDetails[participantId].dob = userData.dob
          }
        }
      } catch (userError) {
        console.error(`Error getting user details for ${participantId}:`, userError)
        // Continue with basic info if we can't get full details
        participantDetails[participantId] = {
          displayName: "User",
          photoURL: null,
        }
      }
    }

    // Create unread counts object for each participant
    const unreadCounts = {}
    sortedParticipants.forEach((id) => {
      if (id !== participants[0]) {
        // Sender doesn't have unread messages
        unreadCounts[id] = 1
      } else {
        unreadCounts[id] = 0
      }
    })

    // Create the conversation document
    const conversationRef = await addDoc(collection(db, "conversations"), {
      participants: sortedParticipants,
      participantDetails,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: {
        content: firstMessage,
        timestamp: serverTimestamp(),
        sender: participants[0],
      },
      unreadCounts: unreadCounts,
      muted: {}, // Track which users have muted the conversation
      removedParticipants: [], // Track users who have "deleted" the conversation
    })

    // Add first message
    await addDoc(collection(db, `conversations/${conversationRef.id}/messages`), {
      content: firstMessage,
      sender: participants[0],
      timestamp: serverTimestamp(),
      read: false,
      readBy: [participants[0]], // Track who has read the message
      type: "text",
      status: "sent",
      deletedFor: [], // Track who has deleted this message
    })

    return conversationRef.id
  } catch (error) {
    console.error("Error creating conversation:", error)
    throw new Error(`Failed to create conversation: ${error.message}`)
  }
}

// Update the sendMessage function to properly handle file data

// Function to send a message with different types (text, image, file, audio, video)
export const sendMessage = async (
  conversationId,
  senderId,
  content,
  type = "text",
  file = null,
  replyToMessage = null,
) => {
  try {
    if (!conversationId || !senderId) {
      throw new Error("Conversation ID and sender ID are required")
    }

    // First verify the conversation exists
    const conversationDoc = await getDoc(doc(db, "conversations", conversationId))
    if (!conversationDoc.exists()) {
      throw new Error("Conversation does not exist")
    }

    const conversationData = conversationDoc.data()

    // Check if sender is a participant or was removed
    const isParticipant = conversationData.participants.includes(senderId)
    const wasRemoved = conversationData.removedParticipants?.includes(senderId)

    // If sender was removed, add them back to participants
    if (!isParticipant && wasRemoved) {
      await updateDoc(doc(db, "conversations", conversationId), {
        participants: arrayUnion(senderId),
        removedParticipants: arrayRemove(senderId),
      })
    } else if (!isParticipant && !wasRemoved) {
      throw new Error("Sender is not a participant in this conversation")
    }

    let fileData = null
    let fileName = null
    let fileSize = null
    let fileMimeType = null
    let fileBase64 = null
    let fileDuration = null

    // If there's a file, process it
    if (file && (type === "image" || type === "file" || type === "audio" || type === "video")) {
      try {
        // Check if file is valid
        if (!file) {
          throw new Error("Invalid file object")
        }

        // Handle file.fileData (from voice recorder or camera)
        if (file.fileData) {
          fileBase64 = file.fileData.base64 || null
          fileDuration = file.fileData.duration || 0
          fileMimeType = file.fileData.type || file.type || ""
          fileName = file.name || `${type}-${Date.now()}`
          fileSize = file.size || 0
        } else {
          // Check file size
          const maxSizeMB = type === "video" ? 10 : type === "audio" ? 2 : 1
          if (!isFileSizeValid(file, maxSizeMB)) {
            throw new Error(`File size exceeds the limit (${maxSizeMB}MB)`)
          }

          // Compress image if it's an image
          let processedFile = file
          if (type === "image" && file.type && file.type.startsWith("image/")) {
            try {
              processedFile = await compressImage(file)
            } catch (compressError) {
              console.error("Error compressing image:", compressError)
              // Continue with original file if compression fails
              processedFile = file
            }
          }

          // Convert to base64
          try {
            fileBase64 = await fileToBase64(processedFile)
          } catch (base64Error) {
            console.error("Error converting to base64:", base64Error)
            throw new Error("Failed to process file")
          }

          // Store file metadata
          fileName = file.name || `${type}-${Date.now()}`
          fileSize = processedFile.size || 0
          fileMimeType = file.type || ""
        }

        // Store file data - ensure no undefined values
        fileData = {
          base64: fileBase64 || null,
          name: fileName || `${type}-${Date.now()}`,
          size: fileSize || 0,
          type: fileMimeType || "",
          category: getFileTypeCategory(file) || "other",
          duration: fileDuration || 0,
        }

        console.log("File processed successfully")
      } catch (processError) {
        console.error("Error processing file:", processError)
        throw new Error(`File processing failed: ${processError.message}`)
      }
    }

    // Prepare reply data if replying to a message
    let replyData = null
    if (replyToMessage) {
      replyData = {
        id: replyToMessage.id,
        content: replyToMessage.content || "",
        sender: replyToMessage.sender || "",
        senderName: replyToMessage.senderName || "",
        type: replyToMessage.type || "text",
      }
    }

    // Add message to the conversation
    const messageRef = await addDoc(collection(db, `conversations/${conversationId}/messages`), {
      content: type === "text" ? content : content || fileName || `Sent a ${type}`,
      sender: senderId,
      timestamp: serverTimestamp(),
      read: false,
      readBy: [senderId], // Sender has read their own message
      type,
      fileData,
      fileName,
      fileSize,
      fileMimeType,
      status: "delivered",
      deletedFor: [], // Track who has deleted this message
      replyTo: replyData, // Add reply data if replying to a message
    })

    // Get other participants to update unread count
    const otherParticipants = conversationData.participants.filter((id) => id !== senderId)

    // Update unread counts for each participant
    const unreadCounts = conversationData.unreadCounts || {}
    otherParticipants.forEach((participantId) => {
      unreadCounts[participantId] = (unreadCounts[participantId] || 0) + 1
    })

    // Ensure sender's unread count is 0
    unreadCounts[senderId] = 0

    // Update conversation's last message and unread counts
    await updateDoc(doc(db, "conversations", conversationId), {
      lastMessage: {
        content: type === "text" ? content : `Sent a ${type}`,
        timestamp: serverTimestamp(),
        sender: senderId,
      },
      updatedAt: serverTimestamp(),
      unreadCounts: unreadCounts,
    })

    return messageRef.id
  } catch (error) {
    console.error("Error sending message:", error)
    throw error
  }
}

// Function to upload a file and send a message with the file URL
export const sendFileMessage = async (conversationId, file, senderId, receiverId) => {
  try {
    // Create a unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}_${file.name}`
    const storageRef = ref(storage, `messages/${conversationId}/${filename}`)

    // Set metadata to help with CORS
    const metadata = {
      contentType: file.type,
      customMetadata: {
        "Access-Control-Allow-Origin": "*",
      },
    }

    // Upload the file with metadata
    await uploadBytes(storageRef, file, metadata)

    // Get the download URL
    const fileUrl = await getDownloadURL(storageRef)

    // Determine file type (image or other)
    const isImage = file.type && file.type.startsWith("image/")

    // Create message data
    const messageData = {
      senderId,
      text: isImage ? "Sent an image" : `Sent a file: ${file.name}`,
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileContentType: isImage ? "image" : "file",
      createdAt: serverTimestamp(),
      unreadBy: [receiverId],
    }

    // Send the message
    return await sendMessage(conversationId, messageData)
  } catch (error) {
    console.error("Error sending file message:", error)
    throw error
  }
}

// Mark messages as read
export const markMessagesAsRead = async (conversationId, userId) => {
  try {
    if (!conversationId || !userId) {
      console.error("Conversation ID and user ID are required to mark messages as read")
      return
    }

    // First verify the conversation exists and the user is a participant
    const conversationDoc = await getDoc(doc(db, "conversations", conversationId))
    if (!conversationDoc.exists()) {
      console.error("Conversation does not exist")
      return
    }

    const conversationData = conversationDoc.data()
    if (!conversationData.participants.includes(userId)) {
      console.error("User is not a participant in this conversation")
      return
    }

    // Get all unread messages not sent by this user
    // Query for messages where the user is NOT in readBy array yet
    const messagesRef = collection(db, `conversations/${conversationId}/messages`)
    const querySnapshot = await getDocs(messagesRef)

    // Filter messages that are unread (user not in readBy) and not sent by this user
    const batch = []
    querySnapshot.forEach((docSnapshot) => {
      const messageData = docSnapshot.data()
      const isNotSender = messageData.sender !== userId
      const isUnread = !messageData.readBy || !messageData.readBy.includes(userId)
      
      if (isNotSender && isUnread) {
      batch.push(
        updateDoc(docSnapshot.ref, {
          read: true,
          readBy: arrayUnion(userId),
          status: "read",
        }),
      )
      }
    })

    // Reset unread count for this user
    const unreadCounts = conversationData.unreadCounts || {}
    unreadCounts[userId] = 0

    await updateDoc(doc(db, "conversations", conversationId), {
      unreadCounts: unreadCounts,
    })

    await Promise.all(batch)
  } catch (error) {
    if (error?.code !== "permission-denied") {
      console.error("Error marking messages as read:", error)
    }
  }
}

// Mark conversation as unread
export const markConversationAsUnread = async (conversationId, userId) => {
  try {
    if (!conversationId || !userId) {
      throw new Error("Conversation ID and user ID are required")
    }

    const conversationRef = doc(db, "conversations", conversationId)
    const conversationDoc = await getDoc(conversationRef)

    if (!conversationDoc.exists()) {
      throw new Error("Conversation doesn't exist")
    }

    const conversationData = conversationDoc.data()
    if (!conversationData.participants.includes(userId)) {
      throw new Error("User is not a participant in this conversation")
    }

    // Set unread count to 1 for this user
    const unreadCounts = conversationData.unreadCounts || {}
    unreadCounts[userId] = 1

    await updateDoc(conversationRef, {
      unreadCounts: unreadCounts,
    })

    return true
  } catch (error) {
    console.error("Error marking conversation as unread:", error)
    throw error
  }
}

// Mute or unmute a conversation
export const toggleConversationMute = async (conversationId, userId, isMuted) => {
  try {
    if (!conversationId || !userId) {
      throw new Error("Conversation ID and user ID are required")
    }

    const conversationRef = doc(db, "conversations", conversationId)
    const conversationDoc = await getDoc(conversationRef)

    if (!conversationDoc.exists()) {
      throw new Error("Conversation doesn't exist")
    }

    const conversationData = conversationDoc.data()
    if (!conversationData.participants.includes(userId)) {
      throw new Error("User is not a participant in this conversation")
    }

    // Update muted status
    const muted = conversationData.muted || {}

    if (isMuted) {
      muted[userId] = true
    } else {
      delete muted[userId]
    }

    await updateDoc(conversationRef, { muted })

    return true
  } catch (error) {
    console.error(`Error ${isMuted ? "muting" : "unmuting"} conversation:`, error)
    throw error
  }
}

// Check if a conversation is muted
export const isConversationMuted = (conversation, userId) => {
  if (!conversation || !userId) return false

  const muted = conversation.muted || {}
  return !!muted[userId]
}

// Unsend a message (only if it's your message)
export const unsendMessage = async (conversationId, messageId, senderId) => {
  try {
    if (!conversationId || !messageId || !senderId) {
      throw new Error("Conversation ID, message ID, and sender ID are required")
    }

    const messageRef = doc(db, `conversations/${conversationId}/messages`, messageId)
    const messageDoc = await getDoc(messageRef)

    if (!messageDoc.exists() || messageDoc.data().sender !== senderId) {
      throw new Error("Cannot unsend this message")
    }

    // Update the message
    await updateDoc(messageRef, {
      content: "This message was unsent",
      status: "unsent",
      fileData: null,
      fileName: null,
      fileSize: null,
      fileMimeType: null,
    })

    // Check if it was the last message and update conversation if needed
    const conversationRef = doc(db, "conversations", conversationId)
    const conversationDoc = await getDoc(conversationRef)

    if (conversationDoc.exists()) {
      const lastMessage = conversationDoc.data().lastMessage

      // If this was the last message, update the conversation's lastMessage
      if (lastMessage && lastMessage.sender === senderId) {
        // Get the previous message
        const q = query(
          collection(db, `conversations/${conversationId}/messages`),
          where("status", "!=", "unsent"),
          orderBy("timestamp", "desc"),
          firestoreLimit(1),
        )

        const prevMessages = await getDocs(q)

        if (!prevMessages.empty) {
          const prevMessage = prevMessages.docs[0].data()
          await updateDoc(conversationRef, {
            lastMessage: {
              content: prevMessage.type === "text" ? prevMessage.content : `Sent a ${prevMessage.type}`,
              timestamp: prevMessage.timestamp,
              sender: prevMessage.sender,
            },
          })
        } else {
          // No previous messages, update with generic message
          await updateDoc(conversationRef, {
            lastMessage: {
              content: "No messages",
              timestamp: serverTimestamp(),
              sender: "",
            },
          })
        }
      }
    }
  } catch (error) {
    console.error("Error unsending message:", error)
    throw error
  }
}

// Delete message for me (marks as deleted for current user only)
export const deleteMessageForMe = async (conversationId, messageId, userId) => {
  try {
    if (!conversationId || !messageId || !userId) {
      throw new Error("Conversation ID, message ID, and user ID are required")
    }

    const messageRef = doc(db, `conversations/${conversationId}/messages`, messageId)
    const messageDoc = await getDoc(messageRef)

    if (!messageDoc.exists()) {
      throw new Error("Message doesn't exist")
    }

    // Mark message as deleted for this user
    await updateDoc(messageRef, {
      deletedFor: arrayUnion(userId),
    })

    // If this was the last message, update the conversation's lastMessage
    const conversationRef = doc(db, "conversations", conversationId)
    const conversationDoc = await getDoc(conversationRef)

    if (conversationDoc.exists()) {
      const lastMessage = conversationDoc.data().lastMessage

      // Check if the deleted message was the last one in the conversation
      if (lastMessage && messageId === messageDoc.id) {
        // Find the previous message that isn't deleted for this user
        const q = query(
          collection(db, `conversations/${conversationId}/messages`),
          where("deletedFor", "array-contains", userId),
          orderBy("timestamp", "desc"),
          firestoreLimit(1),
        )

        const prevMessages = await getDocs(q)

        if (!prevMessages.empty) {
          const prevMessage = prevMessages.docs[0].data()
          await updateDoc(conversationRef, {
            lastMessage: {
              content: prevMessage.type === "text" ? prevMessage.content : `Sent a ${prevMessage.type}`,
              timestamp: prevMessage.timestamp,
              sender: prevMessage.sender,
            },
          })
        }
      }
    }

    return true
  } catch (error) {
    console.error("Error deleting message for me:", error)
    throw error
  }
}

// Update the deleteMessageForEveryone function to properly handle deleting messages for everyone

// Delete message for everyone (only if you're the sender)
export const deleteMessageForEveryone = async (conversationId, messageId, senderId) => {
  try {
    if (!conversationId || !messageId || !senderId) {
      throw new Error("Conversation ID, message ID, and sender ID are required")
    }

    const messageRef = doc(db, `conversations/${conversationId}/messages`, messageId)
    const messageDoc = await getDoc(messageRef)

    if (!messageDoc.exists()) {
      throw new Error("Message doesn't exist")
    }

    const messageData = messageDoc.data()

    // Only the sender can delete for everyone
    if (messageData.sender !== senderId) {
      throw new Error("Only the sender can delete a message for everyone")
    }

    // Delete the message
    await deleteDoc(messageRef)

    // Check if it was the last message and update conversation if needed
    const conversationRef = doc(db, "conversations", conversationId)
    const conversationDoc = await getDoc(conversationRef)

    if (conversationDoc.exists()) {
      const lastMessage = conversationDoc.data().lastMessage

      // If this was the last message, update the conversation's lastMessage
      if (lastMessage && lastMessage.sender === senderId) {
        // Get the previous message
        const q = query(
          collection(db, `conversations/${conversationId}/messages`),
          orderBy("timestamp", "desc"),
          firestoreLimit(1),
        )

        const prevMessages = await getDocs(q)

        if (!prevMessages.empty) {
          const prevMessage = prevMessages.docs[0].data()
          await updateDoc(conversationRef, {
            lastMessage: {
              content: prevMessage.type === "text" ? prevMessage.content : `Sent a ${prevMessage.type}`,
              timestamp: prevMessage.timestamp,
              sender: prevMessage.sender,
            },
          })
        } else {
          // No previous messages, update with generic message
          await updateDoc(conversationRef, {
            lastMessage: {
              content: "No messages",
              timestamp: serverTimestamp(),
              sender: "",
            },
          })
        }
      }
    }

    return true
  } catch (error) {
    console.error("Error deleting message for everyone:", error)
    throw error
  }
}

// Delete conversation (removes for current user only)
export const deleteConversation = async (conversationId, userId) => {
  try {
    if (!conversationId || !userId) {
      throw new Error("Conversation ID and user ID are required")
    }

    const conversationRef = doc(db, "conversations", conversationId)
    const conversationDoc = await getDoc(conversationRef)

    if (!conversationDoc.exists()) {
      throw new Error("Conversation doesn't exist")
    }

    // Mark all messages as deleted for this user
    const messagesQuery = query(collection(db, `conversations/${conversationId}/messages`))
    const messagesSnapshot = await getDocs(messagesQuery)

    const batch = []
    messagesSnapshot.forEach((messageDoc) => {
      batch.push(
        updateDoc(messageDoc.ref, {
          deletedFor: arrayUnion(userId),
        }),
      )
    })

    await Promise.all(batch)

    // Instead of deleting the conversation, we'll remove the user from participants
    // and add them to a "removed" array to track who has deleted the conversation
    await updateDoc(conversationRef, {
      participants: arrayRemove(userId),
      removedParticipants: arrayUnion(userId),
    })

    return true
  } catch (error) {
    console.error("Error deleting conversation:", error)
    throw error
  }
}

// Add the addCallStatusMessage function after the deleteConversation function
// and before the getUserDetailsForConversation function

// Function to add a call status message to a conversation
export const addCallStatusMessage = async (conversationId, callData) => {
  try {
    if (!conversationId || !callData) {
      throw new Error("Conversation ID and call data are required")
    }

    // Verify the conversation exists
    const conversationDoc = await getDoc(doc(db, "conversations", conversationId))
    if (!conversationDoc.exists()) {
      throw new Error("Conversation does not exist")
    }

    // Format duration if available
    let durationText = ""
    if (callData.duration && callData.duration > 0) {
      const minutes = Math.floor(callData.duration / 60)
      const seconds = callData.duration % 60
      durationText = `${minutes}:${seconds.toString().padStart(2, "0")}`
    }

    // Create the call status message content
    const callType = callData.type === "video" ? "Video call" : "Voice call"
    let content = ""

    switch (callData.status) {
      case "missed":
        content = `${callType} missed`
        break
      case "rejected":
        content = `${callType} declined`
        break
      case "ended":
        content = `${callType} ended${durationText ? ` • ${durationText}` : ""}`
        break
      case "completed":
        content = `${callType} completed${durationText ? ` • ${durationText}` : ""}`
        break
      default:
        content = `${callType} ${callData.status}`
    }

    // Add the call status message
    await addDoc(collection(db, `conversations/${conversationId}/messages`), {
      content,
      sender: callData.initiator,
      timestamp: serverTimestamp(),
      read: false,
      readBy: [callData.initiator], // Initiator has read their own message
      type: "call-status",
      callData: {
        type: callData.type,
        status: callData.status,
        duration: callData.duration || 0,
        initiator: callData.initiator,
        participants: callData.participants || [],
      },
      status: "delivered",
      deletedFor: [], // Track who has deleted this message
    })

    // Update conversation's last message
    await updateDoc(doc(db, "conversations", conversationId), {
      lastMessage: {
        content,
        timestamp: serverTimestamp(),
        sender: callData.initiator,
      },
      updatedAt: serverTimestamp(),
    })

    return true
  } catch (error) {
    console.error("Error adding call status message:", error)
    throw error
  }
}

// Get user details for a conversation
export const getUserDetailsForConversation = async (userId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required")
    }

    const userDoc = await getDoc(doc(db, "users", userId))
    if (userDoc.exists()) {
      return {
        id: userId,
        ...userDoc.data(),
      }
    }
    return null
  } catch (error) {
    console.error("Error getting user details:", error)
    throw error
  }
}

// Also update the checkExistingConversation function to fix potential issues
// Replace the entire checkExistingConversation function with this improved version:

// Check if a conversation already exists between users
export const checkExistingConversation = async (userIds, includeRemoved = false) => {
  try {
    if (!userIds || userIds.length < 2) {
      throw new Error("At least two user IDs are required")
    }

    // Sort the userIds to ensure consistent order
    const sortedUserIds = [...userIds].sort()

    // First, check for active conversations with these exact participants
    const q = query(collection(db, "conversations"), where("participants", "array-contains", sortedUserIds[0]))

    const snapshot = await getDocs(q)

    // Check each conversation to see if it has exactly the participants we're looking for
    for (const doc of snapshot.docs) {
      const data = doc.data()
      const participants = data.participants || []

      // Check if the participants array matches exactly
      if (participants.length === sortedUserIds.length) {
        // Check if all required participants are in this conversation
        const allMatch = sortedUserIds.every((id) => participants.includes(id))
        if (allMatch) {
          return doc.id
        }
      }
    }

    // If includeRemoved is true, also check for "soft-deleted" conversations
    if (includeRemoved) {
      for (const doc of snapshot.docs) {
        const data = doc.data()
        const participants = data.participants || []
        const removedParticipants = data.removedParticipants || []

        // Combine current and removed participants
        const allParticipants = [...new Set([...participants, ...removedParticipants])]

        // Check if all our target participants are in this combined list
        // and the total count matches (to ensure it's exactly these participants)
        if (sortedUserIds.length === new Set(allParticipants).size) {
          const allMatch = sortedUserIds.every((id) => participants.includes(id) || removedParticipants.includes(id))
          if (allMatch) {
            return doc.id
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error("Error checking existing conversation:", error)
    return null
  }
}

// Get all available doctors for patient to message
export const getAvailableDoctors = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "doctor"), firestoreLimit(50))

    const querySnapshot = await getDocs(q)
    const doctors = []

    querySnapshot.forEach((doc) => {
      doctors.push({ id: doc.id, ...doc.data() })
    })

    return doctors
  } catch (error) {
    console.error("Error getting available doctors:", error)
    throw error
  }
}

// Get all patients for doctor to message
export const getAvailablePatients = async () => {
  try {
    const q = query(collection(db, "users"), where("role", "==", "patient"), firestoreLimit(50))

    const querySnapshot = await getDocs(q)
    const patients = []

    querySnapshot.forEach((doc) => {
      patients.push({ id: doc.id, ...doc.data() })
    })

    return patients
  } catch (error) {
    console.error("Error getting available patients:", error)
    throw error
  }
}

// Update user online status
export const updateOnlineStatus = async (userId, isOnline) => {
  try {
    if (!userId) {
      console.error("User ID is required to update online status")
      return
    }

    await updateDoc(doc(db, "users", userId), {
      isOnline,
      lastActive: serverTimestamp(),
    })
  } catch (error) {
    if (error?.code !== "permission-denied") {
      console.error("Error updating online status:", error)
    }
    // Don't throw - this is a non-critical operation
  }
}

// Get user online status
export const getUserOnlineStatus = (userId, callback) => {
  if (!userId) {
    console.error("User ID is required to get online status")
    callback({ isOnline: false, lastActive: null })
    return () => {}
  }

  try {
    return onSnapshot(
      doc(db, "users", userId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          callback({
            isOnline: data.isOnline || false,
            lastActive: data.lastActive,
          })
        } else {
          callback({ isOnline: false, lastActive: null })
        }
      },
      (error) => {
        if (error?.code !== "permission-denied") {
          console.error(`Error getting online status for user ${userId}:`, error)
        }
        callback({ isOnline: false, lastActive: null })
      },
    )
  } catch (error) {
    console.error("Error setting up online status listener:", error)
    callback({ isOnline: false, lastActive: null })
    return () => {}
  }
}

// Get all conversations for a user
export const getUserConversations = (userId, callback) => {
  if (!userId) {
    console.error("No user ID provided for getUserConversations")
    callback([])
    return () => {}
  }

  try {
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc"),
      firestoreLimit(20), // Limit to 20 most recent conversations
    )

    return onSnapshot(
      q,
      (querySnapshot) => {
        const conversations = []
        querySnapshot.forEach((doc) => {
          conversations.push({ id: doc.id, ...doc.data() })
        })
        callback(conversations)
      },
      (error) => {
        console.error("Error getting conversations:", error)
        callback([])
      },
    )
  } catch (error) {
    console.error("Error setting up conversations listener:", error)
    callback([])
    return () => {}
  }
}

// Get messages for a specific conversation with pagination
export const getConversationMessages = (conversationId, userId, callback, messagesLimit = 30) => {
  if (!conversationId) {
    console.error("No conversation ID provided for getConversationMessages")
    if (typeof callback === "function") callback([])
    return () => {}
  }

  try {
    // Get the most recent messages first, limited to messagesLimit
    const q = query(
      collection(db, `conversations/${conversationId}/messages`),
      orderBy("timestamp", "desc"),
      firestoreLimit(messagesLimit),
    )

    return onSnapshot(
      q,
      (querySnapshot) => {
        const messages = []
        querySnapshot.forEach((doc) => {
          // Only include messages that aren't deleted for the current user
          const data = doc.data()
          if (!data.deletedFor || !data.deletedFor.includes(userId)) {
            messages.push({ id: doc.id, ...data })
          }
        })

        // Sort messages by timestamp (oldest first) before returning
        messages.sort((a, b) => {
          const timeA = a.timestamp?.toDate?.() || new Date(0)
          const timeB = b.timestamp?.toDate?.() || new Date(0)
          return timeA - timeB
        })

        if (typeof callback === "function") callback(messages)
      },
      (error) => {
        if (error?.code !== "permission-denied") {
          console.error(`Error getting messages for conversation ${conversationId}:`, error)
        }
        if (typeof callback === "function") callback([])
      },
    )
  } catch (error) {
    console.error("Error setting up messages listener:", error)
    if (typeof callback === "function") callback([])
    return () => {}
  }
}

// Load more messages (older messages)
export const loadMoreMessages = async (conversationId, userId, oldestMessageTimestamp, messagesLimit = 20) => {
  if (!conversationId || !oldestMessageTimestamp) {
    console.error("Conversation ID and oldest message timestamp are required")
    return []
  }

  try {
    // Query for messages older than the oldest message we already have
    const q = query(
      collection(db, `conversations/${conversationId}/messages`),
      orderBy("timestamp", "desc"),
      startAfter(oldestMessageTimestamp),
      firestoreLimit(messagesLimit),
    )

    const querySnapshot = await getDocs(q)
    const messages = []

    querySnapshot.forEach((doc) => {
      // Only include messages that aren't deleted for the current user
      const data = doc.data()
      if (!data.deletedFor || !data.deletedFor.includes(userId)) {
        messages.push({ id: doc.id, ...data })
      }
    })

    // Sort messages by timestamp (oldest first) before returning
    messages.sort((a, b) => {
      const timeA = a.timestamp?.toDate?.() || new Date(0)
      const timeB = b.timestamp?.toDate?.() || new Date(0)
      return timeA - timeB
    })

    return messages
  } catch (error) {
    console.error("Error loading more messages:", error)
    return []
  }
}

// Set user typing status
export const setTypingStatus = async (conversationId, userId, isTyping) => {
  try {
    if (!conversationId || !userId) return

    const conversationRef = doc(db, "conversations", conversationId)

    // Update typing status
    await updateDoc(conversationRef, {
      [`typingUsers.${userId}`]: isTyping ? serverTimestamp() : null,
    })
  } catch (error) {
    console.error("Error updating typing status:", error)
  }
}

// Get typing status for a conversation
export const getTypingStatus = (conversationId, currentUserId, callback) => {
  if (!conversationId) {
    callback({})
    return () => {}
  }

  try {
    return onSnapshot(
      doc(db, "conversations", conversationId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          const typingUsers = data.typingUsers || {}

          // Filter out current user and expired typing indicators (older than 10 seconds)
          const now = new Date()
          const activeTypingUsers = {}

          Object.entries(typingUsers).forEach(([userId, timestamp]) => {
            if (userId !== currentUserId && timestamp) {
              const typingTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
              const timeDiff = (now - typingTime) / 1000 // difference in seconds

              if (timeDiff < 10) {
                // Consider typing active only for 10 seconds
                activeTypingUsers[userId] = timestamp
              }
            }
          })

          callback(activeTypingUsers)
        } else {
          callback({})
        }
      },
      (error) => {
        console.error("Error getting typing status:", error)
        callback({})
      },
    )
  } catch (error) {
    console.error("Error setting up typing status listener:", error)
    callback({})
    return () => {}
  }
}
