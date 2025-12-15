"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Loader2 } from "lucide-react"

export default function VoiceRecorder({ onRecordingComplete, onCancel }) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const chunksRef = useRef([])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopMediaTracks()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Start recording automatically when component mounts
  useEffect(() => {
    startRecording()
  }, [])

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const startRecording = async () => {
    try {
      chunksRef.current = []
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(audioBlob)
        setIsProcessing(true)

        // Convert to base64 for storage
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = () => {
          const base64data = reader.result.split(",")[1]

          onRecordingComplete({
            blob: audioBlob,
            base64: base64data,
            duration: recordingTime,
            type: "audio/webm",
          })

          setIsProcessing(false)
          setIsRecording(false)
          setRecordingTime(0)
        }
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          // Auto-stop after 2 minutes
          if (prev >= 120) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      stopMediaTracks()

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const handleCancel = () => {
    stopMediaTracks()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRecording(false)
    setRecordingTime(0)
    onCancel()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <div className="p-3 bg-pale-stone/30 rounded-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isRecording ? (
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse"></div>
              <span className="text-sm font-medium text-graphite">Recording... {formatTime(recordingTime)}</span>
            </div>
          ) : isProcessing ? (
            <div className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-soft-amber" />
              <span className="text-sm font-medium text-graphite">Processing...</span>
            </div>
          ) : (
            <span className="text-sm font-medium text-graphite">Record voice message</span>
          )}
        </div>

        <div className="flex space-x-2">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600"
              title="Stop Recording"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="p-2 rounded-full bg-soft-amber text-white hover:bg-amber-600 disabled:opacity-50"
              title="Start Recording"
            >
              <Mic className="h-4 w-4" />
            </button>
          )}

          <button onClick={handleCancel} className="text-xs text-drift-gray hover:text-soft-amber">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
