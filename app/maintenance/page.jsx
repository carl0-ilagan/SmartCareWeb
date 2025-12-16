"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Wrench, Clock, Mail, AlertCircle, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export default function MaintenancePage() {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(true)
  const router = useRouter()
  const { userRole } = useAuth()

  useEffect(() => {
    // Check maintenance status periodically
    const checkMaintenance = async () => {
      try {
        const response = await fetch("/api/maintenance")
        const data = await response.json()
        
        if (data.success) {
          const enabled = data.enabled || false
          
          // If maintenance was enabled but now disabled, show success and redirect
          if (isMaintenanceMode && !enabled) {
            setIsMaintenanceMode(false)
            // Wait a moment for user to see the success message, then redirect
            setTimeout(() => {
              if (userRole === "doctor") {
                router.push("/doctor/dashboard")
              } else if (userRole === "patient") {
                router.push("/dashboard")
              } else {
                router.push("/")
              }
            }, 3000) // 3 seconds so user can see the success message
          } else {
            // Update state normally
            setIsMaintenanceMode(enabled)
          }
        }
      } catch (err) {
        console.error("Error checking maintenance status:", err)
      }
    }

    checkMaintenance()
    // Check every 10 seconds for faster response when maintenance ends
    const interval = setInterval(checkMaintenance, 10000)

    return () => clearInterval(interval)
  }, [userRole, router, isMaintenanceMode])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pale-stone via-white to-pale-stone flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-soft-amber/5 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-40 h-40 bg-soft-amber/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-soft-amber/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl">
        {/* Animated wrench icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-24 h-24">
            <div
              className="absolute inset-0 bg-soft-amber/20 rounded-full blur-xl"
              style={{
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full shadow-lg ring-4 ring-soft-amber/10 animate-glow">
              <Wrench className="w-12 h-12 text-soft-amber animate-spin" style={{ animationDuration: "3s" }} />
            </div>
          </div>
        </div>

        {/* Headings */}
        <div className="mb-6">
          <h1
            className="text-4xl md:text-5xl font-bold text-graphite mb-3"
            style={{
              animation: "fadeInDown 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
            }}
          >
            Under Maintenance
          </h1>
          <div
            className="h-1 w-16 bg-gradient-to-r from-soft-amber to-orange-400 mx-auto rounded-full mb-4"
            style={{
              animation: "scaleX 0.6s ease-out 0.2s forwards",
              transformOrigin: "center",
            }}
          ></div>
          <p
            className="text-lg text-drift-gray leading-relaxed"
            style={{
              animation: "fadeInUp 0.8s ease-out 0.2s forwards",
              opacity: 0,
            }}
          >
            Smart Care is currently undergoing scheduled maintenance to improve your experience.
            <br />
            We&apos;ll be back shortly!
          </p>
        </div>

        {/* Info Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 mb-8"
          style={{
            animation: "fadeInUp 0.8s ease-out 0.3s forwards",
            opacity: 0,
          }}
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-soft-amber/20 p-4 shadow-sm">
            <Clock className="w-6 h-6 text-soft-amber mx-auto mb-2" />
            <p className="text-sm font-medium text-graphite mb-1">Estimated Time</p>
            <p className="text-xs text-drift-gray">We&apos;re working as fast as we can</p>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-soft-amber/20 p-4 shadow-sm">
            <Mail className="w-6 h-6 text-soft-amber mx-auto mb-2" />
            <p className="text-sm font-medium text-graphite mb-1">Notifications</p>
            <p className="text-xs text-drift-gray">You&apos;ll be notified when we&apos;re back</p>
          </div>
        </div>

        {/* Status Message */}
        {!isMaintenanceMode && (
          <div
            className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl"
            style={{
              animation: "fadeInUp 0.8s ease-out 0.4s forwards",
              opacity: 1,
            }}
          >
            <div className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <p className="text-sm font-medium">Maintenance complete! System is ready to use. Redirecting you now...</p>
            </div>
          </div>
        )}

        {/* Floating message */}
        <div
          className="mt-8 p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-soft-amber/20 shadow-sm"
          style={{
            animation: "float 3s ease-in-out infinite 0.5s",
          }}
        >
          <p className="text-sm text-drift-gray">
            Thank you for your patience. We appreciate your understanding during this maintenance period.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes scaleX {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }

        /* Subtle glow pulse on icon ring */
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.18); }
          50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.08); }
        }
        .animate-glow { animation: glowPulse 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
