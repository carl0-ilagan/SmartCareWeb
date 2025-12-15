"use client"

import { useState, useRef, useEffect } from "react"
import { Paperclip, Send, Smile, Mic, Camera, X, StopCircle } from "lucide-react"
import EmojiPicker from "./emoji-picker"
import VoiceRecorder from "./voice-recorder"
import CameraCapture from "./camera-capture"

export default function MessageInput({
  value,
  onChange,
  onSend,
  onFileSelect,
  selectedFile,
  onRemoveFile,
  fileError,
  sendingMessage,
  replyingTo,
  onCancelReply,
  onTyping,
  otherUserName,
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordingData, setRecordingData] = useState(null)
  const fileInputRef = useRef(null)
  const inputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const chunksRef = useRef([])

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Clean up recording resources on unmount
  useEffect(() => {
    return () => {
      stopMediaTracks()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Stop media tracks
  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    onChange(value + emoji.native)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect({ file: e.target.files[0] })
    }
  }

  // Handle voice recording
  const handleVoiceRecorded = (recordingData) => {
    setShowVoiceRecorder(false)
    if (recordingData) {
      onFileSelect({
        file: new File([recordingData.blob], "voice-message.webm", { type: "audio/webm" }),
        fileData: {
          base64: recordingData.base64,
          type: "audio/webm",
          duration: recordingData.duration,
          name: "voice-message.webm",
        },
      })
    }
  }

  // Start recording
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

        // Convert to base64 for storage
        const reader = new FileReader()
        reader.readAsDataURL(audioBlob)
        reader.onloadend = () => {
          const base64data = reader.result.split(",")[1]

          onFileSelect({
            file: new File([audioBlob], "voice-message.webm", { type: "audio/webm" }),
            fileData: {
              base64: base64data,
              type: "audio/webm",
              duration: recordingTime,
              name: "voice-message.webm",
            },
          })

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

  // Stop recording
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

  // Cancel recording
  const cancelRecording = () => {
    stopMediaTracks()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsRecording(false)
    setRecordingTime(0)
  }

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  // Handle camera capture
  const handleCameraCapture = (captureData) => {
    setShowCamera(false)
    if (captureData && captureData.file) {
      onFileSelect({
        file: captureData.file,
        fileData: captureData.fileData,
      })
    }
  }

  // Handle input change
  const handleInputChange = (e) => {
    onChange(e.target.value)
    if (onTyping) onTyping()
  }

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend(e)
    }
  }

  // Format reply header
  const formatReplyHeader = () => {
    if (!replyingTo) return null

    // If replying to your own message
    if (replyingTo.isSender) {
      return "Replying to yourself"
    }

    // If replying to someone else's message
    return `Replying to ${otherUserName || "User"}`
  }

  return (
    <div className="border-t border-pale-stone bg-white p-3 sticky bottom-0 z-10">
      {/* Reply preview */}
      {replyingTo && (
        <div className="mb-3 rounded-md border border-earth-beige bg-pale-stone/20 p-2">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-drift-gray">{formatReplyHeader()}</p>
              <p className="text-sm text-graphite truncate">{replyingTo.content}</p>
            </div>
            <button
              onClick={onCancelReply}
              className="ml-2 rounded-full p-1 text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Voice recorder */}
      {showVoiceRecorder && (
        <div className="mb-3">
          <VoiceRecorder onRecordingComplete={handleVoiceRecorded} onCancel={() => setShowVoiceRecorder(false)} />
        </div>
      )}

      {/* Camera capture */}
      {showCamera && (
        <div className="mb-3">
          <CameraCapture onCapture={handleCameraCapture} onCancel={() => setShowCamera(false)} />
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="mb-3 rounded-md border border-earth-beige bg-pale-stone/20 p-2">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-drift-gray truncate">{selectedFile.name || "Selected file"}</p>
              <p className="text-xs text-graphite">
                {selectedFile.size ? `${Math.round(selectedFile.size / 1024)} KB` : ""}
              </p>
            </div>
            <button
              onClick={onRemoveFile}
              className="ml-2 rounded-full p-1 text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {fileError && <p className="mt-1 text-xs text-red-500">{fileError}</p>}
        </div>
      )}

      {/* Recording interface */}
      {isRecording ? (
        <div className="flex items-center justify-between rounded-md border border-earth-beige bg-pale-stone/20 p-3">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse"></div>
            <span className="text-sm font-medium text-graphite">Recording... {formatTime(recordingTime)}</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={stopRecording}
              className="rounded-full bg-soft-amber p-2 text-white hover:bg-amber-600"
              title="Stop Recording"
            >
              <StopCircle className="h-5 w-5" />
            </button>
            <button
              onClick={cancelRecording}
              className="rounded-md border border-earth-beige px-3 py-1 text-sm text-drift-gray hover:bg-pale-stone"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Message input */
        <form onSubmit={onSend} className="flex items-end space-x-2">
          <div className="flex-1 rounded-md border border-earth-beige bg-white">
            <div className="flex items-center px-3 py-2">
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 rounded-full text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
                  title="Attach file"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="p-1 rounded-full text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
                  title="Camera"
                >
                  <Camera className="h-5 w-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,video/*,audio/*,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
              </div>
              <div className="flex-1 mx-2">
                <textarea
                  ref={inputRef}
                  value={value}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="w-full resize-none border-0 bg-transparent p-0 text-graphite placeholder:text-drift-gray/60 focus:outline-none focus:ring-0"
                  rows={1}
                  style={{ minHeight: "24px", maxHeight: "120px" }}
                />
              </div>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1 rounded-full text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
                  title="Emoji"
                >
                  <Smile className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={startRecording}
                  className="p-1 rounded-full text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
                  title="Voice message"
                >
                  <Mic className="h-5 w-5" />
                </button>
              </div>
            </div>
            {showEmojiPicker && (
              <div className="p-2 border-t border-earth-beige">
                <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={sendingMessage || (!value.trim() && !selectedFile)}
            className="rounded-full bg-soft-amber p-3 text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {sendingMessage ? (
              <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </form>
      )}
    </div>
  )
}
