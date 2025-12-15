"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Mic, MicOff, Phone, User, MessageSquare, Volume2, VolumeX, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  doc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { addCallStatusMessage } from "@/lib/message-utils"
import CallNotification from "@/components/call-notification"

export default function DoctorVoiceCallPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [callTime, setCallTime] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [patientInfo, setPatientInfo] = useState(null)
  const [callStatus, setCallStatus] = useState("connecting") // connecting, connected, ended
  const [callId, setCallId] = useState(null)
  const [isCallAccepted, setIsCallAccepted] = useState(false)
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [ringbackTone, setRingbackTone] = useState(false)

  // References for WebRTC
  const audioRef = useRef(null)
  const ringbackRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)
  const callDocRef = useRef(null)
  const callTimerRef = useRef(null)

  // Fetch patient information
  useEffect(() => {
    const fetchPatientInfo = async () => {
      if (!params.id) return

      try {
        const patientDoc = await getDoc(doc(db, "users", params.id))

        if (patientDoc.exists()) {
          setPatientInfo({
            id: patientDoc.id,
            ...patientDoc.data(),
          })
        } else {
          console.error("Patient not found")
          // Fallback to show something
          setPatientInfo({
            id: params.id,
            displayName: "Patient",
            avatar: null,
          })
        }
      } catch (error) {
        console.error("Error fetching patient info:", error)
      }
    }

    fetchPatientInfo()
  }, [params.id])

  // Play ringback tone
  useEffect(() => {
    if (ringbackTone && ringbackRef.current) {
      ringbackRef.current.currentTime = 0
      ringbackRef.current.play().catch((err) => console.error("Error playing sound:", err))
    } else if (!ringbackTone && ringbackRef.current) {
      ringbackRef.current.pause()
      ringbackRef.current.currentTime = 0
    }

    return () => {
      if (ringbackRef.current) {
        ringbackRef.current.pause()
        ringbackRef.current.currentTime = 0
      }
    }
  }, [ringbackTone])

  // Check for existing call or create new one
  useEffect(() => {
    if (!user || !params.id || !patientInfo) return

    const checkExistingCall = async () => {
      try {
        // Check if there's an incoming call from this patient
        const callSnapshot = await getDoc(doc(db, "activeCall", user.uid))

        if (callSnapshot.exists()) {
          const callData = callSnapshot.data()

          // If there's an active call with this patient
          if (callData.participants.includes(user.uid) && callData.participants.includes(params.id)) {
            setCallId(callData.callId)
            callDocRef.current = doc(db, "calls", callData.callId)
            setIsIncomingCall(callData.initiator !== user.uid)

            // If we're accepting an incoming call
            if (callData.initiator !== user.uid) {
              // Update call status to accepted
              await updateDoc(doc(db, "calls", callData.callId), {
                status: "accepted",
                acceptedAt: serverTimestamp(),
              })
              setCallStatus("connected")
              setIsCallAccepted(true)
              startCallTimer()
            } else {
              // We're the initiator, start ringback tone
              setRingbackTone(true)

              // Listen for call status changes
              const unsubscribe = onSnapshot(doc(db, "calls", callData.callId), (doc) => {
                const data = doc.data()
                if (!data) return

                if (data.status === "accepted") {
                  setRingbackTone(false)
                  setIsCallAccepted(true)
                  setCallStatus("connected")
                  startCallTimer()
                } else if (data.status === "ended" || data.status === "rejected") {
                  setRingbackTone(false)
                  handleCallEnded()
                }

                // Update messages
                if (data.messages) {
                  setMessages(data.messages)
                }
              })

              return unsubscribe
            }
          } else {
            // Create a new call
            await initializeCall()
          }
        } else {
          // Create a new call
          await initializeCall()
        }
      } catch (error) {
        console.error("Error checking existing call:", error)
        await initializeCall()
      }
    }

    checkExistingCall()

    // Cleanup function
    return () => {
      // End call if it's still active when component unmounts
      if (callId && callStatus !== "ended") {
        endCall()
      }

      // Stop media tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      // Clear timer
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }

      // Stop ringback tone
      setRingbackTone(false)
    }
  }, [user, params.id, patientInfo])

  // Initialize call
  const initializeCall = async () => {
    try {
      // Create a new call document
      const callData = {
        createdAt: serverTimestamp(),
        participants: [user.uid, params.id],
        type: "voice",
        status: "ringing",
        initiator: user.uid,
        endedAt: null,
        messages: [],
      }

      const callRef = await addDoc(collection(db, "calls"), callData)
      setCallId(callRef.id)
      callDocRef.current = callRef

      // Create an active call reference for the patient
      await setDoc(doc(db, "activeCall", params.id), {
        callId: callRef.id,
        participants: [user.uid, params.id],
        initiator: user.uid,
        type: "voice",
        createdAt: serverTimestamp(),
      })

      // Start ringback tone
      setRingbackTone(true)

      // Listen for call status changes
      const unsubscribe = onSnapshot(doc(db, "calls", callRef.id), (doc) => {
        const data = doc.data()
        if (!data) return

        if (data.status === "accepted") {
          setRingbackTone(false)
          setIsCallAccepted(true)
          setCallStatus("connected")
          // Start call timer
          startCallTimer()
        } else if (data.status === "ended" || data.status === "rejected") {
          setRingbackTone(false)
          handleCallEnded()
        }

        // Update messages
        if (data.messages) {
          setMessages(data.messages)
        }
      })

      // Initialize WebRTC
      await setupWebRTC()

      return unsubscribe
    } catch (error) {
      console.error("Error initializing call:", error)
      alert("Could not initialize call. Please try again.")
      router.push("/doctor/chat")
    }
  }

  // Setup WebRTC
  const setupWebRTC = async () => {
    try {
      // Get local media stream (audio only)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      })

      localStreamRef.current = stream

      // Initialize peer connection
      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
        ],
      }

      const peerConnection = new RTCPeerConnection(configuration)
      peerConnectionRef.current = peerConnection

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream)
      })

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (audioRef.current && event.streams[0]) {
          audioRef.current.srcObject = event.streams[0]

          // Play audio when it's ready
          audioRef.current.onloadedmetadata = () => {
            audioRef.current.play().catch(console.error)
          }
        }
      }

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && callDocRef.current) {
          const candidatesCollection = collection(callDocRef.current, "candidates")
          addDoc(candidatesCollection, { ...event.candidate.toJSON(), from: user.uid })
        }
      }

      // Create and send offer if you're the initiator
      if (!isIncomingCall) {
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)

        // Update call document with the offer
        if (callDocRef.current) {
          await updateDoc(callDocRef.current, {
            offer: {
              type: offer.type,
              sdp: offer.sdp,
            },
          })
        }
      }

      // Listen for remote description (answer or offer)
      if (callDocRef.current) {
        const unsubscribe = onSnapshot(callDocRef.current, (doc) => {
          const data = doc.data()
          if (!data) return

          // If there's an answer and we're the initiator
          if (!isIncomingCall && data.answer && !peerConnection.currentRemoteDescription) {
            const answer = new RTCSessionDescription(data.answer)
            peerConnection.setRemoteDescription(answer).catch(console.error)
          }

          // If there's an offer and we're not the initiator
          if (isIncomingCall && data.offer && !peerConnection.currentRemoteDescription) {
            handleRemoteOffer(data.offer)
          }
        })

        // Listen for ICE candidates
        const candidatesUnsubscribe = onSnapshot(collection(callDocRef.current, "candidates"), (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const data = change.doc.data()
              if (data.from !== user.uid) {
                const candidate = new RTCIceCandidate(data)
                peerConnection.addIceCandidate(candidate).catch(console.error)
              }
            }
          })
        })

        return () => {
          unsubscribe()
          candidatesUnsubscribe()
        }
      }
    } catch (error) {
      console.error("Error setting up WebRTC:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  // Handle remote offer
  const handleRemoteOffer = async (offer) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)

      // Send answer
      if (callDocRef.current) {
        await updateDoc(callDocRef.current, {
          answer: {
            type: answer.type,
            sdp: answer.sdp,
          },
        })
      }
    } catch (error) {
      console.error("Error handling remote offer:", error)
    }
  }

  // Start call timer
  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallTime((prevTime) => prevTime + 1)
    }, 1000)
  }

  // Format call time
  const formatCallTime = () => {
    const minutes = Math.floor(callTime / 60)
    const seconds = callTime % 60
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Handle sending a message
  const handleSendMessage = (e) => {
    e.preventDefault()

    if (!message.trim() || !callId) return

    // Add message to local state
    const newMessage = {
      sender: user?.uid,
      content: message,
      timestamp: new Date().toISOString(),
    }

    setMessages([...messages, newMessage])
    setMessage("")

    // Add message to Firestore
    if (callDocRef.current) {
      updateDoc(callDocRef.current, {
        messages: [...messages, newMessage],
      }).catch(console.error)
    }
  }

  // Handle ending the call
  const handleEndCall = () => {
    endCall()
    router.push("/doctor/chat")
  }

  // End call function
  const endCall = async () => {
    // Stop media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }

    // Update call status in Firestore
    if (callId) {
      try {
        // Get the call document to check if it has a conversationId
        const callDoc = await getDoc(doc(db, "calls", callId))
        const callData = callDoc.exists() ? callDoc.data() : null

        await updateDoc(doc(db, "calls", callId), {
          status: "ended",
          endedAt: serverTimestamp(),
          duration: callTime,
        })

        // Add call status message to conversation if this call was initiated from a chat
        if (callData && callData.conversationId) {
          await addCallStatusMessage(callData.conversationId, {
            type: "voice",
            status: "ended",
            initiator: callData.initiator,
            duration: callTime,
            participants: callData.participants,
          })
        }

        // Remove active call reference
        if (isIncomingCall) {
          await deleteDoc(doc(db, "activeCall", user.uid))
        } else {
          await deleteDoc(doc(db, "activeCall", params.id))
        }
      } catch (error) {
        console.error("Error ending call:", error)
      }
    }

    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
    }

    setCallStatus("ended")
  }

  // Handle call ended
  const handleCallEnded = () => {
    // Stop media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }

    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
    }

    setCallStatus("ended")

    // Redirect after a short delay
    setTimeout(() => {
      router.push("/doctor/chat")
    }, 2000)
  }

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  // Toggle speaker
  const toggleSpeaker = () => {
    if (audioRef.current) {
      audioRef.current.volume = isSpeakerOn ? 0.2 : 1.0
      setIsSpeakerOn(!isSpeakerOn)
    }
  }

  return (
    <div className="h-screen w-full bg-graphite text-white">
      {/* Ringback tone */}
      <audio ref={ringbackRef} src="/sounds/ringback-tone.mp3" loop />

      {/* Remote audio */}
      <audio ref={audioRef} autoPlay />

      {/* Main call area */}
      <div className="relative h-full w-full">
        {/* Patient's profile */}
        <div className="absolute inset-0 flex items-center justify-center">
          {patientInfo && (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-6 h-32 w-32 overflow-hidden rounded-full bg-pale-stone">
                {patientInfo.photoURL ? (
                  <img
                    src={patientInfo.photoURL || "/placeholder.svg"}
                    alt={patientInfo.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-full w-full p-6 text-drift-gray" />
                )}
              </div>
              <h2 className="text-2xl font-bold">{patientInfo.displayName}</h2>
              <div className="mt-4 text-lg">
                <p>{callStatus === "connecting" ? "Calling..." : "Voice Call"}</p>
                <p className="mt-2">{formatCallTime()}</p>
              </div>

              {/* Audio visualization (simulated) */}
              {callStatus === "connected" && (
                <div className="mt-8 flex h-12 w-64 items-center justify-center space-x-1">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const height = Math.sin(i / 3 + callTime / 2) * 20 + 30
                    return <div key={i} className="w-1 bg-soft-amber" style={{ height: `${height}%` }}></div>
                  })}
                </div>
              )}

              {callStatus === "connecting" && (
                <div className="mt-8">
                  <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-soft-amber border-t-transparent"></div>
                  {!isIncomingCall && <div className="mt-4 animate-pulse-slow">Ringing...</div>}
                </div>
              )}

              {callStatus === "ended" && (
                <div className="mt-8">
                  <p>Call Ended</p>
                  <p className="mt-2 text-sm">Redirecting to chat...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Call controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="mx-auto flex max-w-md flex-col items-center">
            {/* Call duration */}
            <div className="mb-2 rounded-full bg-black/50 px-4 py-1">
              <span>{formatCallTime()}</span>
            </div>

            {/* Call controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleMute}
                className={`rounded-full p-3 ${isMuted ? "bg-red-500" : "bg-white/20"}`}
                disabled={callStatus !== "connected"}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>

              <button onClick={handleEndCall} className="rounded-full bg-red-500 p-4">
                <Phone className="h-6 w-6 rotate-135" />
              </button>

              <button
                onClick={toggleSpeaker}
                className={`rounded-full p-3 ${!isSpeakerOn ? "bg-red-500" : "bg-white/20"}`}
                disabled={callStatus !== "connected"}
              >
                {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
              </button>

              <button
                onClick={() => setShowChat(!showChat)}
                className={`rounded-full p-3 ${showChat ? "bg-soft-amber" : "bg-white/20"}`}
              >
                <MessageSquare className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Chat sidebar */}
        {showChat && (
          <div className="absolute bottom-0 right-0 top-0 w-80 bg-white text-graphite">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-pale-stone p-3">
                <h3 className="font-medium">Chat</h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="rounded-full p-1 text-drift-gray hover:bg-pale-stone"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.sender === user?.uid ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-lg p-2 ${
                            msg.sender === user?.uid ? "bg-soft-amber text-white" : "bg-pale-stone text-graphite"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-center text-sm text-drift-gray">No messages yet. Start the conversation!</p>
                  </div>
                )}
              </div>

              <div className="border-t border-pale-stone p-3">
                <form onSubmit={handleSendMessage} className="flex">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-l-md border border-earth-beige bg-white py-2 px-3 text-graphite placeholder:text-drift-gray/60 focus:border-soft-amber focus:outline-none focus:ring-1 focus:ring-soft-amber"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="rounded-r-md bg-soft-amber px-3 py-2 text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* Call Notification */}
        <CallNotification />
      </div>
    </div>
  )
}
