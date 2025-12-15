"use client"

import React, { useEffect, useRef, useState, useCallback, use as unwrap } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase"
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore"
import { getUserAppointments, isEligibleForVideoCall } from "@/lib/appointment-utils"
import { Mic, MicOff, Video, VideoOff, MonitorUp, MonitorX, PhoneOff, Maximize2, Minimize2, CheckCircle2 } from "lucide-react"
import { sendNotification } from "@/lib/notification-utils"
import { sendPushNotification } from "@/lib/notification-utils"
import { sendEmailNotification } from "@/lib/email-service"
import { getUserDetails } from "@/lib/user-utils"
import ProfileImage from "@/components/profile-image"

export default function RoomPage({ params }) {
  // Next.js newer params may be a Promise; unwrap safely
  const { id: callId } = unwrap(params)
  const { user, userRole } = useAuth()
  const { toast } = useToast()
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const screenTrackRef = useRef(null)
  const isInitiatorRef = useRef(false)
  const isLeavingRef = useRef(false)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [connecting, setConnecting] = useState(true)
  const [pinned, setPinned] = useState("remote") // 'remote' | 'local'
  const [waitingMessage, setWaitingMessage] = useState("")
  const [remoteActive, setRemoteActive] = useState(false)
  const stageRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isInviteClosing, setIsInviteClosing] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)
  const [upcomingAppointments, setUpcomingAppointments] = useState([])
  const [invitedPatients, setInvitedPatients] = useState(new Set())
  const [invitationSent, setInvitationSent] = useState(null) // Store {patientId, patientName} when invitation is sent
  const [showEndModal, setShowEndModal] = useState(false)
  const hasShownEndedToastRef = useRef(false)

  const getRedirectPath = (callData) => {
    const role = userRole || callData?.callerRole || callData?.receiverRole || callData?.role
    if (role === "doctor") return "/doctor/dashboard"
    if (role === "admin") return "/admin/dashboard"
    // Fallback: if current path is under /doctor, keep doctor dashboard
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/doctor")) {
      return "/doctor/dashboard"
    }
    return "/dashboard"
  }

  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  }

  // Parse a time like "8:00 PM" into 24h ("20:00") and return Date from date string
  const toAppointmentDate = (dateString, timeString) => {
    if (!dateString || !timeString) return null
    try {
      const trimmed = String(timeString).trim()
      const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i)
      let hhmm = "00:00"
      if (match) {
        let h = parseInt(match[1], 10)
        const m = parseInt(match[2] || "0", 10)
        const ampm = match[3].toUpperCase()
        if (ampm === "PM" && h !== 12) h += 12
        if (ampm === "AM" && h === 12) h = 0
        const hh = String(h).padStart(2, "0")
        const mm = String(m).padStart(2, "0")
        hhmm = `${hh}:${mm}`
      } else if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
        // Already 24h
        hhmm = trimmed
      }
      // Construct in local time
      return new Date(`${dateString}T${hhmm}:00`)
    } catch {
      return null
    }
  }

  const isSameDay = (dateString) => {
    try {
      const d = new Date(dateString)
      const now = new Date()
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      )
    } catch {
      return false
    }
  }

  const startLocalMedia = useCallback(async () => {
    const constraints = {
      video: { 
        width: { ideal: 1280 }, 
        height: { ideal: 720 }, 
        facingMode: "user",
        // Prevent zoomed/close-up view like Google Meet
        frameRate: { ideal: 30, max: 60 },
        aspectRatio: { ideal: 16 / 9 }
      },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      return stream
    } catch (e) {
      // If camera/mic busy, fallback to audio-only; then to no media
      if (e && (e.name === "NotReadableError" || e.name === "OverconstrainedError" || e.name === "NotAllowedError")) {
        try {
          const audioOnly = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          localStreamRef.current = audioOnly
          if (localVideoRef.current) localVideoRef.current.srcObject = audioOnly
          return audioOnly
        } catch (e2) {
          // As a last resort, create an empty MediaStream so the peer connection can proceed
          const empty = new MediaStream()
          localStreamRef.current = empty
          return empty
        }
      }
      throw e
    }
  }, [])

  const setupPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(configuration)
    pcRef.current = pc

    // Add local tracks
    const localTracks = localStreamRef.current?.getTracks?.() || []
    localTracks.forEach((t) => pc.addTrack(t, localStreamRef.current))
    // If no local tracks, negotiate recv-only so remote media can still flow
    const hasAudio = localTracks.some((t) => t.kind === "audio")
    const hasVideo = localTracks.some((t) => t.kind === "video")
    if (!hasAudio) {
      try { pc.addTransceiver("audio", { direction: "recvonly" }) } catch {}
    }
    if (!hasVideo) {
      try { pc.addTransceiver("video", { direction: "recvonly" }) } catch {}
    }

    // Remote track handler
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream
        setRemoteActive(true)
      }
    }

    // ICE candidates -> Firestore
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        const candidatesCol = collection(doc(db, "calls", callId), "candidates")
        await addDoc(candidatesCol, { ...event.candidate.toJSON(), from: user?.uid || "anon" })
      }
    }

    // Helpful logging for debugging states
    pc.onconnectionstatechange = () => {
      // console.log('PC state', pc.connectionState)
    }
  }, [callId, user?.uid])

  useEffect(() => {
    if (!user || !callId) return

    let unsubCall = null
    let unsubCandidates = null

    const joinRoom = async () => {
      try {
        const callRef = doc(db, "calls", callId)
        const callSnap = await getDoc(callRef)

        // Check if room exists and is active - if not, redirect away
        if (!callSnap.exists()) {
          console.log("❌ Room does not exist, redirecting to dashboard...")
          if (!hasShownEndedToastRef.current) {
            toast({
              title: "Room already ended",
              description: "This room is no longer available.",
              variant: "destructive",
            })
            hasShownEndedToastRef.current = true
          }
          if (typeof window !== "undefined") {
            setTimeout(() => {
              window.location.assign(getRedirectPath())
            }, 150)
          }
          return
        }

        const callData = callSnap.data() || {}
        
        // Check if room is ended or inactive - redirect to dashboard if so (prevent joining)
        if (callData.status === "ended" || callData.status === "cancelled" || callData.status === "closed" || callData.revokedBy) {
          console.log("❌ Room is ended/inactive, cannot join. Redirecting to dashboard...")
          if (!hasShownEndedToastRef.current) {
            toast({
              title: "Room already ended",
              description: "This room is no longer available.",
              variant: "destructive",
            })
            hasShownEndedToastRef.current = true
          }
          if (typeof window !== "undefined") {
            setTimeout(() => {
              window.location.assign(getRedirectPath(callData))
            }, 150)
          }
          return
        }

        // Only doctors can create rooms - patients must be invited (receiverId must match)
        if (userRole === "patient") {
          // Check if patient is the intended receiver
          if (callData.receiverId && callData.receiverId !== user?.uid) {
            console.log("❌ Patient not authorized for this room, redirecting to dashboard...")
            if (typeof window !== "undefined") {
              window.location.href = "/dashboard"
            }
            return
          }
        }

        // Start media and setup peer connection
        await startLocalMedia()
        setupPeerConnection()

        // Update participants list if user is not already in it (only if room still active)
        const participants = callData.participants || []
        if (!participants.includes(user?.uid)) {
          // Re-validate active status prior to joining - prevent joining if ended
          if (callData.status === "ended" || callData.status === "cancelled" || callData.status === "closed" || callData.revokedBy) {
            console.log("❌ Cannot join: Room is ended. Redirecting to dashboard...")
            if (typeof window !== "undefined") {
              setTimeout(() => window.location.assign(getRedirectPath(callData)), 150)
            }
            return
          }
          // Only allow joining if status is pending or active
          if (!(callData.status === "pending" || callData.status === "active")) {
            console.log("❌ Cannot join: Room is not in joinable state. Redirecting to dashboard...")
            if (typeof window !== "undefined") {
              setTimeout(() => window.location.assign(getRedirectPath(callData)), 150)
            }
            return
          }
          participants.push(user?.uid)
          await updateDoc(callRef, {
            participants: participants,
            status: "active", // Only set to active if room exists and user joins
            receiverId: userRole === "patient" ? user?.uid : callData.receiverId || null,
          })
        }

        // Track already invited patients
        if (callData.receiverId && userRole === "doctor") {
          setInvitedPatients(new Set([callData.receiverId]))
        }

        // Offer/Answer flow - ensure proper state checking
        const current = await getDoc(callRef)
        const data = current.data() || {}
        // Abort negotiation if room was revoked/ended in the meantime - prevent joining
        if (!current.exists() || data.status === "ended" || data.status === "cancelled" || data.status === "closed" || data.revokedBy) {
          console.log("❌ Cannot proceed: Room was ended. Redirecting to dashboard...")
          if (typeof window !== "undefined") {
            setTimeout(() => window.location.assign(getRedirectPath(data)), 150)
          }
          return
        }

        // If we're not in participants anymore (race conditions), do not negotiate
        const participantsNow = Array.isArray(data.participants) ? data.participants : []
        const amInParticipants = user?.uid ? participantsNow.includes(user.uid) : false

        if (!amInParticipants || isLeavingRef.current) {
          // Skip negotiation if we're not in the room or we are leaving
        } else if (!data.offer) {
          // Initiator: create and write offer
          if (pcRef.current.signalingState === "stable" && !pcRef.current.localDescription) {
            isInitiatorRef.current = true
            const offer = await pcRef.current.createOffer()
            if (!isLeavingRef.current && pcRef.current.signalingState === "stable") {
              await pcRef.current.setLocalDescription(offer)
              await updateDoc(callRef, { 
                offer: offer,
                status: "active",
              })
            }
          }
        } else if (data.offer && !data.answer) {
          // Responder: set remote offer, create answer
          // Only proceed if we're in stable state and haven't set remote description yet
          if (
            pcRef.current.signalingState === "stable" &&
            !pcRef.current.currentRemoteDescription &&
            !pcRef.current.localDescription
          ) {
            if (isLeavingRef.current || !amInParticipants) {
              // Don't negotiate while leaving or if not a participant
              
            } else {
              isInitiatorRef.current = false
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.offer))
            // Wait for state to change before creating answer
            const answer = await pcRef.current.createAnswer()
            // Only set local description if we are in have-remote-offer state and still no localDescription
            if (
              pcRef.current.signalingState === "have-remote-offer" &&
              !pcRef.current.localDescription
            ) {
                if (!isLeavingRef.current) {
                  await pcRef.current.setLocalDescription(answer)
                  await updateDoc(callRef, { 
                    answer: answer,
                    status: "active",
                  })
                }
            }
            }
          }
        } else if (data.offer && data.answer) {
          // Both offer and answer already exist; do not renegotiate here to avoid wrong state errors.
          // Snapshot listener will handle any needed updates.
        }

        // Listen for remote SDP updates and room status
        unsubCall = onSnapshot(callRef, async (snap) => {
          const d = snap.data()
          if (!d) {
            // Room deleted - redirect to dashboard
            console.log("❌ Room was deleted, redirecting to dashboard...")
            if (!hasShownEndedToastRef.current) {
              toast({
                title: "Room already ended",
                description: "The call has been closed.",
                variant: "destructive",
              })
              hasShownEndedToastRef.current = true
            }
            try { if (pcRef.current) pcRef.current.close() } catch {}
            try { if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t)=>t.stop()) } catch {}
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.location.assign(getRedirectPath())
              }, 150)
            }
            return
          }

          // Check if room was ended - redirect to dashboard if so
          if (d.status === "ended" || d.status === "cancelled" || d.status === "closed") {
            console.log("❌ Room was ended, redirecting to dashboard...")
            if (!hasShownEndedToastRef.current) {
              toast({
                title: "Room already ended",
                description: "The call has been closed.",
                variant: "destructive",
              })
              hasShownEndedToastRef.current = true
            }
            try { if (pcRef.current) pcRef.current.close() } catch {}
            try { if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t)=>t.stop()) } catch {}
            if (typeof window !== "undefined") {
              setTimeout(() => {
                window.location.assign(userRole === "doctor" ? "/doctor/dashboard" : "/dashboard")
              }, 150)
            }
            return
          }

          // Waiting state indicator
          try {
            const participants = Array.isArray(d.participants) ? d.participants : []
            // Determine presence of other party
            if (userRole === "doctor") {
              const patientId = d.receiverId
              if (patientId && !participants.includes(patientId)) {
                setWaitingMessage("Waiting for patient to join…")
                setRemoteActive(false)
              } else {
                setWaitingMessage("")
                // Remote may become active shortly after offer/answer; don't force true here
              }
            } else if (userRole === "patient") {
              const doctorId = d.callerId
              if (doctorId && !participants.includes(doctorId)) {
                setWaitingMessage("Waiting for doctor to join…")
                setRemoteActive(false)
              } else {
                setWaitingMessage("")
              }
            } else {
              setWaitingMessage("")
            }
          } catch {
            setWaitingMessage("")
          }

          // If we're responder and we haven't set remote yet, handle an incoming offer (rare after mount)
          if (
            d.offer &&
            !isInitiatorRef.current &&
            !pcRef.current.currentRemoteDescription &&
            !pcRef.current.localDescription &&
            pcRef.current.signalingState === "stable"
          ) {
            try {
              if (isLeavingRef.current) return
              const participants = Array.isArray(d.participants) ? d.participants : []
              if (user?.uid && !participants.includes(user.uid)) return
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(d.offer))
              // Wait for state to update before creating answer
              await new Promise(resolve => setTimeout(resolve, 200))
              // Double-check state before creating answer
              if (
                pcRef.current.signalingState === "have-remote-offer" &&
                !pcRef.current.localDescription
              ) {
                const answer = await pcRef.current.createAnswer()
                // Wait a bit more before setting local description
                await new Promise(resolve => setTimeout(resolve, 100))
                if (
                  pcRef.current.signalingState === "have-remote-offer" &&
                  !pcRef.current.localDescription &&
                  !isLeavingRef.current
                ) {
                  await pcRef.current.setLocalDescription(answer)
                  await updateDoc(callRef, { answer })
                }
              }
            } catch (e) {
              console.error("Error handling remote offer in listener:", e)
              // If error is state-related, try to recover
              if (e.message && e.message.includes("state")) {
                console.log("⚠️ State error, resetting peer connection...")
                // Reset peer connection if state error
                if (pcRef.current) {
                  pcRef.current.close()
                  setupPeerConnection()
                }
              }
            }
          }
          
          // If we're initiator, set remote answer only when we have a local offer set
          if (
            d.answer &&
            isInitiatorRef.current &&
            !pcRef.current.currentRemoteDescription &&
            pcRef.current.localDescription &&
            pcRef.current.localDescription.type === "offer" &&
            pcRef.current.signalingState === "have-local-offer"
          ) {
            try {
              await pcRef.current.setRemoteDescription(new RTCSessionDescription(d.answer))
            } catch (e) {
              console.error("Error handling remote answer in listener:", e)
            }
          }

          // If other participant left, clear remote video and show waiting message
          try {
            const participants = Array.isArray(d.participants) ? d.participants : []
            if (userRole === "doctor") {
              const patientId = d.receiverId
              if (!patientId || !participants.includes(patientId)) {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
                setRemoteActive(false)
              }
            } else if (userRole === "patient") {
              const doctorId = d.callerId
              if (!doctorId || !participants.includes(doctorId)) {
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
                setRemoteActive(false)
              }
            }
          } catch {}
        })

        // Listen for ICE candidates
        unsubCandidates = onSnapshot(collection(callRef, "candidates"), async (snapshot) => {
          snapshot.docChanges().forEach(async (change) => {
            const data = change.doc.data()
            // Ignore our own candidates
            if (data.from === (user?.uid || "anon")) return
            try {
              if (pcRef.current && data) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(data))
              }
            } catch (e) {
              // no-op - candidate might be invalid or connection closed
            }
          })
        })

        setConnecting(false)
      } catch (e) {
        console.error("Failed to join room", e)
        setConnecting(false)
      }
    }

    joinRoom()

    return () => {
      if (unsubCall) unsubCall()
      if (unsubCandidates) unsubCandidates()
      if (pcRef.current) pcRef.current.close()
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [callId, user, setupPeerConnection, startLocalMedia])

  // Load doctor's online consultations (same-day only; highlight <= 20 mins)
  useEffect(() => {
    if (!user?.uid) return
    let unsubscribe = () => {}
    try {
      unsubscribe = getUserAppointments(user.uid, "doctor", (appointments) => {
        const list = (appointments || [])
          .filter((apt) => (apt?.mode === "online") && (apt?.status === "approved") && isSameDay(apt.date))
          .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
        setUpcomingAppointments(list)
      })
    } catch {
      // ignore
    }
    return () => {
      if (typeof unsubscribe === "function") unsubscribe()
    }
  }, [user?.uid])

  const toggleMute = () => {
    const audioTracks = localStreamRef.current?.getAudioTracks() || []
    audioTracks.forEach((t) => (t.enabled = !t.enabled))
    setMuted(!audioTracks[0]?.enabled)
  }

  const toggleCamera = () => {
    const videoTracks = localStreamRef.current?.getVideoTracks() || []
    videoTracks.forEach((t) => (t.enabled = !t.enabled))
    setCameraOff(!videoTracks[0]?.enabled)
  }

  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
      const screenTrack = displayStream.getVideoTracks()[0]
      screenTrackRef.current = screenTrack
      const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === "video")
      if (sender) await sender.replaceTrack(screenTrack)
      setSharing(true)

      screenTrack.onended = async () => {
        const camTrack = localStreamRef.current.getVideoTracks()[0]
        if (sender && camTrack) await sender.replaceTrack(camTrack)
        setSharing(false)
      }
    } catch (e) {
      // user cancelled
    }
  }

  const stopScreenShare = async () => {
    const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === "video")
    const camTrack = localStreamRef.current.getVideoTracks()[0]
    if (sender && camTrack) await sender.replaceTrack(camTrack)
    if (screenTrackRef.current) screenTrackRef.current.stop()
    setSharing(false)
  }

  const leaveRoom = async () => {
    isLeavingRef.current = true
    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    
    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    
    // Update room to allow rejoin: remove self from participants and set status to pending
    try {
      const callRef = doc(db, "calls", callId)
      const snap = await getDoc(callRef)
      if (snap.exists()) {
        const data = snap.data() || {}
        const currentParticipants = Array.isArray(data.participants) ? data.participants : []
        const updatedParticipants = currentParticipants.filter((pid) => pid !== (user?.uid || ""))
        const newStatus = data.receiverId ? "pending" : (data.status || "pending")
        const updatePayload = {
          participants: updatedParticipants,
          status: newStatus,
        }
        // If user leaving causes room to be empty or single without negotiation partner, clear SDP to prevent auto renegotiation
        if (updatedParticipants.length <= 1) {
          updatePayload.offer = deleteField()
          updatePayload.answer = deleteField()
        }
        await updateDoc(callRef, updatePayload)
      }
    } catch (error) {
      console.error("Error updating room on leave:", error)
    }
    
    // Redirect to appropriate page based on user role
    if (typeof window !== "undefined") {
      if (userRole === "doctor") {
        window.location.href = "/doctor/appointments"
      } else {
        window.location.href = "/dashboard/appointments"
      }
    }
  }

  const togglePin = (target) => {
    setPinned(target)
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (stageRef.current?.requestFullscreen) await stageRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {}
  }

  const revokeRoom = async () => {
    if (isRevoking) return
    setIsRevoking(true)
    try {
      const callRef = doc(db, "calls", callId)
      await updateDoc(callRef, {
        status: "ended",
        endedAt: serverTimestamp(),
        revokedBy: user?.uid || true,
      })
      // Hard-close room shortly after by deleting the doc (allow clients to receive 'ended')
      setTimeout(async () => {
        try { await deleteDoc(callRef) } catch {}
      }, 500)
    } catch (e) {
      // no-op
    } finally {
      try { if (pcRef.current) pcRef.current.close() } catch {}
      try { if (localStreamRef.current) localStreamRef.current.getTracks().forEach((t) => t.stop()) } catch {}
      if (typeof window !== "undefined") {
        // Notify once and redirect both doctor and patient to their respective dashboards when call is ended
        if (!hasShownEndedToastRef.current) {
          toast({
            title: "Room already ended",
            description: "The call has been closed.",
            variant: "destructive",
          })
          hasShownEndedToastRef.current = true
        }
        setTimeout(() => {
          window.location.assign(getRedirectPath())
        }, 150)
      }
    }
  }

  const handleConfirmEndRoom = () => {
    setShowEndModal(false)
    revokeRoom()
  }

  const handleCancelEndRoom = () => {
    if (isRevoking) return
    setShowEndModal(false)
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0b0f14] text-white" ref={stageRef}>
      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-r from-amber-600 to-amber-500/90 px-3 sm:px-4 py-2.5 sm:py-3 shadow">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
          <span className="text-sm font-semibold">Room</span>
          <span className="hidden sm:inline text-xs text-amber-50/90">{callId}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const url = typeof window !== "undefined" ? window.location.href : ""
              if (url) navigator.clipboard.writeText(url).catch(() => {})
            }}
            className="rounded-md bg-white/10 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-white/20"
          >
            Copy link
          </button>
          {userRole === "doctor" && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="relative rounded-md bg-white px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-700 shadow transition hover:bg-amber-50"
              title="Invite patient"
            >
              Invite
              {upcomingAppointments.length > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
                  {upcomingAppointments.length}
                </span>
              )}
            </button>
          )}
          {userRole === "doctor" && (
            <button
              onClick={() => {
                if (isRevoking) return
                setShowEndModal(true)
              }}
              disabled={isRevoking}
              className={`rounded-md px-2.5 sm:px-3 py-1.5 text-xs font-semibold shadow transition ${isRevoking ? "bg-red-400 text-white cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600"}`}
              title="Revoke room (end for both)"
            >
              {isRevoking ? "Revoking…" : "Revoke"}
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="rounded-md bg-white/10 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-white/20"
            title={isFullscreen ? "Exit full screen" : "Enter full screen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Stage */}
      <div className="absolute inset-0 z-0 pt-14 pb-24">
        {/* Main (pinned) video fills stage */}
        <div className="absolute inset-0">
          {pinned === "remote" ? (
            <>
              <video
                ref={remoteVideoRef}
                onClick={() => togglePin("remote")}
                autoPlay
                playsInline
                className="h-full w-full cursor-pointer object-contain bg-black"
              />
              {!remoteActive && (
                <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                  <div className="rounded-xl bg-white/5 backdrop-blur px-4 py-3 text-sm">
                    {waitingMessage || "Waiting for participant to join…"}
                  </div>
                </div>
              )}
            </>
          ) : (
            <video
              ref={localVideoRef}
              onClick={() => togglePin("local")}
              autoPlay
              playsInline
              muted
              className="h-full w-full cursor-pointer object-contain bg-black [transform:scaleX(-1)]"
            />
          )}
          {/* Soft vignette */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(transparent,rgba(0,0,0,0.4))]" />
        </div>

        {/* PiP */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-10 w-40 sm:w-72 overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-lg backdrop-blur">
          {pinned === "remote" ? (
            <video
              ref={localVideoRef}
              onClick={() => togglePin("local")}
              autoPlay
              playsInline
              muted
              className="h-full w-full cursor-pointer object-contain bg-black [transform:scaleX(-1)]"
            />
          ) : (
            <>
              <video
                ref={remoteVideoRef}
                onClick={() => togglePin("remote")}
                autoPlay
                playsInline
                className="h-full w-full cursor-pointer object-contain bg-black"
              />
              {!remoteActive && (
                <div className="absolute inset-0 flex items-center justify-center text-center p-2">
                  <div className="rounded-md bg-white/10 backdrop-blur px-2 py-1 text-[10px]">
                    {waitingMessage || "Waiting…"}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Name badges */}
        <div className="absolute left-4 bottom-28 z-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-xs backdrop-blur">
            <span className="font-medium">You</span>
            <span className="text-white/70">{user?.displayName || "Doctor"}</span>
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center pb-4 sm:pb-6">
        <div className="flex items-center gap-2 sm:gap-3 rounded-full bg-white/10 px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-xl backdrop-blur">
          <button onClick={toggleMute} className="group rounded-full bg-white/10 p-2.5 sm:p-3 hover:bg-white/20">
            {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button onClick={toggleCamera} className="group rounded-full bg-white/10 p-2.5 sm:p-3 hover:bg-white/20">
            {cameraOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>
          {!sharing ? (
            <button onClick={startScreenShare} className="group rounded-full bg-white/10 p-2.5 sm:p-3 hover:bg-white/20">
              <MonitorUp className="h-5 w-5" />
            </button>
          ) : (
            <button onClick={stopScreenShare} className="group rounded-full bg-white/10 p-2.5 sm:p-3 hover:bg-white/20">
              <MonitorX className="h-5 w-5" />
            </button>
          )}
          {/* Leave button removed; only doctor can end via Revoke */}
        </div>
      </div>

      {connecting && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center text-sm text-white/80">
          Connecting...
        </div>
      )}

      {!!waitingMessage && !connecting && (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-20 flex items-center justify-center">
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white/80" />
            {waitingMessage}
          </div>
        </div>
      )}

      {/* Invite side panel */}
      {userRole === "doctor" && isInviteOpen && (
        <>
          <style jsx>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            @keyframes slideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
          `}</style>
          <div
            className="absolute inset-0 z-30 bg-black/40"
            onClick={() => {
              setIsInviteClosing(true)
              setTimeout(() => { setIsInviteOpen(false); setIsInviteClosing(false) }, 200)
            }}
            style={{ animation: `${isInviteClosing ? "fadeOut" : "fadeIn"} .2s ease-out` }}
          />
          <div
            className="absolute right-0 top-0 z-40 h-full w-[85%] max-w-md bg-white text-graphite shadow-2xl"
            style={{ animation: `${isInviteClosing ? "slideOut" : "slideIn"} .2s ease-out` }}
          >
            <div className="flex items-center justify-between border-b border-pale-stone px-4 py-3">
              <h3 className="text-sm font-semibold">Invite patient</h3>
              <button
                onClick={() => {
                  setIsInviteClosing(true)
                  setTimeout(() => { setIsInviteOpen(false); setIsInviteClosing(false) }, 200)
                }}
                className="text-drift-gray hover:text-graphite text-sm"
              >Close</button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto h-full">
              <div>
                <label className="text-xs font-medium text-drift-gray">Invite link</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    readOnly
                    value={typeof window !== "undefined" ? window.location.href : ""}
                    className="flex-1 rounded-md border border-earth-beige px-2 py-2 text-xs"
                  />
                  <button
                    onClick={() => {
                      const url = typeof window !== "undefined" ? window.location.href : ""
                      if (url) navigator.clipboard.writeText(url).catch(() => {})
                    }}
                    className="rounded-md bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Online bookings (upcoming)</h4>
                {upcomingAppointments.length === 0 ? (
                  <p className="text-xs text-drift-gray">No upcoming online bookings.</p>
                ) : (
                  <ul className="space-y-2">
                    {upcomingAppointments.map((apt) => {
                      const isInvited = invitedPatients.has(apt.patientId)
                      const justInvited = invitationSent?.patientId === apt.patientId
                      return (
                        <li key={apt.id} className="flex items-center gap-2 rounded-md border border-pale-stone p-2">
                          <div className="flex-shrink-0">
                            <ProfileImage userId={apt.patientId} size="sm" role="patient" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{apt.patientName}</p>
                            <p className="text-xs text-drift-gray truncate">
                              {apt.date} • {apt.time}
                              {(() => {
                                const now = new Date()
                                const dt = toAppointmentDate(apt.date, apt.time)
                                if (!dt) return null
                                const diffMin = Math.round((dt.getTime() - now.getTime()) / 60000)
                                return diffMin >= 0 && diffMin <= 20 ? (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">soon</span>
                                ) : null
                              })()}
                            </p>
                            {justInvited && (
                              <div className="mt-1 flex items-center gap-1 text-green-600 animate-pulse">
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="text-[10px] font-medium">Invitation Sent</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={async () => {
                              // Prevent multiple invitations
                              if (isInvited) return

                              try {
                                const callRef = doc(db, "calls", callId)
                                
                                // Get room data first
                                const roomSnapshot = await getDoc(callRef)
                                const roomData = roomSnapshot.exists() ? roomSnapshot.data() : {}
                                const roomName = roomData.roomName || "Video Room"
                                
                                // Get patient details for notifications
                                const patientDetails = await getUserDetails(apt.patientId)
                                const patientName = patientDetails?.displayName || patientDetails?.name || apt.patientName || "Patient"
                                const patientEmail = patientDetails?.email
                                const patientPhotoURL = patientDetails?.photoURL || null

                                // Update room with patient invitation
                                await updateDoc(callRef, {
                                  receiverId: apt.patientId,
                                  participants: [user?.uid, apt.patientId],
                                  appointmentId: apt.id || null, // Link room to appointment
                                })

                                // Track invited patient
                                setInvitedPatients(prev => new Set([...prev, apt.patientId]))

                                // Send in-app notification
                                await sendNotification(apt.patientId, {
                                  title: "Video Room Invitation",
                                  message: `${user?.displayName || "Your doctor"} invited you to join a video room: ${roomName}`,
                                  type: "call_invite",
                                  actionLink: `/calls/room/${callId}`,
                                  actionText: "Join Room",
                                  imageUrl: patientPhotoURL,
                                  metadata: { 
                                    callId,
                                    roomName: roomName,
                                    doctorName: user?.displayName || "Doctor",
                                    appointmentId: apt.id || null
                                  },
                                })

                                // Send push notification
                                await sendPushNotification("Video Room Invitation", {
                                  body: `${user?.displayName || "Your doctor"} invited you to join a video room`,
                                  tag: "call-invite",
                                  icon: "/SmartCare.png",
                                  badge: "/SmartCare.png",
                                  data: {
                                    url: `/calls/room/${callId}`,
                                    callId,
                                    type: "call_invite",
                                  },
                                })

                                // Send email notification
                                if (patientEmail) {
                                  const emailSubject = `Video Room Invitation from ${user?.displayName || "Your Doctor"}`
                                  const emailMessage = `Dear ${patientName},\n\n` +
                                    `${user?.displayName || "Your doctor"} has invited you to join a video consultation room.\n\n` +
                                    `Room: ${roomName}\n` +
                                    `Click the link below to join:\n` +
                                    `${typeof window !== "undefined" ? window.location.origin : ""}/calls/room/${callId}\n\n` +
                                    `Best regards,\n` +
                                    `Smart Care Team`
                                  
                                  sendEmailNotification(patientEmail, emailSubject, emailMessage, apt.patientId).catch(err => {
                                    // Only log non-timeout errors
                                    if (err?.message && !err.message.includes('ETIMEDOUT') && !err.message.includes('timeout')) {
                                      console.error("Error sending email notification:", err)
                                    }
                                  })
                                }

                                // Show success animation
                                setInvitationSent({ patientId: apt.patientId, patientName })
                                setTimeout(() => {
                                  setInvitationSent(null)
                                }, 3000)
                              } catch (e) {
                                console.error("Error inviting patient:", e)
                                // Revert invitation state on error
                                setInvitedPatients(prev => {
                                  const newSet = new Set(prev)
                                  newSet.delete(apt.patientId)
                                  return newSet
                                })
                              }
                            }}
                            disabled={isInvited}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                              isInvited 
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                                : "bg-amber-500 text-white hover:bg-amber-600"
                            }`}
                          >
                            {isInvited ? "Invited" : "Invite"}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {showEndModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white text-graphite shadow-2xl">
            <div className="border-b border-pale-stone px-6 py-4">
              <h3 className="text-lg font-bold">End Room</h3>
              <p className="text-sm text-drift-gray mt-1">This will end the room for everyone.</p>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm text-drift-gray">
              <p>All participants will be removed and redirected to their dashboards.</p>
              <p className="font-semibold text-graphite">Continue?</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 border-t border-pale-stone px-6 py-4">
              <button
                onClick={handleCancelEndRoom}
                disabled={isRevoking}
                className="flex-1 rounded-lg border border-earth-beige bg-white px-4 py-2.5 text-sm font-semibold text-graphite hover:bg-pale-stone transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEndRoom}
                disabled={isRevoking}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRevoking ? "Ending…" : "End Room"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


