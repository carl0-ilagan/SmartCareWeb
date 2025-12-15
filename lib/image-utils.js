/**
 * Utility functions for image handling
 */

/**
 * Compresses an image file to reduce size
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width of the compressed image
 * @param {number} quality - Quality of the compressed image (0-1)
 * @returns {Promise<Blob>} - A promise that resolves to the compressed image blob
 */
export const compressImage = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    // Check if the file is an image
    if (!file.type.startsWith("image/")) {
      return resolve(file) // Return the original file if not an image
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        // Create a canvas element
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions if width exceeds maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw image on canvas
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, width, height)

        // Get the compressed image as blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new file from the blob
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error("Canvas to Blob conversion failed"))
            }
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

/**
 * Validates if an image file meets size requirements
 * @param {File} file - The file to validate
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {boolean} - Whether the file is valid
 */
export const validateImageFile = (file, maxSizeMB = 5) => {
  // Check if file exists
  if (!file) return false

  // Check if it's an image
  if (!file.type.startsWith("image/")) return false

  // Check file size (convert MB to bytes)
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) return false

  return true
}

/**
 * Creates a data URL for an image with cache busting
 * @param {string} url - The image URL
 * @returns {string} - The image URL with cache busting parameter
 */
export const getCacheBustedImageUrl = (url) => {
  if (!url) return null

  // Add cache busting parameter
  const separator = url.includes("?") ? "&" : "?"
  return `${url}${separator}t=${Date.now()}`
}
