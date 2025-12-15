import { db } from "./firebase"
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from "firebase/firestore"

export async function createVideoRoom({ roomName, doctorId, doctorName, patientId, scheduledAt, appointmentId }) {
  if (!doctorId) throw new Error("Missing doctorId")

  // 1) Create call document
  const callData = {
    type: "video",
    status: "pending",
    callerId: doctorId,
    receiverId: patientId || null,
    participants: patientId ? [doctorId, patientId] : [doctorId],
    roomName,
    doctorName,
    scheduledAt: scheduledAt || null,
    appointmentId: appointmentId || null,
    createdAt: serverTimestamp(),
    messages: [],
  }

  const callsCol = collection(db, "calls")
  const callRef = await addDoc(callsCol, callData)

  // 2) Send notification without touching the patient's user doc (to satisfy rules)
  if (patientId) {
    const notificationsCol = collection(db, "notifications")
    await addDoc(notificationsCol, {
      userId: patientId,
      title: "Video Room Invitation",
      message: `${doctorName || "Your doctor"} invited you to a video room: ${roomName}`,
      type: "call_invite",
      actionLink: `/calls/room/${callRef.id}`,
      actionText: "Join Room",
      metadata: { callId: callRef.id, roomName, scheduledAt: scheduledAt || null },
      read: false,
      createdAt: serverTimestamp(),
    })
  }

  return { callId: callRef.id }
}

// Check if there's an active room for an appointment
export async function hasActiveRoomForAppointment(appointmentId, doctorId, patientId) {
  if (!appointmentId || !doctorId || !patientId) return { hasRoom: false, roomId: null }
  
  try {
    // Query for rooms linked to this appointment where patient is invited
    const roomsQuery = query(
      collection(db, "calls"),
      where("appointmentId", "==", appointmentId),
      where("callerId", "==", doctorId),
      where("receiverId", "==", patientId),
      where("status", "in", ["pending", "active"]),
      orderBy("createdAt", "desc"),
      limit(1)
    )
    
    const querySnapshot = await getDocs(roomsQuery)
    
    if (!querySnapshot.empty) {
      const roomDoc = querySnapshot.docs[0]
      const roomData = roomDoc.data()
      
      // Ensure patient is in participants
      if (roomData.participants && roomData.participants.includes(patientId)) {
        return { hasRoom: true, roomId: roomDoc.id }
      }
    }
    
    return { hasRoom: false, roomId: null }
  } catch (error) {
    console.error("Error checking for active room:", error)
    return { hasRoom: false, roomId: null }
  }
}

// Get room ID for an appointment (for both doctor and patient)
export async function getRoomIdForAppointment(appointmentId, userId, userRole) {
  if (!appointmentId || !userId) return null
  
  try {
    // Query for rooms linked to this appointment
    const roomsQuery = query(
      collection(db, "calls"),
      where("appointmentId", "==", appointmentId),
      where("status", "in", ["pending", "active"]),
      orderBy("createdAt", "desc"),
      limit(1)
    )
    
    const querySnapshot = await getDocs(roomsQuery)
    
    if (!querySnapshot.empty) {
      const roomDoc = querySnapshot.docs[0]
      const roomData = roomDoc.data()
      
      // Check if user is authorized (doctor is caller, patient is receiver or in participants)
      if (userRole === "doctor" && roomData.callerId === userId) {
        // Doctor can only join if they created the room AND patient is invited
        if (roomData.receiverId) {
          return roomDoc.id
        }
      } else if (userRole === "patient" && roomData.receiverId === userId) {
        // Patient can join if they are the receiver
        return roomDoc.id
      } else if (roomData.participants && roomData.participants.includes(userId)) {
        // Or if user is in participants
        return roomDoc.id
      }
    }
    
    return null
  } catch (error) {
    console.error("Error getting room ID for appointment:", error)
    return null
  }
}
