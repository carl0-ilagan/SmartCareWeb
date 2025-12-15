"use client"

import { useState, useRef } from "react"
import { PaperclipIcon, XCircleIcon } from "@heroicons/react/24/outline"

const FileUpload = ({ onFileSelect, onCancelUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setSelectedFile(file)
    onFileSelect(file)

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleCancelUpload = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onCancelUpload()
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  return (
    <div className="relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />

      {!selectedFile ? (
        <button
          type="button"
          onClick={triggerFileInput}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Attach file"
        >
          <PaperclipIcon className="h-5 w-5 text-gray-500" />
        </button>
      ) : (
        <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-md">
          {previewUrl ? (
            <div className="relative w-16 h-16">
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-full object-cover rounded"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded">
              <span className="text-xs text-gray-600 text-center">{selectedFile.name.substring(0, 10)}...</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium truncate max-w-[150px]">{selectedFile.name}</span>
            <span className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</span>
          </div>
          <button
            type="button"
            onClick={handleCancelUpload}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <XCircleIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  )
}

export default FileUpload
