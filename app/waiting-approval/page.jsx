"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Clock, Mail, Phone, AlertCircle, Shield, Bell, Home } from "lucide-react"
import { doc, onSnapshot, collection, query, where, getDocs, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import Link from "next/link"
import { sendApprovalNotification, sendRejectionNotification } from "@/lib/email-service"
import { LogoutConfirmation } from "@/components/logout-confirmation"

export default function WaitingApprovalPage() {
  const { user, userRole, userStatus, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [adminContact, setAdminContact] = useState({ 
    email: "smartcarephofficial@gmail.com", 
    phone: "09979866482" 
  })
  const [isVisible, setIsVisible] = useState(false)
  const [animationStep, setAnimationStep] = useState(0)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const router = useRouter()

  // Animation refs
  const lockRef = useRef(null)
  const orbit1Ref = useRef(null)
  const orbit2Ref = useRef(null)
  const notificationRef = useRef(null)

  // Fetch admin contact information (optional, keeping static info)
  useEffect(() => {
    const fetchAdminContact = async () => {
      try {
        // Query for admin users
        const adminQuery = query(collection(db, "users"), where("role", "==", "admin"), limit(1))
        const querySnapshot = await getDocs(adminQuery)

        if (!querySnapshot.empty) {
          const adminData = querySnapshot.docs[0].data()
          setAdminContact({
            email: adminData.email || "smartcarephofficial@gmail.com",
            phone: adminData.phone || "09979866482",
          })
        }
      } catch (error) {
        console.error("Error fetching admin contact:", error)
        // Keep default values on error
      }
    }

    fetchAdminContact()
  }, [])

  // Listen for status changes in real-time
  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // Set up real-time listener for user status
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), async (doc) => {
      if (doc.exists()) {
        const userData = doc.data()
        const prevStatus = userStatus
        const newStatus = userData.status

        // If user is approved
        if (newStatus === 1 && prevStatus !== 1) {
          // Send approval email
          try {
            await sendApprovalNotification(user.email || userData.email, userData.role)
          } catch (error) {
            console.error("Error sending approval email:", error)
          }
          
          // Redirect to appropriate dashboard
          if (userData.role === "patient") {
            router.push("/dashboard")
          } else if (userData.role === "doctor") {
            router.push("/doctor/dashboard")
          } else if (userData.role === "admin") {
            router.push("/admin/dashboard")
          }
        } else if (newStatus === 2 && prevStatus !== 2) {
          // If user is rejected
          try {
            await sendRejectionNotification(
              user.email || userData.email, 
              userData.role,
              adminContact.email
            )
          } catch (error) {
            console.error("Error sending rejection email:", error)
          }
          
          router.push("/account-rejected")
        }
      }

      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user, userStatus, router, adminContact])

  // Animation effects
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-soft-amber"></div>
      </div>
    )
  }

  const handleLogoutAndGoHome = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const confirmLogout = () => {
    setShowLogoutModal(true)
  }

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false)
    handleLogoutAndGoHome()
  }

  return (
    <div className="min-h-screen bg-pale-stone flex flex-col items-center justify-center p-4">
      {/* Enhanced logout confirmation modal */}
      <LogoutConfirmation
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />

      <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full">
        {/* Main animation container */}
        <div className="relative h-48 w-full mb-6 flex justify-center">
          {/* Central floating lock */}
          <div ref={lockRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div
              className={`flex h-24 w-24 items-center justify-center rounded-full bg-yellow-50 transition-all duration-500 ${
                animationStep === 1 ? "scale-105" : "scale-100"
              }`}
            >
              <div
                className={`relative transition-all duration-1000 ${
                  isVisible ? "rotate-0 scale-100" : "rotate-90 scale-0"
                }`}
              >
                <Clock
                  className={`h-12 w-12 text-yellow-500 transition-all duration-500 ${
                    animationStep === 2 ? "opacity-80" : "opacity-100"
                  }`}
                />
                <div
                  className={`absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white transition-all delay-500 duration-500 ${
                    isVisible ? "scale-100" : "scale-0"
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Orbiting shield icon */}
          <div ref={orbit1Ref} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-orange-500/10 rounded-full p-2 shadow-md">
              <Shield
                className={`h-6 w-6 text-orange-500 transition-all duration-300 ${
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
            <div className="bg-orange-500/10 rounded-full p-1.5">
              <div className="h-3 w-3 rounded-full bg-orange-500/30"></div>
            </div>
          </div>

          <div className="absolute bottom-0 left-10 animate-float-slow-delay">
            <div className="bg-orange-500/10 rounded-full p-1.5">
              <div className="h-3 w-3 rounded-full bg-orange-500/30"></div>
            </div>
          </div>

          <div className="absolute -bottom-8 right-16 animate-float-slow-delay-more">
            <div className="bg-orange-500/10 rounded-full p-1.5">
              <div className="h-3 w-3 rounded-full bg-orange-500/30"></div>
            </div>
          </div>
        </div>

        <h3
          className={`text-xl font-medium text-graphite mb-2 text-center transition-all duration-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          Account Pending Approval
        </h3>

        <p
          className={`text-drift-gray text-center max-w-md mb-6 transition-all duration-500 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          Thank you for creating your {userRole === "doctor" ? "doctor" : "patient"} account with Smart Care. Your
          account is currently pending approval by our administrators.
        </p>

        <div
          className={`py-4 px-6 bg-orange-50 border border-orange-200 rounded-lg mb-6 transition-all duration-500 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-orange-700">
              <span className="font-medium block mb-1">Waiting for admin approval</span>
              Your account will be reviewed by our administrators. This process typically takes 24-48 hours. You will
              need to log back in to check your approval status.
            </p>
          </div>
        </div>

        <div
          className={`border-t border-earth-beige pt-4 mt-6 transition-all duration-500 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <p className="font-medium text-graphite mb-3 text-center">Need assistance?</p>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-center text-sm">
              <Mail className="h-4 w-4 mr-2 text-drift-gray" />
              <span className="text-drift-gray">{adminContact.email}</span>
            </div>
            <div className="flex items-center justify-center text-sm">
              <Phone className="h-4 w-4 mr-2 text-drift-gray" />
              <span className="text-drift-gray">{adminContact.phone}</span>
            </div>
          </div>
          <button
            onClick={confirmLogout}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </button>
        </div>
      </div>

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
