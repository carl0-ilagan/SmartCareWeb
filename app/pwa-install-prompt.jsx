"use client"

import { useState, useEffect } from "react"
import { Download } from "lucide-react"

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return

    // Check if already installed
    const isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator.standalone === true) ||
      document.referrer.includes('android-app://')
    
    if (isInstalled) {
      return
    }

    // Listen for beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // For footer, show immediately if not dismissed (no delay)
    if (!localStorage.getItem('pwa-install-dismissed')) {
      setShowPrompt(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [mounted])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback: show instructions
      setShowPrompt(false)
      alert(
        'To install Smart Care:\n\n' +
        'iOS: Tap the Share button and select "Add to Home Screen"\n\n' +
        'Android: Tap the menu (3 dots) and select "Install App" or "Add to Home Screen"'
      )
      return
    }

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa-install-dismissed', 'true')
      
      // Show again after 7 days
      setTimeout(() => {
        localStorage.removeItem('pwa-install-dismissed')
      }, 7 * 24 * 60 * 60 * 1000)
    }
  }

  // Don't render on server to avoid hydration mismatch
  if (!mounted) {
    return null
  }

  // Check if should show (client-side only)
  const isDismissed = typeof window !== 'undefined' ? localStorage.getItem('pwa-install-dismissed') : null
  const isInstalled = typeof window !== 'undefined' ? (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator.standalone === true) ||
    document.referrer.includes('android-app://')
  ) : false
  
  if (isInstalled || (isDismissed && !showPrompt)) {
    return null
  }

  return (
    <div className="rounded-lg border border-earth-beige bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-soft-amber/10 flex-shrink-0">
          <Download className="h-5 w-5 text-soft-amber" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-graphite text-sm mb-1">Install Smart Care</h3>
          <p className="text-xs text-drift-gray">
            Install as an app for a better experience. Works offline!
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="rounded-md bg-soft-amber px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 whitespace-nowrap"
        >
          Install
        </button>
      </div>
    </div>
  )
}
