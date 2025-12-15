"use client"

import { useState, useEffect, useRef } from "react"
import { Lock, Shield, Clock, Bell, AlertTriangle } from "lucide-react"

export function AnimatedAccessRestricted({
  title = "Access Restricted",
  message,
  status = "restricted",
  onRequestAccess,
  isLoading = false,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [animationStep, setAnimationStep] = useState(0)
  const lockRef = useRef(null)
  const orbit1Ref = useRef(null)
  const orbit2Ref = useRef(null)
  const notificationRef = useRef(null)

  useEffect(() => {
    // Initial animation
    const initialTimer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    // Continuous subtle animations
    const animationInterval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % 4)
    }, 3000)

    // Create continuous orbital animations with JavaScript for smoother performance
    let angle = 0
    let angle2 = Math.PI // Start at opposite position
    let floatY = 0
    let floatDirection = 1

    const animate = () => {
      if (lockRef.current && orbit1Ref.current && orbit2Ref.current) {
        // Floating animation for the lock
        floatY += 0.05 * floatDirection
        if (floatY > 5) floatDirection = -1
        if (floatY < -5) floatDirection = 1
        lockRef.current.style.transform = `translateY(${floatY}px)`

        // Orbital animations
        angle += 0.01
        angle2 += 0.008

        const radius = 60
        const x1 = Math.cos(angle) * radius
        const y1 = Math.sin(angle) * radius

        const x2 = Math.cos(angle2) * radius
        const y2 = Math.sin(angle2) * radius

        orbit1Ref.current.style.transform = `translate(${x1}px, ${y1}px)`
        orbit2Ref.current.style.transform = `translate(${x2}px, ${y2}px)`
      }

      requestAnimationFrame(animate)
    }

    const animationFrame = requestAnimationFrame(animate)

    // Notification bell animation
    if (notificationRef.current) {
      const bellAnimation = () => {
        if (notificationRef.current) {
          notificationRef.current.classList.add("animate-bell")
          setTimeout(() => {
            if (notificationRef.current) {
              notificationRef.current.classList.remove("animate-bell")
            }
          }, 1000)
        }
      }

      // Animate bell every 5 seconds
      const bellInterval = setInterval(bellAnimation, 5000)

      return () => {
        clearInterval(bellInterval)
        clearTimeout(initialTimer)
        clearInterval(animationInterval)
        cancelAnimationFrame(animationFrame)
      }
    }

    return () => {
      clearTimeout(initialTimer)
      clearInterval(animationInterval)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Main animation container */}
      <div className="relative h-48 w-48 mb-6">
        {/* Central floating lock */}
        <div ref={lockRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full ${
              status === "pending" ? "bg-yellow-50" : "bg-earth-beige/20"
            } transition-all duration-500 ${animationStep === 1 ? "scale-105" : "scale-100"}`}
          >
            <div
              className={`relative transition-all duration-1000 ${
                isVisible ? "rotate-0 scale-100" : "rotate-90 scale-0"
              }`}
            >
              {status === "pending" ? (
                <Clock
                  className={`h-12 w-12 text-yellow-500 transition-all duration-500 ${
                    animationStep === 2 ? "opacity-80" : "opacity-100"
                  }`}
                />
              ) : (
                <Lock
                  className={`h-12 w-12 text-drift-gray transition-all duration-500 ${
                    animationStep === 2 ? "opacity-80" : "opacity-100"
                  }`}
                />
              )}
              <div
                className={`absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full ${
                  status === "pending" ? "bg-yellow-500" : "bg-red-500"
                } text-white transition-all delay-500 duration-500 ${isVisible ? "scale-100" : "scale-0"}`}
              >
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Orbiting shield icon */}
        <div ref={orbit1Ref} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="bg-soft-amber/10 rounded-full p-2 shadow-md">
            <Shield
              className={`h-6 w-6 text-soft-amber transition-all duration-300 ${
                animationStep === 0 ? "scale-110" : "scale-100"
              }`}
            />
          </div>
        </div>

        {/* Orbiting bell icon */}
        <div ref={orbit2Ref} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="bg-blue-50 rounded-full p-2 shadow-md">
            <div ref={notificationRef}>
              <Bell
                className={`h-6 w-6 text-blue-500 transition-all duration-300 ${
                  animationStep === 3 ? "scale-110" : "scale-100"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Decorative particles */}
        <div className="absolute -top-4 right-10 animate-float-slow">
          <div className="bg-soft-amber/10 rounded-full p-1.5">
            <div className="h-3 w-3 rounded-full bg-soft-amber/30"></div>
          </div>
        </div>

        <div className="absolute bottom-0 left-10 animate-float-slow-delay">
          <div className="bg-soft-amber/10 rounded-full p-1.5">
            <div className="h-3 w-3 rounded-full bg-soft-amber/30"></div>
          </div>
        </div>

        <div className="absolute -bottom-8 right-16 animate-float-slow-delay-more">
          <div className="bg-soft-amber/10 rounded-full p-1.5">
            <div className="h-3 w-3 rounded-full bg-soft-amber/30"></div>
          </div>
        </div>
      </div>

      <h3
        className={`text-lg font-medium text-graphite mb-2 transition-all duration-500 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {title}
      </h3>

      <p
        className={`text-drift-gray text-center max-w-md mb-6 transition-all duration-500 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {message}
      </p>

      {status !== "pending" && (
        <button
          onClick={onRequestAccess}
          disabled={isLoading}
          className={`inline-flex items-center px-4 py-2 bg-soft-amber text-white rounded-md hover:bg-amber-600 transition-colors transition-all duration-500 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Sending Request...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Request Access
            </>
          )}
        </button>
      )}

      {status === "pending" && (
        <div
          className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md transition-all duration-500 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-700">
              <span className="font-medium block mb-1">Request Pending</span>
              Your access request has been sent to the patient. You'll be notified when they respond.
            </p>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes float-slow-delay {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes float-slow-delay-more {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes bell-ring {
          0%, 100% {
            transform: rotate(0);
          }
          10%, 30%, 50% {
            transform: rotate(10deg);
          }
          20%, 40%, 60% {
            transform: rotate(-10deg);
          }
          70% {
            transform: rotate(5deg);
          }
          80% {
            transform: rotate(-5deg);
          }
          90% {
            transform: rotate(2deg);
          }
        }
        
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }
        
        .animate-float-slow-delay {
          animation: float-slow-delay 4s ease-in-out infinite 1s;
        }
        
        .animate-float-slow-delay-more {
          animation: float-slow-delay-more 4s ease-in-out infinite 2s;
        }
        
        .animate-bell {
          animation: bell-ring 1s ease-in-out;
        }
      `}</style>
    </div>
  )
}
