// Function to convert a file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64String = reader.result.split(",")[1]
      resolve(base64String)
    }
    reader.onerror = (error) => {
      reject(error)
    }
  })
}

// Function to convert base64 to blob
export const base64ToBlob = (base64, contentType) => {
  if (!base64) {
    console.error("Missing base64 data")
    return new Blob([], { type: contentType || "application/octet-stream" })
  }

  try {
    const byteCharacters = atob(base64)
    const byteArrays = []

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512)
      const byteNumbers = new Array(slice.length)

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }

    return new Blob(byteArrays, { type: contentType || "application/octet-stream" })
  } catch (error) {
    console.error("Error converting base64 to blob:", error)
    return new Blob([], { type: contentType || "application/octet-stream" })
  }
}

// Function to check if file size is valid (in MB)
export const isFileSizeValid = (file, maxSizeMB = 1) => {
  if (!file) return false

  // Adjust max size based on file type
  let adjustedMaxSize = maxSizeMB

  // Safely check file type
  const fileType = file.type || ""

  if (fileType.startsWith("video/")) {
    adjustedMaxSize = 10 // 10MB for videos
  } else if (fileType.startsWith("audio/")) {
    adjustedMaxSize = 2 // 2MB for audio
  }

  const maxSizeBytes = adjustedMaxSize * 1024 * 1024 // Convert MB to bytes
  return file.size <= maxSizeBytes
}

// Function to get file type category
export const getFileTypeCategory = (file) => {
  if (!file) return "other"

  const type = file.type || ""

  if (type.startsWith("image/")) {
    return "image"
  } else if (type.startsWith("audio/")) {
    return "audio"
  } else if (type.startsWith("video/")) {
    return "video"
  } else if (type.startsWith("application/pdf")) {
    return "pdf"
  } else if (
    type.startsWith("application/msword") ||
    type.startsWith("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
  ) {
    return "doc"
  } else if (type.startsWith("text/")) {
    return "text"
  } else {
    return "other"
  }
}

// Function to compress an image
export const compressImage = async (file, maxWidth = 800, quality = 0.7) => {
  if (!file || !file.type || !file.type.startsWith("image/")) {
    // If not an image or type is undefined, return the original file
    return file
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Scale down if width is greater than maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, width, height)

        // Get the compressed image as a blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create blob from canvas"))
              return
            }

            // Create a new file from the blob
            const compressedFile = new File([blob], file.name || "image.jpg", {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          file.type,
          quality,
        )
      }
      img.onerror = (error) => {
        reject(error)
      }
    }
    reader.onerror = (error) => {
      reject(error)
    }
  })
}

// Function to create a data URL from base64 and content type
export const createDataURL = (base64, contentType) => {
  if (!base64 || !contentType) {
    console.error("Missing base64 or contentType for createDataURL")
    return null
  }
  return `data:${contentType};base64,${base64}`
}

// Function to download a file
export const downloadFile = (dataUrl, fileName) => {
  if (!dataUrl) {
    console.error("Missing dataUrl for downloadFile")
    return
  }

  // Create a sanitized file name
  const sanitizedFileName = fileName ? fileName.replace(/[^\w\s.-]/gi, "") : "download"

  const link = document.createElement("a")
  link.href = dataUrl
  link.download = sanitizedFileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Function to compress video:
export const compressVideo = async (file, maxDuration = 15) => {
  if (!file || !file.type || !file.type.startsWith("video/")) {
    // If not a video or type is undefined, return the original file
    return file
  }

  // This is a placeholder - in a real app, you would use a library like FFmpeg
  // For now, we'll just check the duration and return the original file
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "metadata"

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src)

      if (video.duration > maxDuration) {
        reject(new Error(`Video duration exceeds the maximum allowed (${maxDuration} seconds)`))
      } else {
        resolve(file)
      }
    }

    video.onerror = () => {
      reject(new Error("Error loading video metadata"))
    }

    video.src = URL.createObjectURL(file)
  })
}
