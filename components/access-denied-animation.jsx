"use client"

import { useState, useEffect, useRef } from "react"
import { Lock, AlertTriangle, Shield, Share2, FileText } from "lucide-react"

export function AccessDeniedAnimation({ message, patientName }) {
  const [isVisible, setIsVisible] = useState(false)
  const [animationStep, setAnimationStep] = useState(0)
  const orbitRef = useRef(null)
  const orbit2Ref = useRef(null)
  const floatingRef = useRef(null)

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
      if (orbitRef.current && orbit2Ref.current && floatingRef.current) {
        // Orbital animations
        angle += 0.01
        angle2 += 0.008

        const radius = 60
        const x1 = Math.cos(angle) * radius
        const y1 = Math.sin(angle) * radius

        const x2 = Math.cos(angle2) * radius
        const y2 = Math.sin(angle2) * radius

        orbitRef.current.style.transform = `translate(${x1}px, ${y1}px)`
        orbit2Ref.current.style.transform = `translate(${x2}px, ${y2}px)`

        // Floating animation for the lock
        floatY += 0.05 * floatDirection
        if (floatY > 5) floatDirection = -1
        if (floatY < -5) floatDirection = 1

        floatingRef.current.style.transform = `translateY(${floatY}px)`
      }

      requestAnimationFrame(animate)
    }

    const animationFrame = requestAnimationFrame(animate)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(animationInterval)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div
        className={`flex max-w-md flex-col items-center rounded-lg bg-white p-8 text-center shadow-lg transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* Main animation container */}
        <div className="relative mb-10 h-48 w-48">
          {/* Central floating lock */}
          <div ref={floatingRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full bg-red-50 transition-all duration-500 ${
                animationStep === 1 ? "scale-105" : "scale-100"
              }`}
            >
              <div
                className={`relative transition-all duration-1000 ${
                  isVisible ? "rotate-0 scale-100" : "rotate-90 scale-0"
                }`}
              >
                <Lock
                  className={`h-12 w-12 text-red-500 transition-all duration-500 ${
                    animationStep === 2 ? "opacity-80" : "opacity-100"
                  }`}
                />
                <div
                  className={`absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white transition-all delay-500 duration-500 ${
                    isVisible ? "scale-100" : "scale-0"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Orbiting shield icon */}
          <div ref={orbitRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className={`bg-amber-50 rounded-full p-2 shadow-md`}>
              <Shield
                className={`h-6 w-6 text-amber-500 transition-all duration-300 ${
                  animationStep === 0 ? "scale-110" : "scale-100"
                }`}
              />
            </div>
          </div>

          {/* Orbiting share icon */}
          <div ref={orbit2Ref} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className={`bg-blue-50 rounded-full p-2 shadow-md`}>
              <Share2
                className={`h-6 w-6 text-blue-500 transition-all duration-300 ${
                  animationStep === 3 ? "scale-110" : "scale-100"
                }`}
              />
            </div>
          </div>

          {/* Small floating document icons */}
          <div className="absolute -top-4 right-10" style={{ animation: "float 4s ease-in-out infinite" }}>
            <div className="bg-soft-amber/10 rounded-full p-1.5">
              <FileText className="h-4 w-4 text-soft-amber" />
            </div>
          </div>

          <div className="absolute bottom-0 left-10" style={{ animation: "float 4s ease-in-out infinite 1s" }}>
            <div className="bg-soft-amber/10 rounded-full p-1.5">
              <FileText className="h-4 w-4 text-soft-amber" />
            </div>
          </div>

          <div className="absolute -bottom-8 right-16" style={{ animation: "float 4s ease-in-out infinite 2s" }}>
            <div className="bg-soft-amber/10 rounded-full p-1.5">
              <FileText className="h-4 w-4 text-soft-amber" />
            </div>
          </div>
        </div>

        <h2
          className={`mb-3 text-2xl font-bold text-graphite transition-all delay-300 duration-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          Access Denied
        </h2>

        <p
          className={`mb-4 text-drift-gray transition-all delay-500 duration-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {message || `You don't have access to ${patientName ? patientName + "'s" : "these"} medical records.`}
        </p>

        <div
          className={`mt-2 max-w-sm rounded-lg bg-amber-50 p-4 border border-amber-200 transition-all delay-700 duration-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700">
              <span className="font-medium block mb-1">Patient Privacy Protection</span>
              Smart Care protects patient privacy by requiring explicit consent before sharing medical records.
            </p>
          </div>
        </div>

        <div
          className={`mt-4 max-w-sm rounded-lg bg-blue-50 p-4 border border-blue-200 transition-all delay-900 duration-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex items-start">
            <Share2 className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              <span className="font-medium block mb-1">How Records Are Shared</span>
              Patients can share specific records with you through their dashboard. Once shared, you'll have immediate
              access.
            </p>
          </div>
        </div>

        <div
          className={`mt-6 w-full max-w-sm rounded-lg bg-gradient-to-r from-soft-amber/20 to-amber-500/20 p-4 transition-all delay-1100 duration-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ animation: "pulse 3s infinite" }}
        >
          <p className="text-sm text-graphite font-medium text-center">
            Please check back later after the patient has shared their records with you.
          </p>
        </div>
      </div>

      <div
        className={`mt-8 h-1 w-24 rounded-full bg-red-200 transition-all delay-1000 duration-1000 ${
          isVisible ? "w-24 opacity-100" : "w-0 opacity-0"
        }`}
      ></div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  )
}

export default AccessDeniedAnimation
