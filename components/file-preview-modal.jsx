"use client"

import { useState, useEffect } from "react"
import { X, Download } from "lucide-react"
import { createDataURL, downloadFile } from "@/lib/file-utils"

export default function FilePreviewModal({ isOpen, onClose, file, fileName }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      // Simulate loading time for larger files
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleDownload = () => {
    if (!file || !file.base64 || !file.type) return
    const dataUrl = createDataURL(file.base64, file.type)
    downloadFile(dataUrl, fileName || "download")
  }

  const fileUrl = file && file.base64 ? createDataURL(file.base64, file.type) : null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/80 transition-opacity" onClick={onClose} aria-hidden="true"></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="absolute right-16 top-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          aria-label="Download"
        >
          <Download className="h-6 w-6" />
        </button>

        {/* File name */}
        <div className="absolute left-4 top-4 max-w-[60%] rounded-md bg-black/50 px-3 py-2 text-white">
          <p className="truncate text-sm font-medium">{fileName || "File"}</p>
        </div>

        {/* Content */}
        <div className="max-h-[80vh] max-w-[90vw] overflow-auto rounded-lg bg-white p-1">
          {isLoading ? (
            <div className="flex h-[50vh] w-[80vw] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-soft-amber border-t-transparent"></div>
            </div>
          ) : (
            <>
              {file && file.type && file.type.startsWith("image/") && (
                <img
                  src={fileUrl || "/placeholder.svg"}
                  alt={fileName || "Image"}
                  className="max-h-[80vh] max-w-[90vw] object-contain"
                />
              )}

              {file && file.type && file.type.startsWith("video/") && (
                <video src={fileUrl} controls autoPlay className="max-h-[80vh] max-w-[90vw]" />
              )}

              {file && file.type && file.type.startsWith("audio/") && (
                <div className="flex h-[20vh] w-[80vw] flex-col items-center justify-center p-8">
                  <p className="mb-4 text-lg font-medium text-graphite">{fileName || "Audio"}</p>
                  <audio src={fileUrl} controls className="w-full" />
                </div>
              )}

              {file && file.type && file.type === "application/pdf" && (
                <iframe src={fileUrl} title={fileName || "PDF"} className="h-[80vh] w-[90vw]" />
              )}

              {file && file.type && file.type.startsWith("text/") && (
                <div className="h-[80vh] w-[80vw] overflow-auto p-4">
                  <pre className="whitespace-pre-wrap text-sm">{atob(file.base64)}</pre>
                </div>
              )}

              {(!file ||
                !file.type ||
                (!file.type.startsWith("image/") &&
                  !file.type.startsWith("video/") &&
                  !file.type.startsWith("audio/") &&
                  file.type !== "application/pdf" &&
                  !file.type.startsWith("text/"))) && (
                <div className="flex h-[50vh] w-[80vw] flex-col items-center justify-center p-8">
                  <p className="mb-2 text-lg font-medium text-graphite">{fileName || "File"}</p>
                  <p className="text-sm text-drift-gray">Preview not available</p>
                  <button
                    onClick={handleDownload}
                    className="mt-4 rounded-md bg-soft-amber px-4 py-2 text-white hover:bg-amber-600"
                  >
                    Download
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
