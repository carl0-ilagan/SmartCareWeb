"use client"

import { useState, useEffect } from "react"
import { X, File } from "lucide-react"

export default function FileUploadPreview({ file, onRemove }) {
  const [preview, setPreview] = useState(null)
  const [fileType, setFileType] = useState("file")

  useEffect(() => {
    if (!file) return

    // Check if it's an image
    if (file && file.type && file.type.startsWith("image/")) {
      setFileType("image")
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setFileType("file")
      setPreview(null)
    }

    return () => {
      // Clean up
      if (preview && typeof preview === "string" && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [file])

  if (!file) return null

  return (
    <div className="relative mb-3 rounded-md border border-earth-beige p-2">
      <div className="flex items-center">
        {fileType === "image" ? (
          <div className="h-16 w-16 overflow-hidden rounded-md bg-pale-stone mr-3">
            {preview && (
              <img src={preview || "/placeholder.svg"} alt="Preview" className="h-full w-full object-cover" />
            )}
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-pale-stone mr-3">
            <File className="h-8 w-8 text-drift-gray" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-graphite">{file.name}</p>
          <p className="text-xs text-drift-gray">{formatFileSize(file.size)}</p>
        </div>
        <button
          onClick={onRemove}
          className="ml-2 rounded-full p-1 text-drift-gray hover:bg-pale-stone hover:text-soft-amber"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
