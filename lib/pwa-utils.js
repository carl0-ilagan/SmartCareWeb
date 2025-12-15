// PWA utility functions

/**
 * Detect if the app is running as a PWA (installed app)
 * @returns {boolean} True if running as PWA
 */
export function isPWAInstalled() {
  if (typeof window === "undefined") return false
  
  // Check for standalone display mode (Android, iOS, Desktop)
  if (window.matchMedia) {
    if (window.matchMedia("(display-mode: standalone)").matches) return true
    if (window.matchMedia("(display-mode: fullscreen)").matches) return true
    if (window.matchMedia("(display-mode: minimal-ui)").matches) return true
  }
  
  // iOS Safari standalone mode
  if (navigator.standalone === true) return true
  
  // Check if launched from home screen (additional checks)
  if (window.navigator && window.navigator.standalone !== undefined) {
    return window.navigator.standalone === true
  }
  
  // Check for presence of service worker and manifest
  if (window.matchMedia && window.matchMedia("(display-mode: browser)").matches === false) {
    return true
  }
  
  return false
}

/**
 * Check if service worker is supported
 * @returns {boolean} True if service worker is supported
 */
export function isServiceWorkerSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator
}

/**
 * Get PWA installation status
 * @returns {Promise<{isInstalled: boolean, canInstall: boolean, deferredPrompt: any}>}
 */
export async function getPWAStatus() {
  const isInstalled = isPWAInstalled()
  let canInstall = false
  let deferredPrompt = null
  
  if (typeof window !== "undefined") {
    // Check if beforeinstallprompt event is available
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault()
      deferredPrompt = e
      canInstall = true
    })
  }
  
  return {
    isInstalled,
    canInstall,
    deferredPrompt,
  }
}

