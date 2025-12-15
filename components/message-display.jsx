"use client"

import { useState, useRef, useEffect } from "react"
import { File, Download, Eye, Play, Pause, Volume2 } from "lucide-react"
import { createDataURL, downloadFile } from "@/lib/file-utils"
import FilePreviewModal from "./file-preview-modal"

const MessageDisplay = ({
  message,
  isSender,
  formatTime,
  formatFileSize,
  senderName,
  currentUserName,
  patientDetails,
  doctorDetails,
  currentUserId,
  receiverLastActive,
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioProgress, setAudioProgress] = useState(0)
  const [waveformHeights, setWaveformHeights] = useState([])
  const audioRef = useRef(null)
  const progressIntervalRef = useRef(null)

  useEffect(() => {
    // Clean up interval on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  // Load audio metadata when audio element is loaded
  const handleAudioMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration)
      // Generate random waveform heights for visualization (25 bars like Messenger)
      const heights = Array.from({ length: 25 }, () => Math.random() * 70 + 30)
      setWaveformHeights(heights)
    }
  }

  const handleDownload = (fileData, fileName) => {
    if (!fileData || !fileData.base64 || !fileData.type) return

    const dataUrl = createDataURL(fileData.base64, fileData.type)
    downloadFile(dataUrl, fileName || "download")
  }

  const openPreviewModal = () => {
    setShowPreviewModal(true)
  }

  const closePreviewModal = () => {
    setShowPreviewModal(false)
  }

  // Toggle audio playback
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }
      } else {
        audioRef.current.play()
        // Update progress every 100ms
        progressIntervalRef.current = setInterval(() => {
          if (audioRef.current) {
            setAudioProgress(audioRef.current.currentTime)
          }
        }, 100)
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Format time for audio player
  const formatAudioTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Format reply header based on who is replying to whom
  const formatReplyHeader = (replyTo) => {
    if (!replyTo) return null

    // If the sender is replying to themselves
    if (replyTo.sender === message.sender) {
      return isSender ? "You replied to yourself" : `${senderName || "User"} replied to themselves`
    }

    // If the sender is replying to the current user
    if (replyTo.sender !== message.sender && !isSender) {
      return `${senderName || "User"} replied to you`
    }

    // If the current user is replying to the sender
    if (replyTo.sender !== message.sender && isSender) {
      return `You replied to ${replyTo.senderName || patientDetails?.displayName || doctorDetails?.displayName || "User"}`
    }

    return "Reply"
  }

  // If it's a system message (like call status)
  if (message.type === "system") {
    return (
      <div className="w-full flex justify-center my-2">
        <div className="bg-pale-stone/50 text-drift-gray text-xs px-3 py-1 rounded-full">{message.content}</div>
      </div>
    )
  }

  // Detect actual file type from fileData if message.type is "file"
  // Also check fileContentType and fileType fields as fallbacks
  const actualFileType = message.fileData?.type 
    ? (message.fileData.type.startsWith("image/") ? "image" 
       : message.fileData.type.startsWith("audio/") ? "audio"
       : message.fileData.type.startsWith("video/") ? "video"
       : message.type)
    : message.fileContentType === "image" ? "image"
    : message.fileContentType === "audio" ? "audio"
    : message.fileContentType === "video" ? "video"
    : message.fileType?.startsWith("image/") ? "image"
    : message.fileType?.startsWith("audio/") ? "audio"
    : message.fileType?.startsWith("video/") ? "video"
    : message.type

  // For audio messages, render outside the message bubble (like Messenger)
  if ((message.type === "audio" || actualFileType === "audio") && (message.fileData || message.fileUrl) && message.status !== "unsent") {
    const audioSrc = message.fileData?.base64 
      ? createDataURL(message.fileData.base64, message.fileData.type || message.fileType || "audio/webm")
      : message.fileUrl || ""

    if (!audioSrc) {
      // Fallback to file display if no audio source
      return null
    }

    return (
      <>
        <div className="max-w-[75%]">
          <div className={`inline-flex items-center gap-2.5 ${isSender ? 'bg-blue-500' : 'bg-gray-200'} rounded-full px-3 py-2.5 min-w-[180px] max-w-[280px]`}>
            {/* Play/Pause Button - White circle on left */}
            <button
              onClick={toggleAudio}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isSender 
                  ? 'bg-white text-blue-500 hover:bg-gray-100' 
                  : 'bg-soft-amber text-white hover:bg-amber-600'
              }`}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" fill="currentColor" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Waveform visualization - White bars */}
            <div className="flex items-center gap-0.5 flex-1 min-w-0 h-6">
              {waveformHeights.length > 0 ? (
                waveformHeights.map((height, i) => {
                  const progressRatio = audioDuration > 0 ? audioProgress / audioDuration : 0
                  const isActive = isPlaying && (i / waveformHeights.length) < progressRatio
                  const barHeight = isActive ? height : Math.max(25, height * 0.4)
                  return (
                    <div
                      key={i}
                      className={`w-0.5 rounded-full transition-all duration-150 ${
                        isSender
                          ? isActive ? 'bg-white' : 'bg-white/50'
                          : isActive ? 'bg-gray-700' : 'bg-gray-500'
                      }`}
                      style={{
                        height: `${barHeight}%`,
                        minHeight: '4px',
                      }}
                    />
                  )
                })
              ) : (
                // Placeholder bars while loading
                Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-0.5 rounded-full ${
                      isSender ? 'bg-white/50' : 'bg-gray-500'
                    }`}
                    style={{ height: '25%', minHeight: '4px' }}
                  />
                ))
              )}
            </div>

            {/* Time display - White text for sender, dark for receiver */}
            <div className={`flex-shrink-0 text-xs font-medium min-w-[35px] text-right ${
              isSender ? 'text-white' : 'text-gray-700'
            }`}>
              {audioDuration > 0 ? formatAudioTime(isPlaying ? audioProgress : audioDuration) : "0:00"}
            </div>
          </div>

          {/* Timestamp and status */}
          <div className="mt-1 flex items-center justify-end space-x-1">
            {isSender && message.status !== "unsent" && (() => {
              // Check if message is actually read by receiver
              const isReadByReceiver = message.status === "read" && 
                message.readBy && 
                message.readBy.length > 1 && 
                message.readBy.some(id => id !== message.sender)
              
              // Check if receiver was active after message was sent
              const messageTime = message.timestamp?.toDate ? message.timestamp.toDate() : new Date(message.timestamp)
              const receiverActiveTime = receiverLastActive?.toDate ? receiverLastActive.toDate() : (receiverLastActive ? new Date(receiverLastActive) : null)
              const wasActiveAfterMessage = receiverActiveTime && receiverActiveTime >= messageTime
              
              // Only show "read" if receiver read it AND was active after the message
              const showRead = isReadByReceiver && wasActiveAfterMessage
              
              return (
              <span className="text-drift-gray">
                {showRead ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-500"
                  >
                    <path d="M18 6L7 17L2 12" />
                    <path d="M22 10L13 19L11 17" />
                  </svg>
                ) : message.status === "delivered" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L7 17L2 12" />
                    <path d="M22 10L13 19L11 17" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12L10 17L20 7" />
                  </svg>
                )}
            </span>
              )
            })()}
            <span className="text-right text-xs text-drift-gray">
              {formatTime(message.timestamp)}
            </span>
          </div>

          <audio
            ref={audioRef}
            src={audioSrc}
            onEnded={() => {
              setIsPlaying(false)
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current)
              }
              setAudioProgress(0)
            }}
            onLoadedMetadata={handleAudioMetadata}
            className="hidden"
          />
        </div>
      </>
    )
  }

  return (
    <>
      <div
        className={`max-w-[75%] rounded-lg p-3 ${
          isSender ? "bg-soft-amber text-white" : "bg-pale-stone text-graphite"
        } ${message.status === "unsent" ? "opacity-50" : ""}`}
      >
        {/* Reply content */}
        {message.replyTo && (
          <div
            className={`mb-2 rounded-md p-2 text-xs ${
              isSender ? "bg-amber-600/50 text-white/90" : "bg-gray-200 text-gray-700"
            }`}
          >
            <p className="font-medium">{formatReplyHeader(message.replyTo)}</p>
            <p className="truncate">{message.replyTo.content}</p>
          </div>
        )}

        {/* Image message - Messenger style */}
        {((message.type === "image" || actualFileType === "image") && message.status !== "unsent") && (
          <div className="mb-2 -mx-1">
            <div className="overflow-hidden rounded-2xl cursor-pointer group relative" onClick={openPreviewModal}>
            <img
                src={
                  message.fileData?.base64 
                    ? createDataURL(message.fileData.base64, message.fileData.type || message.fileType || "image/jpeg")
                    : message.fileUrl || "/placeholder.svg"
                }
              alt="Image"
                className="max-w-full max-h-[400px] w-auto h-auto object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              loading="lazy"
            />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200"></div>
            </div>
            {message.content && message.content.trim() && (
              <p className="text-sm mt-2">{message.content}</p>
            )}
          </div>
        )}

        {/* Video message */}
        {message.type === "video" && message.fileData && message.status !== "unsent" && (
          <div className="mb-2 overflow-hidden rounded-md">
            <div className="relative cursor-pointer" onClick={openPreviewModal}>
              <video
                src={createDataURL(message.fileData.base64, message.fileData.type)}
                className="max-h-[200px] w-full object-contain"
                poster="/placeholder.svg"
                preload="metadata"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="h-10 w-10 text-white" />
              </div>
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1 rounded">
                {message.fileData.duration
                  ? `${Math.floor(message.fileData.duration / 60)}:${String(message.fileData.duration % 60).padStart(2, "0")}`
                  : "Video"}
              </div>
            </div>
            <div className="mt-1 text-xs opacity-80 flex justify-between">
              <span className="truncate max-w-[150px]">{message.fileName || message.fileData.name || "Video"}</span>
              {message.fileSize && <span>{formatFileSize(message.fileSize)}</span>}
            </div>
          </div>
        )}

        {/* File message - Only show if it's actually a file (not image/audio/video) */}
        {message.type === "file" && actualFileType === "file" && message.fileData && message.status !== "unsent" && (
          <div className="mb-2">
            <div className="flex items-center rounded-md bg-white/10 p-2">
              <File className="mr-2 h-5 w-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm block truncate">
                  {message.fileName || message.fileData.name || message.content || "File"}
                </div>
                {message.fileSize && <span className="text-xs opacity-80">{formatFileSize(message.fileSize)}</span>}
              </div>
              <div className="flex ml-2 space-x-1">
                <button onClick={openPreviewModal} className="p-1 rounded-full hover:bg-white/20" title="Preview">
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDownload(message.fileData, message.fileName || message.fileData.name)}
                  className="p-1 rounded-full hover:bg-white/20"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Text message */}
        {(message.type === "text" || message.status === "unsent") && <p className="text-sm">{message.content}</p>}

        {/* Timestamp and status */}
        <div className="mt-1 flex items-center justify-end space-x-1">
          {isSender && message.status !== "unsent" && (() => {
            // Check if message is actually read by receiver
            const isReadByReceiver = message.status === "read" && 
              message.readBy && 
              message.readBy.length > 1 && 
              message.readBy.some(id => id !== message.sender)
            
            // Check if receiver was active after message was sent
            const messageTime = message.timestamp?.toDate ? message.timestamp.toDate() : new Date(message.timestamp)
            const receiverActiveTime = receiverLastActive?.toDate ? receiverLastActive.toDate() : (receiverLastActive ? new Date(receiverLastActive) : null)
            const wasActiveAfterMessage = receiverActiveTime && receiverActiveTime >= messageTime
            
            // Only show "read" if receiver read it AND was active after the message
            const showRead = isReadByReceiver && wasActiveAfterMessage
            
            return (
            <span className="text-white/70">
              {showRead ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-400"
                >
                  <path d="M18 6L7 17L2 12" />
                  <path d="M22 10L13 19L11 17" />
                </svg>
              ) : message.status === "delivered" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6L7 17L2 12" />
                  <path d="M22 10L13 19L11 17" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12L10 17L20 7" />
                </svg>
              )}
            </span>
            )
          })()}
          <span className={`text-right text-xs ${isSender ? "text-white/70" : "text-drift-gray"}`}>
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>

      {/* File Preview Modal */}
      {message.fileData && (
        <FilePreviewModal
          isOpen={showPreviewModal}
          onClose={closePreviewModal}
          file={message.fileData}
          fileName={message.fileName || message.fileData.name}
        />
      )}
    </>
  )
}

export default MessageDisplay
