/**
 * Utility functions for handling media permissions and access
 */

/**
 * Check and request permissions for microphone and camera
 * @param {boolean} requireVideo - Whether video is required (true for video calls, false for voice calls)
 * @returns {Promise<{stream: MediaStream|null, permissions: {audio: boolean, video: boolean}, error: string|null}>}
 */
export const requestMediaPermissions = async (requireVideo = true) => {
  // Result object
  const result = {
    stream: null,
    permissions: {
      audio: false,
      video: false,
    },
    error: null,
  }

  try {
    // Check if permissions are already granted
    const audioPermissions = await navigator.permissions
      .query({ name: "microphone" })
      .catch(() => ({ state: "unknown" })) // Fallback for browsers that don't support this
    let videoPermissions = { state: "unknown" }
    if (requireVideo) {
      videoPermissions = await navigator.permissions.query({ name: "camera" }).catch(() => ({ state: "unknown" })) // Fallback for browsers that don't support this
    }

    // Update permission status
    result.permissions.audio = audioPermissions.state === "granted"
    result.permissions.video = requireVideo ? videoPermissions.state === "granted" : false

    // Request media based on requirements
    const constraints = {
      audio: true,
      video: requireVideo,
    }

    // Request the media stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints)

    // Update result with stream and permissions
    result.stream = stream
    result.permissions.audio = true // If we got here, audio permission was granted
    result.permissions.video = requireVideo ? true : false // If we got here and video was required, it was granted

    return result
  } catch (error) {
    console.error("Error accessing media devices:", error)

    // Handle specific error types
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      result.error =
        "Permission denied. Please allow access to your microphone" +
        (requireVideo ? " and camera" : "") +
        " to use this feature."
    } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      result.error = requireVideo
        ? "No camera or microphone found. Please connect a camera and microphone to use this feature."
        : "No microphone found. Please connect a microphone to use this feature."
    } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      result.error =
        "Could not access your " +
        (requireVideo ? "camera or microphone" : "microphone") +
        ". The device might be in use by another application."
    } else {
      result.error = "An error occurred while trying to access your media devices. Please try again."
    }

    return result
  }
}

/**
 * Stop all tracks in a media stream
 * @param {MediaStream|null} stream - The media stream to stop
 */
export const stopMediaStream = (stream) => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
  }
}

/**
 * Check if the browser supports WebRTC
 * @returns {boolean} - Whether WebRTC is supported
 */
export const isWebRTCSupported = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.RTCPeerConnection)
}

/**
 * Test media devices before a call
 * @param {boolean} requireVideo - Whether to test video as well
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const testMediaDevices = async (requireVideo = true) => {
  // Check WebRTC support first
  if (!isWebRTCSupported()) {
    return {
      success: false,
      message:
        "Your browser does not support video/voice calls. Please use a modern browser like Chrome, Firefox, or Safari.",
    }
  }

  // Request permissions and get stream
  const { stream, permissions, error } = await requestMediaPermissions(requireVideo)

  // If there was an error, return it
  if (error) {
    return {
      success: false,
      message: error,
    }
  }

  // Stop the stream since this is just a test
  stopMediaStream(stream)

  // Return success
  return {
    success: true,
    message: "Media devices are working properly.",
  }
}
