import { db } from "./firebase"
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  query,
  where,
  getDocs,
  arrayUnion,
  limit,
  orderBy,
  startAfter,
  addDoc,
} from "firebase/firestore"

// WebRTC configuration
const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
}

// State variables
let localStream = null
let remoteStream = null
let peerConnection = null
let currentCall = null
const callListener = null
let incomingCallListener = null
let callStatusListener = null
let networkCheckInterval = null
let networkStatus = "good" // good, poor, or disconnected

// Initialize WebRTC peer connection
export function initializePeerConnection() {
  peerConnection = new RTCPeerConnection(configuration)

  // Add local tracks to the peer connection
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream)
    })
  }

  // Set up remote stream
  remoteStream = new MediaStream()

  // Handle incoming tracks
  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track)
    })
  }

  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      addIceCandidate(event.candidate)
    }
  }

  // Monitor connection state
  peerConnection.onconnectionstatechange = () => {
    checkNetworkStatus()
  }

  // Start network quality monitoring
  startNetworkMonitoring()

  return peerConnection
}

// Start monitoring network quality
export function startNetworkMonitoring() {
  networkCheckInterval = setInterval(() => {
    checkNetworkStatus()
  }, 2000)
}

// Stop monitoring network quality
export function stopNetworkMonitoring() {
  if (networkCheckInterval) {
    clearInterval(networkCheckInterval)
    networkCheckInterval = null
  }
}

// Check network status
export function checkNetworkStatus() {
  if (!peerConnection) return

  const connectionState = peerConnection.connectionState

  if (connectionState === "connected") {
    // Get connection stats to determine quality
    peerConnection.getStats().then((stats) => {
      let packetLoss = 0
      let roundTripTime = 0
      let hasValidStats = false

      stats.forEach((report) => {
        if (report.type === "remote-inbound-rtp" && report.packetsLost !== undefined) {
          packetLoss = report.packetsLost
          hasValidStats = true
        }

        if (report.type === "remote-inbound-rtp" && report.roundTripTime !== undefined) {
          roundTripTime = report.roundTripTime
          hasValidStats = true
        }
      })

      if (hasValidStats) {
        if (packetLoss > 5 || roundTripTime > 0.3) {
          networkStatus = "poor"
        } else {
          networkStatus = "good"
        }
      }
    })
  } else if (connectionState === "disconnected" || connectionState === "failed" || connectionState === "closed") {
    networkStatus = "disconnected"
  }
}

// Get network status
export function getNetworkStatus() {
  return networkStatus
}

// Initialize media stream for call
export async function initializeMediaStream(isVideo) {
  try {
    const constraints = {
      audio: true,
      video: isVideo ? { width: 1280, height: 720 } : false,
    }

    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    return localStream
  } catch (error) {
    console.error("Error accessing media devices:", error)
    throw error
  }
}

// Create a new call
export const createCall = async (callerId, receiverId, type, callerInfo) => {
  try {
    const callRef = await addDoc(collection(db, "calls"), {
      callerId,
      receiverId,
      type,
      status: "ringing",
      createdAt: serverTimestamp(),
      offer: null,
      answer: null,
      initiatorInfo: callerInfo,
    })

    // Create active call document for receiver
    await setDoc(doc(db, "activeCall", receiverId), {
      callId: callRef.id,
      status: "ringing",
      initiator: callerId,
      initiatorInfo: callerInfo,
      type,
      createdAt: serverTimestamp(),
    })

    return callRef.id
  } catch (error) {
    console.error("Error creating call:", error)
    return null
  }
}

// Listen for incoming calls
export function listenForIncomingCalls(userId, callback) {
  try {
    // Query for calls where the user is the receiver and status is 'calling'
    const q = query(collection(db, "calls"), where("receiverId", "==", userId), where("status", "==", "calling"))

    incomingCallListener = onSnapshot(q, (snapshot) => {
      const incomingCalls = []

      snapshot.forEach((doc) => {
        incomingCalls.push({ id: doc.id, ...doc.data() })
      })

      if (incomingCalls.length > 0) {
        callback(incomingCalls[0])
      } else {
        callback(null)
      }
    })

    return () => {
      if (incomingCallListener) {
        incomingCallListener()
        incomingCallListener = null
      }
    }
  } catch (error) {
    console.error("Error listening for incoming calls:", error)
    throw error
  }
}

// Listen for call status changes
export function listenForCallStatus(callId, callback) {
  try {
    callStatusListener = onSnapshot(doc(db, "calls", callId), (doc) => {
      if (doc.exists()) {
        const callData = { id: doc.id, ...doc.data() }
        callback(callData)

        // If call ended, clean up
        if (callData.status === "ended") {
          cleanupCall()
        }
      } else {
        callback(null)
      }
    })

    return () => {
      if (callStatusListener) {
        callStatusListener()
        callStatusListener = null
      }
    }
  } catch (error) {
    console.error("Error listening for call status:", error)
    throw error
  }
}

// Accept an incoming call
export async function acceptCall(callId) {
  try {
    await updateDoc(doc(db, "calls", callId), {
      status: "accepted",
      acceptTime: serverTimestamp(),
    })

    // Get call data
    const callDoc = await getDoc(doc(db, "calls", callId))
    if (callDoc.exists()) {
      currentCall = { id: callDoc.id, ...callDoc.data() }
      return currentCall
    }

    throw new Error("Call not found")
  } catch (error) {
    console.error("Error accepting call:", error)
    throw error
  }
}

// Decline an incoming call
export async function declineCall(callId) {
  try {
    await updateDoc(doc(db, "calls", callId), {
      status: "declined",
      endTime: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error declining call:", error)
    throw error
  }
}

// End an active call
export async function endCall(callId) {
  try {
    // Calculate duration
    const callDoc = await getDoc(doc(db, "calls", callId))
    if (callDoc.exists()) {
      const callData = callDoc.data()
      let duration = 0

      if (callData.acceptTime) {
        const acceptTime = callData.acceptTime.toDate()
        const now = new Date()
        duration = Math.floor((now - acceptTime) / 1000) // duration in seconds
      }

      await updateDoc(doc(db, "calls", callId), {
        status: "ended",
        endTime: serverTimestamp(),
        duration,
      })
    }

    cleanupCall()
  } catch (error) {
    console.error("Error ending call:", error)
    throw error
  }
}

// Create and send offer
export async function createOffer(callId) {
  try {
    if (!peerConnection) {
      initializePeerConnection()
    }

    const offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    await updateDoc(doc(db, "calls", callId), {
      offer: {
        type: offer.type,
        sdp: offer.sdp,
      },
    })
  } catch (error) {
    console.error("Error creating offer:", error)
    throw error
  }
}

// Handle incoming offer
export async function handleOffer(callId, offer) {
  try {
    if (!peerConnection) {
      initializePeerConnection()
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))

    const answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    await updateDoc(doc(db, "calls", callId), {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    })
  } catch (error) {
    console.error("Error handling offer:", error)
    throw error
  }
}

// Handle incoming answer
export async function handleAnswer(answer) {
  try {
    if (!peerConnection) {
      throw new Error("Peer connection not initialized")
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
  } catch (error) {
    console.error("Error handling answer:", error)
    throw error
  }
}

// Add ICE candidate
export async function addIceCandidate(candidate) {
  try {
    if (currentCall) {
      await updateDoc(doc(db, "calls", currentCall.id), {
        candidates: arrayUnion(candidate),
      })
    }
  } catch (error) {
    console.error("Error adding ICE candidate:", error)
  }
}

// Handle incoming ICE candidate
export async function handleIceCandidate(candidate) {
  try {
    if (!peerConnection) {
      throw new Error("Peer connection not initialized")
    }

    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
  } catch (error) {
    console.error("Error handling ICE candidate:", error)
  }
}

// Clean up call resources
export function cleanupCall() {
  // Stop all tracks in local stream
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop())
    localStream = null
  }

  // Close peer connection
  if (peerConnection) {
    peerConnection.close()
    peerConnection = null
  }

  // Stop network monitoring
  stopNetworkMonitoring()

  // Reset call data
  currentCall = null
  remoteStream = null
}

// Get call history
export async function getCallHistory(userId) {
  try {
    // Query for calls where the user is either caller or receiver
    const callerQuery = query(collection(db, "calls"), where("callerId", "==", userId))

    const receiverQuery = query(collection(db, "calls"), where("receiverId", "==", userId))

    const [callerSnapshot, receiverSnapshot] = await Promise.all([getDocs(callerQuery), getDocs(receiverQuery)])

    const calls = []

    callerSnapshot.forEach((doc) => {
      calls.push({ id: doc.id, ...doc.data(), role: "caller" })
    })

    receiverSnapshot.forEach((doc) => {
      calls.push({ id: doc.id, ...doc.data(), role: "receiver" })
    })

    // Sort by start time (most recent first)
    return calls.sort((a, b) => {
      const timeA = a.startTime?.toDate?.() || new Date(0)
      const timeB = b.startTime?.toDate?.() || new Date(0)
      return timeB - timeA
    })
  } catch (error) {
    console.error("Error getting call history:", error)
    throw error
  }
}

// Get call history with pagination
export async function getCallHistoryWithPagination(userId, lastCall = null, pageSize = 10) {
  try {
    const calls = []

    // Create base queries for caller and receiver
    let callerQuery, receiverQuery

    if (lastCall) {
      // Get the last call's timestamp
      const lastCallDoc = await getDoc(doc(db, "calls", lastCall.id))
      if (!lastCallDoc.exists()) {
        throw new Error("Last call document not found")
      }

      const lastTimestamp = lastCallDoc.data().startTime

      callerQuery = query(
        collection(db, "calls"),
        where("callerId", "==", userId),
        orderBy("startTime", "desc"),
        startAfter(lastTimestamp),
        limit(pageSize),
      )

      receiverQuery = query(
        collection(db, "calls"),
        where("receiverId", "==", userId),
        orderBy("startTime", "desc"),
        startAfter(lastTimestamp),
        limit(pageSize),
      )
    } else {
      callerQuery = query(
        collection(db, "calls"),
        where("callerId", "==", userId),
        orderBy("startTime", "desc"),
        limit(pageSize),
      )

      receiverQuery = query(
        collection(db, "calls"),
        where("receiverId", "==", userId),
        orderBy("startTime", "desc"),
        limit(pageSize),
      )
    }

    const [callerSnapshot, receiverSnapshot] = await Promise.all([getDocs(callerQuery), getDocs(receiverQuery)])

    callerSnapshot.forEach((doc) => {
      calls.push({ id: doc.id, ...doc.data(), role: "caller" })
    })

    receiverSnapshot.forEach((doc) => {
      calls.push({ id: doc.id, ...doc.data(), role: "receiver" })
    })

    // Sort by start time (most recent first)
    const sortedCalls = calls.sort((a, b) => {
      const timeA = a.startTime?.toDate?.() || new Date(0)
      const timeB = b.startTime?.toDate?.() || new Date(0)
      return timeB - timeA
    })

    // Limit to pageSize
    return sortedCalls.slice(0, pageSize)
  } catch (error) {
    console.error("Error getting call history with pagination:", error)
    throw error
  }
}

// Get the local stream
export function getLocalStream() {
  return localStream
}

// Get the remote stream
export function getRemoteStream() {
  return remoteStream
}

// Get the current call
export function getCurrentCall() {
  return currentCall
}

// Export default for backward compatibility
export default {
  initializePeerConnection,
  initializeMediaStream,
  createCall,
  listenForIncomingCalls,
  listenForCallStatus,
  acceptCall,
  declineCall,
  endCall,
  createOffer,
  handleOffer,
  handleAnswer,
  addIceCandidate,
  handleIceCandidate,
  cleanupCall,
  getCallHistory,
  getCallHistoryWithPagination,
  getNetworkStatus,
  getLocalStream,
  getRemoteStream,
  getCurrentCall,
}
