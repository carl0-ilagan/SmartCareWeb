"use client"

import { useEffect } from "react"

export function RegisterServiceWorker() {
  useEffect(() => {
    // Register service worker for PWA offline caching on all pages
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("[PWA] Service Worker registered successfully:", registration.scope)
          
          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60000) // Check for updates every minute
          
          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  // New service worker available
                  console.log("[PWA] New service worker available - will activate on next page load")
                  // Optionally notify user or auto-reload
                  if (confirm("New version available! Reload to update?")) {
                    newWorker.postMessage({ type: "SKIP_WAITING" })
                    window.location.reload()
                  }
                }
              })
            }
          })
          
          // Handle service worker updates
          let refreshing = false
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (!refreshing) {
              refreshing = true
              console.log("[PWA] Service worker updated, reloading...")
              window.location.reload()
            }
          })
        })
        .catch((error) => {
          console.error("[PWA] Service Worker registration failed:", error)
        })
    } else {
      console.warn("[PWA] Service Workers are not supported in this browser")
    }
  }, [])

  return null
}

