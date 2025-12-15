"use client"

import { useState, useEffect, useRef } from "react"
import { User, Stethoscope, Heart, ArrowRight, Calendar, MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function WelcomeModal({ isOpen, onClose, userType = "patient", userName = "" }) {
  const { userProfile, user } = useAuth()
  const [startX, setStartX] = useState(null)
  const [offsetX, setOffsetX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const modalRef = useRef(null)

  // Get display name from user profile or prop
  const displayName = userProfile?.displayName || userName || user?.displayName || ""
  const userRole = userProfile?.role || userType

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen])

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  // Reset offset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setOffsetX(0)
    }
  }, [isOpen])

  // Swipe handlers
  const handleTouchStart = (e) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleMouseDown = (e) => {
    setStartX(e.clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!isDragging || startX === null) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startX
    setOffsetX(diff)
  }

  const handleMouseMove = (e) => {
    if (!isDragging || startX === null) return
    const currentX = e.clientX
    const diff = currentX - startX
    setOffsetX(diff)
  }

  const handleTouchEnd = () => {
    if (Math.abs(offsetX) > 100) {
      handleClose()
    } else {
      setOffsetX(0)
    }
    setIsDragging(false)
    setStartX(null)
  }

  const handleMouseUp = () => {
    if (Math.abs(offsetX) > 100) {
      handleClose()
    } else {
      setOffsetX(0)
    }
    setIsDragging(false)
    setStartX(null)
  }

  // Handle close with animation
  const handleClose = async () => {
    setIsClosing(true)
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }
  
  console.log("WelcomeModal RENDER - isOpen:", isOpen, "userType:", userType, "userRole:", userRole, "displayName:", displayName)
  
  if (!isOpen) {
    console.log("WelcomeModal - NOT RENDERING (isOpen is false)")
    return null
  }

  console.log("WelcomeModal - RENDERING MODAL!")
  
  const formattedName = displayName ? (userRole === "doctor" ? `Dr. ${displayName}` : displayName) : ""
  
  const welcomeMessages = {
    patient: {
      greeting: "Welcome back",
      title: "Access your health dashboard",
      description: "Manage appointments, view medical records, and connect with your healthcare providers.",
      icon: User,
      iconColor: "bg-blue-100 text-blue-600",
      bgGradient: "bg-gradient-to-br from-blue-50 to-cyan-50",
    },
    doctor: {
      greeting: "Welcome back",
      title: "Connect with your patients",
      description: "Manage appointments, review medical records, and provide quality healthcare.",
      icon: Stethoscope,
      iconColor: "bg-soft-amber/20 text-soft-amber",
      bgGradient: "bg-gradient-to-br from-soft-amber/10 to-yellow-50",
    },
    admin: {
      greeting: "Welcome back",
      title: "Manage the platform",
      description: "Monitor system activity, manage users, and ensure smooth operations.",
      icon: Heart,
      iconColor: "bg-green-100 text-green-600",
      bgGradient: "bg-gradient-to-br from-green-50 to-emerald-50",
    },
  }

  const message = welcomeMessages[userRole] || welcomeMessages.patient
  const IconComponent = message.icon

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
      <div
        ref={modalRef}
        className={`w-full max-w-md mx-auto rounded-2xl bg-white shadow-2xl overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'} ${message.bgGradient}`}
        style={{
          transform: `translateX(${offsetX}px)`,
          opacity: isClosing ? 0 : Math.max(0, 1 - Math.abs(offsetX) / 200),
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes modalIn {
          from { 
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes modalOut {
          from { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to { 
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-fade-out {
          animation: fadeOut 0.3s ease-out;
        }
        .animate-modal-in {
          animation: modalIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-modal-out {
          animation: modalOut 0.3s ease-in;
        }
      `}</style>
        {/* Header with animation */}
        <div className={`${message.bgGradient} p-6 sm:p-8 relative overflow-hidden`}>
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              {user?.photoURL ? (
                <div className="relative">
                  <img 
                    src={user.photoURL} 
                    alt={displayName || "User"} 
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-3 sm:border-4 border-white shadow-lg object-cover"
                  />
                  {/* Role badge */}
                  <div className={`absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 ${message.iconColor} rounded-full border-2 border-white p-1 sm:p-1.5`}>
                    <IconComponent className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>
                </div>
              ) : (
                <div className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full ${message.iconColor}`}>
                  <IconComponent className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-graphite text-center mb-1 sm:mb-2">
              {message.greeting}{formattedName ? `, ${formattedName}` : "!"} 👋
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-drift-gray text-center">{message.title}</p>
          </div>
          
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full -ml-12 -mb-12"></div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8">
          <div className="space-y-3 sm:space-y-4">
            <p className="text-center text-xs sm:text-sm md:text-base text-drift-gray">{message.description}</p>
            
            {/* Quick stats or benefits */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6">
              {userRole === "patient" ? (
                <>
                  <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-drift-gray truncate">Appointments</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-green-50 border border-green-100">
                    <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-drift-gray truncate">Health Records</span>
                  </div>
                </>
              ) : userRole === "doctor" ? (
                <>
                  <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-soft-amber/10 border border-soft-amber/20">
                    <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-soft-amber flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-drift-gray truncate">Manage Patients</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg bg-cyan-50 border border-cyan-100">
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm text-drift-gray truncate">Consultations</span>
                  </div>
                </>
              ) : null}
            </div>

            <div className="pt-2 sm:pt-4">
              <button
                onClick={handleClose}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-soft-amber px-4 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-graphite shadow-lg hover:bg-soft-amber/90 transition-all duration-200 hover:shadow-xl"
              >
                Continue to Dashboard
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>

            <p className="text-center text-xs text-drift-gray mt-2 sm:mt-4 italic">
              Swipe left or right to dismiss
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}