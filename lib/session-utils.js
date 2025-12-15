// Session timeout utility
let sessionTimeoutId = null

export function setupSessionTimeout(timeoutMinutes, logoutCallback) {
  // Clear any existing timeout
  if (sessionTimeoutId) {
    clearTimeout(sessionTimeoutId)
  }

  // If timeout is set to "never", don't set a timeout
  if (timeoutMinutes === "never") {
    return
  }

  // Convert minutes to milliseconds
  const timeoutMs = Number.parseInt(timeoutMinutes) * 60 * 1000

  // Set the timeout
  sessionTimeoutId = setTimeout(() => {
    logoutCallback()
  }, timeoutMs)

  // Reset the timeout on user activity
  const resetTimeout = () => {
    if (sessionTimeoutId) {
      clearTimeout(sessionTimeoutId)
      sessionTimeoutId = setTimeout(() => {
        logoutCallback()
      }, timeoutMs)
    }
  }

  // Add event listeners for user activity
  const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]
  events.forEach((event) => {
    document.addEventListener(event, resetTimeout)
  })

  // Return a cleanup function
  return () => {
    if (sessionTimeoutId) {
      clearTimeout(sessionTimeoutId)
    }
    events.forEach((event) => {
      document.removeEventListener(event, resetTimeout)
    })
  }
}
