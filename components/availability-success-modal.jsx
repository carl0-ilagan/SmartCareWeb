"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { CheckCircle2, X, Calendar, Loader2 } from "lucide-react"

export function AvailabilitySuccessModal({ isOpen, onClose, message, className = "" }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // Loading state before showing success
  const isClosingRef = useRef(false)
  const modalRef = useRef(null)

  // Handle modal visibility with animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setIsClosing(false)
      setIsLoading(true) // Reset to loading when modal opens
      isClosingRef.current = false
      if (typeof document !== "undefined") {
        document.body.style.overflow = "hidden"
      }
      
      // Show loading for 1.5 seconds, then show success check
      const loadingTimer = setTimeout(() => {
        setIsLoading(false)
      }, 1500)
      
      return () => clearTimeout(loadingTimer)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setIsClosing(false)
        setIsLoading(true) // Reset to loading when modal closes
        isClosingRef.current = false
      }, 300)
      if (typeof document !== "undefined") {
        document.body.style.overflow = ""
      }
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Handle closing with animation - matching appointment modal
  const handleCloseWithAnimation = useCallback((e) => {
    // ABORT IMMEDIATELY - check ref FIRST
    if (isClosingRef.current || isClosing) {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
        if (e.stopImmediatePropagation) {
          e.stopImmediatePropagation()
        }
      }
      return
    }
    
    // LOCK IMMEDIATELY - set ref FIRST before anything else
    isClosingRef.current = true
    
    // Stop all event propagation IMMEDIATELY
    if (e) {
      e.preventDefault()
      e.stopPropagation()
      if (e.stopImmediatePropagation) {
        e.stopImmediatePropagation()
      }
    }
    
    // Set UI state immediately
    setIsClosing(true)
    
    // Call onClose immediately (don't wait for setTimeout)
    try {
      onClose()
    } catch (error) {
      console.error("Error in onClose:", error)
    }
    
    // Reset after animation completes
    setTimeout(() => {
      setIsClosing(false)
      isClosingRef.current = false
    }, 300)
  }, [isClosing, onClose])

  if (!isOpen && !isVisible) return null

  // Theme colors matching doctor availability modal
  const theme = {
    headerBg: "bg-gradient-to-br from-soft-amber/10 to-yellow-50",
    iconBg: "bg-soft-amber/20 text-soft-amber",
    focusBorder: "focus:border-soft-amber",
    focusRing: "focus:ring-soft-amber",
  }

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes modalIn { 
          from { 
            opacity: 0; 
            transform: translate(-50%, -48%) scale(0.96); 
          } 
          to { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1); 
          } 
        }
        @keyframes modalOut { 
          from { 
            opacity: 1; 
            transform: translate(-50%, -50%) scale(1); 
          } 
          to { 
            opacity: 0; 
            transform: translate(-50%, -48%) scale(0.96); 
          } 
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.3), 0 0 40px rgba(34, 197, 94, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.5), 0 0 60px rgba(34, 197, 94, 0.3);
          }
        }
        @keyframes ringExpand {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out forwards;
        }
        .animate-bounceIn {
          animation: bounceIn 0.6s ease-out forwards;
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        .animate-ring-expand {
          animation: ringExpand 1.5s ease-out infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s linear infinite;
          background: linear-gradient(
            to right,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          background-size: 1000px 100%;
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out forwards;
        }
        .animate-fade-out {
          animation: fade-out 0.25s ease-out forwards;
        }
      `}</style>
      {/* Backdrop with blur - matching appointment modal */}
      <div
        className={`fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-3 md:p-4 lg:p-4 bg-black/60 backdrop-blur-xl ${isClosing ? "animate-fade-out" : "animate-fade-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""}`}
        onClick={(e) => {
          // If not open or closing, prevent all interactions
          if (!isOpen || isClosing || isClosingRef.current) {
            if (e) {
              e.preventDefault()
              e.stopPropagation()
            }
            return
          }
          // Only close if clicking backdrop itself (not children)
          if (e.target !== e.currentTarget) {
            e.stopPropagation()
            return
          }
          handleCloseWithAnimation(e)
        }}
        onMouseDown={(e) => {
          // Prevent interactions if not open or closing
          if (!isOpen || isClosing || isClosingRef.current) {
            if (e) {
              e.preventDefault()
              e.stopPropagation()
            }
            return
          }
          // Prevent mousedown from bubbling if clicking on backdrop
          if (e.target === e.currentTarget) {
            // Allow backdrop clicks
          } else {
            e.stopPropagation()
          }
        }}
        style={{ backdropFilter: 'blur(16px)' }}
      >
      <div
        ref={modalRef}
        className={`w-full max-w-xs sm:max-w-md mx-auto rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col ${isClosing ? "animate-modal-out" : "animate-modal-in"} ${!isOpen && !isClosing ? "pointer-events-none opacity-0" : ""} ${theme.headerBg}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          // Prevent interactions if not open or closing
          if (!isOpen || isClosing || isClosingRef.current) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
          e.stopPropagation()
          e.stopImmediatePropagation?.()
        }}
        onMouseDown={(e) => {
          // Prevent interactions if not open or closing
          if (!isOpen || isClosing || isClosingRef.current) {
            e.preventDefault()
            e.stopPropagation()
            return
          }
          e.stopPropagation()
        }}
      >
        {/* Header with gradient background - matching doctor availability modal */}
        <div className={`${theme.headerBg} p-2 sm:p-2.5 md:p-3 lg:p-3 relative overflow-hidden flex-shrink-0 border-b border-amber-200/30`}>
          <div className="relative z-10 flex items-center gap-2 sm:gap-2.5">
            <div className={`flex h-7 w-7 sm:h-8 sm:w-8 md:h-8 md:w-8 lg:h-9 lg:w-9 items-center justify-center rounded-full ${theme.iconBg} flex-shrink-0 shadow-md transition-all duration-300`}>
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4 md:w-4 animate-bounceIn" />
              )}
            </div>
            <h2 className="text-xs sm:text-sm md:text-base lg:text-base font-bold text-gray-900">
              {isLoading ? "Saving..." : "Success"}
            </h2>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full -ml-10 -mb-10"></div>
          <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-amber-100/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Content - matching doctor availability modal structure */}
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto flex-1 min-h-0 flex flex-col bg-gradient-to-br from-white via-amber-50/20 to-yellow-50/30 backdrop-blur-sm relative">
          {/* Decorative background elements */}
          {!isLoading && (
            <>
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
            </>
          )}
          
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-2 sm:py-4">
            {/* Icon container with loading/success animation */}
            <div className="relative mb-3 sm:mb-4 md:mb-6">
              {/* Expanding rings for success state */}
              {!isLoading && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="absolute w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-2 border-green-300/50 animate-ring-expand"></div>
                    <div className="absolute w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-2 border-green-300/30 animate-ring-expand" style={{ animationDelay: '0.3s' }}></div>
                    <div className="absolute w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-2 border-green-300/20 animate-ring-expand" style={{ animationDelay: '0.6s' }}></div>
                  </div>
                </>
              )}
              
              <div className={`relative flex h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 items-center justify-center rounded-full shadow-2xl transition-all duration-500 ${
                isLoading 
                  ? "bg-gradient-to-br from-soft-amber/20 to-amber-50/30 animate-pulse" 
                  : "bg-gradient-to-br from-green-100 via-emerald-50 to-green-50 animate-bounceIn animate-glow"
              }`}>
                {isLoading ? (
                  <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-soft-amber animate-spin" />
                ) : (
                  <>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-200 to-emerald-100 opacity-50 blur-xl"></div>
                    <CheckCircle2 className="relative h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-green-600 animate-scaleIn drop-shadow-lg" strokeWidth={2.5} />
                  </>
                )}
              </div>
            </div>
          
            {/* Message */}
            <div className="w-full max-w-xs sm:max-w-sm mx-auto px-3 sm:px-4">
              <p className={`text-center text-sm sm:text-base md:text-lg text-gray-900 font-semibold leading-relaxed transition-all duration-500 mb-1 sm:mb-2 ${
                isLoading ? "opacity-60" : "opacity-100 animate-fadeIn"
              }`}>
                {isLoading 
                  ? "Please wait while we update your availability..." 
                  : (message || "Your availability has been updated successfully!")
                }
              </p>
              {!isLoading && (
                <p className="text-center text-xs text-gray-600 font-medium mt-1 sm:mt-2 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                  All changes have been saved successfully
                </p>
              )}
            </div>

            {/* Button - only show when success is displayed */}
            {!isLoading && (
              <div className="mt-4 sm:mt-6 md:mt-8 w-full max-w-[200px] sm:max-w-xs mx-auto px-3 sm:px-4 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!isClosingRef.current) {
                      handleCloseWithAnimation(e)
                    }
                  }}
                  disabled={isClosing || isClosingRef.current}
                  className="w-full rounded-lg sm:rounded-xl bg-gradient-to-r from-soft-amber via-amber-500 to-amber-600 px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-bold text-white shadow-xl sm:shadow-2xl hover:from-amber-500 hover:via-amber-600 hover:to-amber-700 hover:shadow-2xl sm:hover:shadow-3xl hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-soft-amber focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2">
                    <span>Close</span>
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
