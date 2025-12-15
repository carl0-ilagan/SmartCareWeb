// Device identification and management utilities

/**
 * Generate a unique device ID and store it in localStorage
 * @returns {string} Device ID
 */
export function getOrCreateDeviceId() {
  if (typeof window === "undefined") return null

  let deviceId = localStorage.getItem("deviceId")

  if (!deviceId) {
    // Generate a unique device ID
    // Format: timestamp + random string
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substring(2, 15)
    deviceId = `device_${timestamp}_${randomStr}`
    localStorage.setItem("deviceId", deviceId)
  }

  return deviceId
}

/**
 * Get device information
 * @returns {object} Device metadata
 */
export function getDeviceInfo() {
  if (typeof window === "undefined") {
    return {
      userAgent: "",
      platform: "",
      language: "",
      screenWidth: 0,
      screenHeight: 0,
      timezone: "",
    }
  }

  return {
    userAgent: navigator.userAgent || "",
    platform: navigator.platform || "",
    language: navigator.language || "",
    screenWidth: window.screen?.width || 0,
    screenHeight: window.screen?.height || 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  }
}

/**
 * Get browser name from user agent
 * @returns {string} Browser name
 */
export function getBrowserName() {
  if (typeof window === "undefined") return "Unknown"

  const ua = navigator.userAgent
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome"
  if (ua.includes("Firefox")) return "Firefox"
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari"
  if (ua.includes("Edg")) return "Edge"
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera"
  return "Unknown"
}

/**
 * Get OS name from user agent
 * @returns {string} OS name
 */
export function getOSName() {
  if (typeof window === "undefined") return "Unknown"

  const ua = navigator.userAgent
  if (ua.includes("Windows")) return "Windows"
  if (ua.includes("Mac")) return "macOS"
  if (ua.includes("Linux")) return "Linux"
  if (ua.includes("Android")) return "Android"
  if (ua.includes("iOS") || (ua.includes("iPhone") || ua.includes("iPad"))) return "iOS"
  return "Unknown"
}

/**
 * Get complete device metadata
 * @returns {object} Complete device information
 */
export function getCompleteDeviceMetadata() {
  const deviceId = getOrCreateDeviceId()
  const deviceInfo = getDeviceInfo()

  return {
    deviceId,
    browser: getBrowserName(),
    os: getOSName(),
    userAgent: deviceInfo.userAgent,
    platform: deviceInfo.platform,
    language: deviceInfo.language,
    screenWidth: deviceInfo.screenWidth,
    screenHeight: deviceInfo.screenHeight,
    timezone: deviceInfo.timezone,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Check if device ID exists in localStorage
 * @returns {boolean}
 */
export function hasDeviceId() {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem("deviceId")
}

/**
 * Clear device ID (for logout or testing)
 */
export function clearDeviceId() {
  if (typeof window === "undefined") return
  localStorage.removeItem("deviceId")
}

