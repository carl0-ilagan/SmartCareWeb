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
import {
  initializePeerConnection,
  createOffer,
  handleOffer,
  handleAnswer,
  collectIceCandidates,
  endCall,
  getCallStats,
} from "@/lib/webrtc"

export default function VoiceCallPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [callTime, setCallTime] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([])
  const [doctorInfo, setDoctorInfo] = useState(null)
  const [callStatus, setCallStatus] = useState("connecting") // connecting, connected, ended
  const [callId, setCallId] = useState(null)
  const [isCallAccepted, setIsCallAccepted] = useState(false)
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [callQuality, setCallQuality] = useState(null)

  // References for WebRTC
  const audioRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const localStreamRef = useRef(null)
  const callDocRef = useRef(null)
  const callTimerRef = useRef(null)
  const statsIntervalRef = useRef(null)

  // Fetch doctor information
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (!params.id) return

      try {
        const doctorDoc = await getDoc(doc(db, "users", params.id))

        if (doctorDoc.exists()) {
          setDoctorInfo({
            id: doctorDoc.id,
            ...doctorDoc.data(),
          })
        } else {
          console.error("Doctor not found")
          // Fallback to show something
          setDoctorInfo({
            id: params.id,
            displayName: "Doctor",
            specialty: "Healthcare Provider",
            avatar: null,
          })
        }
      } catch (error) {
        console.error("Error fetching doctor info:", error)
      }
    }

    fetchDoctorInfo()
  }, [params.id])

  // Initialize WebRTC
  useEffect(() => {
    if (!user || !params.id || !doctorInfo) return

    const setupWebRTC = async () => {
      try {
        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        })
        localStreamRef.current = stream

        // Set up audio output
        if (audioRef.current) {
          audioRef.current.srcObject = stream
        }

        // Initialize peer connection
        const peerConnection = initializePeerConnection()
        peerConnectionRef.current = peerConnection

        // Add local tracks to peer connection
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream)
        })

        // Handle remote stream
        peerConnection.ontrack = (event) => {
          if (audioRef.current && event.streams[0]) {
            audioRef.current.srcObject = event.streams[0]
          }
        }

        // Check if we're the caller or callee
        const callDoc = await getDoc(doc(db, "calls", params.id))
        if (callDoc.exists()) {
          const callData = callDoc.data()
          setCallId(params.id)
          callDocRef.current = doc(db, "calls", params.id)
          setIsIncomingCall(callData.callerId !== user.uid)

          if (callData.callerId === user.uid) {
            // We're the caller
            const offer = await createOffer(peerConnection)
            await updateDoc(callDocRef.current, { offer })
          } else {
            // We're the callee
            if (callData.offer) {
              const answer = await handleOffer(peerConnection, callData.offer)
              await updateDoc(callDocRef.current, { answer })
            }
          }

          // Set up ICE candidate collection
          collectIceCandidates(params.id, peerConnection, user.uid, callData.callerId === user.uid ? callData.receiverId : callData.callerId)

          // Listen for call status changes
          onSnapshot(callDocRef.current, (doc) => {
            const data = doc.data()
            if (!data) return

            if (data.status === "accepted") {
              setCallStatus("connected")
              setIsCallAccepted(true)
              startCallTimer()
            } else if (data.status === "ended") {
              handleCallEnded()
            }

            // Handle answer if we're the caller
            if (data.answer && !peerConnection.currentRemoteDescription) {
              handleAnswer(peerConnection, data.answer)
            }
          })
        }
      } catch (error) {
        console.error("Error setting up WebRTC:", error)
        alert("Could not access microphone. Please check permissions and try again.")
      }
    }

    setupWebRTC()

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current)
      }
    }
  }, [user, params.id, doctorInfo])

  // Start call timer
  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallTime((prevTime) => prevTime + 1)
    }, 1000)

    // Start monitoring call quality
    statsIntervalRef.current = setInterval(async () => {
      if (peerConnectionRef.current) {
        const stats = await getCallStats(peerConnectionRef.current)
        setCallQuality(stats)
      }
    }, 2000)
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
  const handleEndCall = async () => {
    if (callId) {
      await endCall(callId)
      handleCallEnded()
    }
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

    // Clear timers
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
    }
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current)
    }

    setCallStatus("ended")

    // Redirect after a short delay
    setTimeout(() => {
      router.push("/dashboard/messages")
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
      audioRef.current.muted = !audioRef.current.muted
      setIsSpeakerOn(!isSpeakerOn)
    }
  }

  return (
    <div className="h-screen w-full bg-graphite text-white">
      {/* Hidden audio element for remote audio */}
      <audio ref={audioRef} autoPlay playsInline />

      {/* Main call area */}
      <div className="relative h-full w-full">
        {/* Call status and info */}
        <div className="absolute inset-0 flex items-center justify-center bg-graphite">
          {doctorInfo && (
            <div className="flex h-full w-full flex-col items-center justify-center">
              {callStatus === "connecting" ? (
                <div className="text-center">
                  <div className="mb-4 text-2xl">
                    {isIncomingCall ? "Connecting to" : "Calling"} {doctorInfo.displayName}...
                  </div>
                  <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-soft-amber border-t-transparent"></div>
                  {!isIncomingCall && <div className="mt-4 animate-pulse-slow">Ringing...</div>}
                </div>
              ) : callStatus === "ended" ? (
                <div className="text-center">
                  <div className="mb-4 text-2xl">Call Ended</div>
                  <div>Redirecting to chat...</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mb-8 h-32 w-32 overflow-hidden rounded-full bg-pale-stone">
                    {doctorInfo.photoURL ? (
                      <img
                        src={doctorInfo.photoURL}
                        alt={doctorInfo.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-soft-amber text-white">
                        <User className="h-16 w-16" />
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold">{doctorInfo.displayName}</h2>
                  <p className="text-soft-amber">{doctorInfo.specialty}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Call info and controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="mx-auto flex max-w-md flex-col items-center">
            {/* Call duration */}
            <div className="mb-2 rounded-full bg-black/50 px-4 py-1">
              <span>{formatCallTime()}</span>
            </div>

            {/* Call controls */}
            <div className="flex items-center space-x-4">
              <button onClick={toggleMute} className={`rounded-full p-3 ${isMuted ? "bg-red-500" : "bg-white/20"}`}>
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>

              <button onClick={handleEndCall} className="rounded-full bg-red-500 p-4">
                <Phone className="h-6 w-6 rotate-135" />
              </button>

              <button onClick={toggleSpeaker} className={`rounded-full p-3 ${!isSpeakerOn ? "bg-red-500" : "bg-white/20"}`}>
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

        {/* Call quality indicator */}
        {callQuality && (
          <div className="absolute top-4 right-4 rounded-lg bg-black/50 px-3 py-1 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${callQuality.audioPacketsLost < 5 ? "bg-green-500" : "bg-red-500"}`} />
              <span>Audio: {callQuality.audioPacketsLost < 5 ? "Good" : "Poor"}</span>
            </div>
          </div>
        )}
      </div>
      {/* Call Notification */}
      <CallNotification />
    </div>
  )
}
