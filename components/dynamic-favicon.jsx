"use client"

import { useEffect } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function DynamicFavicon() {
  useEffect(() => {
    // Default favicon fallback
    const defaultFavicon = "/SmartCare.png?v=2"
    
    // Function to update favicon in document head
    const updateFavicon = (faviconUrl) => {
      const url = faviconUrl || defaultFavicon
      
      // Update or create favicon links
      const updateFaviconLink = (rel, href) => {
        let link = document.querySelector(`link[rel='${rel}']`)
        if (!link) {
          link = document.createElement("link")
          link.setAttribute("rel", rel)
          document.head.appendChild(link)
        }
        // Add timestamp to force browser refresh
        const timestamp = new Date().getTime()
        link.setAttribute("href", `${href}?t=${timestamp}`)
        link.setAttribute("type", "image/png")
      }
      
      // Update all favicon types
      updateFaviconLink("icon", url)
      updateFaviconLink("shortcut icon", url)
      updateFaviconLink("apple-touch-icon", url)
      
      // Also update manifest.json icon if needed (for PWA)
      // Note: manifest.json is static, but browsers cache it
      // The service worker will handle PWA icon updates
    }
    
    // Set initial favicon
    updateFavicon(defaultFavicon)
    
    // Listen to Firestore for real-time favicon updates
    const landingDocRef = doc(db, "system", "landing_page")
    
    const unsubscribe = onSnapshot(
      landingDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data()
          const faviconUrl = data.branding?.faviconUrl
          
          if (faviconUrl) {
            console.log("[DynamicFavicon] Updating favicon to:", faviconUrl)
            updateFavicon(faviconUrl)
            
            // Inform service worker about new PWA icon for manifest/app icon
            if (navigator.serviceWorker?.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: "PWA_ICON_UPDATE",
                iconUrl: faviconUrl,
              })
            }
          } else {
            // Fallback to default if no favicon URL in database
            updateFavicon(defaultFavicon)
          }
        } else {
          // Document doesn't exist, use default
          updateFavicon(defaultFavicon)
        }
      },
      (error) => {
        console.error("[DynamicFavicon] Error listening to favicon updates:", error)
        // On error, use default favicon
        updateFavicon(defaultFavicon)
      }
    )
    
    // Cleanup listener on unmount
    return () => {
      unsubscribe()
    }
  }, [])
  
  // This component doesn't render anything
  return null
}

