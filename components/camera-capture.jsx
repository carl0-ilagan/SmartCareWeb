"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, Video, X, RotateCw, Loader2 } from "lucide-react"

export default function CameraCapture({ onCapture, onCancel, maxVideoDuration = 15 }) {
  const [mode, setMode] = useState("photo") // "photo" or "video"
  const [isCapturing, setIsCapturing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [facingMode, setFacingMode] = useState("user") // "user" (front) or "environment" (back)
  const [recordingTime, setRecordingTime] = useState(0)
  const [capturedImage, setCapturedImage] = useState(null)
  const [capturedVideo, setCapturedVideo] = useState(null)
  const [stream, setStream] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  // Initialize camera
  useEffect(() => {
    startCamera()

    return () => {
      stopMediaTracks()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [facingMode])

  const startCamera = async () => {
    try {
      stopMediaTracks()

      const constraints = {
        audio: mode === "video",
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Could not access camera. Please check permissions.")
      onCancel()
    }
  }

  const stopMediaTracks = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
  }

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }

  const switchMode = (newMode) => {
    if (newMode !== mode) {
      setMode(newMode)
      // Restart camera with new constraints
      startCamera()
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    // Draw video frame to canvas
    const context = canvas.getContext("2d")
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data
    const imageDataUrl = canvas.toDataURL("image/jpeg")
    setCapturedImage(imageDataUrl)

    // Generate a timestamp-based filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const fileName = `photo-${timestamp}.jpg`

    // Convert to blob and then to base64 for storage
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error("Failed to create blob from canvas")
          return
        }

        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = () => {
          const base64data = reader.result.split(",")[1]

          // Create a proper file object with name
          const file = new File([blob], fileName, { type: "image/jpeg" })

          // This is the key change - structure the data exactly like a file upload
          onCapture({
            file: file,
            fileData: {
              base64: base64data,
              type: "image/jpeg",
              name: fileName,
              size: blob.size,
              duration: 0,
            },
            type: "image",
          })
        }
      },
      "image/jpeg",
      0.8,
    )
  }

  const startVideoRecording = () => {
    if (!stream) return

    chunksRef.current = []
    const mediaRecorder = new MediaRecorder(stream)
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    mediaRecorder.onstop = () => {
      const videoBlob = new Blob(chunksRef.current, { type: "video/webm" })
      const videoUrl = URL.createObjectURL(videoBlob)
      setCapturedVideo(videoUrl)
      setIsProcessing(true)

      // Generate a timestamp-based filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const fileName = `video-${timestamp}.webm`

      // Convert to base64 for storage
      const reader = new FileReader()
      reader.readAsDataURL(videoBlob)
      reader.onloadend = () => {
        const base64data = reader.result.split(",")[1]
        const duration = recordingTime || 0 // Ensure duration is not undefined

        // Create a proper file object with name
        const file = new File([videoBlob], fileName, { type: "video/webm" })

        // This is the key change - structure the data exactly like a file upload
        onCapture({
          file: file,
          fileData: {
            base64: base64data,
            type: "video/webm",
            name: fileName,
            size: videoBlob.size,
            duration: duration,
          },
          type: "video",
        })

        setIsProcessing(false)
      }
    }

    // Start recording
    mediaRecorder.start()
    setIsCapturing(true)

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        // Auto-stop after maxVideoDuration seconds
        if (prev >= maxVideoDuration) {
          stopVideoRecording()
          return prev
        }
        return prev + 1
      })
    }, 1000)
  }

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setIsCapturing(false)
    }
  }

  const handleCapture = () => {
    if (mode === "photo") {
      capturePhoto()
    } else {
      if (isCapturing) {
        stopVideoRecording()
      } else {
        setRecordingTime(0)
        startVideoRecording()
      }
    }
  }

  const formatTime = (seconds) => {
    if (typeof seconds !== "number" || isNaN(seconds)) {
      return "0:00"
    }
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <div className="bg-black rounded-md overflow-hidden">
      <div className="relative">
        {/* Video preview */}
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" />

        {/* Canvas for capturing photos (hidden) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Recording indicator */}
        {isCapturing && (
          <div className="absolute top-2 left-2 flex items-center bg-black/50 rounded-full px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-1 animate-pulse"></div>
            <span className="text-xs text-white">{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Controls */}
      <div className="p-3 bg-black flex items-center justify-between">
        {/* Mode switcher */}
        <div className="flex space-x-2">
          <button
            onClick={() => switchMode("photo")}
            className={`p-2 rounded-md text-white ${mode === "photo" ? "bg-soft-amber" : "bg-gray-700"}`}
          >
            <Camera className="h-5 w-5" />
          </button>
          <button
            onClick={() => switchMode("video")}
            className={`p-2 rounded-md text-white ${mode === "video" ? "bg-soft-amber" : "bg-gray-700"}`}
          >
            <Video className="h-5 w-5" />
          </button>
        </div>

        {/* Capture button */}
        <button
          onClick={handleCapture}
          disabled={isProcessing}
          className="p-3 rounded-full bg-white disabled:opacity-50"
        >
          {mode === "photo" ? (
            <Camera className="h-6 w-6 text-black" />
          ) : isCapturing ? (
            <div className="h-6 w-6 rounded bg-red-500"></div>
          ) : (
            <Video className="h-6 w-6 text-black" />
          )}
        </button>

        {/* Switch camera button */}
        <button onClick={switchCamera} className="p-2 rounded-md bg-gray-700 text-white">
          <RotateCw className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
